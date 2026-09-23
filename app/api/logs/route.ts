import { NextResponse } from "next/server";
import { getToolLogs } from "@/lib/tool-log";

export const dynamic = "force-dynamic";

export function GET() {
  return NextResponse.json({
    logs: getToolLogs(),
    note: "In-memory demo tool logs. Conversation transcripts remain in the ElevenLabs dashboard.",
  });
}

