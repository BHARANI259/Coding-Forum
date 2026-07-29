import { HTMLAttributes } from "react";
import { cn } from "@/lib/cn";

export default function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("w-full min-w-0 max-w-full rounded-xl border border-kec-border bg-white p-4 shadow-sm shadow-slate-200/70 sm:p-5 max-sm:rounded-2xl max-sm:border-slate-200 max-sm:shadow-md max-sm:shadow-slate-200/80", className)}
      {...props}
    />
  );
}
