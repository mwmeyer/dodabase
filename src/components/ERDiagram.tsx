import { useState } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { DataPreviewModal } from './DataPreviewModal';

interface Column {
  name: string;
  data_type: string;
  is_nullable: boolean;
  has_default: boolean;
  foreign_key: string | null;
}

export interface Table {
  name: string;
  schema: string;
  columns: Column[];
}

interface ERDiagramProps {
  schema: Table[];
  connectionString: string;
}

export function ERDiagram({ schema, connectionString }: ERDiagramProps) {
  const [selectedTable, setSelectedTable] = useState<string | null>(null);
  const [tableData, setTableData] = useState<any[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [query, setQuery] = useState<string>('');
  const [isExecuting, setIsExecuting] = useState(false);

  const handleTableClick = async (table: Table) => {
    try {
      setSelectedTable(table.name);
      setError(null);
      setQuery(`SELECT * FROM ${table.schema}.${table.name} LIMIT 100;`);

      console.log('Querying table:', {
        table: table.name,
        schema: table.schema,
        connectionString
      });

      // Add retry logic with exponential backoff
      const MAX_RETRIES = 3;
      let lastError: any = null;
      
      for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
        try {
          const data = await invoke<any[]>('query_table', {
            connectionString,
            tableName: table.name,
            schemaName: table.schema || 'public'
          });

          console.log('Query result:', data);
          // Parse the result if it's a string
          const parsedData = typeof data === 'string' ? JSON.parse(data) : data;
          setTableData(Array.isArray(parsedData) ? parsedData : parsedData.rows || []);
          setIsPreviewOpen(true);
          return; // Success, exit the retry loop
        } catch (err) {
          lastError = err;
          console.warn(`Query attempt ${attempt + 1} failed:`, err);
          
          // If the table definitely doesn't exist, no point in retrying
          if (err instanceof Error && err.message.includes('does not exist')) {
            throw err;
          }
          
          // Wait before retrying, with exponential backoff
          if (attempt < MAX_RETRIES - 1) {
            await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
          }
        }
      }
      
      // If we get here, all retries failed
      throw lastError;
    } catch (err) {
      console.error('Failed to query table:', err);
      setError(err instanceof Error ? err.message : String(err));
      setTableData(null);
    }
  };

  const selectedTableInfo = schema.find(t => t.name === selectedTable);

  if (schema.length === 0) {
    return null;
  }

  return (
    <div className="w-full h-full overflow-auto bg-[var(--bg-darker)] p-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {schema.map((table) => (
          <div 
            key={table.name} 
            className={`bg-[var(--bg-dark)] rounded-lg overflow-hidden cursor-pointer transition-all duration-200 hover:shadow-lg border border-[var(--border)] ${
              selectedTable === table.name ? 'ring-2 ring-blue-500' : ''
            }`}
            onClick={() => handleTableClick(table)}
          >
            {/* Table Header */}
            <div className={`px-4 py-2.5 font-medium flex items-center justify-between ${
              selectedTable === table.name ? 'bg-blue-600' : 'bg-[var(--bg-darker)]'
            }`}>
              <span className="text-base truncate">
                {table.schema}.{table.name}
              </span>
              <span className="text-sm text-[var(--text-secondary)] ml-2">
                {table.columns.length}
              </span>
            </div>

            {/* Columns */}
            <div className="p-3 space-y-1.5">
              {table.columns.map((column) => (
                <div 
                  key={column.name} 
                  className="text-sm flex items-center justify-between px-3 py-1.5 rounded bg-[var(--bg-darker)] hover:bg-[var(--bg-light)]"
                  title={`${column.name} (${column.data_type})${column.is_nullable ? ' - Nullable' : ''}${column.foreign_key ? ` - FK: ${column.foreign_key}` : ''}`}
                >
                  <div className="flex items-center space-x-2 truncate">
                    <span className={`truncate ${column.foreign_key ? 'text-purple-400' : ''}`}>
                      {column.foreign_key ? '→ ' : ''}{column.name}
                    </span>
                  </div>
                  <div className="flex items-center ml-3 shrink-0">
                    <span className="text-green-400">{column.data_type}</span>
                    {!column.is_nullable && <span className="text-red-400 ml-1">*</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Data Preview Modal */}
      {selectedTableInfo && (
        <DataPreviewModal
          isOpen={isPreviewOpen}
          onClose={() => setIsPreviewOpen(false)}
          data={tableData}
          tableName={selectedTableInfo.name}
          schema={selectedTableInfo.schema}
          query={query}
          onQueryChange={setQuery}
          onExecuteQuery={async (e) => {
            e.preventDefault();
            if (!query.trim()) return;

            try {
              setIsExecuting(true);
              setError(null);

              const result = await invoke<any[]>('execute_query', {
                connectionString,
                query: query.trim()
              });

              // Parse the result if it's a string
              const parsedResult = typeof result === 'string' ? JSON.parse(result) : result;
              setTableData(Array.isArray(parsedResult) ? parsedResult : parsedResult.rows || []);
            } catch (err) {
              console.error('Failed to execute query:', err);
              setError(err instanceof Error ? err.message : String(err));
              setTableData([]); // Clear the table data on error
            } finally {
              setIsExecuting(false);
            }
          }}
          isExecuting={isExecuting}
          error={error}
        />
      )}
    </div>
  );
}
