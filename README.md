# ZeroMTTR

ZeroMTTR is a laptop-first hackathon demo for PayZen's AI-powered incident RCA workflow. It presents the full five-screen experience from raw log ingestion through root-cause analysis, runbook generation, and incident resolution.

## Stack

- `Next.js` App Router
- server-side `/api/analyse-incident` bridge for Lyzr
- session-backed client state for multi-screen incident flow
- built-in seeded fallback payload for demo resilience

## Local Setup

1. Install dependencies:

```bash
PATH="/Users/arun/Library/pnpm:$PATH" pnpm install
```

2. Create `.env.local` with the values you have:

```bash
LYZR_API_URL=
LYZR_API_KEY=
DEMO_FALLBACK_ENABLED=true
NEXT_PUBLIC_APP_ENV=Hackathon demo
```

3. Start the dev server:

```bash
PATH="/Users/arun/Library/pnpm:$PATH" pnpm dev
```

## Lyzr Integration Contract

The frontend posts this payload to the local API route:

```json
{
  "incidentId": "INC-LIVE-001",
  "severity": "P1",
  "rawLogs": "..."
}
```

The app expects the Lyzr endpoint to return either:

- the canonical aggregated ZeroMTTR response shape, or
- a close variant containing `incident`, `patternMatches`, `rca`, `runbook`, and optional `timeline`

The server route normalizes partial responses and merges missing fields with the seeded demo payload so the UI remains presentation-ready.

## Demo Mode

- If `LYZR_API_URL` or `LYZR_API_KEY` is missing, the app returns the seeded `INC-LIVE-001` report.
- If the live provider fails and `DEMO_FALLBACK_ENABLED=true`, the app falls back to the seeded report and marks the response as fallback-backed.
- Slack sending is intentionally not implemented in v1; the UI only renders and copies the Slack-ready update.

## Deploying To Vercel

1. Push this repo to GitHub.
2. Import it into Vercel.
3. Add the same environment variables in the Vercel project settings.
4. Deploy.

Use the server-side API route only for Lyzr calls so the API key never reaches the browser.
