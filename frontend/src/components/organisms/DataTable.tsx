import React from "react";

export interface Column<T> {
  key: string;
  header: React.ReactNode;
  render?: (row: T, index: number) => React.ReactNode;
  align?: "left" | "center" | "right";
  className?: string;
  headerClassName?: string;
}

export interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  keyExtractor: (row: T, index: number) => string | number;
  onRowClick?: (row: T, index: number) => void;
  emptyMessage?: React.ReactNode;
  className?: string;
}

export function DataTable<T>({
  columns,
  data,
  keyExtractor,
  onRowClick,
  emptyMessage = "No records found.",
  className = "",
}: DataTableProps<T>) {
  const getAlignClass = (align?: "left" | "center" | "right") => {
    if (align === "center") return "text-center";
    if (align === "right") return "text-right";
    return "text-left";
  };

  return (
    <div
      className={`w-full overflow-x-auto rounded border border-brand-border bg-brand-surface/70 backdrop-blur-sm ${className}`}
    >
      <table className="w-full text-sm text-brand-text border-collapse">
        <thead>
          <tr className="border-b border-brand-border bg-brand-surface/90 text-xs font-mono text-brand-secondary uppercase tracking-wider">
            {columns.map((col) => (
              <th
                key={col.key}
                className={`py-3.5 px-4 font-semibold ${getAlignClass(
                  col.align
                )} ${col.headerClassName || ""}`}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-brand-border/40">
          {data.length === 0 ? (
            <tr>
              <td
                colSpan={columns.length}
                className="py-10 px-4 text-center text-brand-secondary font-sans text-sm"
              >
                {emptyMessage}
              </td>
            </tr>
          ) : (
            data.map((row, idx) => (
              <tr
                key={keyExtractor(row, idx)}
                onClick={() => onRowClick?.(row, idx)}
                className={`transition-colors duration-150 ${
                  onRowClick
                    ? "cursor-pointer hover:bg-brand-accent/5 hover:text-brand-accent"
                    : "hover:bg-brand-accent/[0.02]"
                }`}
              >
                {columns.map((col) => (
                  <td
                    key={col.key}
                    className={`py-3.5 px-4 ${getAlignClass(col.align)} ${
                      col.className || ""
                    }`}
                  >
                    {col.render
                      ? col.render(row, idx)
                      : (row as Record<string, any>)[col.key]}
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

export default DataTable;
