import { NextRequest, NextResponse } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

const isSupabaseConfigured = !!(
  process.env.NEXT_PUBLIC_SUPABASE_URL &&
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const PUBLIC_PATHS = ["/", "/login", "/registro", "/reset-password", "/actualizar-password", "/crear-restaurante", "/api/auth", "/auth/callback"];

function isPublic(pathname: string): boolean {
  if (PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(p + "/"))) {
    return true;
  }
  if (/^\/[^/]+\/menu(\/|$)/.test(pathname)) return true;
  if (/^\/api\/[^/]+\/customer-order$/.test(pathname)) return true;
  if (pathname.startsWith("/_next") || pathname.startsWith("/favicon")) return true;
  if (/^\/api\/[^/]+\/auth$/.test(pathname)) return true;
  return false;
}

function parseSession(cookie: string | undefined): Record<string, string> | null {
  if (!cookie) return null;
  try {
    const data = JSON.parse(cookie);
    if (data && typeof data === "object" && data.userId && data.restaurantSlug) {
      return data;
    }
  } catch {}
  return null;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  let supabaseResponse = NextResponse.next({ request });
  if (isSupabaseConfigured) {
    ({ supabaseResponse } = await updateSession(request));
  }

  if (isPublic(pathname)) {
    return supabaseResponse;
  }

  const session = parseSession(request.cookies.get("mise-session")?.value);

  if (!session) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  const slugMatch = pathname.match(/^\/([^/]+)/);
  if (slugMatch && !pathname.startsWith("/api/")) {
    const requestedSlug = slugMatch[1];
    if (requestedSlug !== session.restaurantSlug) {
      return NextResponse.redirect(
        new URL(`/${session.restaurantSlug}`, request.url)
      );
    }
  }

  return supabaseResponse;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
