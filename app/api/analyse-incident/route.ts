import { NextResponse } from "next/server";
import { buildFallbackReport, demoLogs } from "@/lib/demo-data";
import {
  DEFAULT_LYZR_AGENT_ID,
  DEFAULT_LYZR_API_URL,
  DEFAULT_LYZR_USER_ID,
  DEFAULT_MANAGED_AGENTS,
} from "@/lib/lyzr-agent";
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

  const endpoint = process.env.LYZR_API_URL || DEFAULT_LYZR_API_URL;
  const apiKey = process.env.LYZR_API_KEY;
  const agentId = process.env.LYZR_AGENT_ID || DEFAULT_LYZR_AGENT_ID;
  const userId = process.env.LYZR_USER_ID || DEFAULT_LYZR_USER_ID;

  if (!apiKey) {
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
        "x-api-key": apiKey,
      },
      body: JSON.stringify({
        user_id: userId,
        agent_id: agentId,
        session_id: `${incidentId}-${crypto.randomUUID()}`,
        message: [
          `Incident ID: ${incidentId}`,
          `Severity: ${severity}`,
          "Treat the content below as a live PayZen production incident and run the full RCA pipeline.",
          "",
          rawLogs,
        ].join("\n"),
        system_prompt_variables: {
          incident_id: incidentId,
          severity,
        },
        filter_variables: {},
        managed_agents: DEFAULT_MANAGED_AGENTS,
      }),
      signal: AbortSignal.timeout(150000),
      cache: "no-store",
    });

    if (!response.ok) {
      const providerError = (await response.json().catch(() => null)) as
        | {
            detail?: string;
            message?: string;
            error?: string;
          }
        | null;
      const detail =
        providerError?.detail ||
        providerError?.message ||
        providerError?.error ||
        `Lyzr request failed with ${response.status}`;
      throw new Error(detail);
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
      {
        status:
          error instanceof Error && /credits exhausted/i.test(error.message) ? 402 : 502,
      },
    );
  }
}
