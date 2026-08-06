import { NextRequest, NextResponse } from "next/server";
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

function setSessionCookie(
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
    const result = demoRegister({
      email,
      password,
      name,
      restaurantName,
      phone,
    });

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
    setSessionCookie(response, sessionData);
    return response;
  }

  // --- Supabase Auth ---
  const { data: authData, error: authError } =
    await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

  if (authError) {
    const msg =
      authError.message === "A user with this email address has already been registered"
        ? "Ya existe una cuenta con ese email"
        : authError.message;
    return NextResponse.json({ error: msg }, { status: 400 });
  }

  const authUser = authData.user;

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
    redirectTo: `/${restaurant.slug}`,
  });
  setSessionCookie(response, sessionData);
  return response;
}
