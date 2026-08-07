import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { isSupabaseConfigured, supabaseAdmin } from "@/lib/supabase-server";
import { demoRegister } from "@/lib/demo-auth-store";

function slugify(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

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
  const { email, password, name, restaurantName, phone } =
    await request.json();

  if (!email || !password || !name || !restaurantName) {
    return NextResponse.json(
      { error: "Todos los campos son obligatorios" },
      { status: 400 }
    );
  }

  if (password.length < 8) {
    return NextResponse.json(
      { error: "La contraseña debe tener al menos 8 caracteres" },
      { status: 400 }
    );
  }

  if (!isSupabaseConfigured) {
    const result = demoRegister({ email, password, name, restaurantName, phone });

    if ("error" in result) {
      return NextResponse.json({ error: result.error }, { status: 400 });
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
      redirectTo: `/${result.restaurant.slug}/onboarding`,
    });
    setMiseSession(response, sessionData);
    return response;
  }

  // Create Supabase Auth user
  const { data: authData, error: authError } =
    await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: name },
    });

  if (authError) {
    const msg =
      authError.message ===
      "A user with this email address has already been registered"
        ? "Ya existe una cuenta con ese email"
        : authError.message;
    return NextResponse.json({ error: msg }, { status: 400 });
  }

  const authUser = authData.user;

  // Create owner record
  const { data: owner, error: ownerError } = await supabaseAdmin
    .from("owners")
    .insert({ auth_id: authUser.id, email, name, phone: phone || null })
    .select()
    .single();

  if (ownerError) {
    await supabaseAdmin.auth.admin.deleteUser(authUser.id);
    return NextResponse.json(
      { error: "Error al crear la cuenta" },
      { status: 500 }
    );
  }

  // Create restaurant
  let slug = slugify(restaurantName);
  const { data: existing } = await supabaseAdmin
    .from("restaurants")
    .select("id")
    .eq("slug", slug)
    .single();

  if (existing) {
    slug = slug + "-" + Date.now().toString(36).slice(-4);
  }

  const { data: restaurant, error: restError } = await supabaseAdmin
    .from("restaurants")
    .insert({
      owner_id: owner.id,
      slug,
      name: restaurantName,
      phone: phone || null,
    })
    .select()
    .single();

  if (restError) {
    await supabaseAdmin.from("owners").delete().eq("id", owner.id);
    await supabaseAdmin.auth.admin.deleteUser(authUser.id);
    return NextResponse.json(
      { error: "Error al crear el restaurante" },
      { status: 500 }
    );
  }

  // Collect Supabase cookies to apply to the final response
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

  await supabase.auth.signInWithPassword({ email, password });

  const sessionData = {
    userId: owner.id,
    email: owner.email,
    name: owner.name,
    restaurantId: restaurant.id,
    restaurantSlug: restaurant.slug,
    restaurantName: restaurant.name,
    role: "owner",
  };

  const response = NextResponse.json({
    user: sessionData,
    redirectTo: `/${restaurant.slug}/onboarding`,
  });
  pendingCookies.forEach(({ name, value, options }) =>
    response.cookies.set(name, value, options)
  );
  setMiseSession(response, sessionData);
  return response;
}
