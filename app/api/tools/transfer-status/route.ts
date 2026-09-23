import { NextRequest, NextResponse } from "next/server";
import { getTransfers } from "@/lib/store";
import { recordToolLog } from "@/lib/tool-log";

export async function GET(request: NextRequest) {
  const reference = request.nextUrl.searchParams.get("reference")?.trim().toUpperCase();
  const transfers = await getTransfers();
  if (!reference) {
    recordToolLog({ tool: "transfer-status", input: "missing reference", outcome: "invalid" });
    return NextResponse.json({ found: false, error: "reference is required" }, { status: 400 });
  }

  const result = transfers.find((item) => item.reference === reference);
  if (!result) {
    recordToolLog({ tool: "transfer-status", input: reference, outcome: "not_found" });
    return NextResponse.json({ found: false, reference, message: "No transfer was found for that reference. Please check the reference or speak with a team member." });
  }
  recordToolLog({ tool: "transfer-status", input: reference, outcome: "found" });

  // Production note: verify the caller's identity and authorization before returning account-specific transfer data.
  return NextResponse.json({ found: true, reference: result.reference, status: result.status, note: result.note });
}
