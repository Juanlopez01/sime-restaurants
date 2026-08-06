import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { supabaseAdmin, isSupabaseConfigured } from "@/lib/supabase-server";
import type { CategoryWithProducts } from "@/types";
import { DEMO_RESTAURANT, DEMO_MENU } from "@/lib/demo-data";
import { MenuHeader } from "@/components/menu/MenuHeader";
import { MenuClient } from "@/components/menu/MenuClient";

interface Props {
  params: { slug: string };
}

async function getMenuData(slug: string) {
  if (!isSupabaseConfigured) {
    if (slug === "la-ribera") {
      return { restaurant: DEMO_RESTAURANT, menu: DEMO_MENU };
    }
    return null;
  }

  const { data: restaurant } = await supabaseAdmin
    .from("restaurants")
    .select("id, name, address, logo_url")
    .eq("slug", slug)
    .eq("is_active", true)
    .single();

  if (!restaurant) return null;

  const { data: categories } = await supabaseAdmin
    .from("categories")
    .select("id, name, display_order")
    .eq("restaurant_id", restaurant.id)
    .eq("is_active", true)
    .order("display_order", { ascending: true });

  const { data: products } = await supabaseAdmin
    .from("products")
    .select("id, category_id, name, description, price, image_url, is_available, display_order")
    .eq("restaurant_id", restaurant.id)
    .order("display_order", { ascending: true });

  const menu: CategoryWithProducts[] = (categories ?? []).map((cat) => ({
    ...cat,
    restaurant_id: restaurant.id,
    is_active: true,
    created_at: "",
    updated_at: "",
    products: (products ?? []).filter((p) => p.category_id === cat.id).map((p) => ({
      ...p,
      restaurant_id: restaurant.id,
      created_at: "",
      updated_at: "",
    })),
  }));

  return { restaurant, menu };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const data = await getMenuData(params.slug);
  if (!data) return { title: "Menú no encontrado" };

  return {
    title: `Menú - ${data.restaurant.name}`,
    description: `Consultá el menú de ${data.restaurant.name}. Precios actualizados.`,
  };
}

export default async function MenuPage({ params }: Props) {
  const data = await getMenuData(params.slug);

  if (!data) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-surface">
      <MenuHeader
        restaurantName={data.restaurant.name}
        address={data.restaurant.address}
      />
      <MenuClient
        slug={params.slug}
        restaurantId={data.restaurant.id}
        initialMenu={data.menu}
      />
    </div>
  );
}
