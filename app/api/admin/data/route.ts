import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { getRates, getTransfers, getEntitlements, getEscalationSettings, saveRates, saveTransfers, saveEntitlements, saveEscalationSettings, type Rate, type Transfer, type Entitlement, type EscalationSettings } from "@/lib/store";

export async function GET(request: NextRequest) {
  if (!requireAdmin(request)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return NextResponse.json({ rates: await getRates(), transfers: await getTransfers(), entitlements: await getEntitlements(), escalation: await getEscalationSettings() });
}

export async function PUT(request: NextRequest) {
  if (!requireAdmin(request)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await request.json().catch(() => null) as { section?: string; value?: unknown } | null;
  if (!body?.section || body.value === undefined) return NextResponse.json({ error: "section and value are required" }, { status: 400 });
  try {
    if (body.section === "rates") await saveRates(body.value as Rate[]);
    else if (body.section === "transfers") await saveTransfers(body.value as Transfer[]);
    else if (body.section === "entitlements") await saveEntitlements(body.value as Entitlement[]);
    else if (body.section === "escalation") await saveEscalationSettings(body.value as EscalationSettings);
    else return NextResponse.json({ error: "Unknown section" }, { status: 400 });
    return NextResponse.json({ ok: true });
  } catch { return NextResponse.json({ error: "Could not save demo configuration" }, { status: 500 }); }
}
