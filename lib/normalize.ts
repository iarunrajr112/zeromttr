import { demoTimeline } from "@/lib/demo-data";
import type { AnalysisReport, PatternMatch, RunbookStep, TimelineEntry } from "@/lib/types";

type NormalizeInput = {
  incidentId: string;
  severity: string;
  rawLogs: string;
};

function pickArray<T>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : [];
}

function normalizeMatch(match: Record<string, unknown>): PatternMatch {
  return {
    incidentId: String(match.incident_id ?? match.incidentId ?? "INC-000"),
    similarityPct: Number(match.similarity_pct ?? match.similarityPct ?? 0),
    title: String(match.title ?? "Similar incident"),
    rootCause: String(match.root_cause ?? match.rootCause ?? "Unknown root cause"),
    resolvedMinutes: Number(match.resolved_minutes ?? match.resolvedMinutes ?? 0),
    resolvedBy: String(match.resolved_by ?? match.resolvedBy ?? "Unknown"),
    fixSteps: pickArray<string>(match.fix_steps ?? match.fixSteps),
  };
}

function normalizeRunbookStep(
  step: Record<string, unknown>,
  index: number,
): RunbookStep {
  return {
    step: Number(step.step ?? index + 1),
    title: String(step.title ?? `Step ${index + 1}`),
    command: String(step.command ?? "Command unavailable"),
    verify: String(step.verify ?? "Verify service health manually"),
  };
}

function normalizeTimeline(rawLogs: string, payloadTimeline: unknown): TimelineEntry[] {
  const existing = pickArray<Record<string, unknown>>(payloadTimeline).map((entry) => ({
    timestamp: String(entry.timestamp ?? ""),
    service: String(entry.service ?? "unknown-service"),
    level: String(entry.level ?? "INFO").toUpperCase() as TimelineEntry["level"],
    message: String(entry.message ?? ""),
  }));

  if (existing.length > 0) {
    return existing;
  }

  const derived = rawLogs
    .split("\n")
    .slice(0, 6)
    .map((line) => {
      const match = line.match(
        /\[([^\]]+)\]\s+(INFO|WARN|ERROR)\s+([a-z-]+).*msg="([^"]+)"/,
      );

      if (!match) {
        return null;
      }

      return {
        timestamp: match[1],
        service: match[3],
        level: match[2] as TimelineEntry["level"],
        message: match[4],
      };
    })
    .filter((value): value is TimelineEntry => Boolean(value));

  return derived.length > 0 ? derived : demoTimeline();
}

export function normalizeProviderResponse(
  payload: unknown,
  input: NormalizeInput,
): Partial<AnalysisReport> {
  const response = (payload ?? {}) as Record<string, unknown>;
  const incident = (response.incident ?? response.incident_object ?? {}) as Record<
    string,
    unknown
  >;
  const patternMatches = (response.patternMatches ??
    response.pattern_match ??
    response.patternMatchesAgentOutput ??
    {}) as Record<string, unknown>;
  const rca = (response.rca ?? response.root_cause_analysis ?? {}) as Record<
    string,
    unknown
  >;
  const runbook =
    (response.runbook ?? response.runbookAgentOutput ?? {}) as Record<string, unknown>;
  const slackMessage = (runbook.slackMessage ??
    runbook.slack_message ??
    response.slack_message ??
    {}) as Record<string, unknown>;
  const blastRadius = ((rca.blast_radius ?? rca.blastRadius ?? {}) as Record<
    string,
    unknown
  >);

  return {
    incident: {
      incidentId: String(incident.incident_id ?? incident.incidentId ?? input.incidentId),
      severity: String(incident.severity ?? input.severity) as AnalysisReport["incident"]["severity"],
      startTime: String(incident.start_time ?? incident.startTime ?? ""),
      primaryError: String(incident.primary_error ?? incident.primaryError ?? ""),
      affectedServices: pickArray<string>(
        incident.affected_services ?? incident.affectedServices,
      ),
      errorCount: Number(incident.error_count ?? incident.errorCount ?? 0),
      triggerEvent: String(incident.trigger_event ?? incident.triggerEvent ?? ""),
      keyMetrics: (incident.key_metrics ?? incident.keyMetrics ?? {}) as Record<
        string,
        string
      >,
      incidentSummary: String(
        incident.incident_summary ?? incident.incidentSummary ?? "",
      ),
    },
    patternMatches: {
      matches: pickArray<Record<string, unknown>>(
        patternMatches.matches ?? response.matches,
      ).map(normalizeMatch),
      topMatchConfidence: String(
        patternMatches.top_match_confidence ??
          patternMatches.topMatchConfidence ??
          "medium",
      ) as AnalysisReport["patternMatches"]["topMatchConfidence"],
      recommendation: String(patternMatches.recommendation ?? ""),
    },
    rca: {
      rootCause: String(rca.root_cause ?? rca.rootCause ?? ""),
      confidencePct: Number(rca.confidence_pct ?? rca.confidencePct ?? 0),
      confidenceReasoning: String(
        rca.confidence_reasoning ?? rca.confidenceReasoning ?? "",
      ),
      contributingFactors: pickArray<string>(
        rca.contributing_factors ?? rca.contributingFactors,
      ),
      blastRadius: {
        directlyAffected: pickArray<string>(
          blastRadius.directly_affected ?? blastRadius.directlyAffected,
        ),
        cascadingAffected: pickArray<string>(
          blastRadius.cascading_affected ?? blastRadius.cascadingAffected,
        ),
        failedTransactions: Number(
          blastRadius.failed_transactions ?? blastRadius.failedTransactions ?? 0,
        ),
        affectedUsers: Number(
          blastRadius.affected_users ?? blastRadius.affectedUsers ?? 0,
        ),
        estimatedLossPerHour: String(
          blastRadius.estimated_loss_per_hour ?? blastRadius.estimatedLossPerHour ?? "",
        ),
      },
      matchedPastIncident: String(
        rca.matched_past_incident ?? rca.matchedPastIncident ?? "",
      ),
    },
    runbook: {
      steps: pickArray<Record<string, unknown>>(runbook.runbook ?? runbook.steps).map(
        normalizeRunbookStep,
      ),
      slackMessage: {
        header: String(slackMessage.header ?? ""),
        body: String(slackMessage.body ?? ""),
        footer: String(slackMessage.footer ?? ""),
      },
    },
    timeline: normalizeTimeline(input.rawLogs, response.timeline),
    meta: {
      mttrSeconds: Number(
        (response.meta as Record<string, unknown> | undefined)?.mttrSeconds ?? 47,
      ),
      usedFallback: false,
    },
  };
}

export function mergeWithFallbackReport(
  candidate: Partial<AnalysisReport>,
  fallback: AnalysisReport,
): AnalysisReport {
  const merged: AnalysisReport = {
    incident: {
      ...fallback.incident,
      ...candidate.incident,
      affectedServices:
        candidate.incident?.affectedServices?.length
          ? candidate.incident.affectedServices
          : fallback.incident.affectedServices,
      keyMetrics: {
        ...fallback.incident.keyMetrics,
        ...(candidate.incident?.keyMetrics ?? {}),
      },
    },
    patternMatches: {
      ...fallback.patternMatches,
      ...candidate.patternMatches,
      matches:
        candidate.patternMatches?.matches?.length
          ? candidate.patternMatches.matches
          : fallback.patternMatches.matches,
    },
    rca: {
      ...fallback.rca,
      ...candidate.rca,
      contributingFactors:
        candidate.rca?.contributingFactors?.length === 3
          ? candidate.rca.contributingFactors
          : fallback.rca.contributingFactors,
      blastRadius: {
        ...fallback.rca.blastRadius,
        ...(candidate.rca?.blastRadius ?? {}),
        directlyAffected:
          candidate.rca?.blastRadius.directlyAffected?.length
            ? candidate.rca.blastRadius.directlyAffected
            : fallback.rca.blastRadius.directlyAffected,
        cascadingAffected:
          candidate.rca?.blastRadius.cascadingAffected?.length
            ? candidate.rca.blastRadius.cascadingAffected
            : fallback.rca.blastRadius.cascadingAffected,
      },
    },
    runbook: {
      steps:
        candidate.runbook?.steps?.length === 5
          ? candidate.runbook.steps
          : fallback.runbook.steps,
      slackMessage: {
        ...fallback.runbook.slackMessage,
        ...(candidate.runbook?.slackMessage ?? {}),
      },
    },
    timeline: candidate.timeline?.length ? candidate.timeline : fallback.timeline,
    meta: {
      ...fallback.meta,
      ...(candidate.meta ?? {}),
      usedFallback:
        fallback.meta.usedFallback ||
        Boolean(candidate.meta?.usedFallback) ||
        !candidate.incident?.incidentSummary ||
        !candidate.rca?.rootCause,
    },
  };

  if (!merged.timeline.length) {
    merged.timeline = demoTimeline();
  }

  return merged;
}
