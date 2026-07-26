import { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

type ButtonVariant = "primary" | "secondary" | "danger" | "ghost";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  loading?: boolean;
};

const variants: Record<ButtonVariant, string> = {
  primary: "bg-kec-purple text-white hover:bg-kec-purpleHover focus:ring-kec-purple/25",
  secondary: "border border-kec-border bg-white text-kec-text hover:bg-slate-50 focus:ring-kec-purple/20",
  danger: "bg-red-600 text-white hover:bg-red-700 focus:ring-red-600/25",
  ghost: "bg-transparent text-kec-secondary hover:bg-slate-100 focus:ring-kec-purple/20"
};

export default function Button({
  variant = "primary",
  loading = false,
  disabled,
  className,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex min-h-10 items-center justify-center rounded-lg px-4 py-2 text-sm font-semibold leading-5 transition focus:outline-none focus:ring-4 disabled:cursor-not-allowed disabled:opacity-60",
        variants[variant],
        className
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? "Please wait..." : children}
    </button>
  );
}
