import { SelectHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

type SelectProps = SelectHTMLAttributes<HTMLSelectElement> & {
  label: string;
  error?: string;
  helperText?: string;
};

export default function Select({ label, error, helperText, id, className, children, ...props }: SelectProps) {
  const selectId = id ?? props.name ?? label.toLowerCase().replace(/\s+/g, "-");

  return (
    <label className="block" htmlFor={selectId}>
      <span className="text-sm font-semibold text-kec-text">{label}</span>
      <select
        id={selectId}
        className={cn(
          "mt-2 w-full rounded-lg border border-kec-border bg-white px-3 py-2.5 text-sm text-kec-text outline-none transition focus:border-kec-purple focus:ring-4 focus:ring-kec-purple/15",
          error && "border-red-300 focus:border-red-500 focus:ring-red-500/15",
          className
        )}
        {...props}
      >
        {children}
      </select>
      {error ? <span className="mt-1 block text-xs text-red-600">{error}</span> : null}
      {!error && helperText ? <span className="mt-1 block text-xs text-kec-muted">{helperText}</span> : null}
    </label>
  );
}
