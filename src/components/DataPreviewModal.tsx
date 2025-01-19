import React from 'react';
import { Modal } from './Modal';
import { DataTable } from './DataTable';
import { SQLEditor } from './SQLEditor';

interface DataPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: any[] | null;
  tableName: string;
  schema: string;
  query: string;
  onQueryChange: (query: string) => void;
  onExecuteQuery: (e: React.FormEvent) => void;
  isExecuting?: boolean;
  error?: string | null;
}

export function DataPreviewModal({
  isOpen,
  onClose,
  data,
  query,
  onQueryChange,
  onExecuteQuery,
  isExecuting = false,
  error = null
}: DataPreviewModalProps) {
  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      title={
        <div className="flex items-center gap-2 text-[var(--text)]">
          <i className="ph-bold ph-code text-blue-400"></i>
          <span className="font-medium">Query Results</span>
          {isExecuting && (
            <div className="flex items-center gap-1.5 text-[var(--text-lighter)]">
              <i className="ph-bold ph-circle-notch animate-spin"></i>
              <span className="text-sm">Executing...</span>
            </div>
          )}
        </div>
      }
      fullScreen
    >
      <div className="flex h-[calc(100vh-8rem)] bg-[var(--bg-darker)]">
        {/* Data Preview Section */}
        <div className="flex-1 flex flex-col min-h-0 border-r border-[var(--border)] bg-[var(--bg-color)]">
          <div className="flex-1 min-h-0 overflow-auto">
            <div className="h-full">
              <DataTable data={data || []} />
            </div>
          </div>
        </div>

        {/* Query Section */}
        <div className="w-[450px] flex flex-col">
          <div className="p-3 border-b border-[var(--border)]">
            <div className="text-sm text-[var(--text-lighter)] flex items-center gap-2">
              <i className="ph-bold ph-code text-purple-400"></i>
              <span>SQL Query</span>
            </div>
          </div>
          <SQLEditor
            value={query}
            onChange={onQueryChange}
            onSubmit={onExecuteQuery}
            isLoading={isExecuting}
            compact={true}
            buttonPosition="bottom"
            className="flex-1"
          />
          {error && (
            <div className="p-3 text-sm text-red-500 bg-red-500/10 border-t border-red-500/20">
              <div className="flex items-center gap-2">
                <i className="ph-bold ph-warning-circle"></i>
                <span>Error executing query:</span>
              </div>
              <pre className="mt-2 whitespace-pre-wrap font-mono text-xs">{error}</pre>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}
