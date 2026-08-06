"use client";

import { useEffect, useState } from "react";
import type { CategoryWithProducts } from "@/types";
import { supabase, isSupabaseConfigured } from "@/lib/supabase-client";
import { CategoryNav } from "./CategoryNav";
import { MenuCategory } from "./MenuCategory";

interface MenuClientProps {
  slug: string;
  restaurantId: string;
  initialMenu: CategoryWithProducts[];
}

export function MenuClient({ slug, restaurantId, initialMenu }: MenuClientProps) {
  const [menu, setMenu] = useState<CategoryWithProducts[]>(initialMenu);

  useEffect(() => {
    if (!isSupabaseConfigured) return;

    const channel = supabase
      .channel(`menu:${restaurantId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "products",
          filter: `restaurant_id=eq.${restaurantId}`,
        },
        () => {
          refreshMenu();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [restaurantId, slug]);

  async function refreshMenu() {
    const res = await fetch(`/api/${slug}/products`);
    if (res.ok) {
      const data = await res.json();
      setMenu(data.menu);
    }
  }

  return (
    <>
      <CategoryNav categories={menu} />
      <main className="pb-8">
        {menu.map((category) => (
          <MenuCategory key={category.id} category={category} />
        ))}
        {menu.length === 0 && (
          <p className="px-4 py-12 text-center text-stone-400">
            El menú estará disponible próximamente.
          </p>
        )}
      </main>
    </>
  );
}
