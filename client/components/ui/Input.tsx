import { InputHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  error?: string;
  helperText?: string;
};

export default function Input({ label, error, helperText, id, className, ...props }: InputProps) {
  const inputId = id ?? props.name ?? label.toLowerCase().replace(/\s+/g, "-");

  return (
    <label className="block min-w-0" htmlFor={inputId}>
      <span className="text-sm font-semibold text-kec-text">
        {label}{props.required ? <span className="ml-1 text-red-600" aria-hidden="true">*</span> : null}
      </span>
      <input
        id={inputId}
        className={cn(
          "mt-2 min-h-10 w-full min-w-0 rounded-lg border border-kec-border bg-white px-3 py-2.5 text-base text-kec-text outline-none transition placeholder:text-kec-muted focus:border-kec-purple focus:ring-4 focus:ring-kec-purple/15 sm:text-sm",
          error && "border-red-300 focus:border-red-500 focus:ring-red-500/15",
          className
        )}
        {...props}
      />
      {error ? <span className="mt-1 block break-words text-xs text-red-600">{error}</span> : null}
      {!error && helperText ? <span className="mt-1 block break-words text-xs text-kec-muted">{helperText}</span> : null}
    </label>
  );
}
