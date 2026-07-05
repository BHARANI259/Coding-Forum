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
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-kec-border text-sm">
          <thead className="bg-slate-50">
            <tr>
              {headers.map((header) => (
                <th key={header} className="px-4 py-3 text-left font-semibold text-kec-secondary">
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
                    <td key={cellIndex} className="px-4 py-3 text-kec-text">
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
