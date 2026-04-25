"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { AnalysisReport, IncidentDraft } from "@/lib/types";

type IncidentContextValue = {
  draft: IncidentDraft;
  report: AnalysisReport | null;
  completedRunbookSteps: number[];
  updateDraft: (patch: Partial<IncidentDraft>) => void;
  setReport: (report: AnalysisReport | null) => void;
  toggleRunbookStep: (step: number) => void;
  resetAll: () => void;
};

const STORAGE_KEY = "zeromttr-state";

const defaultDraft: IncidentDraft = {
  incidentId: "INC-LIVE-001",
  severity: "P1",
  rawLogs: "",
};

const IncidentContext = createContext<IncidentContextValue | null>(null);

function readStoredState() {
  if (typeof window === "undefined") {
    return {
      draft: defaultDraft,
      report: null as AnalysisReport | null,
      completedRunbookSteps: [] as number[],
    };
  }

  const stored = window.sessionStorage.getItem(STORAGE_KEY);
  if (!stored) {
    return {
      draft: defaultDraft,
      report: null as AnalysisReport | null,
      completedRunbookSteps: [] as number[],
    };
  }

  try {
    const parsed = JSON.parse(stored) as {
      draft?: IncidentDraft;
      report?: AnalysisReport | null;
      completedRunbookSteps?: number[];
    };

    return {
      draft: parsed.draft ?? defaultDraft,
      report: parsed.report ?? null,
      completedRunbookSteps: parsed.completedRunbookSteps ?? [],
    };
  } catch {
    return {
      draft: defaultDraft,
      report: null as AnalysisReport | null,
      completedRunbookSteps: [] as number[],
    };
  }
}

export function IncidentProvider({ children }: { children: React.ReactNode }) {
  const storedState = readStoredState();
  const [draft, setDraft] = useState<IncidentDraft>(storedState.draft);
  const [report, setReportState] = useState<AnalysisReport | null>(storedState.report);
  const [completedRunbookSteps, setCompletedRunbookSteps] = useState<number[]>(
    storedState.completedRunbookSteps,
  );

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    window.sessionStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        draft,
        report,
        completedRunbookSteps,
      }),
    );
  }, [completedRunbookSteps, draft, report]);

  const updateDraft = useCallback((patch: Partial<IncidentDraft>) => {
    setDraft((current) => ({ ...current, ...patch }));
  }, []);

  const setReport = useCallback((nextReport: AnalysisReport | null) => {
    setReportState(nextReport);
    setCompletedRunbookSteps([]);
  }, []);

  const toggleRunbookStep = useCallback((step: number) => {
    setCompletedRunbookSteps((current) =>
      current.includes(step)
        ? current.filter((value) => value !== step)
        : [...current, step].sort((a, b) => a - b),
    );
  }, []);

  const resetAll = useCallback(() => {
    setDraft(defaultDraft);
    setReportState(null);
    setCompletedRunbookSteps([]);
    window.sessionStorage.removeItem(STORAGE_KEY);
  }, []);

  const value = useMemo<IncidentContextValue>(
    () => ({
      draft,
      report,
      completedRunbookSteps,
      updateDraft,
      setReport,
      toggleRunbookStep,
      resetAll,
    }),
    [completedRunbookSteps, draft, report, resetAll, setReport, toggleRunbookStep, updateDraft],
  );

  return (
    <IncidentContext.Provider value={value}>{children}</IncidentContext.Provider>
  );
}

export function useIncidentState() {
  const context = useContext(IncidentContext);

  if (!context) {
    throw new Error("useIncidentState must be used inside IncidentProvider");
  }

  return context;
}
