import React from 'react';
import './Table.css';

export interface Column<T> {
  key: string;
  header: string;
  render?: (row: T) => React.ReactNode;
  sortable?: boolean;
}

interface TableProps<T> {
  columns: Column<T>[];
  data: T[];
  isLoading?: boolean;
  emptyState?: React.ReactNode;
  onRowClick?: (row: T) => void;
  sortColumn?: string;
  sortDirection?: 'asc' | 'desc';
  onSort?: (key: string) => void;
}

export function Table<T extends { id: string | number }>({
  columns,
  data,
  isLoading = false,
  emptyState,
  onRowClick,
  sortColumn,
  sortDirection,
  onSort,
}: TableProps<T>) {
  
  const handleHeaderClick = (column: Column<T>) => {
    if (column.sortable && onSort) {
      onSort(column.key);
    }
  };

  return (
    <div className="table-responsive-wrapper">
      <table className="custom-data-table">
        <thead>
          <tr>
            {columns.map((col) => {
              const isSorted = sortColumn === col.key;
              return (
                <th
                  key={col.key}
                  className={`${col.sortable ? 'sortable-header' : ''} ${isSorted ? 'active-sort' : ''}`}
                  onClick={() => handleHeaderClick(col)}
                >
                  <div className="table-header-cell-content">
                    <span>{col.header}</span>
                    {col.sortable && (
                      <span className="sort-arrow-indicator">
                        {isSorted ? (sortDirection === 'asc' ? ' ▴' : ' ▾') : ' ⇅'}
                      </span>
                    )}
                  </div>
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {isLoading ? (
            // Shimmer Loading skeleton rows
            Array.from({ length: 5 }).map((_, rIdx) => (
              <tr key={rIdx} className="table-skeleton-row">
                {columns.map((col) => (
                  <td key={col.key}>
                    <div className="skeleton-line animate-shimmer" />
                  </td>
                ))}
              </tr>
            ))
          ) : data.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="table-empty-cell">
                {emptyState || (
                  <div className="table-default-empty">
                    <span className="empty-icon">📭</span>
                    <p className="empty-text">No records found</p>
                  </div>
                )}
              </td>
            </tr>
          ) : (
            data.map((row) => (
              <tr
                key={row.id}
                className={onRowClick ? 'clickable-row' : ''}
                onClick={() => onRowClick && onRowClick(row)}
              >
                {columns.map((col) => (
                  <td key={col.key}>
                    {col.render ? col.render(row) : (row as any)[col.key]}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
export default Table;
