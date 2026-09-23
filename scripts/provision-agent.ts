import { readFile } from "node:fs/promises";
import path from "node:path";
import { ElevenLabsClient } from "@elevenlabs/elevenlabs-js";

const SYSTEM_PROMPT = `You are the automated voice assistant for a UAE exchange house. You help customers with exactly three things: today's exchange rate for a currency, the status of a transfer by reference number, and what a salary card includes. You detect and respond in the caller's own language.

Rules you must never break:

Only answer from the rate, transfer-status, and entitlements tools/documents you have been given. Never estimate, guess, or use outside knowledge for a rate or status.
Never give financial advice. Never recommend one product, currency, or transfer method over another. If asked "what should I do" or "what's best," say you can't advise on that and offer to transfer the caller to a team member.
Never state a rate as final or guaranteed. Always say it is indicative and must be confirmed at the time of the transaction, with the timestamp you retrieved it at.
If the caller expresses a complaint, says something is wrong, mentions a dispute, or asks for anything outside rate/status/entitlements, do not attempt to resolve it yourself. Say you're transferring them to a team member who can help, and end the call there.
You cannot access, change, or action anything on an account. You can only look up and report information.
If the caller makes a complaint, mentions a dispute, asks for advice, or asks for anything outside the three supported services, call the client escalation tool named escalate_to_human with a brief reason before saying you are transferring them to a team member. Do not attempt to resolve the issue yourself.
Speak in the caller's detected language. Support English, Arabic, and Hindi, and switch naturally when the caller switches. Preserve currency codes, numbers, timestamps, and transfer references exactly. Keep responses short enough to say naturally out loud.
Be concise and warm. This is a phone/voice conversation, not a chat â€” keep answers short enough to say naturally out loud.`;

async function main() {
  const envPath = path.join(process.cwd(), ".env.local");
  try {
    const envText = await readFile(envPath, "utf8");
    for (const line of envText.split(/\r?\n/)) {
      const match = line.match(/^([A-Z0-9_]+)=(.*)$/);
      if (match && !process.env[match[1]]) process.env[match[1]] = match[2].trim();
    }
  } catch {
    // It is valid to provide the variables through the shell instead.
  }

  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) throw new Error("Missing ELEVENLABS_API_KEY. Add it to .env.local or the shell environment.");

  const specialistPhone = process.env.SPECIALIST_PHONE?.replace(/[\\s()-]/g, "");
  if (specialistPhone && !/^\\+[1-9]\\d{7,14}$/.test(specialistPhone)) {
    throw new Error("SPECIALIST_PHONE must use international E.164 format, for example +971501234567.");
  }

  const client = new ElevenLabsClient({ apiKey });
  const root = process.cwd();
  const baseUrl = process.env.TOOL_BASE_URL ?? "http://localhost:3000";

  const agent = await client.conversationalAi.agents.create({
    name: "RemitLine â€” Synthetic Demo",
    tags: ["hackathon", "read-only", "multilingual"],
    conversationConfig: {
      tts: { voiceId: process.env.ELEVENLABS_VOICE_ID ?? "aMSt68OGf4xUZAnLpTU8", modelId: "eleven_multilingual_v2" },
      agent: {
        firstMessage: "Hello. I can help with a rate, a transfer reference, or salary-card entitlements.",
        language: "en",
        prompt: {
          prompt: SYSTEM_PROMPT,
          ...(specialistPhone ? {
            builtInTools: {
              transferToNumber: {
                type: "system",
                name: "transfer_to_number",
                description: "Transfer callers to the configured human specialist when a complaint, dispute, advice request, or out-of-scope request requires human help.",
                params: {
                  systemToolType: "transfer_to_number",
                  transfers: [{
                    transferDestination: { type: "phone", phoneNumber: specialistPhone },
                    condition: "When the caller makes a complaint, mentions a dispute, asks for financial advice, explicitly asks for a human, or requests anything outside rate checks, transfer status, and salary-card entitlements.",
                    transferType: "conference",
                  }],
                },
              },
            },
          } : {}),
        },
      },
    },
  });

  const documents = ["docs/rate-sheet.md", "docs/entitlements.md"];
  for (const relativePath of documents) {
    const content = await readFile(path.join(root, relativePath), "utf8");
    const document = await client.conversationalAi.knowledgeBase.documents.createFromText({
      name: path.basename(relativePath, ".md"),
      text: content,
    });
    await client.conversationalAi.knowledgeBase.document.computeRagIndex(document.id, { model: "e5_mistral_7b_instruct" });
    console.log(`Knowledge document created and indexed: ${relativePath} (${document.id})`);
  }

  console.log(`Agent created: ${agent.agentId}`);
  console.log(`Set NEXT_PUBLIC_AGENT_ID=${agent.agentId}`);
  console.log(`Tool base URL for dashboard/API setup: ${baseUrl}`);
  console.log("Important: configure the three GET webhook tools in the ElevenLabs dashboard/API integration layer using:");
  console.log(`  ${baseUrl}/api/tools/rate?currency={currency}`);
  console.log(`  ${baseUrl}/api/tools/transfer-status?reference={reference}`);
  console.log(`  ${baseUrl}/api/tools/entitlements?tier={tier}`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});

