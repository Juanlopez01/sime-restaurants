"use client";

import type { Product } from "@/types";

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const isUnavailable = !product.is_available;

  return (
    <div
      className={`card flex items-start gap-3 p-4 transition-opacity ${
        isUnavailable ? "opacity-50" : ""
      }`}
    >
      {product.image_url && (
        <img
          src={product.image_url}
          alt={product.name}
          className="h-20 w-20 flex-shrink-0 rounded-lg object-cover"
          loading="lazy"
        />
      )}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-base font-semibold text-ink leading-tight">
            {product.name}
          </h3>
          <span className="flex-shrink-0 text-base font-bold text-[#b49a5a] tabular-nums">
            ${product.price.toLocaleString("es-AR")}
          </span>
        </div>
        {product.description && (
          <p className="mt-1 text-sm text-ink-muted line-clamp-2">
            {product.description}
          </p>
        )}
        {isUnavailable && (
          <span className="mt-2 inline-block rounded-full bg-red-50 px-2.5 py-0.5 text-xs font-semibold text-red-600">
            Agotado
          </span>
        )}
      </div>
    </div>
  );
}
