"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export function EmptyGuard({
  ready,
  fallbackHref = "/",
  children,
}: {
  ready: boolean;
  fallbackHref?: string;
  children: React.ReactNode;
}) {
  const router = useRouter();

  useEffect(() => {
    if (!ready) {
      router.replace(fallbackHref);
    }
  }, [fallbackHref, ready, router]);

  if (!ready) {
    return null;
  }

  return <>{children}</>;
}
