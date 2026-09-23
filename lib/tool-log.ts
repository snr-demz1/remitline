export type ToolLog = {
  id: string;
  tool: string;
  input: string;
  outcome: "found" | "not_found" | "invalid";
  at: string;
};

const logs: ToolLog[] = [];

export function recordToolLog(entry: Omit<ToolLog, "id" | "at">) {
  const log: ToolLog = { ...entry, id: crypto.randomUUID(), at: new Date().toISOString() };
  logs.unshift(log);
  if (logs.length > 100) logs.length = 100;
  console.info(`[RemitLine tool] ${entry.tool} ${entry.outcome} input=${entry.input}`);
  return log;
}

export function getToolLogs() {
  return logs;
}

