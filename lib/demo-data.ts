import type { AnalysisReport, Severity, TimelineEntry } from "@/lib/types";

export const demoIncidentLog = `INCIDENT: INC-001
TITLE: MySQL connection pool exhausted during Diwali sale
SEVERITY: P1
SUMMARY: Payment service MySQL connection pool reached max_connections limit of 512 during Diwali promotional campaign. Traffic spike of 6x baseline caused rapid connection pool saturation. SQLSTATE HY000 too many connections errors flooded logs. Circuit breaker opened on checkout-api. 1200 UPI transactions failed. Connection pool limit not scaled ahead of known traffic event.
ROOT CAUSE: MySQL max_connections=512 exhausted during traffic spike. Not pre-scaled before campaign.
FIX STEP 1: SET GLOBAL max_connections = 1024 on db-primary
FIX STEP 2: kubectl rollout restart deployment/payment-service
FIX STEP 3: SHOW STATUS LIKE Threads_connected
FIX STEP 4: Monitor active_connections for 10 minutes
FIX STEP 5: Add DB scaling to pre-campaign checklist
SERVICES AFFECTED: payment-service, checkout-api, fraud-detection
AFFECTED USERS: 1200
RESOLVED IN: 28 minutes
RESOLVED BY: Ravi Kumar SRE Lead
TAGS: connection pool, max_connections, SQLSTATE HY000, traffic spike, UPI, circuit breaker, campaign`;

export const demoLogs = `[2025-04-25 02:11:03] INFO checkout-api request_id=rzp_9f32 campaign=BLACK_FRIDAY_SALE msg="traffic spike detected" rps=518
[2025-04-25 02:11:05] WARN payment-service request_id=pay_001 msg="mysql pool saturation approaching threshold" connections=94/100 latency=812ms
[2025-04-25 02:11:08] ERROR checkout-api request_id=rzp_9f33 msg="UPI create payment failed with 503 from payment-service"
[2025-04-25 02:11:11] ERROR payment-service request_id=pay_002 msg="mysql connection pool exhausted"
[2025-04-25 02:11:16] ERROR db-proxy request_id=db_1002 msg="too many open connections to primary cluster"
[2025-04-25 02:11:22] WARN notification-service request_id=ntf_001 msg="delayed confirmation webhook backlog=241"
[2025-04-25 02:11:31] ERROR checkout-api request_id=rzp_9f34 msg="UPI create payment failed with 503 from payment-service"
[2025-04-25 02:11:42] ERROR payment-service request_id=pay_003 msg="mysql connection pool exhausted"
[2025-04-25 02:11:55] INFO fraud-detection request_id=frd_003 msg="risk scoring latency elevated" latency=1462ms
[2025-04-25 02:12:02] ERROR checkout-api request_id=rzp_9f35 msg="UPI create payment failed with 503 from payment-service"
[2025-04-25 02:12:17] ERROR payment-service request_id=pay_004 msg="mysql connection pool exhausted"`;

export function demoTimeline(): TimelineEntry[] {
  return [
    {
      timestamp: "02:11:03 IST",
      service: "checkout-api",
      level: "INFO",
      message: "BLACK_FRIDAY_SALE campaign traffic spike begins at 518 RPS",
    },
    {
      timestamp: "02:11:05 IST",
      service: "payment-service",
      level: "WARN",
      message: "MySQL pool hits 94/100 connections and latency crosses 800ms",
    },
    {
      timestamp: "02:11:08 IST",
      service: "checkout-api",
      level: "ERROR",
      message: "UPI create payment starts failing with 503 responses from payment-service",
    },
    {
      timestamp: "02:11:11 IST",
      service: "payment-service",
      level: "ERROR",
      message: "Connection pool exhaustion confirmed on payment-service",
    },
    {
      timestamp: "02:11:16 IST",
      service: "db-proxy",
      level: "ERROR",
      message: "Primary cluster rejects new sessions because open connection count is exhausted",
    },
    {
      timestamp: "02:11:22 IST",
      service: "notification-service",
      level: "WARN",
      message: "Webhook confirmations queue as downstream processing starts to lag",
    },
  ];
}

export function buildFallbackReport(
  incidentId: string,
  severity: string,
  rawLogs: string,
): AnalysisReport {
  const typedSeverity = (["P1", "P2", "P3"].includes(severity) ? severity : "P1") as Severity;

  return {
    incident: {
      incidentId,
      severity: typedSeverity,
      startTime: "2025-04-25T02:11:08+05:30",
      primaryError: "UPI create payment failed with 503 from payment-service",
      affectedServices: [
        "checkout-api",
        "payment-service",
        "db-proxy",
        "notification-service",
      ],
      errorCount: 6,
      triggerEvent: "BLACK_FRIDAY_SALE campaign traffic surge",
      keyMetrics: {
        rps: "518",
        mysqlConnections: "94/100",
        p95Latency: "1462ms",
      },
      incidentSummary:
        "PayZen checkout traffic spiked immediately after the BLACK_FRIDAY_SALE campaign started. Payment requests began failing with 503 responses because payment-service exhausted its MySQL connection pool. The failure propagated into db-proxy saturation and delayed confirmation webhooks, resulting in checkout disruption for UPI users.",
    },
    patternMatches: {
      matches: [
        {
          incidentId: "INC-001",
          similarityPct: 94,
          title: "Checkout 503 storm after festive sale launch",
          rootCause: "MySQL connection pool exhaustion in payment-service under campaign load",
          resolvedMinutes: 28,
          resolvedBy: "Ravi Kumar",
          fixSteps: [
            "Scale payment-service replicas by 2x",
            "Recycle stale MySQL connections in the pool",
            "Apply temporary rate limit at checkout-api ingress",
          ],
        },
        {
          incidentId: "INC-005",
          similarityPct: 61,
          title: "Webhook lag from downstream DB contention",
          rootCause: "db-proxy saturation after payment retries accumulated",
          resolvedMinutes: 34,
          resolvedBy: "Karthik Raj",
          fixSteps: [
            "Pause webhook fan-out",
            "Drain retry queue gradually",
            "Restore payment-service DB concurrency after headroom returns",
          ],
        },
        {
          incidentId: "INC-003",
          similarityPct: 48,
          title: "Festival traffic latency regression",
          rootCause: "Fraud scoring latency amplified checkout contention",
          resolvedMinutes: 19,
          resolvedBy: "Anand Subramanian",
          fixSteps: [
            "Switch fraud model to cached decisions",
            "Reduce sync checks for low-risk UPI requests",
            "Replay delayed callbacks after service recovery",
          ],
        },
      ],
      topMatchConfidence: "high",
      recommendation:
        "Follow the INC-001 mitigation path first: restore DB headroom, then normalize request rate.",
    },
    rca: {
      rootCause:
        "BLACK_FRIDAY_SALE traffic overwhelmed payment-service, exhausting the MySQL connection pool and causing checkout-api to serve 503s for UPI payment creation.",
      confidencePct: 87,
      confidenceReasoning:
        "The live logs show repeated payment-service pool exhaustion and the top Qdrant match aligns at 94% similarity with the same failure signature.",
      contributingFactors: [
        "Campaign traffic surge reached checkout before replica capacity was scaled",
        "Stale MySQL sessions reduced effective pool headroom under retry load",
        "db-proxy contention amplified downstream latency and webhook lag",
      ],
      blastRadius: {
        directlyAffected: ["checkout-api", "payment-service", "db-proxy"],
        cascadingAffected: ["notification-service", "fraud-detection"],
        failedTransactions: 1847,
        affectedUsers: 2400,
        estimatedLossPerHour: "₹1.2L/hr",
      },
      matchedPastIncident: "INC-001 at 94% - resolved in 28 min",
    },
    runbook: {
      steps: [
        {
          step: 1,
          title: "Throttle incoming checkout surge",
          command:
            "kubectl scale deploy/checkout-api --replicas=8 -n payzen-prod && kubectl apply -f rate-limit-hotfix.yaml",
          verify: "503 rate drops within 60 seconds and ingress RPS stabilises below 350.",
        },
        {
          step: 2,
          title: "Restore payment-service DB headroom",
          command:
            "kubectl rollout restart deploy/payment-service -n payzen-prod && kubectl exec deploy/payment-service -n payzen-prod -- ./scripts/clear-stale-pool.sh",
          verify: "Active MySQL pool usage falls below 70/100 with healthy pod readiness.",
        },
        {
          step: 3,
          title: "Relieve db-proxy saturation",
          command:
            "kubectl scale deploy/db-proxy --replicas=4 -n payzen-prod && kubectl top pods -n payzen-prod | grep db-proxy",
          verify: "Proxy latency returns under 250ms and new sessions stop failing.",
        },
        {
          step: 4,
          title: "Drain delayed callbacks safely",
          command:
            "kubectl exec deploy/notification-service -n payzen-prod -- ./scripts/resume-webhook-worker.sh --batch-size=50",
          verify: "Webhook backlog trends to zero without re-triggering DB saturation.",
        },
        {
          step: 5,
          title: "Lock in prevention guardrails",
          command:
            "kubectl apply -f autoscale/payment-service-hpa.yaml && kubectl apply -f alerts/mysql-pool-threshold.yaml",
          verify: "Autoscaling and pool saturation alerts show as active in monitoring.",
        },
      ],
      slackMessage: {
        header: "🔴 P1 UPDATE - PayZen Checkout 02:15 IST",
        body:
          "UPI checkout has been degraded since 02:11 IST, impacting ~2,400 users.\nRoot cause is payment-service MySQL pool exhaustion triggered by BLACK_FRIDAY_SALE traffic.\nCurrent ETA is 10 minutes while we restore DB headroom and drain queued callbacks.\nPrevention action: enabling autoscale and earlier pool saturation alerts after recovery.",
        footer: "Sent by ZeroMTTR • Resolved in 47s",
      },
    },
    timeline: demoTimeline(),
    meta: {
      mttrSeconds: 47,
      usedFallback: rawLogs === demoLogs,
    },
  };
}
