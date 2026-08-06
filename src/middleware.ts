import { NextRequest, NextResponse } from "next/server";

const PUBLIC_PATHS = ["/", "/login", "/registro", "/api/auth"];

function isPublic(pathname: string): boolean {
  if (PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(p + "/"))) {
    return true;
  }
  if (/^\/[^/]+\/menu(\/|$)/.test(pathname)) {
    return true;
  }
  if (pathname.startsWith("/_next") || pathname.startsWith("/favicon")) {
    return true;
  }
  // Staff auth API is public (PIN login)
  if (/^\/api\/[^/]+\/auth$/.test(pathname)) {
    return true;
  }
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

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (isPublic(pathname)) {
    return NextResponse.next();
  }

  const session = parseSession(request.cookies.get("mise-session")?.value);

  if (!session) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Verify the owner is accessing their own restaurant
  const slugMatch = pathname.match(/^\/([^/]+)/);
  if (slugMatch && !pathname.startsWith("/api/")) {
    const requestedSlug = slugMatch[1];
    if (requestedSlug !== session.restaurantSlug) {
      return NextResponse.redirect(new URL(`/${session.restaurantSlug}`, request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
