import React, { useState } from 'react';

type InputMode = 'sql' | 'chat' | 'terminal';

interface UnifiedQueryInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: (value: string, mode: InputMode) => void;
  isLoading?: boolean;
  className?: string;
  output?: string[];
  selectedDb?: string;
}

export const UnifiedQueryInput: React.FC<UnifiedQueryInputProps> = ({
  value,
  onChange,
  onSubmit,
  isLoading,
  className = '',
  output = [],
  selectedDb,
}) => {
  const [mode, setMode] = useState<InputMode>('terminal');

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (!isLoading && value.trim()) {
        onSubmit(value, mode);
      }
    }
  };

  return (
    <div className={`flex flex-col w-full ${mode === 'terminal' ? 'bg-[#1E1E1E] text-white font-mono' : ''} ${className}`}>
      <div className="flex items-center justify-between px-4 py-2 bg-[var(--bg-darker)]">
        <div className="flex items-center gap-1.5">
          <div className="flex rounded-lg border border-[var(--border)] overflow-hidden">
            <button
              onClick={() => setMode('terminal')}
              className={`px-3 py-1.5 text-xs ${
                mode === 'terminal' 
                  ? 'bg-purple-500 text-white' 
                  : 'bg-[var(--bg-color)] text-[var(--text-lighter)]'
              } transition-colors`}
            >
              Terminal
            </button>
            <button
              onClick={() => setMode('sql')}
              className={`px-3 py-1.5 text-xs ${
                mode === 'sql' 
                  ? 'bg-orange-500 text-white' 
                  : 'bg-[var(--bg-color)] text-[var(--text-lighter)]'
              } transition-colors`}
            >
              SQL
            </button>
            <button
              onClick={() => setMode('chat')}
              className={`px-3 py-1.5 text-xs ${
                mode === 'chat' 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-[var(--bg-color)] text-[var(--text-lighter)]'
              } transition-colors`}
            >
              Chat
            </button>
          </div>
          {selectedDb && mode !== 'terminal' && (
            <>
              <div className="h-4 w-px bg-[var(--border)] mx-1"></div>
              <div className="text-xs text-[var(--text-lighter)]">
                Database: <span className="text-blue-400">{selectedDb}</span>
              </div>
            </>
          )}
        </div>
      </div>
      
      {mode === 'terminal' ? (
        <div className="flex-1 p-4 space-y-2 overflow-auto min-h-[200px]">
          {output.map((line, i) => (
            <div key={i} className="text-sm text-[#9DA5B4]">{line}</div>
          ))}
          
          <div className="flex items-start gap-2">
            <span className="text-[#61AFEF]">~</span>
            <textarea
              value={value}
              onChange={(e) => onChange(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Enter a command..."
              className="flex-1 bg-transparent border-none outline-none resize-none text-sm text-[#ABB2BF] placeholder-[#4D4D4D]"
              style={{ minHeight: '24px' }}
            />
          </div>

          {isLoading && (
            <div className="flex items-center gap-2 text-sm text-[#9DA5B4]">
              <div className="animate-spin">⠋</div>
              <span>Executing command...</span>
            </div>
          )}
        </div>
      ) : (
        <div className="relative min-h-[200px]">
          <textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={mode === 'sql' ? "Write your SQL query..." : "Ask a question about your data..."}
            className="w-full h-full px-4 py-3 text-sm bg-[var(--bg-darker)] border-0 focus:ring-0 resize-none"
            style={{ 
              fontFamily: mode === 'sql' ? 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace' : 'inherit'
            }}
          />
          <div className="absolute bottom-3 right-3 flex items-center gap-2">
            <div className="text-xs text-[var(--text-lighter)]">
              Press <span className="text-blue-400">Enter</span> to submit
            </div>
            <button
              onClick={() => onSubmit(value, mode)}
              disabled={isLoading || !value.trim()}
              className={`px-3 py-1.5 text-xs rounded ${
                mode === 'sql' 
                  ? 'bg-orange-500 hover:bg-orange-600' 
                  : 'bg-blue-500 hover:bg-blue-600'
              } text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors`}
            >
              {isLoading ? 'Processing...' : mode === 'sql' ? 'Run Query' : 'Send'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
