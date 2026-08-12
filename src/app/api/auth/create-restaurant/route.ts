import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { isSupabaseConfigured, supabaseAdmin } from "@/lib/supabase-server";
import { slugify } from "@/lib/utils";
import { setMiseSession } from "@/lib/session";

export async function POST(request: NextRequest) {
  if (!isSupabaseConfigured) {
    return NextResponse.json({ error: "Supabase no configurado" }, { status: 503 });
  }

  const { name, phone } = await request.json();

  if (!name) {
    return NextResponse.json({ error: "Nombre es obligatorio" }, { status: 400 });
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll() {},
      },
    }
  );

  const { data: { user: authUser } } = await supabase.auth.getUser();

  if (!authUser) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const { data: owner } = await supabaseAdmin
    .from("owners")
    .select("*")
    .eq("auth_id", authUser.id)
    .single();

  if (!owner) {
    return NextResponse.json({ error: "Cuenta no encontrada" }, { status: 404 });
  }

  const { data: existingRestaurant } = await supabaseAdmin
    .from("restaurants")
    .select("id")
    .eq("owner_id", owner.id)
    .eq("is_active", true)
    .single();

  if (existingRestaurant) {
    return NextResponse.json({ error: "Ya tenés un restaurante" }, { status: 400 });
  }

  let slug = slugify(name);
  const { data: slugTaken } = await supabaseAdmin
    .from("restaurants")
    .select("id")
    .eq("slug", slug)
    .single();

  if (slugTaken) {
    slug = slug + "-" + Date.now().toString(36).slice(-4);
  }

  const { data: restaurant, error: restError } = await supabaseAdmin
    .from("restaurants")
    .insert({
      owner_id: owner.id,
      slug,
      name,
      phone: phone || null,
    })
    .select()
    .single();

  if (restError) {
    return NextResponse.json({ error: "Error al crear el restaurante" }, { status: 500 });
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
    restaurant,
    redirectTo: `/${restaurant.slug}/onboarding`,
  });

  setMiseSession(response, sessionData);

  return response;
}
