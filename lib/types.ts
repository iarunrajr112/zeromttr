export type Severity = "P1" | "P2" | "P3";

export type IncidentDraft = {
  incidentId: string;
  severity: Severity;
  rawLogs: string;
};

export type IncidentSummary = {
  incidentId: string;
  severity: Severity;
  startTime: string;
  primaryError: string;
  affectedServices: string[];
  errorCount: number;
  triggerEvent: string;
  keyMetrics: Record<string, string>;
  incidentSummary: string;
};

export type PatternMatch = {
  incidentId: string;
  similarityPct: number;
  title: string;
  rootCause: string;
  resolvedMinutes: number;
  resolvedBy: string;
  fixSteps: string[];
};

export type PatternMatches = {
  matches: PatternMatch[];
  topMatchConfidence: "high" | "medium" | "low";
  recommendation: string;
};

export type BlastRadius = {
  directlyAffected: string[];
  cascadingAffected: string[];
  failedTransactions: number;
  affectedUsers: number;
  estimatedLossPerHour: string;
};

export type RCAReport = {
  rootCause: string;
  confidencePct: number;
  confidenceReasoning: string;
  contributingFactors: string[];
  blastRadius: BlastRadius;
  matchedPastIncident: string;
};

export type RunbookStep = {
  step: number;
  title: string;
  command: string;
  verify: string;
};

export type SlackMessage = {
  header: string;
  body: string;
  footer: string;
};

export type TimelineEntry = {
  timestamp: string;
  service: string;
  level: "INFO" | "WARN" | "ERROR";
  message: string;
};

export type AnalysisReport = {
  incident: IncidentSummary;
  patternMatches: PatternMatches;
  rca: RCAReport;
  runbook: {
    steps: RunbookStep[];
    slackMessage: SlackMessage;
  };
  timeline: TimelineEntry[];
  meta: {
    mttrSeconds: number;
    usedFallback: boolean;
    providerError?: string;
  };
};
