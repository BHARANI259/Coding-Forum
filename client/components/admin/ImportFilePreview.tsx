"use client";

import { useEffect, useState } from "react";

type PreviewRow = {
  rowNumber: number;
  label: string;
  valid: boolean;
  message: string;
};

type ImportFilePreviewProps = {
  file: File | null;
  requiredColumns: string[];
  labelColumn: string;
};

export default function ImportFilePreview({ file, requiredColumns, labelColumn }: ImportFilePreviewProps) {
  const [rows, setRows] = useState<PreviewRow[]>([]);
  const [message, setMessage] = useState("");
  const requiredColumnKey = requiredColumns.join("|");

  useEffect(() => {
    let active = true;
    async function preview() {
      const required = requiredColumnKey.split("|").filter(Boolean);
      setRows([]);
      setMessage("");
      if (!file) return;
      if (!file.name.toLowerCase().endsWith(".csv")) {
        setMessage("XLSX selected. The server will validate every row during import; use the CSV template for an on-screen preflight preview.");
        return;
      }
      try {
        const lines = (await file.text()).split(/\r?\n/).filter((line) => line.trim());
        if (!active) return;
        if (lines.length < 2) {
          setMessage("The CSV must contain a header row and at least one student or faculty row.");
          return;
        }
        const headers = parseCsvLine(lines[0]).map((value) => value.trim());
        const missingColumns = required.filter((column) => !headers.includes(column));
        if (missingColumns.length) {
          setMessage(`Missing required columns: ${missingColumns.join(", ")}.`);
          return;
        }
        const previewRows = lines.slice(1, 6).map((line, index) => {
          const values = parseCsvLine(line);
          const row = Object.fromEntries(headers.map((header, columnIndex) => [header, values[columnIndex]?.trim() ?? ""]));
          const missingValues = required.filter((column) => !row[column]);
          return {
            rowNumber: index + 2,
            label: row[labelColumn] || "Unnamed row",
            valid: missingValues.length === 0,
            message: missingValues.length ? `Missing: ${missingValues.join(", ")}` : "Ready for server validation"
          };
        });
        setRows(previewRows);
        setMessage(lines.length > 6 ? `Showing the first 5 of ${lines.length - 1} data rows.` : `Previewing ${previewRows.length} data row${previewRows.length === 1 ? "" : "s"}.`);
      } catch {
        if (active) setMessage("Unable to preview this CSV. Confirm that it is a UTF-8 text file or import it for server validation.");
      }
    }
    void preview();
    return () => {
      active = false;
    };
  }, [file, labelColumn, requiredColumnKey]);

  if (!file) return null;

  return (
    <div className="mt-4 rounded-lg border border-kec-border bg-slate-50 p-3">
      <p className="text-sm font-semibold text-kec-text">Import Preview</p>
      {message ? <p className="mt-1 text-xs text-kec-secondary">{message}</p> : null}
      {rows.length ? (
        <div className="mt-3 space-y-2">
          {rows.map((row) => (
            <div key={row.rowNumber} className="flex flex-col gap-1 rounded-lg border border-kec-border bg-white px-3 py-2 sm:flex-row sm:items-center sm:justify-between">
              <p className="min-w-0 break-words text-sm text-kec-text">Row {row.rowNumber}: <strong>{row.label}</strong></p>
              <span className={`shrink-0 text-xs font-semibold ${row.valid ? "text-green-700" : "text-red-700"}`}>{row.message}</span>
            </div>
          ))}
        </div>
      ) : null}
      <p className="mt-2 text-xs text-kec-muted">Duplicate accounts, department codes, email format, and business rules are checked by the server during import.</p>
    </div>
  );
}

function parseCsvLine(line: string) {
  const values: string[] = [];
  let value = "";
  let quoted = false;
  for (let index = 0; index < line.length; index += 1) {
    const character = line[index];
    if (character === '"') {
      if (quoted && line[index + 1] === '"') {
        value += '"';
        index += 1;
      } else {
        quoted = !quoted;
      }
    } else if (character === "," && !quoted) {
      values.push(value);
      value = "";
    } else {
      value += character;
    }
  }
  values.push(value);
  return values;
}
