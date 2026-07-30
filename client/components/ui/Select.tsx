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
    <label className="block min-w-0" htmlFor={selectId}>
      <span className="text-sm font-semibold text-kec-text">
        {label}{props.required ? <span className="ml-1 text-red-600" aria-hidden="true">*</span> : null}
      </span>
      <select
        id={selectId}
        className={cn(
          "mt-2 min-h-10 w-full min-w-0 rounded-lg border border-white/60 bg-white/55 px-3 py-2.5 text-base text-kec-text shadow-[inset_0_1px_0_rgba(255,255,255,0.55),0_8px_24px_rgba(15,23,42,0.06)] outline-none backdrop-blur-md transition focus:border-kec-purple/70 focus:bg-white/75 focus:ring-4 focus:ring-kec-purple/15 disabled:cursor-not-allowed disabled:bg-white/35 disabled:text-kec-muted sm:text-sm",
          error && "border-red-300 focus:border-red-500 focus:ring-red-500/15",
          className
        )}
        {...props}
      >
        {children}
      </select>
      {error ? <span className="mt-1 block break-words text-xs text-red-600">{error}</span> : null}
      {!error && helperText ? <span className="mt-1 block break-words text-xs text-kec-muted">{helperText}</span> : null}
    </label>
  );
}
