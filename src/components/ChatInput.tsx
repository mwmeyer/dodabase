import React, { FormEvent, useRef } from 'react';

interface ChatInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: (e: FormEvent) => void;
  isLoading?: boolean;
  className?: string;
}

export const ChatInput: React.FC<ChatInputProps> = ({
  value,
  onChange,
  onSubmit,
  isLoading,
  className,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  // TODO: Implement file upload handling
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      // Handle file upload
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (!isLoading && value.trim()) {
        onSubmit(e as any);
      }
    }
  };

  return (
    <div className={`flex flex-col ${className}`}>
      <div className="flex items-center justify-between px-4 py-2 bg-[var(--bg-darker)] border-t border-[var(--border)]">
        <div className="flex items-center gap-1.5">
          <button
            className="px-3 py-1.5 text-xs rounded bg-[var(--bg-color)] border border-[var(--border)] hover:border-blue-500/30 hover:bg-[var(--bg-color)]/80 text-[var(--text-lighter)] transition-colors flex items-center gap-1.5"
            onClick={() => fileInputRef.current?.click()}
          >
            <i className="ph-bold ph-paperclip text-blue-400"></i>
            Attach
          </button>
          <button
            className="px-3 py-1.5 text-xs rounded bg-[var(--bg-color)] border border-[var(--border)] hover:border-blue-500/30 hover:bg-[var(--bg-color)]/80 text-[var(--text-lighter)] transition-colors flex items-center gap-1.5"
            onClick={() => {/* TODO: Add code block */}}
          >
            <i className="ph-bold ph-code text-purple-400"></i>
            Code
          </button>
          <button
            className="px-3 py-1.5 text-xs rounded bg-[var(--bg-color)] border border-[var(--border)] hover:border-blue-500/30 hover:bg-[var(--bg-color)]/80 text-[var(--text-lighter)] transition-colors flex items-center gap-1.5"
            onClick={() => {/* TODO: Add table */}}
          >
            <i className="ph-bold ph-table text-green-400"></i>
            Table
          </button>
          <div className="h-4 w-px bg-[var(--border)] mx-1"></div>
          <button
            className="px-3 py-1.5 text-xs rounded bg-[var(--bg-color)] border border-[var(--border)] hover:border-blue-500/30 hover:bg-[var(--bg-color)]/80 text-[var(--text-lighter)] transition-colors flex items-center gap-1.5"
            onClick={() => {/* TODO: Toggle fullscreen */}}
          >
            <i className="ph-bold ph-arrows-out-simple text-orange-400"></i>
            Expand
          </button>
        </div>
        <div className="text-xs bg-[var(--bg-color)] px-3 py-1.5 rounded border border-[var(--border)] text-[var(--text-lighter)]">
          <span className="text-blue-400">Shift</span> + <span className="text-blue-400">Enter</span> for new line
        </div>
      </div>
      
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileUpload}
        className="hidden"
        multiple
      />
      
      <div className="p-4 bg-[var(--bg-darker)] border-t border-[var(--border)] flex gap-2">
        <div className="flex-1 flex gap-2">
          <textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Message..."
            className="flex-1 px-3 py-2 rounded-lg bg-[var(--bg-color)] border border-[var(--border)] focus:outline-none focus:border-blue-500 text-sm min-h-[100px] resize-y"
          />
          <button
            onClick={(e) => onSubmit(e as any)}
            disabled={isLoading || !value.trim()}
            className="aspect-square h-[100px] bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed text-sm flex flex-col items-center justify-center gap-2 font-medium"
          >
            <i className="ph-bold ph-paper-plane-right text-xl"></i>
            {isLoading ? 'Sending...' : 'Send'}
          </button>
        </div>
      </div>
    </div>
  );
};
