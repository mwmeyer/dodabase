import React, { useMemo } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  createColumnHelper,
  flexRender,
  SortingState,
} from '@tanstack/react-table';
import { useVirtualizer } from '@tanstack/react-virtual';
import { writeTextFile, BaseDirectory } from '@tauri-apps/plugin-fs';

interface DataTableProps {
  data: any[];
  showCSV?: boolean;
}

export const DataTable: React.FC<DataTableProps> = ({ data }) => {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [copySuccess, setCopySuccess] = React.useState<string | null>(null);

  const convertToCSV = (data: any[]): string => {
    if (!data.length) return '';
    const headers = Object.keys(data[0]);
    const rows = data.map(row => 
      headers.map(header => {
        const value = row[header];
        if (value === null) return '';
        if (typeof value === 'string' && value.includes(',')) {
          return `"${value}"`;
        }
        return String(value);
      }).join(',')
    );
    return [headers.join(','), ...rows].join('\n');
  };

  const handleCopyToClipboard = async () => {
    try {
      const csvContent = convertToCSV(data);
      await navigator.clipboard.writeText(csvContent);
      setCopySuccess('Copied!');
      setTimeout(() => setCopySuccess(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
      setCopySuccess('Failed to copy');
    }
  };

  const handleDownloadCSV = async () => {
    try {
      const csvContent = convertToCSV(data);
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const fileName = `table_data_${timestamp}.csv`;
      
      await writeTextFile(fileName, csvContent, { baseDir: BaseDirectory.Download });
      
      setCopySuccess('Downloaded!');
      setTimeout(() => setCopySuccess(null), 2000);
    } catch (err) {
      console.error('Failed to save CSV:', err);
      setCopySuccess('Failed to download');
    }
  };

  // Dynamically create columns based on the first row of data
  const columns = useMemo(() => {
    if (!data.length) return [];
    
    const columnHelper = createColumnHelper<any>();
    return Object.keys(data[0]).map((key) => 
      columnHelper.accessor(key, {
        header: () => <span className="font-semibold">{key}</span>,
        cell: (info) => {
          const value = info.getValue();
          // Handle different data types appropriately
          if (value === null) return <span className="text-gray-400">null</span>;
          if (typeof value === 'boolean') return value ? 'true' : 'false';
          if (typeof value === 'object') return JSON.stringify(value);
          return String(value);
        },
      })
    );
  }, [data]);

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
    },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  });

  const { rows } = table.getRowModel();

  const rowVirtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => containerRef.current,
    estimateSize: () => 24,
    overscan: 10,
  });

  if (!data.length) {
    return <div className="text-center p-4 text-gray-500">No data available</div>;
  }

  const columnsList = table.getAllColumns();

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-end gap-2 p-2 border-b border-[var(--border)] bg-[var(--bg-darker)]">
        <button
          onClick={handleCopyToClipboard}
          className="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-md hover:bg-[var(--bg-lighter)] text-[var(--text)] transition-colors"
        >
          <i className="ph-bold ph-copy"></i>
          <span>Copy as CSV</span>
        </button>
        <button
          onClick={handleDownloadCSV}
          className="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-md bg-blue-500 hover:bg-blue-600 text-white transition-colors"
        >
          <i className="ph-bold ph-download"></i>
          <span>Download CSV</span>
        </button>
        {copySuccess && (
          <span className="text-sm text-[var(--text-lighter)]">{copySuccess}</span>
        )}
      </div>
      {/* Fixed Header */}
      <div className="flex border-b border-[var(--border)] bg-[var(--bg-darker)]">
        {table.getHeaderGroups().map(headerGroup => (
          headerGroup.headers.map(header => (
            <div
              key={header.id}
              className="px-3 h-8 text-left cursor-pointer select-none text-[var(--text)] text-xs font-medium flex items-center"
              style={{ width: `${100 / columnsList.length}%` }}
              onClick={header.column.getToggleSortingHandler()}
            >
              {flexRender(
                header.column.columnDef.header,
                header.getContext()
              )}
            </div>
          ))
        ))}
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 min-h-0 overflow-hidden">
        <div
          ref={containerRef}
          className="h-full overflow-auto"
          style={{ contain: 'strict' }}
        >
          <div 
            style={{ 
              height: `${rowVirtualizer.getTotalSize()}px`,
              position: 'relative',
              width: '100%',
            }}
          >
            {rowVirtualizer.getVirtualItems().map(virtualRow => {
              const row = rows[virtualRow.index];
              return (
                <div
                  key={row.id}
                  className="absolute w-full flex hover:bg-[var(--bg-darker)] text-[var(--text-secondary)]"
                  style={{
                    height: '24px',
                    transform: `translateY(${virtualRow.start}px)`,
                    willChange: 'transform',
                  }}
                >
                  {row.getVisibleCells().map(cell => (
                    <div
                      key={cell.id}
                      className="px-3 border-b border-[var(--border)] truncate text-xs"
                      style={{ width: `${100 / columnsList.length}%` }}
                    >
                      <div className="leading-[24px]">
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="px-2 h-7 border-t border-[var(--border)] text-xs text-[var(--text-secondary)] flex justify-between items-center bg-[var(--bg-darker)]">
        <span>{data.length.toLocaleString()} rows</span>
      </div>
    </div>
  );
};
