import { HTMLAttributes } from "react";
import { cn } from "@/lib/cn";

export default function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("rounded-xl border border-kec-border bg-white p-5 shadow-sm", className)}
      {...props}
    />
  );
}
