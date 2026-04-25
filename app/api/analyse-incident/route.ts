import { NextResponse } from "next/server";
import { buildFallbackReport, demoLogs } from "@/lib/demo-data";

type AnalyseRequest = {
  incidentId?: string;
  severity?: string;
  rawLogs?: string;
};

export async function POST(request: Request) {
  const body = (await request.json()) as AnalyseRequest;
  const incidentId = body.incidentId?.trim() || "INC-LIVE-001";
  const severity = body.severity?.trim() || "P1";
  const rawLogs = body.rawLogs?.trim() || demoLogs;
  const fallback = buildFallbackReport(incidentId, severity, rawLogs);
  const forcedDemoResponse = {
    ...fallback,
    meta: {
      ...fallback.meta,
      usedFallback: true,
      providerError: "Demo analysis mode is enabled - returning seeded ZeroMTTR RCA output.",
    },
  };

  return NextResponse.json(forcedDemoResponse);
}
