import { supabaseAdmin, isSupabaseConfigured } from "@/lib/supabase-server";

export async function getRestaurantId(slug: string): Promise<string | null> {
  if (!isSupabaseConfigured) return slug === "la-ribera" ? "demo-la-ribera" : null;
  const { data } = await supabaseAdmin
    .from("restaurants")
    .select("id")
    .eq("slug", slug)
    .eq("is_active", true)
    .single();
  return data?.id ?? null;
}
