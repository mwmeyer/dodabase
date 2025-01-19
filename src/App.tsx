import { useState, useEffect, useRef } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { useTheme } from './hooks/useTheme';
import { DatabaseConfig, type DatabaseConfig as DatabaseConfigType } from './components/DatabaseConfig';
import { LLMConfig, type LLMConfig as LLMConfigType } from './components/LLMConfig';
import { ERDiagram, type Table } from './components/ERDiagram';
import { ErrorDisplay } from './components/ErrorDisplay';
import { SidebarHeader } from './components/SidebarHeader';
import { LLMWrapper } from './lib/LLMWrapper';
import "@phosphor-icons/web/bold";
import "./App.css";
import { SQLEditor } from './components/SQLEditor';
import { ChatInput } from './components/ChatInput';
import { DataPreviewModal } from './components/DataPreviewModal';
import { UnifiedQueryInput } from './components/UnifiedQueryInput'; // Import UnifiedQueryInput
import { path } from '@tauri-apps/api';
import { Toast } from './components/Toast';

interface DatabaseInstance {
  name: string;
  // Optional fields since we'll get only name from backend for now
  type?: 'postgres' | 'mysql' | 'mongodb';
  status?: 'running' | 'stopped' | 'error';
  version?: string;
  port?: number;
  size?: string;
  owner?: string;
}

interface QueryResult {
  rows: any[];
  rowCount: number;
  executionTime: number;
  columns: Array<{
    name: string;
    type: string;
  }>;
}

function App() {
  const [databases, setDatabases] = useState<DatabaseInstance[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [dbConfigOpen, setDbConfigOpen] = useState(false);
  const [dbConfig, setDbConfig] = useState<DatabaseConfigType>({
    type: 'postgres',
    host: 'localhost',
    port: 5432,
    username: 'postgres',
    password: '',
    database: 'postgres'  // Default to postgres database for initial connection
  });
  const [connectionString, setConnectionString] = useState('');
  const [sqlQuery, setSqlQuery] = useState('');
  const [isExecutingQuery, setIsExecutingQuery] = useState(false);
  const [queryResult, setQueryResult] = useState<any[]>([]);
  const [selectedDb, setSelectedDb] = useState<string | null>(null);
  const [schema, setSchema] = useState<Table[]>([]);
  const { theme, setTheme } = useTheme();

  // LLM Configuration
  const [llmConfig, setLLMConfig] = useState<LLMConfigType>({
    provider: 'ollama',
    model: '',
    baseUrl: 'http://localhost:11434',
    apiKey: ''
  });
  const [llmClient, setLlmClient] = useState<LLMWrapper | null>(null);
  const [llmInput, setLlmInput] = useState('');
  const [llmResponses, setLlmResponses] = useState<Array<{ role: 'user' | 'assistant', content: string }>>([]);
  const [isLlmLoading, setIsLlmLoading] = useState(false);
  const [availableModels, setAvailableModels] = useState<string[] | null>(null);
  const [isLoadingModels, setIsLoadingModels] = useState(false);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // AI model state
  const [selectedModel, setSelectedModel] = useState<string | null>(null);
  const [aiConfigOpen, setAiConfigOpen] = useState(false);

  // Layout state
  const [layout, setLayout] = useState<'split' | 'full'>('split');
  const [activeTab, setActiveTab] = useState<'database' | 'chat'>('database');

  const [showQueryResults, setShowQueryResults] = useState(false);

  // Unified Query Input state
  const [showUnifiedInput] = useState(false);

  // Terminal Input state
  const [terminalOutput, setTerminalOutput] = useState<string[]>([]);
  const [terminalCommand, setTerminalCommand] = useState('');
  const [isExecutingCommand, setIsExecutingCommand] = useState(false);

  const [workspacePath, setWorkspacePath] = useState<string>('');

  // Separate state for modal errors
  const [modalError, setModalError] = useState<string | null>(null);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [llmResponses, isLlmLoading]);

  useEffect(() => {
    // Get the app's data directory
    path.appDataDir().then(path => {
      setWorkspacePath(path);
    }).catch(console.error);
  }, []);

  const handleDbConfigChange = (newConfig: DatabaseConfigType) => {
    // Generate connection string based on database type
    let connectionString = '';
    if (newConfig.type === 'sqlite') {
      connectionString = `sqlite://${newConfig.database}`;
    } else {
      const auth = newConfig.password 
        ? `${newConfig.username}:${newConfig.password}`
        : newConfig.username;
      if (auth && newConfig.host && newConfig.port && newConfig.database) {
        connectionString = `${newConfig.type}://${auth}@${newConfig.host}:${newConfig.port}/${newConfig.database}`;
        console.log('Generated connection string:', connectionString);
      }
    }
    
    setDbConfig(newConfig);
    setConnectionString(connectionString);
    return connectionString; // Return the connection string for immediate use
  };

  const handleConnect = async (configToUse?: DatabaseConfigType): Promise<string | null> => {
    try {
      setModalError(null);
      setIsConnecting(true);
      
      // If a config is provided, update the connection string first
      const connString = configToUse ? handleDbConfigChange(configToUse) : connectionString;
      
      if (!connString) {
        throw new Error('Please fill in all required database configuration fields');
      }

      console.log('Using connection string:', connString);
      console.log('Database config:', configToUse || dbConfig);
      
      const dbList = await invoke<DatabaseInstance[]>('list_databases', { 
        connectionString: connString
      });
      
      setDatabases(dbList);
      setDbConfigOpen(false);
      return null; // Indicate success
    } catch (err) {
      console.error('Failed to connect:', err);
      setModalError(err instanceof Error ? err.message : 'Failed to connect to database');
      return err instanceof Error ? err.message : 'Failed to connect to database'; // Return error message
    } finally {
      setIsConnecting(false);
    }
  };

  const fetchSchema = async (dbConnectionString: string) => {
    try {
      setError(null);
      const schemaJson = await invoke<string>('get_schema', { connectionString: dbConnectionString });
      const parsedSchema = JSON.parse(schemaJson);
      // Extract schema name from connection string, defaulting to 'public' if not found
      const schemaName = dbConnectionString.includes('search_path=') 
        ? dbConnectionString.split('search_path=')[1].split('&')[0]
        : 'public';
      
      // Add schema property to each table
      const schemaWithDefault = parsedSchema.map((table: Table) => ({
        ...table,
        schema: schemaName
      }));
      console.log('Fetched schema:', schemaWithDefault);
      setSchema(schemaWithDefault);
    } catch (err) {
      console.error('Failed to fetch schema:', err);
      setError(err instanceof Error ? err.message : String(err));
      setSchema([]);
    }
  };

  const handleLLMConfigChange = async (config: LLMConfigType, error?: string) => {
    if (error) {
      setModalError(error);
      return;
    }

    try {
      setModalError(null);
      setLLMConfig(config);
      
      // Test the LLM connection
      await initializeLLM(config);
      
      setAiConfigOpen(false);
    } catch (err) {
      setModalError(err instanceof Error ? err.message : 'Failed to configure AI model');
    }
  };

  const initializeLLM = async (config: LLMConfigType) => {
    try {
      setIsLoadingModels(true);
      setModalError(null);
      
      const wrapper = new LLMWrapper({
        provider: config.provider,
        apiKey: config.apiKey,
        model: config.model,
        baseURL: config.baseUrl, // Match the baseUrl from LLMConfigType to baseURL in LLMWrapper
      });
      
      setLlmClient(wrapper);
      
      // Fetch available models
      const models = await wrapper.fetchAvailableModels();
      setAvailableModels(models);
      
      // Reset selected model since we have new models
      setSelectedModel(null);
    } catch (err) {
      console.error('Failed to initialize LLM:', err);
      setModalError(err instanceof Error ? err.message : 'Failed to initialize LLM client');
      setLlmClient(null);
      setAvailableModels(null);
    } finally {
      setIsLoadingModels(false);
    }
  };

  const handleAskLLM = async (e?: React.FormEvent) => {
    if (e) {
      e.preventDefault();
    }
    
    if (!llmInput.trim() || !llmClient || !selectedModel) return;

    setLlmResponses(prev => [...prev, { role: 'user', content: llmInput }]);
    const currentInput = llmInput;
    setLlmInput('');
    setIsLlmLoading(true);

    try {
      if (llmConfig.provider === 'ollama') {
        const response = await fetch(`${llmConfig.baseUrl}/api/generate`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: selectedModel,
            prompt: currentInput,
            stream: false
          })
        });

        if (!response.ok) {
          throw new Error('Failed to get response from Ollama');
        }

        const data = await response.json();
        const assistantMessage = data.response;
        
        if (!assistantMessage) {
          throw new Error('Invalid response format from LLM');
        }
        
        setLlmResponses(prev => [...prev, { role: 'assistant', content: assistantMessage }]);
      } else {
        const response = await llmClient.sendMessage(currentInput);
        setLlmResponses(prev => [...prev, { role: 'assistant', content: response }]);
      }
    } catch (error) {
      console.error('LLM error:', error);
      setLlmResponses(prev => [...prev, { 
        role: 'assistant', 
        content: `Error: ${error instanceof Error ? error.message : 'Failed to get response from LLM'}`
      }]);
    } finally {
      setIsLlmLoading(false);
    }
  };

  const handleExecuteQuery = async () => {
    try {
      setIsExecutingQuery(true);
      setError(null);
      const result = await invoke<string>('execute_query', { 
        connectionString, 
        query: sqlQuery 
      });
      
      const parsedResult: QueryResult = JSON.parse(result);
      setQueryResult(parsedResult.rows);
      setShowQueryResults(true);
      
      console.log(
        `Query executed in ${parsedResult.executionTime}ms, ` +
        `returned ${parsedResult.rowCount} rows`
      );
    } catch (err) {
      console.error('Failed to execute query:', err);
      setError(err instanceof Error ? err.message : String(err));
      setQueryResult([]);
    } finally {
      setIsExecutingQuery(false);
    }
  };

  const handleDatabaseClick = async (dbName: string) => {
    setSelectedDb(dbName);
    try {
      // Build the connection string for the specific database
      let dbConnectionString = '';
      if (dbConfig.type === 'sqlite') {
        dbConnectionString = connectionString;
      } else if (dbConfig.type === 'postgres') {
        // Replace the database name in the connection string
        const baseConnString = connectionString.split('/').slice(0, -1).join('/');
        dbConnectionString = `${baseConnString}/${dbName}`;
        // Update the main connection string
        setConnectionString(dbConnectionString);
      }

      console.log('Switching to database:', dbName);
      console.log('New connection string:', dbConnectionString);
      
      await fetchSchema(dbConnectionString);
    } catch (error) {
      console.error('Schema error details:', {
        error,
        connectionString,
        dbConfig,
        selectedDb: dbName
      });
      setError(error instanceof Error ? error.message : String(error));
      setSchema([]);
    }
  };

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };
  
  const handleExecuteCommand = async (command: string) => {
    setIsExecutingCommand(true);
    setTerminalOutput(prev => [...prev, `$ ${command}`]);
    
    try {
      const output = await invoke('execute_command', { 
        command,
        cwd: workspacePath // Use the dynamic workspace path
      });
      
      setTerminalOutput(prev => [...prev, output as string]);
    } catch (err) {
      setTerminalOutput(prev => [...prev, `Error: ${err instanceof Error ? err.message : 'Command failed'}`]);
    } finally {
      setIsExecutingCommand(false);
      setTerminalCommand('');
    }
  };

  return (
    <div className="h-screen flex flex-col bg-[var(--bg-color)] text-[var(--text-color)]">
      {/* Only show Toast for modal errors */}
      <Toast 
        message={modalError}
        onDismiss={() => setModalError(null)}
      />
      
      {/* Navigation */}
      <nav className="bg-[var(--bg-darker)] border-b border-[var(--border)] px-3 py-1.5 flex justify-between items-center">
        <div className="flex items-center gap-1.5 text-[var(--text-color)]">
          <span className="font-medium text-sm">DODABASE 0.0.1</span>
        </div>
        <div className="flex items-center gap-2">
          {/* <button
            onClick={() => setShowUnifiedInput(prev => !prev)}
            className="w-8 h-8 flex items-center justify-center rounded hover:bg-[var(--bg-lighter)] text-[var(--text-lighter)] transition-colors"
            title="Toggle Command Palette (⌘K)"
          >
            <i className="ph-bold ph-terminal-window text-lg"></i>
          </button> */}

          {/* Dark Mode Toggle */}
          <button
            onClick={toggleTheme}
            className="p-1.5 hover:bg-[var(--bg-lighter)] rounded-md transition-colors"
            aria-label="Toggle theme"
          >
            <i className={`ph-bold ${theme === 'dark' ? 'ph-sun' : 'ph-moon'} text-lg text-[var(--text-color)]`}></i>
          </button>
          {/* Layout Toggle */}
          <button
            onClick={() => setLayout(prev => prev === 'split' ? 'full' : 'split')}
            className="p-1.5 hover:bg-[var(--bg-lighter)] rounded-md transition-colors"
            title={layout === 'split' ? 'Go full screen' : 'Split screen'}
          >
            <i className={`ph-bold ${layout === 'split' ? 'ph-arrows-out-simple' : 'ph-arrows-out-line-horizontal'} text-lg text-[var(--text-color)]`}></i>
          </button>
        </div>
      </nav>

      {/* Unified Query Input with animation */}
      <div className={`transition-all duration-200 ease-out ${showUnifiedInput ? 'h-[300px] opacity-100' : 'h-0 opacity-0'} overflow-hidden border-b border-[var(--border)]`}>
        <UnifiedQueryInput
          value={terminalCommand}
          onChange={setTerminalCommand}
          onSubmit={handleExecuteCommand}
          isLoading={isExecutingCommand}
          output={terminalOutput}
          className="h-full"
        />
      </div>

      <div className="flex-1 flex min-h-0">
        {/* Tab Bar - Only show in full screen mode */}
        {layout === 'full' && (
          <div className="absolute top-[49px] left-0 right-0 bg-[var(--bg-darker)] border-b border-[var(--border)] px-2 flex">
            <button
              onClick={() => setActiveTab('database')}
              className={`px-4 py-2 text-sm font-medium transition-colors relative ${
                activeTab === 'database' ? 'text-[var(--text-color)]' : 'text-[var(--text-secondary)] hover:text-[var(--text-color)]'
              }`}
            >
              Database
              {activeTab === 'database' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500"></div>
              )}
            </button>
            <button
              onClick={() => setActiveTab('chat')}
              className={`px-4 py-2 text-sm font-medium transition-colors relative ${
                activeTab === 'chat' ? 'text-[var(--text-color)]' : 'text-[var(--text-secondary)] hover:text-[var(--text-color)]'
              }`}
            >
              Chat
              {activeTab === 'chat' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500"></div>
              )}
            </button>
          </div>
        )}

        {/* Main Content */}
        <div className={`flex min-h-0 w-full ${layout === 'full' ? 'pt-10' : ''}`}>
          {/* Database Section */}
          {(layout === 'split' || (layout === 'full' && activeTab === 'database')) && (
            <div className={`flex flex-col min-h-0 ${layout === 'split' ? 'w-1/2 border-r-[3px] border-[var(--border)] shadow-[1px_0_0_0_var(--bg-darker)]' : 'w-full'}`}>
              <SidebarHeader
                title="Databases"
                selectedItem={selectedDb}
                onBack={() => {
                  setSelectedDb(null);
                  setSchema([]);
                }}
                onConfigure={() => setDbConfigOpen(true)}
              />
              <div className="flex-1 overflow-auto">
                {activeTab === 'database' && error && (
                  <ErrorDisplay 
                    error={error}
                    onDismiss={() => setError(null)}
                  />
                )}
                
                {selectedDb ? (
                  <div className="p-4">
                    {schema.length > 0 ? (
                      <ERDiagram schema={schema} connectionString={connectionString} />
                    ) : (
                      <div className="text-center text-[var(--text-secondary)]">
                        No tables found in this database
                      </div>
                    )}
                  </div>
                ) : databases.length === 0 ? (
                  <div className="text-center p-8">
                    <div className="mb-4">
                      <i className="ph-bold ph-database text-4xl text-[var(--text-secondary)]"></i>
                    </div>
                    <p className="text-[var(--text-secondary)] mb-4">Connect to a database to start exploring</p>
                    <button
                      onClick={() => setDbConfigOpen(true)}
                      className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 text-sm font-medium inline-flex items-center gap-2"
                    >
                      <i className="ph-bold ph-database"></i>
                      Connect Database
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
                    {databases.map((db) => {
                      const dbName = typeof db === 'string' ? db : db.name;
                      const dbSize = typeof db === 'string' ? null : db.size;
                      const dbOwner = typeof db === 'string' ? null : db.owner;
                      
                      return (
                        <div
                          key={dbName}
                          onClick={() => handleDatabaseClick(dbName)}
                          className={`bg-[var(--bg-dark)] p-4 rounded-md border border-[var(--border)] hover:border-blue-500 cursor-pointer group relative ${
                            selectedDb === dbName ? 'ring-2 ring-blue-500' : ''
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="space-y-1">
                              <span className="font-medium">{dbName}</span>
                              {(dbSize || dbOwner) && (
                                <div className="text-xs text-gray-400">
                                  {dbSize && <span className="mr-2">Size: {dbSize}</span>}
                                  {dbOwner && <span>Owner: {dbOwner}</span>}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
              {selectedDb && (
                <SQLEditor
                  value={sqlQuery}
                  onChange={setSqlQuery}
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleExecuteQuery();
                  }}
                  isLoading={isExecutingQuery}
                  selectedDb={selectedDb}
                  className=""
                />
              )}
            </div>
          )}

          {/* Chat Section */}
          {(layout === 'split' || (layout === 'full' && activeTab === 'chat')) && (
            <div className={`flex flex-col min-h-0 ${layout === 'split' ? 'w-1/2' : 'w-full'}`}>
              <SidebarHeader
                title="AI Models"
                selectedItem={selectedModel}
                onBack={() => setSelectedModel(null)}
                onConfigure={() => setAiConfigOpen(true)}
              />
              <div className="flex-1 overflow-auto">
                {activeTab === 'chat' && error && (
                  <ErrorDisplay 
                    error={error}
                    onDismiss={() => setError(null)}
                  />
                )}
                
                {selectedModel ? (
                  <div className="h-full flex flex-col">
                    {/* Chat Messages */}
                    <div className="flex-1 overflow-auto p-4 space-y-4" ref={chatContainerRef}>
                      {llmResponses.map((msg, i) => (
                        <div
                          key={i}
                          className={`flex ${
                            msg.role === 'user' ? 'justify-end' : 'justify-start'
                          }`}
                        >
                          <div
                            className={`max-w-[80%] rounded-md px-4 py-2 ${
                              msg.role === 'user'
                                ? 'bg-blue-500 text-white'
                                : 'bg-[var(--bg-darker)] border border-[var(--border)]'
                            }`}
                          >
                            <div className="text-sm">
                              {msg.role === 'user' ? 'You' : selectedModel}
                            </div>
                            <div className="mt-1 text-sm whitespace-pre-wrap">
                              {msg.content}
                            </div>
                          </div>
                        </div>
                      ))}
                      {isLlmLoading && (
                        <div className="flex justify-start">
                          <div className="max-w-[80%] rounded-md px-4 py-2 bg-[var(--bg-darker)] border border-[var(--border)]">
                            <div className="text-sm">{selectedModel}</div>
                            <div className="mt-1">
                              <div className="flex items-center space-x-2">
                                <div className="w-2 h-2 bg-[var(--text-muted)] rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                                <div className="w-2 h-2 bg-[var(--text-muted)] rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                                <div className="w-2 h-2 bg-[var(--text-muted)] rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ) : !llmConfig.provider ? (
                  <div className="text-center p-8">
                    <div className="mb-6">
                      <i className="ph-bold ph-chat-circle-dots text-6xl text-[var(--text-secondary)]"></i>
                    </div>
                    <h3 className="text-lg font-medium mb-2">Start Chatting with AI Models</h3>
                    <p className="text-[var(--text-secondary)] mb-6">Configure your AI provider to begin chatting</p>
                    <button
                      onClick={() => setAiConfigOpen(true)}
                      className="px-6 py-3 bg-blue-500 text-white rounded-md hover:bg-blue-600 text-sm font-medium inline-flex items-center gap-2"
                    >
                      <i className="ph-bold ph-robot"></i>
                      Configure AI Provider
                    </button>
                    <div className="mt-8 text-sm text-[var(--text-secondary)]">
                      <p className="font-medium mb-2">Supported Providers:</p>
                      <ul className="space-y-2">
                        <li><i className="ph-bold ph-check mr-2"></i>Ollama (local models)</li>
                        <li><i className="ph-bold ph-check mr-2"></i>OpenAI-compatible APIs</li>
                      </ul>
                    </div>
                  </div>
                ) : (
                  <div className="p-4">
                    {isLoadingModels ? (
                      <div className="text-center p-8">
                        <div className="mb-4">
                          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
                        </div>
                        <p className="text-[var(--text-secondary)]">Loading available models...</p>
                      </div>
                    ) : availableModels && availableModels.length > 0 ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {availableModels.map((model) => (
                          <div
                            key={model}
                            onClick={() => {
                              setSelectedModel(model);
                              setLLMConfig(prev => ({ ...prev, model }));
                            }}
                            className="bg-[var(--bg-dark)] p-4 rounded-md border border-[var(--border)] hover:border-blue-500 cursor-pointer group"
                          >
                            <div className="flex items-center justify-between">
                              <div>
                                <div className="font-medium">{model}</div>
                                <div className="text-sm text-[var(--text-secondary)]">
                                  {llmConfig.provider === 'openai' ? 'OpenAI' :
                                   llmConfig.provider === 'anthropic' ? 'Anthropic' :
                                   llmConfig.provider === 'ollama' ? 'Ollama' : 'Local'}
                                </div>
                              </div>
                              <i className="ph-bold ph-arrow-right opacity-0 group-hover:opacity-100 transition-opacity"></i>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center p-8">
                        <div className="mb-4">
                          <i className="ph-bold ph-warning text-4xl text-[var(--text-secondary)]"></i>
                        </div>
                        <p className="text-[var(--text-secondary)] mb-4">Configure an AI model provider to start chatting</p>
                        <button
                          onClick={() => setAiConfigOpen(true)}
                          className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 text-sm font-medium inline-flex items-center gap-2"
                        >
                          <i className="ph-bold ph-robot"></i>
                          Configure AI
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
              {selectedModel && (
                <ChatInput
                  value={llmInput}
                  onChange={setLlmInput}
                  onSubmit={handleAskLLM}
                  isLoading={isLlmLoading}
                />
              )}
            </div>
          )}
        </div>
      </div>

      {/* Database Configuration Modal */}
      <DatabaseConfig
        isOpen={dbConfigOpen}
        config={dbConfig}
        onChange={handleDbConfigChange}
        onClose={() => setDbConfigOpen(false)}
        onConnect={async (config) => {
          await handleConnect(config);
        }}
        isConnecting={isConnecting}
      />

      {/* AI Model Configuration Modal */}
      <LLMConfig
        isOpen={aiConfigOpen}
        config={llmConfig}
        onChange={handleLLMConfigChange}
        onClose={() => setAiConfigOpen(false)}
      />

      <DataPreviewModal
        isOpen={showQueryResults}
        onClose={() => setShowQueryResults(false)}
        data={queryResult}
        tableName="Query Results"
        schema="public"
        query={sqlQuery}
        onQueryChange={setSqlQuery}
        onExecuteQuery={handleExecuteQuery}
        isExecuting={isExecutingQuery}
      />
    </div>
  );
}

export default App;
