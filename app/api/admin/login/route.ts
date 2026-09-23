import { NextRequest, NextResponse } from "next/server";
import { setAdminCookie } from "@/lib/admin-auth";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  if (!process.env.ADMIN_ACCESS_CODE || body.code !== process.env.ADMIN_ACCESS_CODE) return NextResponse.json({ error: "Invalid admin code" }, { status: 401 });
  const response = NextResponse.json({ ok: true });
  setAdminCookie(response);
  return response;
}

export async function DELETE() {
  const response = NextResponse.json({ ok: true });
  response.cookies.delete("remitline_admin");
  return response;
}
