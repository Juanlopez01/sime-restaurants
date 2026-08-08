"use client";

import { useEffect, useState, useCallback } from "react";
import type { CategoryWithProducts, Product } from "@/types";
import { supabase, isSupabaseConfigured } from "@/lib/supabase-client";
import { CategoryNav } from "./CategoryNav";
import { MenuCategory } from "./MenuCategory";
import { CartBar } from "./CartBar";

interface CartItem {
  product_id: string;
  product_name: string;
  unit_price: number;
  quantity: number;
}

interface MenuClientProps {
  slug: string;
  restaurantId: string;
  initialMenu: CategoryWithProducts[];
  tableNumber?: string | null;
}

export function MenuClient({ slug, restaurantId, initialMenu, tableNumber }: MenuClientProps) {
  const [menu, setMenu] = useState<CategoryWithProducts[]>(initialMenu);
  const [cart, setCart] = useState<CartItem[]>([]);

  const orderingEnabled = !!tableNumber;

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

  const allProducts = menu.flatMap((c) => c.products);

  const handleAdd = useCallback((product: Product) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.product_id === product.id);
      if (existing) {
        return prev.map((i) =>
          i.product_id === product.id
            ? { ...i, quantity: i.quantity + 1 }
            : i
        );
      }
      return [
        ...prev,
        {
          product_id: product.id,
          product_name: product.name,
          unit_price: product.price,
          quantity: 1,
        },
      ];
    });
  }, []);

  const handleRemove = useCallback((productId: string) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.product_id === productId);
      if (!existing) return prev;
      if (existing.quantity <= 1) {
        return prev.filter((i) => i.product_id !== productId);
      }
      return prev.map((i) =>
        i.product_id === productId ? { ...i, quantity: i.quantity - 1 } : i
      );
    });
  }, []);

  const handleClear = useCallback(() => {
    setCart([]);
  }, []);

  const cartForCategory = cart.map((i) => ({
    product_id: i.product_id,
    quantity: i.quantity,
  }));

  return (
    <>
      <CategoryNav categories={menu} />
      <main className={orderingEnabled ? "pb-24" : "pb-8"}>
        {menu.map((category) => (
          <MenuCategory
            key={category.id}
            category={category}
            cart={orderingEnabled ? cartForCategory : undefined}
            onAdd={orderingEnabled ? handleAdd : undefined}
            onRemove={orderingEnabled ? handleRemove : undefined}
          />
        ))}
        {menu.length === 0 && (
          <p className="px-4 py-12 text-center text-stone-400">
            El menú estará disponible próximamente.
          </p>
        )}
      </main>
      {orderingEnabled && (
        <CartBar
          items={cart}
          slug={slug}
          tableNumber={tableNumber!}
          onClear={handleClear}
          onRemove={handleRemove}
          onAdd={handleAdd}
          products={allProducts}
        />
      )}
    </>
  );
}
