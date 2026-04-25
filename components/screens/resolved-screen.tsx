"use client";

import { useRouter } from "next/navigation";
import { AnimatedNumber } from "@/components/animated-number";
import { EmptyGuard } from "@/components/empty-guard";
import { useIncidentState } from "@/components/incident-provider";

export function ResolvedScreen() {
  const router = useRouter();
  const { report, resetAll } = useIncidentState();

  return (
    <EmptyGuard ready={Boolean(report)}>
      {report ? (
        <div className="resolved-shell">
          <div className="resolved-top">
            <div className="resolved-icon" />
            <h1>Incident Resolved</h1>
            <p>
              {report.incident.incidentId} • PayZen UPI Checkout • April 25, 2025 •
              02:15 IST
            </p>
          </div>

          <section className="comparison-grid">
            <article className="comparison-card card" style={{ background: "rgba(29, 158, 117, 0.1)" }}>
              <div className="value">
                <AnimatedNumber
                  value={report.meta.mttrSeconds}
                  formatter={(value) => `${Math.round(value)} seconds`}
                />
              </div>
              <div style={{ color: "var(--muted)" }}>Time to Resolution</div>
            </article>

            <article className="comparison-card muted card">
              <div className="value">4 hrs 12 min</div>
              <div style={{ color: "var(--muted)" }}>Previous Manual MTTR</div>
            </article>
          </section>

          <article className="summary-card card">
            <div className="panel-header">
              <h2>Impact Summary</h2>
              <span className="badge badge-green">Recovered</span>
            </div>

            <div className="stats-grid">
              <div className="stat-line">
                <span>Failed transactions recovered</span>
                <strong>{report.rca.blastRadius.failedTransactions.toLocaleString("en-IN")}</strong>
              </div>
              <div className="stat-line">
                <span>Affected users restored</span>
                <strong>{report.rca.blastRadius.affectedUsers.toLocaleString("en-IN")}</strong>
              </div>
              <div className="stat-line">
                <span>Downtime cost avoided</span>
                <strong>{report.rca.blastRadius.estimatedLossPerHour}</strong>
              </div>
            </div>
          </article>

          <div className="banner">
            <strong>This incident has been added to Qdrant memory</strong>
            <span>
              The next similar incident will be identified in milliseconds.
            </span>
          </div>

          <div className="action-row">
            <button className="button-ghost" type="button">
              Download Report
            </button>
            <button
              className="button-secondary"
              onClick={() => {
                resetAll();
                router.push("/");
              }}
              type="button"
            >
              New Incident
            </button>
          </div>
        </div>
      ) : null}
    </EmptyGuard>
  );
}
