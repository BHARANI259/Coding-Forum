"use client";

import { InputHTMLAttributes, useState } from "react";
import { cn } from "@/lib/cn";

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  error?: string;
  helperText?: string;
};

export default function Input({ label, error, helperText, id, className, type, disabled, ...props }: InputProps) {
  const inputId = id ?? props.name ?? label.toLowerCase().replace(/\s+/g, "-");
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === "password";

  return (
    <div className="block min-w-0">
      <label className="text-sm font-semibold text-kec-text" htmlFor={inputId}>
        {label}{props.required ? <span className="ml-1 text-red-600" aria-hidden="true">*</span> : null}
      </label>
      <div className="relative mt-2">
        <input
          id={inputId}
          type={isPassword && showPassword ? "text" : type}
          disabled={disabled}
          className={cn(
            "min-h-10 w-full min-w-0 rounded-lg border border-white/60 bg-white/55 px-3 py-2.5 text-base text-kec-text shadow-[inset_0_1px_0_rgba(255,255,255,0.55),0_8px_24px_rgba(15,23,42,0.06)] outline-none backdrop-blur-md transition placeholder:text-kec-muted focus:border-kec-purple/70 focus:bg-white/75 focus:ring-4 focus:ring-kec-purple/15 disabled:cursor-not-allowed disabled:bg-white/35 disabled:text-kec-muted sm:text-sm",
            isPassword && "pr-11",
            error && "border-red-300 focus:border-red-500 focus:ring-red-500/15",
            className
          )}
          {...props}
        />
        {isPassword ? (
          <button
            type="button"
            className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-md text-kec-muted transition hover:bg-kec-purple/10 hover:text-kec-purple focus:outline-none focus:ring-2 focus:ring-kec-purple/30 disabled:cursor-not-allowed disabled:opacity-50"
            aria-label={showPassword ? "Hide password" : "Show password"}
            aria-pressed={showPassword}
            disabled={disabled}
            onClick={() => setShowPassword((current) => !current)}
          >
            {showPassword ? (
              <svg aria-hidden="true" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 3l18 18" />
                <path d="M10.6 10.6a2 2 0 0 0 2.8 2.8" />
                <path d="M9.9 4.2A10.8 10.8 0 0 1 12 4c5 0 9 4.5 10 8a11.8 11.8 0 0 1-2.4 4" />
                <path d="M6.5 6.5A11.5 11.5 0 0 0 2 12c1 3.5 5 8 10 8a10.8 10.8 0 0 0 4.1-.8" />
              </svg>
            ) : (
              <svg aria-hidden="true" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
            )}
          </button>
        ) : null}
      </div>
      {error ? <span className="mt-1 block break-words text-xs text-red-600">{error}</span> : null}
      {!error && helperText ? <span className="mt-1 block break-words text-xs text-kec-muted">{helperText}</span> : null}
    </div>
  );
}
