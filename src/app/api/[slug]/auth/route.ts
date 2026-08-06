import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin, isSupabaseConfigured } from "@/lib/supabase-server";
import { DEMO_USERS } from "@/lib/demo-data";

export async function POST(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  const { pin } = await request.json();

  if (!isSupabaseConfigured) {
    if (params.slug !== "la-ribera") {
      return NextResponse.json(
        { error: "Restaurante no encontrado" },
        { status: 404 }
      );
    }
    const user = DEMO_USERS.find((u) => u.pin === pin && u.is_active);
    if (!user) {
      return NextResponse.json(
        { error: "PIN inválido o usuario desactivado" },
        { status: 401 }
      );
    }
    return NextResponse.json({
      user: {
        id: user.id,
        name: user.name,
        role: user.role,
        restaurant_id: user.restaurant_id,
      },
    });
  }

  const { data: restaurant } = await supabaseAdmin
    .from("restaurants")
    .select("id")
    .eq("slug", params.slug)
    .eq("is_active", true)
    .single();

  if (!restaurant) {
    return NextResponse.json(
      { error: "Restaurante no encontrado" },
      { status: 404 }
    );
  }

  const { data: user } = await supabaseAdmin
    .from("users")
    .select("id, name, role, is_active")
    .eq("restaurant_id", restaurant.id)
    .eq("pin", pin)
    .eq("is_active", true)
    .single();

  if (!user) {
    return NextResponse.json(
      { error: "PIN inválido o usuario desactivado" },
      { status: 401 }
    );
  }

  return NextResponse.json({
    user: {
      id: user.id,
      name: user.name,
      role: user.role,
      restaurant_id: restaurant.id,
    },
  });
}
