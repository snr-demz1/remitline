import { NextRequest, NextResponse } from "next/server";
import { getEntitlements } from "@/lib/store";
import { recordToolLog } from "@/lib/tool-log";

export async function GET(request: NextRequest) {
  const tier = request.nextUrl.searchParams.get("tier")?.trim().toLowerCase();
  const entitlements = await getEntitlements();
  if (!tier) {
    recordToolLog({ tool: "entitlements", input: "missing tier", outcome: "invalid" });
    return NextResponse.json({ found: false, error: "tier is required" }, { status: 400 });
  }

  const result = entitlements.find((item) => item.tier === tier);
  if (!result) {
    recordToolLog({ tool: "entitlements", input: tier, outcome: "not_found" });
    return NextResponse.json({ found: false, tier, message: "I don't have entitlements for that salary-card tier." });
  }
  recordToolLog({ tool: "entitlements", input: tier, outcome: "found" });

  return NextResponse.json({ found: true, ...result });
}
