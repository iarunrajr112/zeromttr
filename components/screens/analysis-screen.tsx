"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { EmptyGuard } from "@/components/empty-guard";
import { useIncidentState } from "@/components/incident-provider";
import type { AnalysisReport } from "@/lib/types";
import { cn } from "@/lib/cn";

type StageState = "waiting" | "active" | "completed" | "failed";

type StageConfig = {
  key: string;
  title: string;
  waitingText: string;
  activeText: string;
  summaryText: (report: AnalysisReport) => string;
  pills: { label: string; accent?: "purple" }[];
};

const stages: StageConfig[] = [
  {
    key: "ingestion",
    title: "Log Ingestion Agent",
    waitingText: "Waiting to parse raw incident logs",
    activeText: "Parsing 1,247 log lines across 3 services...",
    summaryText: (report) =>
      `Parsed ${report.timeline.length} key events across ${report.incident.affectedServices.length} services`,
    pills: [{ label: "Haiku 4.5" }],
  },
  {
    key: "pattern",
    title: "Pattern Match Agent",
    waitingText: "Waiting for structured incident object",
    activeText: "Searching Qdrant incident memory...",
    summaryText: (report) => {
      const scores = report.patternMatches.matches
        .map((match) => `${match.similarityPct}%`)
        .join(", ");
      return `Found ${report.patternMatches.matches.length} similar incidents (${scores})`;
    },
    pills: [
      { label: "Haiku 4.5" },
      { label: "Qdrant", accent: "purple" },
    ],
  },
  {
    key: "rca",
    title: "RCA Agent",
    waitingText: "Waiting for pattern match results",
    activeText: "Synthesising root cause...",
    summaryText: (report) =>
      `Root cause identified - ${report.rca.confidencePct}% confidence`,
    pills: [{ label: "Sonnet 4.5" }],
  },
  {
    key: "runbook",
    title: "Runbook Agent",
    waitingText: "Waiting for root cause analysis",
    activeText: "Generating resolution runbook...",
    summaryText: () => "Runbook and stakeholder update prepared",
    pills: [{ label: "Sonnet 4.5" }],
  },
];

export function AnalysisScreen() {
  const router = useRouter();
  const { draft, report, setReport } = useIncidentState();
  const [stageIndex, setStageIndex] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [statusReport, setStatusReport] = useState<AnalysisReport | null>(report);

  useEffect(() => {
    if (!draft.rawLogs.trim()) {
      router.replace("/");
      return;
    }

    let cancelled = false;
    const startedAt = Date.now();

    const elapsedTimer = window.setInterval(() => {
      setElapsedSeconds(Math.floor((Date.now() - startedAt) / 1000));
    }, 1000);

    const advanceStages = async (resolvedReport: AnalysisReport) => {
      const durations = [1600, 1800, 1700, 1600];

      for (let index = 0; index < stages.length; index += 1) {
        if (cancelled) {
          return;
        }

        setStageIndex(index);
        setStatusReport(resolvedReport);
        await new Promise((resolve) => window.setTimeout(resolve, durations[index]));
      }

      setIsComplete(true);
      window.clearInterval(elapsedTimer);
      window.setTimeout(() => {
        if (!cancelled) {
          router.push("/results");
        }
      }, 600);
    };

    const start = async () => {
      try {
        const response = await fetch("/api/analyse-incident", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(draft),
        });

        if (!response.ok) {
          const body = (await response.json().catch(() => null)) as {
            error?: string;
          } | null;
          throw new Error(body?.error || "Unable to analyse this incident.");
        }

        const nextReport = (await response.json()) as AnalysisReport;
        if (cancelled) {
          return;
        }

        setReport(nextReport);
        setStatusReport(nextReport);
        await advanceStages(nextReport);
      } catch (caughtError) {
        window.clearInterval(elapsedTimer);
        setError(
          caughtError instanceof Error
            ? caughtError.message
            : "Unable to analyse this incident.",
        );
      }
    };

    void start();

    return () => {
      cancelled = true;
      window.clearInterval(elapsedTimer);
    };
  }, [draft, router, setReport]);

  const stageStates = useMemo(() => {
    return stages.map((_, index): StageState => {
      if (error && index === stageIndex) {
        return "failed";
      }

      if (index < stageIndex || (isComplete && index === stageIndex)) {
        return "completed";
      }

      if (index === stageIndex) {
        return "active";
      }

      return "waiting";
    });
  }, [error, isComplete, stageIndex]);

  return (
    <EmptyGuard ready={Boolean(draft.rawLogs.trim())}>
      <div className="pipeline-shell">
        <div className="page-hero">
          <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
            <h1 style={{ marginBottom: 0 }}>Analysing {draft.incidentId}</h1>
            <span className="badge badge-red">{draft.severity}</span>
          </div>
          <p>
            4 agents running sequentially •{" "}
            <span className="mono">{String(elapsedSeconds).padStart(2, "0")}s</span>
          </p>
        </div>

        <div className="pipeline-list">
          {stages.map((stage, index) => {
            const state = stageStates[index];
            const iconClass =
              state === "completed"
                ? "completed"
                : state === "active"
                  ? "active"
                  : state === "failed"
                    ? "failed"
                    : "";

            const text =
              state === "completed" && statusReport
                ? stage.summaryText(statusReport)
                : state === "active"
                  ? stage.activeText
                  : state === "failed"
                    ? "Analysis interrupted - retry to continue the pipeline"
                    : stage.waitingText;

            return (
              <article
                className={cn("agent-card", `state-${state}`)}
                key={stage.key}
              >
                <span className={cn("agent-icon", iconClass)} />

                <div className="agent-copy">
                  <div className="agent-title">{stage.title}</div>
                  <div className="agent-status">{text}</div>
                </div>

                <div className="pill-stack">
                  {stage.pills.map((pill) => (
                    <span
                      className={cn(
                        "mini-pill",
                        pill.accent === "purple" && "purple",
                      )}
                      key={pill.label}
                    >
                      {pill.label}
                    </span>
                  ))}
                </div>
              </article>
            );
          })}
        </div>

        {error ? (
          <div className="error-banner">
            <strong>Analysis paused.</strong> {error}
            <div className="page-actions">
              <button className="button" onClick={() => window.location.reload()}>
                Retry Analysis
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </EmptyGuard>
  );
}
