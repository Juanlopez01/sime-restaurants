"use client";

import type { CategoryWithProducts, Product } from "@/types";
import type { Locale } from "@/lib/i18n";
import { ProductCard } from "./ProductCard";

interface CartItem {
  product_id: string;
  quantity: number;
}

interface MenuCategoryProps {
  category: CategoryWithProducts;
  cart?: CartItem[];
  onAdd?: (product: Product) => void;
  onRemove?: (productId: string) => void;
  locale?: Locale;
  accentColor?: string;
}

export function MenuCategory({ category, cart, onAdd, onRemove, locale = "es", accentColor = "#b49a5a" }: MenuCategoryProps) {
  if (category.products.length === 0) return null;

  return (
    <section id={`cat-${category.id}`} className="scroll-mt-14">
      <h2 className="sticky top-[52px] z-10 bg-surface/95 backdrop-blur-sm px-4 py-3 text-base font-bold text-ink border-b border-[#e8e6e1]">
        {category.name}
      </h2>
      <div className="flex flex-col gap-2.5 px-4 py-3">
        {category.products.map((product) => {
          const qty = cart?.find((c) => c.product_id === product.id)?.quantity ?? 0;
          return (
            <ProductCard
              key={product.id}
              product={product}
              quantity={qty}
              onAdd={onAdd}
              onRemove={onRemove}
              locale={locale}
              accentColor={accentColor}
            />
          );
        })}
      </div>
    </section>
  );
}
