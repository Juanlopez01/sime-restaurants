import { notFound } from "next/navigation";
import { supabaseAdmin, isSupabaseConfigured } from "@/lib/supabase-server";
import { DEMO_RESTAURANT } from "@/lib/demo-data";
import { demoGetRestaurantBySlug } from "@/lib/demo-auth-store";
import { StaffProvider } from "@/contexts/staff-context";
import type { Restaurant } from "@/types";

async function getRestaurant(slug: string): Promise<Restaurant | null> {
  if (!isSupabaseConfigured) {
    if (slug === "la-ribera") return DEMO_RESTAURANT;
    const registered = demoGetRestaurantBySlug(slug);
    if (registered) {
      return {
        id: registered.id,
        slug: registered.slug,
        name: registered.name,
        address: registered.address,
        phone: registered.phone,
        logo_url: null,
        billing_config: {},
        mp_access_token: null,
        settings: { currency: "ARS", timezone: "America/Argentina/Buenos_Aires" },
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
    }
    return null;
  }

  const { data } = await supabaseAdmin
    .from("restaurants")
    .select("*")
    .eq("slug", slug)
    .eq("is_active", true)
    .single();

  return data;
}

export default async function TenantLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { slug: string };
}) {
  const restaurant = await getRestaurant(params.slug);

  if (!restaurant) {
    notFound();
  }

  return <StaffProvider>{children}</StaffProvider>;
}
