import { NextRequest, NextResponse } from "next/server";
import { getRates } from "@/lib/store";
import { recordToolLog } from "@/lib/tool-log";

export async function GET(request: NextRequest) {
  const currency = request.nextUrl.searchParams.get("currency")?.trim().toUpperCase();
  const rates = await getRates();
  if (!currency) {
    recordToolLog({ tool: "rate", input: "missing currency", outcome: "invalid" });
    return NextResponse.json({ found: false, error: "currency is required" }, { status: 400 });
  }

  const result = rates.find((item) => item.currency === currency);
  if (!result) {
    recordToolLog({ tool: "rate", input: currency, outcome: "not_found" });
    return NextResponse.json({ found: false, currency, message: "I don't have an indicative rate for that corridor." });
  }
  recordToolLog({ tool: "rate", input: currency, outcome: "found" });

  return NextResponse.json({
    found: true,
    currency: result.currency,
    rate: result.rate,
    quote: `1 AED = ${result.rate} ${result.currency}`,
    lastUpdated: result.lastUpdated,
    disclaimer: "This is an indicative synthetic demo rate. Confirm the rate at the time of transaction; it is not guaranteed.",
  });
}
