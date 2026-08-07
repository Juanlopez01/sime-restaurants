import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { isSupabaseConfigured, supabaseAdmin } from "@/lib/supabase-server";
import { demoLogin } from "@/lib/demo-auth-store";

function setMiseSession(
  response: NextResponse,
  sessionData: Record<string, string>
) {
  response.cookies.set("mise-session", JSON.stringify(sessionData), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
}

export async function POST(request: NextRequest) {
  const { email, password } = await request.json();

  if (!email || !password) {
    return NextResponse.json(
      { error: "Email y contraseña son obligatorios" },
      { status: 400 }
    );
  }

  if (!isSupabaseConfigured) {
    const result = demoLogin(email, password);
    if ("error" in result) {
      return NextResponse.json({ error: result.error }, { status: 401 });
    }

    const sessionData = {
      userId: result.owner.id,
      email: result.owner.email,
      name: result.owner.name,
      restaurantId: result.restaurant.id,
      restaurantSlug: result.restaurant.slug,
      restaurantName: result.restaurant.name,
      role: "owner",
    };

    const response = NextResponse.json({
      user: sessionData,
      redirectTo: `/${result.restaurant.slug}`,
    });
    setMiseSession(response, sessionData);
    return response;
  }

  // Collect Supabase cookies to apply later
  const pendingCookies: { name: string; value: string; options: Record<string, unknown> }[] = [];

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          pendingCookies.push(...cookiesToSet);
        },
      },
    }
  );

  const { error: signInError } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (signInError) {
    return NextResponse.json(
      { error: "Email o contraseña incorrectos" },
      { status: 401 }
    );
  }

  const { data: owner } = await supabaseAdmin
    .from("owners")
    .select("*")
    .eq("email", email)
    .single();

  if (!owner) {
    return NextResponse.json({ error: "Cuenta no encontrada" }, { status: 404 });
  }

  const { data: restaurant } = await supabaseAdmin
    .from("restaurants")
    .select("*")
    .eq("owner_id", owner.id)
    .eq("is_active", true)
    .single();

  const sessionData = {
    userId: owner.id,
    email: owner.email,
    name: owner.name,
    restaurantId: restaurant?.id || "",
    restaurantSlug: restaurant?.slug || "",
    restaurantName: restaurant?.name || "",
    role: "owner",
  };

  const redirectTo = restaurant ? `/${restaurant.slug}` : "/crear-restaurante";

  const response = NextResponse.json({ user: sessionData, redirectTo });
  pendingCookies.forEach(({ name, value, options }) =>
    response.cookies.set(name, value, options)
  );
  setMiseSession(response, sessionData);
  return response;
}
