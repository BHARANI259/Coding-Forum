import { ReactNode } from "react";
import Card from "./Card";

type DataTableProps = {
  headers: string[];
  rows?: ReactNode[][];
  emptyMessage?: string;
  loading?: boolean;
};

export default function DataTable({ headers, rows = [], emptyMessage = "No records found.", loading = false }: DataTableProps) {
  return (
    <Card className="p-0">
      <div className="block sm:hidden">
        {loading ? (
          <div className="divide-y divide-kec-border">
            {Array.from({ length: 4 }).map((_, rowIndex) => (
              <div key={rowIndex} className="space-y-3 p-4">
                {headers.slice(0, 4).map((header) => (
                  <div key={header} className="space-y-1">
                    <div className="h-3 w-24 animate-pulse rounded bg-slate-100" />
                    <div className="h-4 w-full max-w-48 animate-pulse rounded bg-slate-100" />
                  </div>
                ))}
              </div>
            ))}
          </div>
        ) : rows.length ? (
          <div className="divide-y divide-kec-border">
            {rows.map((row, rowIndex) => (
              <div key={rowIndex} className="space-y-3 p-4">
                {headers.map((header, cellIndex) => (
                  <div key={`${rowIndex}-${header}`} className="grid gap-1">
                    <span className="text-xs font-semibold uppercase tracking-wide text-kec-muted">{header}</span>
                    <span className="min-w-0 break-words text-sm text-kec-text">{row[cellIndex] ?? "-"}</span>
                  </div>
                ))}
              </div>
            ))}
          </div>
        ) : (
          <div className="px-4 py-8 text-center text-sm text-kec-muted">{emptyMessage}</div>
        )}
      </div>

      <p className="hidden border-b border-kec-border bg-slate-50 px-4 py-2 text-xs text-kec-muted sm:block lg:hidden">
        Scroll horizontally to view all columns.
      </p>
      <div className="hidden overflow-x-auto focus:outline-none focus:ring-2 focus:ring-inset focus:ring-kec-purple sm:block" tabIndex={0} role="region" aria-label="Scrollable data table">
        <table className="min-w-full divide-y divide-kec-border text-sm">
          <thead className="bg-slate-50">
            <tr>
              {headers.map((header) => (
                <th key={header} className="whitespace-nowrap px-4 py-3 text-left font-semibold text-kec-secondary">
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-kec-border bg-white">
            {loading ? (
              Array.from({ length: 4 }).map((_, rowIndex) => (
                <tr key={rowIndex}>
                  {headers.map((header) => (
                    <td key={header} className="px-4 py-3">
                      <div className="h-4 w-full max-w-32 animate-pulse rounded bg-slate-100" />
                    </td>
                  ))}
                </tr>
              ))
            ) : rows.length ? (
              rows.map((row, rowIndex) => (
                <tr key={rowIndex}>
                  {row.map((cell, cellIndex) => (
                    <td key={cellIndex} className="max-w-[280px] break-words px-4 py-3 text-kec-text">
                      {cell}
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td className="px-4 py-8 text-center text-kec-muted" colSpan={headers.length}>
                  {emptyMessage}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
