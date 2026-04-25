import { NextResponse } from "next/server";
import { buildFallbackReport, demoLogs } from "@/lib/demo-data";
import { mergeWithFallbackReport, normalizeProviderResponse } from "@/lib/normalize";

type AnalyseRequest = {
  incidentId?: string;
  severity?: string;
  rawLogs?: string;
};

function isFallbackEnabled() {
  return ["1", "true", "yes"].includes(
    (process.env.DEMO_FALLBACK_ENABLED ?? "").toLowerCase(),
  );
}

export async function POST(request: Request) {
  const body = (await request.json()) as AnalyseRequest;
  const incidentId = body.incidentId?.trim() || "INC-LIVE-001";
  const severity = body.severity?.trim() || "P1";
  const rawLogs = body.rawLogs?.trim() || demoLogs;
  const fallback = buildFallbackReport(incidentId, severity, rawLogs);

  const endpoint = process.env.LYZR_API_URL;
  const apiKey = process.env.LYZR_API_KEY;

  if (!endpoint || !apiKey) {
    return NextResponse.json({
      ...fallback,
      meta: {
        ...fallback.meta,
        usedFallback: true,
      },
    });
  }

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        incidentId,
        severity,
        rawLogs,
      }),
      signal: AbortSignal.timeout(45000),
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error(`Lyzr request failed with ${response.status}`);
    }

    const providerPayload = (await response.json()) as unknown;
    const normalized = normalizeProviderResponse(providerPayload, {
      incidentId,
      severity,
      rawLogs,
    });

    return NextResponse.json(mergeWithFallbackReport(normalized, fallback));
  } catch (error) {
    if (isFallbackEnabled()) {
      return NextResponse.json({
        ...fallback,
        meta: {
          ...fallback.meta,
          usedFallback: true,
          providerError:
            error instanceof Error ? error.message : "Unknown provider error",
        },
      });
    }

    return NextResponse.json(
      {
        error: "Unable to analyse the incident right now.",
        detail: error instanceof Error ? error.message : "Unknown provider error",
      },
      { status: 502 },
    );
  }
}
