import React, { FormEvent, useCallback } from 'react';

interface SQLEditorProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: (e: FormEvent) => void;
  isLoading?: boolean;
  selectedDb?: string;
  className?: string;
  compact?: boolean;
  buttonPosition?: 'right' | 'bottom';
}

export const SQLEditor: React.FC<SQLEditorProps> = ({
  value = '',
  onChange,
  onSubmit,
  isLoading,
  selectedDb,
  className = '',
  compact = false,
  buttonPosition = 'right',
}) => {
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      onSubmit(e as any);
    }
  }, [onSubmit]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange(e.target.value);
  }, [onChange]);

  const handleSubmit = useCallback((e: React.MouseEvent) => {
    onSubmit(e as any);
  }, [onSubmit]);

  const textareaClassName = `
    w-full
    px-4 py-3
    text-sm leading-relaxed
    bg-[var(--bg-color)]
    border border-[var(--border)]
    rounded-lg
    focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20
    placeholder:text-[var(--text-lighter)]/50
    transition-all duration-150
    ${compact ? 'resize-none flex-1' : 'resize-y min-h-[120px]'}
  `;

  const buttonClassName = `
    ${buttonPosition === 'right' 
      ? (compact ? 'w-full h-10' : 'aspect-square h-[120px]') 
      : 'h-12 px-6'}
    bg-blue-500 text-white 
    rounded-lg
    hover:bg-blue-600
    active:bg-blue-700
    disabled:opacity-50 disabled:cursor-not-allowed
    text-sm font-medium
    flex items-center justify-center gap-2
    transition-all duration-150
    shadow-sm
    hover:shadow-md
    active:shadow-sm
    whitespace-nowrap
    ${isLoading ? 'animate-pulse' : ''}
  `;

  const isEmptyQuery = !value?.trim?.();

  const renderButton = () => (
    <button
      onClick={handleSubmit}
      disabled={isLoading || isEmptyQuery}
      className={buttonClassName}
      title="Execute Query (Ctrl+Enter)"
    >
      {isLoading ? (
        <div className="flex items-center gap-2 px-2">
          <i className="ph-bold ph-circle-notch animate-spin text-lg"></i>
          <span className="text-sm font-medium">Running Query...</span>
        </div>
      ) : (
        <div className="flex items-center gap-2 px-2">
          <i className="ph-bold ph-play text-lg"></i>
          <span className="text-sm font-medium">Run Query</span>
        </div>
      )}
    </button>
  );

  return (
    <div className={`flex flex-col ${className}`}>
      {!compact && (
        <div className="flex items-center justify-between p-3 bg-[var(--bg-darker)] border-b border-[var(--border)]">
          <div className="flex items-center gap-2">
            <button className="px-3 h-8 text-xs rounded-md bg-[var(--bg-color)] border border-[var(--border)] hover:border-blue-500/30 hover:bg-[var(--bg-color)]/80 text-[var(--text-lighter)] transition-all duration-150 flex items-center gap-1.5 shadow-sm">
              <i className="ph-bold ph-brackets-curly text-blue-400"></i>
              Format
            </button>
            <button className="px-3 h-8 text-xs rounded-md bg-[var(--bg-color)] border border-[var(--border)] hover:border-blue-500/30 hover:bg-[var(--bg-color)]/80 text-[var(--text-lighter)] transition-all duration-150 flex items-center gap-1.5 shadow-sm">
              <i className="ph-bold ph-clock-counter-clockwise text-purple-400"></i>
              History
            </button>
            <button className="px-3 h-8 text-xs rounded-md bg-[var(--bg-color)] border border-[var(--border)] hover:border-blue-500/30 hover:bg-[var(--bg-color)]/80 text-[var(--text-lighter)] transition-all duration-150 flex items-center gap-1.5 shadow-sm">
              <i className="ph-bold ph-floppy-disk text-green-400"></i>
              Save
            </button>
            <div className="h-4 w-px bg-[var(--border)] mx-1"></div>
            <button className="px-3 h-8 text-xs rounded-md bg-[var(--bg-color)] border border-[var(--border)] hover:border-blue-500/30 hover:bg-[var(--bg-color)]/80 text-[var(--text-lighter)] transition-all duration-150 flex items-center gap-1.5 shadow-sm">
              <i className="ph-bold ph-arrows-out-simple text-orange-400"></i>
              Expand
            </button>
          </div>
          <div className="text-xs bg-[var(--bg-color)] px-3 h-8 rounded-md border border-[var(--border)] text-[var(--text-lighter)] flex items-center shadow-sm">
            <span className="text-blue-400 font-medium">Ctrl</span> + <span className="text-blue-400 font-medium mx-1">Enter</span> to execute
          </div>
        </div>
      )}
      
      <div className={`${compact ? 'p-3' : 'p-4'} bg-[var(--bg-darker)] flex-1 flex flex-col gap-3`}>
        {selectedDb && !compact && (
          <div className="text-sm text-[var(--text-lighter)] flex items-center px-1">
            <i className="ph-bold ph-database mr-1.5"></i>
            {selectedDb}
          </div>
        )}
        <div className={`flex-1 ${buttonPosition === 'right' ? 'flex gap-3' : 'flex flex-col gap-3'}`}>
          <textarea
            value={value || ''}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            placeholder="Enter SQL query..."
            className={textareaClassName}
            spellCheck={false}
          />
          {buttonPosition === 'right' ? (
            renderButton()
          ) : (
            <div className="flex justify-end px-1">
              {renderButton()}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
