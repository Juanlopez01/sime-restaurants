import { NextResponse } from "next/server";

const SESSION_MAX_AGE = 60 * 60 * 24 * 30;

export function setMiseSession(
  response: NextResponse,
  data: Record<string, string>
) {
  response.cookies.set("mise-session", JSON.stringify(data), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });
}
