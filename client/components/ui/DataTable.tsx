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
    <Card className="overflow-hidden p-0">
      <div className="block sm:hidden">
        {loading ? (
          <div className="space-y-3 bg-slate-50 p-3">
            {Array.from({ length: 4 }).map((_, rowIndex) => (
              <div key={rowIndex} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                {headers.slice(0, 4).map((header) => (
                  <div key={header} className="mb-3 space-y-1 last:mb-0">
                    <div className="h-3 w-24 animate-pulse rounded bg-slate-100" />
                    <div className="h-4 w-full max-w-48 animate-pulse rounded bg-slate-100" />
                  </div>
                ))}
              </div>
            ))}
          </div>
        ) : rows.length ? (
          <div className="space-y-3 bg-slate-50 p-3">
            {rows.map((row, rowIndex) => (
              <div key={rowIndex} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="border-b border-slate-100 pb-3">
                  <span className="text-[11px] font-bold uppercase tracking-wide text-kec-muted">{headers[0]}</span>
                  <div className="mt-1 min-w-0 break-words text-base font-bold leading-6 text-kec-text">{row[0] ?? "-"}</div>
                </div>
                <div className="mt-3 grid gap-3">
                  {headers.slice(1).map((header, offset) => {
                    const cellIndex = offset + 1;
                    return (
                      <div key={`${rowIndex}-${header}`} className="grid grid-cols-[minmax(96px,38%)_1fr] gap-3">
                        <span className="min-w-0 break-words text-xs font-bold uppercase tracking-wide text-kec-muted">{header}</span>
                        <span className="min-w-0 break-words text-sm leading-5 text-kec-text">{row[cellIndex] ?? "-"}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-slate-50 px-4 py-10 text-center">
            <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-kec-purple/10 text-sm font-black text-kec-purple">i</div>
            <p className="mt-3 text-sm font-semibold text-kec-secondary">{emptyMessage}</p>
          </div>
        )}
      </div>

      <p className="hidden border-b border-kec-border bg-slate-50 px-4 py-2 text-xs text-kec-muted sm:block lg:hidden">
        Scroll horizontally to view all columns.
      </p>
      <div className="hidden w-full overflow-x-auto focus:outline-none focus:ring-2 focus:ring-inset focus:ring-kec-purple sm:block" tabIndex={0} role="region" aria-label="Scrollable data table">
        <table className="min-w-[720px] divide-y divide-kec-border text-sm">
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
