import React from 'react';

export interface SidebarHeaderProps {
  title: string;
  selectedItem: string | null;
  onBack?: () => void;
  onDelete?: (item: string) => void;
  onConfigure?: () => void;
}

export const SidebarHeader: React.FC<SidebarHeaderProps> = ({
  title,
  selectedItem,
  onBack,
  onDelete,
  onConfigure,
}) => {
  return (
    <div className="flex items-center justify-between px-3 py-1.5 bg-[var(--bg-darker)] border-b border-[var(--border)]">
      {selectedItem ? (
        <>
          {onBack && (
            <button
              onClick={onBack}
              className="p-1.5 hover:bg-[var(--bg-lighter)] rounded-md transition-colors"
            >
              <i className="ph-bold ph-arrow-left text-lg"></i>
            </button>
          )}
          <div className="flex-1 mx-3 font-medium truncate">{selectedItem}</div>
          {onDelete && (
            <button
              onClick={() => onDelete(selectedItem)}
              className="p-1.5 hover:bg-[var(--bg-lighter)] rounded-md transition-colors"
            >
              <i className="ph-bold ph-trash text-lg opacity-50 hover:opacity-100 text-red-400"></i>
            </button>
          )}
        </>
      ) : (
        <>
          <div className="font-medium">{title}</div>
          {onConfigure && (
            <button
              onClick={onConfigure}
              className="p-1.5 hover:bg-[var(--bg-lighter)] rounded-md transition-colors"
            >
              <i className={`ph-bold ${title.includes('AI') ? 'ph-robot' : 'ph-database'} text-lg opacity-50 hover:opacity-100`}></i>
            </button>
          )}
        </>
      )}
    </div>
  );
};
