"use client";

import type { CategoryWithProducts } from "@/types";
import { ProductCard } from "./ProductCard";

interface MenuCategoryProps {
  category: CategoryWithProducts;
}

export function MenuCategory({ category }: MenuCategoryProps) {
  if (category.products.length === 0) return null;

  return (
    <section id={`cat-${category.id}`} className="scroll-mt-14">
      <h2 className="sticky top-[52px] z-10 bg-surface/95 backdrop-blur-sm px-4 py-3 text-base font-bold text-ink border-b border-[#e8e6e1]">
        {category.name}
      </h2>
      <div className="flex flex-col gap-2.5 px-4 py-3">
        {category.products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </section>
  );
}
