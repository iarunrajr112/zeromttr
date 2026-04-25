export const DEFAULT_LYZR_API_URL =
  "https://agent-prod.studio.lyzr.ai/v3/inference/chat/";

export const DEFAULT_LYZR_AGENT_ID = "69ec79fa53a36f9a896b7a91";
export const DEFAULT_LYZR_USER_ID = "zeromttr-demo-user";

export const DEFAULT_MANAGED_AGENTS = [
  {
    id: "69ec79304bc6ab7542d241ef",
    name: "Log Ingestion Agent",
    usage_description:
      "Use FIRST in the pipeline. Parses raw production logs into structured JSON incident object. Receives: raw logs from user. Returns: incident_id, severity, primary_error, affected_services, error_count, trigger_event, and incident_summary for Qdrant search.",
  },
  {
    id: "69ec7930b583aee53dacff5b",
    name: "Pattern Match Agent",
    usage_description:
      "Use SECOND after Log Ingestion Agent. Searches Qdrant knowledge base for similar past PayZen incidents. Receives: complete incident object (especially incident_summary). Returns: top 3 Qdrant matches with similarity scores, past root causes, resolution times, engineers who resolved them, and fix steps.",
  },
  {
    id: "69ec798292dbf7273f33163b",
    name: "RCA Agent",
    usage_description:
      "Use THIRD after Pattern Match Agent. Synthesizes root cause analysis. Receives: incident object from Agent 1 AND Qdrant matches from Agent 2. Returns: root cause statement with confidence percentage, 3 contributing factors, blast radius (affected services/users/transactions/revenue loss), and matched past incident reference.",
  },
  {
    id: "69ec79bb25a12d97fab6f135",
    name: "Runbook Agent",
    usage_description:
      "Use FOURTH and FINAL. Generates executable runbook and CTO Slack message. Receives: root cause analysis from Agent 3 AND top Qdrant match from Agent 2. Returns: 5-step executable runbook with commands and verify steps, plus Slack message ready to send to CTO.",
  },
] as const;
