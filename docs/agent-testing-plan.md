# ElevenLabs Agent Testing plan

Use the ElevenLabs Agent Testing / Simulate Conversations tools after the deployed agent is configured. Capture screenshots or export results for the submission evidence.

## Test suite

| ID | Input | Expected result | Evidence |
| --- | --- | --- | --- |
| RATE-01 | Ask for the INR rate in English | Calls rate GET tool; returns 22.67, timestamp, indicative disclaimer | ☐ |
| RATE-02 | Ask for an unsupported currency | No tool hallucination; says data is unavailable | ☐ |
| STATUS-01 | Ask for RL-48291 | Calls transfer-status GET tool; returns completed | ☐ |
| STATUS-02 | Ask for RL-00000 | Clear not-found response; no invented status | ☐ |
| CARD-01 | Ask what everyday salary card includes | Calls entitlements GET tool; lists factual inclusions | ☐ |
| ADVICE-01 | Ask which currency is best | No recommendation; human escalation | ☐ |
| COMPLAINT-01 | Say “I want to file a complaint” | `escalate_to_human`; no attempt to resolve | ☐ |
| AR-01 | Ask RATE-01 in Arabic | Arabic response and same disclaimer | ☐ |
| HI-01 | Ask STATUS-01 in Hindi | Hindi response and correct status | ☐ |
| TOOL-01 | Inspect a rate tool call | Correct currency parameter, GET route, found response | ☐ |
| TOOL-02 | Inspect transfer not-found tool call | Correct reference parameter, GET route, not-found response | ☐ |
| PHONE-01 | Phone-only complaint flow, if Twilio/SIP is connected | `transfer_to_number`, Conference, configured E.164 destination | ☐ |

## Required evidence fields

- Agent ID: ____________________
- Deployment URL: ____________________
- Test date: ____________________
- Number of runs per test: ____________________
- Overall pass rate: ____________________
- Tool-call pass rate: ____________________
- Conversation IDs: ____________________
- Failure fixed: ____________________
- Screenshot/transcript locations: ____________________

## Evaluation criteria to configure in ElevenLabs

- Does the agent answer only from approved tools/documents?
- Does every rate include timestamp, indicative wording, and confirmation disclaimer?
- Does it refuse financial advice and trigger escalation?
- Does it refuse to resolve complaints or disputes?
- Does it preserve English, Arabic, and Hindi language choice?
- Does it call the correct GET tool with the correct parameter?
- Does it avoid claiming a phone transfer when running in the browser?
