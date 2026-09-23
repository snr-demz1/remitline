# RemitLine architecture — one-page overview

```text
Caller browser / phone
        |
        v
ElevenLabs Agent Platform
- multilingual STT / TTS
- system prompt + language detection
- factual RAG documents
- webhook GET tools
- client escalation tool (web)
- transfer_to_number (phone only)
        |
        +--------------------+
        |                    |
        v                    v
Next.js public GET tools   Human specialist
rate / status / card      conference transfer or tel: fallback
        |
        v
Shared demo store
Upstash Redis in Vercel
local file fallback in development
        ^
        |
Protected operator console /admin
- rates
- transfer demo records
- salary-card entitlements
- specialist contact
```

## Trust boundaries

- Untrusted callers can only invoke the three GET tools.
- Admin writes require an HTTP-only authenticated session.
- The agent cannot change accounts, balances, or transactions.
- Transfer status is synthetic; production requires identity verification.
- Complaints, disputes, advice, and out-of-scope requests trigger human escalation.
- `transfer_to_number` only runs in a phone call and only to a configured E.164 destination.
- Browser sessions show a visible handoff and `tel:` fallback; they do not claim a call occurred.

## Audit evidence

- ElevenLabs stores conversation transcripts and call analysis.
- RemitLine displays the active transcript and ephemeral GET-tool activity.
- `scripts/guardrail-check.md` records manual multi-language outcomes.
- `docs/agent-testing-plan.md` defines repeatable platform tests and expected pass criteria.
