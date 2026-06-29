import { HTMLAttributes } from "react";
import { cn } from "@/lib/cn";

type BadgeVariant = "default" | "success" | "warning" | "error" | "info" | "purple";

const variants: Record<BadgeVariant, string> = {
  default: "bg-slate-100 text-slate-700",
  success: "bg-green-50 text-green-700",
  warning: "bg-amber-50 text-amber-700",
  error: "bg-red-50 text-red-700",
  info: "bg-blue-50 text-blue-700",
  purple: "bg-kec-purple/10 text-kec-purple"
};

type BadgeProps = HTMLAttributes<HTMLSpanElement> & {
  variant?: BadgeVariant;
};

export default function Badge({ variant = "default", className, ...props }: BadgeProps) {
  return (
    <span
      className={cn("inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold", variants[variant], className)}
      {...props}
    />
  );
}
