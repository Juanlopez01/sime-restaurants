import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { supabaseAdmin, isSupabaseConfigured } from "@/lib/supabase-server";
import { setMiseSession } from "@/lib/session";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") || "/";

  if (!code || !isSupabaseConfigured) {
    return NextResponse.redirect(new URL("/login?error=auth", origin));
  }

  const response = NextResponse.redirect(new URL(next, origin));

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
    error,
  } = await supabase.auth.exchangeCodeForSession(code);

  if (error || !user) {
    return NextResponse.redirect(new URL("/login?error=auth", origin));
  }

  // Look up owner by auth_id, or by email (links Google to existing email account)
  let { data: owner } = await supabaseAdmin
    .from("owners")
    .select("*")
    .eq("auth_id", user.id)
    .single();

  if (!owner && user.email) {
    const { data: emailOwner } = await supabaseAdmin
      .from("owners")
      .select("*")
      .eq("email", user.email)
      .single();

    if (emailOwner) {
      await supabaseAdmin
        .from("owners")
        .update({ auth_id: user.id })
        .eq("id", emailOwner.id);
      owner = emailOwner;
    }
  }

  if (owner) {
    const { data: restaurant } = await supabaseAdmin
      .from("restaurants")
      .select("*")
      .eq("owner_id", owner.id)
      .eq("is_active", true)
      .single();

    if (restaurant) {
      setMiseSession(response, {
        userId: owner.id,
        email: owner.email,
        name: owner.name,
        restaurantId: restaurant.id,
        restaurantSlug: restaurant.slug,
        restaurantName: restaurant.name,
        role: "owner",
      });
      return NextResponse.redirect(
        new URL(`/${restaurant.slug}`, origin),
        { headers: response.headers }
      );
    }

    setMiseSession(response, {
      userId: owner.id,
      email: owner.email,
      name: owner.name,
      restaurantId: "",
      restaurantSlug: "",
      restaurantName: "",
      role: "owner",
    });
    return NextResponse.redirect(
      new URL("/crear-restaurante", origin),
      { headers: response.headers }
    );
  }

  const { data: newOwner } = await supabaseAdmin
    .from("owners")
    .insert({
      auth_id: user.id,
      email: user.email!,
      name:
        user.user_metadata?.full_name ||
        user.user_metadata?.name ||
        user.email?.split("@")[0] ||
        "Usuario",
    })
    .select()
    .single();

  if (!newOwner) {
    return NextResponse.redirect(new URL("/login?error=setup", origin));
  }

  setMiseSession(response, {
    userId: newOwner.id,
    email: newOwner.email,
    name: newOwner.name,
    restaurantId: "",
    restaurantSlug: "",
    restaurantName: "",
    role: "owner",
  });

  return NextResponse.redirect(
    new URL("/crear-restaurante", origin),
    { headers: response.headers }
  );
}

