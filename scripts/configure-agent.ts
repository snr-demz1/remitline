import { readFile } from "node:fs/promises";
import { ElevenLabsClient } from "@elevenlabs/elevenlabs-js";

const defaultBaseUrl = "https://remitline-nu.vercel.app";

const tools = [
  {
    name: "get_remittance_rate",
    description: "Use this tool first whenever the caller asks for today's indicative remittance rate or a currency corridor rate. Never guess a rate.",
    url: `${defaultBaseUrl}/api/tools/rate`,
    parameter: "currency",
    parameterDescription: "Three-letter destination currency code such as INR, PKR, BDT, PHP, NPR, or LKR.",
  },
  {
    name: "get_transfer_status",
    description: "Use this tool whenever the caller asks for a transfer status and provides a reference number. Never invent a status.",
    url: `${defaultBaseUrl}/api/tools/transfer-status`,
    parameter: "reference",
    parameterDescription: "The transfer reference supplied by the caller, such as RL-48291.",
  },
  {
    name: "get_salary_card_entitlements",
    description: "Use this tool whenever the caller asks what a salary card includes. Report facts only and never recommend or compare products.",
    url: `${defaultBaseUrl}/api/tools/entitlements`,
    parameter: "tier",
    parameterDescription: "Salary-card tier such as everyday, plus, or basic.",
  },
];

async function loadEnv() {
  const text = await readFile(".env.local", "utf8");
  for (const line of text.split(/\r?\n/)) {
    const match = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (match && !process.env[match[1]]) process.env[match[1]] = match[2].trim();
  }
}

async function main() {
  await loadEnv();
  const apiKey = process.env.ELEVENLABS_API_KEY;
  const agentId = process.env.NEXT_PUBLIC_AGENT_ID;
  const baseUrl = process.env.TOOL_BASE_URL ?? defaultBaseUrl;
  for (const definition of tools) definition.url = definition.url.replace(defaultBaseUrl, baseUrl);
  if (!apiKey || !agentId) throw new Error("ELEVENLABS_API_KEY and NEXT_PUBLIC_AGENT_ID are required.");
  const client = new ElevenLabsClient({ apiKey });
  const existing = await client.conversationalAi.tools.list({ types: ["webhook"], pageSize: 100 });
  const existingTools = (existing.tools ?? []) as Array<{ id: string; toolConfig?: { name?: string } }>;
  const toolIds: string[] = [];

  for (const definition of tools) {
    const found = existingTools.find((item) => item.toolConfig?.name === definition.name);
    if (found) {
      toolIds.push(found.id);
      console.log(`Reusing tool ${definition.name}: ${found.id}`);
      continue;
    }
    const created = await client.conversationalAi.tools.create({
      toolConfig: {
        type: "webhook",
        name: definition.name,
        description: definition.description,
        responseTimeoutSecs: 15,
        toolErrorHandlingMode: "summarized",
        apiSchema: {
          url: definition.url,
          method: "GET",
          queryParamsSchema: {
            properties: {
              [definition.parameter]: { type: "string", description: definition.parameterDescription },
            },
            required: [definition.parameter],
          },
        },
      },
    });
    toolIds.push(created.id);
    console.log(`Created tool ${definition.name}: ${created.id}`);
  }

  const agent = await client.conversationalAi.agents.get(agentId);
  const currentPrompt = agent.conversationConfig?.agent?.prompt;
  const currentKnowledge = currentPrompt?.knowledgeBase ?? [];
  const knowledge = await client.conversationalAi.knowledgeBase.list({ pageSize: 100 });
  const documents = (knowledge.documents ?? []) as Array<{ id: string; name: string; type?: "file" | "url" | "text" | "folder" }>;
  const selected = documents.filter((document) => document.name === "rate-sheet" || document.name === "entitlements");
  const knowledgeBase = selected.length ? selected.map((document) => ({ type: document.type ?? "text", name: document.name, id: document.id, usageMode: "auto" as const })) : currentKnowledge;

  const promptText = typeof currentPrompt?.prompt === "string" ? currentPrompt.prompt : "";
  const promptAddition = "\n\nTool execution rules: For a rate question, call get_remittance_rate first. For a transfer-status question, call get_transfer_status with the exact reference. For a salary-card question, call get_salary_card_entitlements with the requested tier. When a tool returns found=false, say the requested data was not found and never guess. Do not transfer supported factual questions merely because a tool is available. Escalate only complaints, disputes, advice requests, or out-of-scope requests.";

  await client.conversationalAi.agents.update(agentId, {
    conversationConfig: {
      agent: {
        prompt: {
          prompt: promptText.includes("Tool execution rules:") ? promptText : `${promptText}${promptAddition}`,
          toolIds,
          knowledgeBase,
          rag: { enabled: true },
        },
      },
    },
  });
  console.log(`Configured agent ${agentId} with ${toolIds.length} GET tools and ${knowledgeBase.length} knowledge documents.`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
