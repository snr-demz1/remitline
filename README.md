# RemitLine

RemitLine is a multilingual, read-only voice-agent demo for a UAE exchange house. It answers exactly three factual questions:

1. Today's indicative rate for a supported currency corridor.
2. Transfer status by reference number.
3. What a synthetic salary-card tier includes.

> **Synthetic data disclaimer:** every rate, transfer, and salary-card entitlement in this repository is invented for the hackathon demo. It is not real exchange-house data and must not be used for a financial decision or transaction.

## Stack

- Next.js App Router + TypeScript + Tailwind CSS
- `@elevenlabs/react` for browser voice conversations
- `@elevenlabs/elevenlabs-js` for server-side provisioning
- Local JSON mock data; no external database
- Vercel deployment target

## Run locally

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Environment

Create `.env.local` and never commit it:

```env
ELEVENLABS_API_KEY=your_server_key
ELEVENLABS_VOICE_ID=your_voice_id
NEXT_PUBLIC_AGENT_ID=agent_id_after_provisioning
TOOL_BASE_URL=http://localhost:3000
```

The API key is server-side only. The agent ID is a public identifier. Rotate any key that has been exposed outside your local environment.

## Voice agent

The landing page requests microphone permission on **Start a conversation**, connects to the public ElevenLabs agent over WebSocket, detects the live speaking/listening state, and renders a live transcript in the browser.

The agent supports English, Arabic, and Hindi. The current TTS configuration uses `eleven_multilingual_v2`. The factual knowledge documents are the approved sources for rate and entitlement answers; current transfer status is returned by the GET tool. Browser sessions show a handoff and clickable `tel:` fallback; ElevenLabs `transfer_to_number` is phone-call-only and requires a phone-enabled agent/Twilio or SIP setup.

## Provisioning

```bash
npx tsx scripts/provision-agent.ts
```

The script creates the agent and indexes the factual rate and entitlement documents. If `SPECIALIST_PHONE` is set in E.164 format, it also configures a documented `transfer_to_number` Conference rule for phone calls. It prints the agent ID and the three GET URLs. Add the three webhook tools manually in the ElevenLabs dashboard/API integration layer using the deployed URL:

- `GET /api/tools/rate?currency={currency}`
- `GET /api/tools/transfer-status?reference={reference}`
- `GET /api/tools/entitlements?tier={tier}`

The current SDK type surface does not expose a confirmed generic `tools.create` method, so the provisioning script does not invent one.

Add the client tool `escalate_to_human` in ElevenLabs with an optional string parameter named `reason`. The browser registers that client tool and switches the UI to a distinct human-handoff state when called.

## Read-only backend

- `GET /api/tools/rate?currency=INR`
- `GET /api/tools/transfer-status?reference=RL-48291`
- `GET /api/tools/entitlements?tier=everyday`
- `GET /api/logs`
- `POST /api/admin/login` (admin session setup)
- `GET/PUT /api/admin/data` (protected operator configuration)
- `GET /api/admin/conversations` (protected placeholder; full transcripts remain in ElevenLabs)

The AI-facing tool routes only read the shared demo store. Admin writes are separate operator actions and cannot change an account, balance, transfer, or transaction through the AI. The transfer route includes a production note that identity verification is required before returning account-specific data.

`/api/logs` returns ephemeral in-memory tool-call logs for local debugging. It does not store audio or conversation transcripts. Full conversation transcripts remain in the ElevenLabs dashboard. For durable Vercel storage, configure `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN`; otherwise local admin edits use `.remitline-data` and are not durable on serverless deployments.

## Guardrails

The system prompt and `scripts/guardrail-check.md` enforce:

- Factual answers only from the supplied documents and tools.
- Indicative rates always include a timestamp and transaction-confirmation disclaimer.
- No financial advice or product recommendations.
- Complaints, disputes, advice requests, and out-of-scope requests trigger `escalate_to_human`.
- No account access, account changes, or transaction actions.

## Deploy

1. Push the project to GitHub.
2. Import it into Vercel.
3. Set `ELEVENLABS_API_KEY`, `ELEVENLABS_VOICE_ID`, `NEXT_PUBLIC_AGENT_ID`, and the live `TOOL_BASE_URL`.
4. Update the three ElevenLabs webhook tool URLs to the live Vercel domain.
5. For real phone transfer, connect a phone number through native Twilio or SIP, set `SPECIALIST_PHONE`, provision or update the agent, and choose Conference transfer. The browser widget cannot invoke this phone-only system tool.
6. Verify the client tool, knowledge-base documents, transfer rule, and agent language behavior in the ElevenLabs dashboard.
7. Run every case in `scripts/guardrail-check.md` and record the results.

This is a hackathon demo. The logs are unauthenticated and ephemeral; production requires authentication, durable observability, retention controls, and identity verification for account-specific data.




