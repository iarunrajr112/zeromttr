"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { useIncidentState } from "@/components/incident-provider";

export function LogInputScreen() {
  const router = useRouter();
  const { draft, updateDraft, setReport } = useIncidentState();
  const [isPreparing, setIsPreparing] = useState(false);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsPreparing(true);
    setReport(null);
    router.push("/analysis");
  };

  return (
    <div style={{ maxWidth: 780, margin: "0 auto" }}>
      <div className="page-hero">
        <h1>Analyse Incident</h1>
        <p>Paste raw production logs to begin the PayZen RCA workflow.</p>
      </div>

      <form className="card page-card input-grid" onSubmit={handleSubmit}>
        <div className="field">
          <label htmlFor="rawLogs">Production logs</label>
          <textarea
            className="mono"
            id="rawLogs"
            onChange={(event) => updateDraft({ rawLogs: event.target.value })}
            placeholder="Paste raw logs here..."
            value={draft.rawLogs}
          />
        </div>

        <div className="two-up">
          <div className="field">
            <label htmlFor="incidentId">Incident ID</label>
            <input
              id="incidentId"
              onChange={(event) =>
                updateDraft({ incidentId: event.target.value.toUpperCase() })
              }
              value={draft.incidentId}
            />
          </div>

          <div className="field">
            <label htmlFor="severity">Severity</label>
            <select
              id="severity"
              onChange={(event) => updateDraft({ severity: event.target.value as "P1" | "P2" | "P3" })}
              value={draft.severity}
            >
              <option value="P1">P1</option>
              <option value="P2">P2</option>
              <option value="P3">P3</option>
            </select>
          </div>
        </div>

        <div className="form-actions">
          <button
            className="button"
            disabled={!draft.rawLogs.trim()}
            type="submit"
          >
            {isPreparing ? "Analysing..." : "Analyse Incident"}
          </button>

          <button
            className="clear-link"
            onClick={() =>
              updateDraft({
                rawLogs: "",
                incidentId: "INC-LIVE-001",
                severity: "P1",
              })
            }
            type="button"
          >
            Clear
          </button>
        </div>
      </form>
    </div>
  );
}
