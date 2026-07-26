import { HTMLAttributes } from "react";
import { cn } from "@/lib/cn";

export default function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("min-w-0 rounded-xl border border-kec-border bg-white p-4 shadow-sm sm:p-5", className)}
      {...props}
    />
  );
}
