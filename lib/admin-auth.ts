import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

const COOKIE_NAME = "remitline_admin";

export async function isAdminAuthenticated() {
  const jar = await cookies();
  return jar.get(COOKIE_NAME)?.value === process.env.ADMIN_ACCESS_CODE && Boolean(process.env.ADMIN_ACCESS_CODE);
}

export function requireAdmin(request: NextRequest) {
  const expected = process.env.ADMIN_ACCESS_CODE;
  const token = request.cookies.get(COOKIE_NAME)?.value;
  return Boolean(expected && token && token === expected);
}

export function setAdminCookie(response: NextResponse) {
  response.cookies.set(COOKIE_NAME, process.env.ADMIN_ACCESS_CODE ?? "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 8,
  });
}

export function clearAdminCookie(response: NextResponse) {
  response.cookies.set(COOKIE_NAME, "", { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: 0 });
}
