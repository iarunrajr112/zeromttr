"use client";

import { useRouter } from "next/navigation";
import { AnimatedNumber } from "@/components/animated-number";
import { EmptyGuard } from "@/components/empty-guard";
import { useIncidentState } from "@/components/incident-provider";
import { formatCurrencyLoss, getSeverityBadgeClass } from "@/lib/format";

export function ResultsScreen() {
  const router = useRouter();
  const { report } = useIncidentState();

  return (
    <EmptyGuard ready={Boolean(report)}>
      {report ? (
        <>
          <div className="page-hero">
            <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
              <h1 style={{ marginBottom: 0 }}>Unified RCA Dashboard</h1>
              <span className={`badge ${getSeverityBadgeClass(report.incident.severity)}`}>
                {report.incident.severity}
              </span>
            </div>
            <p>
              Incident {report.incident.incidentId} • Similar to{" "}
              {report.rca.matchedPastIncident}
            </p>
          </div>

          <section className="metric-grid">
            <article className="metric-card metric-red">
              <span className="label">Errors per minute</span>
              <span className="value">
                <AnimatedNumber value={847} formatter={(value) => `${Math.round(value)}`} />
              </span>
            </article>

            <article className="metric-card metric-amber">
              <span className="label">Affected users</span>
              <span className="value">
                <AnimatedNumber
                  value={report.rca.blastRadius.affectedUsers}
                  formatter={(value) => `${Math.round(value).toLocaleString("en-IN")}`}
                />
              </span>
            </article>

            <article className="metric-card metric-red">
              <span className="label">Estimated loss / hr</span>
              <span className="value">{formatCurrencyLoss(report.rca.blastRadius.estimatedLossPerHour)}</span>
            </article>

            <article className="metric-card metric-green">
              <span className="label">MTTR</span>
              <span className="value">
                <AnimatedNumber
                  value={report.meta.mttrSeconds}
                  formatter={(value) => `${Math.round(value)}s`}
                />
              </span>
            </article>
          </section>

          <section className="panel-grid">
            <article className="panel card">
              <div className="panel-header">
                <h2>Event Timeline</h2>
                <span className="badge">Trigger event</span>
              </div>

              <div className="timeline-list">
                {report.timeline.map((entry, index) => (
                  <div
                    className={`timeline-item ${entry.level.toLowerCase()} ${index === 2 ? "highlight" : ""}`}
                    key={`${entry.timestamp}-${entry.service}-${index}`}
                  >
                    <div className="timeline-meta">
                      {entry.timestamp} • {entry.service}
                    </div>
                    <div>{entry.message}</div>
                  </div>
                ))}
              </div>
            </article>

            <article className="panel card">
              <div className="panel-header">
                <h2>Root Cause</h2>
                <span className="badge badge-green">
                  {report.rca.confidencePct}% confidence
                </span>
              </div>

              <div style={{ display: "grid", gap: 18 }}>
                <div style={{ fontSize: 18, lineHeight: 1.4 }}>{report.rca.rootCause}</div>

                <section>
                  <div className="section-title" style={{ fontSize: 16, marginBottom: 10 }}>
                    Contributing factors
                  </div>
                  <ul className="bullet-list">
                    {report.rca.contributingFactors.map((factor) => (
                      <li key={factor}>{factor}</li>
                    ))}
                  </ul>
                </section>

                <section style={{ display: "grid", gap: 12 }}>
                  <div className="section-title" style={{ fontSize: 16 }}>
                    Blast radius
                  </div>
                  <div className="tag-row">
                    {report.rca.blastRadius.directlyAffected.map((service) => (
                      <span className="tag" key={service}>
                        {service}
                      </span>
                    ))}
                  </div>
                  <div className="stats-grid">
                    <div className="stat-line">
                      <span>Failed transactions</span>
                      <strong>{report.rca.blastRadius.failedTransactions.toLocaleString("en-IN")}</strong>
                    </div>
                    <div className="stat-line">
                      <span>Affected users</span>
                      <strong>{report.rca.blastRadius.affectedUsers.toLocaleString("en-IN")}</strong>
                    </div>
                    <div className="stat-line">
                      <span>Matched past incident</span>
                      <strong>{report.rca.matchedPastIncident}</strong>
                    </div>
                  </div>
                </section>
              </div>
            </article>

            <article className="panel card">
              <div className="panel-header">
                <h2>Similar Past Incidents</h2>
                <span className="badge badge-purple">Qdrant</span>
              </div>

              <div className="incident-cards">
                {report.patternMatches.matches.map((match) => (
                  <details className="memory-card" key={match.incidentId}>
                    <summary>
                      <div className="memory-top">
                        <div className="memory-title">
                          <span>
                            {match.incidentId} • {match.similarityPct}%
                          </span>
                          <span>{match.resolvedMinutes} min</span>
                        </div>
                        <div style={{ color: "var(--muted)", fontSize: 14 }}>
                          Resolved by {match.resolvedBy}
                        </div>
                        <div className="progress-bar">
                          <div
                            className="progress-fill"
                            style={{
                              width: `${match.similarityPct}%`,
                              background:
                                match.similarityPct >= 80
                                  ? "var(--green)"
                                  : match.similarityPct >= 60
                                    ? "var(--amber)"
                                    : "#b9b9b4",
                            }}
                          />
                        </div>
                      </div>
                    </summary>

                    <ul className="bullet-list" style={{ marginTop: 14 }}>
                      {match.fixSteps.map((step) => (
                        <li key={step}>{step}</li>
                      ))}
                    </ul>
                  </details>
                ))}
              </div>
            </article>
          </section>

          <div className="page-actions">
            <button className="button-secondary" onClick={() => router.push("/resolution")}>
              View Resolution →
            </button>
          </div>
        </>
      ) : null}
    </EmptyGuard>
  );
}
