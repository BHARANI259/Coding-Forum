"use client";

import { useRouter } from "next/navigation";
import Button from "@/components/ui/Button";

type BackButtonProps = {
  fallbackHref?: string;
  label?: string;
};

export default function BackButton({ fallbackHref, label = "Back" }: BackButtonProps) {
  const router = useRouter();

  function goBack() {
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
      return;
    }
    if (fallbackHref) {
      router.push(fallbackHref);
    }
  }

  return (
    <Button type="button" variant="secondary" onClick={goBack}>
      {label}
    </Button>
  );
}
