import { useState } from 'react';
import { Modal } from './Modal';

export type LLMProvider = 'ollama' | 'openai' | 'anthropic';

export interface LLMConfig {
  provider: LLMProvider;
  model: string;
  apiKey: string;
  baseUrl: string;
}

interface LLMConfigProps {
  isOpen: boolean;
  onChange: (config: LLMConfig, error?: string) => void;
  onClose: () => void;
  config: LLMConfig;
}

export function LLMConfig({
  isOpen,
  onChange,
  onClose,
  config
}: LLMConfigProps) {
  const initialConfig: LLMConfig = {
    provider: 'ollama',
    model: '',
    baseUrl: 'http://localhost:11434',
    apiKey: ''
  };

  const [localConfig, setLocalConfig] = useState<LLMConfig>(config || initialConfig);
  const [isSaving, setIsSaving] = useState(false);

  const handleProviderChange = (provider: LLMProvider) => {
    const newConfig = { ...localConfig, provider };
    // Set appropriate defaults based on provider
    switch (provider) {
      case 'ollama':
        newConfig.baseUrl = 'http://localhost:11434';
        newConfig.model = '';
        newConfig.apiKey = '';
        break;
      case 'openai':
        newConfig.baseUrl = 'https://api.openai.com/v1';
        newConfig.model = '';
        break;
      case 'anthropic':
        newConfig.baseUrl = 'https://api.anthropic.com/v1';
        newConfig.model = '';
        break;
    }
    setLocalConfig(newConfig);
  };

  const validateConfig = () => {
    if (!localConfig.provider) {
      throw new Error('Please select a provider');
    }
    if (!localConfig.baseUrl) {
      throw new Error('Base URL is required');
    }
    if (localConfig.provider !== 'ollama' && !localConfig.apiKey) {
      throw new Error('API Key is required for ' + localConfig.provider);
    }
  };

  const handleSave = () => {
    try {
      validateConfig();
      setIsSaving(true);
      onChange(localConfig);
      onClose();
    } catch (err) {
      // Propagate the error to parent
      onChange(localConfig, err instanceof Error ? err.message : 'Invalid configuration');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      title="AI Model Configuration"
      size="md"
    >
      <div className="space-y-4 p-4">
        <div>
          <label className="block text-sm font-medium mb-1">Provider</label>
          <select
            value={localConfig.provider}
            onChange={(e) => handleProviderChange(e.target.value as LLMProvider)}
            className="w-full p-2 rounded border border-[var(--border-color)] bg-[var(--bg-color)] text-[var(--text-color)] focus:outline-none focus:border-[var(--primary-color)] appearance-none cursor-pointer hover:border-[var(--primary-color)]"
            style={{
              WebkitAppearance: 'none',
              backgroundImage: 'url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'currentColor\' stroke-width=\'2\' stroke-linecap=\'round\' stroke-linejoin=\'round\'%3e%3cpolyline points=\'6 9 12 15 18 9\'%3e%3c/polyline%3e%3c/svg%3e")',
              backgroundRepeat: 'no-repeat',
              backgroundPosition: 'right 0.5rem center',
              backgroundSize: '1.5em 1.5em',
              paddingRight: '2.5rem'
            }}
          >
            <option value="ollama">Ollama (Local)</option>
            <option value="openai">OpenAI</option>
            <option value="anthropic">Anthropic</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Base URL</label>
          <input
            type="text"
            value={localConfig.baseUrl}
            onChange={(e) => setLocalConfig(prev => ({ ...prev, baseUrl: e.target.value }))}
            placeholder={localConfig.provider === 'ollama' ? 'http://localhost:11434' : 'Enter base URL'}
            className="w-full p-2 rounded border border-[var(--border-color)] bg-[var(--bg-color)] text-[var(--text-color)]"
          />
        </div>

        {localConfig.provider !== 'ollama' && (
          <div>
            <label className="block text-sm font-medium mb-1">API Key</label>
            <input
              type="password"
              value={localConfig.apiKey}
              onChange={(e) => setLocalConfig(prev => ({ ...prev, apiKey: e.target.value }))}
              placeholder="Enter API key"
              className="w-full p-2 rounded border border-[var(--border-color)] bg-[var(--bg-color)] text-[var(--text-color)]"
            />
          </div>
        )}

        <div className="mt-6">
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="w-full bg-[var(--primary-color)] text-white p-2 rounded-md hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-medium shadow-sm hover:shadow-md active:scale-[0.98] border-2 border-[var(--primary-color)] hover:border-opacity-90"
          >
            {isSaving ? (
              <span className="flex items-center justify-center space-x-2">
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                <span>Saving...</span>
              </span>
            ) : (
              'Save Configuration'
            )}
          </button>
        </div>
      </div>
    </Modal>
  );
}
