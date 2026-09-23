import { promises as fs } from "node:fs";
import path from "node:path";
import ratesSeed from "@/data/rates.json";
import transfersSeed from "@/data/transfers.json";
import entitlementsSeed from "@/data/entitlements.json";

export type Rate = (typeof ratesSeed)[number];
export type Transfer = (typeof transfersSeed)[number];
export type Entitlement = (typeof entitlementsSeed)[number];
export type EscalationSettings = { department: string; specialistName: string; phone: string; email: string; hours: string; message: string };

const defaults: EscalationSettings = { department: "UAE Remittance Support", specialistName: "Customer Support Specialist", phone: "+971 50 000 0000", email: "support@example.test", hours: "Sunday–Thursday, 09:00–18:00 UAE", message: "A specialist can help with this request. No phone call is placed by this demo." };
const memory = { rates: [...ratesSeed], transfers: [...transfersSeed], entitlements: [...entitlementsSeed], escalation: defaults };
const dataDir = path.join(process.cwd(), ".remitline-data");

async function redis(command: string[]) {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;
  const response = await fetch(url, { method: "POST", headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }, body: JSON.stringify(command), cache: "no-store" });
  if (!response.ok) throw new Error("Storage service unavailable");
  return (await response.json() as { result: string | null }).result;
}

async function read<T>(key: keyof typeof memory, seed: T): Promise<T> {
  const remote = await redis(["GET", `remitline:${key}`]);
  if (remote) return JSON.parse(remote) as T;
  try { return JSON.parse(await fs.readFile(path.join(dataDir, `${key}.json`), "utf8")) as T; } catch { return memory[key] as T ?? seed; }
}

async function write<T>(key: keyof typeof memory, value: T) {
  const encoded = JSON.stringify(value, null, 2);
  if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) { await redis(["SET", `remitline:${key}`, encoded]); return; }
  await fs.mkdir(dataDir, { recursive: true });
  await fs.writeFile(path.join(dataDir, `${key}.json`), encoded, "utf8");
  (memory as Record<string, unknown>)[key] = value;
}

export const getRates = () => read<Rate[]>("rates", ratesSeed);
export const getTransfers = () => read<Transfer[]>("transfers", transfersSeed);
export const getEntitlements = () => read<Entitlement[]>("entitlements", entitlementsSeed);
export const getEscalationSettings = () => read<EscalationSettings>("escalation", defaults);
export const saveRates = (value: Rate[]) => write("rates", value);
export const saveTransfers = (value: Transfer[]) => write("transfers", value);
export const saveEntitlements = (value: Entitlement[]) => write("entitlements", value);
export const saveEscalationSettings = (value: EscalationSettings) => write("escalation", value);
