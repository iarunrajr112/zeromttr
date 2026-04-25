import type { Severity } from "@/lib/types";

export function getSeverityBadgeClass(severity: Severity) {
  if (severity === "P1") {
    return "badge-red";
  }

  if (severity === "P2") {
    return "badge-amber";
  }

  return "badge-blue";
}

export function formatCurrencyLoss(value: string) {
  return value.replace("/hr", "");
}
