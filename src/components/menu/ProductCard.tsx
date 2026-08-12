"use client";

import type { Product } from "@/types";
import { type Locale, t } from "@/lib/i18n";
import { formatPrice } from "@/lib/format";

interface ProductCardProps {
  product: Product;
  quantity?: number;
  onAdd?: (product: Product) => void;
  onRemove?: (productId: string) => void;
  locale?: Locale;
  accentColor?: string;
}

export function ProductCard({ product, quantity = 0, onAdd, onRemove, locale = "es", accentColor = "#b49a5a" }: ProductCardProps) {
  const isUnavailable = !product.is_available;
  const canOrder = !!onAdd && !isUnavailable;

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
          <span className="flex-shrink-0 text-base font-bold tabular-nums" style={{ color: accentColor }}>
            {formatPrice(product.price)}
          </span>
        </div>
        {product.description && (
          <p className="mt-1 text-sm text-ink-muted line-clamp-2">
            {product.description}
          </p>
        )}
        {isUnavailable && (
          <span className="mt-2 inline-block rounded-full bg-red-50 px-2.5 py-0.5 text-xs font-semibold text-red-600">
            {locale === "en" ? "Sold out" : locale === "pt" ? "Esgotado" : "Agotado"}
          </span>
        )}
        {canOrder && (
          <div className="mt-2 flex items-center gap-2">
            {quantity > 0 ? (
              <div className="flex items-center gap-1">
                <button
                  onClick={() => onRemove?.(product.id)}
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-[#f0ede6] text-[#777] hover:bg-[#e8e5dd] active:bg-[#ddd9cf] transition-colors"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="h-4 w-4">
                    <line x1="5" y1="12" x2="19" y2="12" />
                  </svg>
                </button>
                <span className="w-8 text-center text-sm font-bold text-[#1a1a1a] tabular-nums">
                  {quantity}
                </span>
                <button
                  onClick={() => onAdd(product)}
                  className="flex h-8 w-8 items-center justify-center rounded-full text-white transition-colors"
                  style={{ backgroundColor: accentColor }}
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="h-4 w-4">
                    <line x1="12" y1="5" x2="12" y2="19" />
                    <line x1="5" y1="12" x2="19" y2="12" />
                  </svg>
                </button>
              </div>
            ) : (
              <button
                onClick={() => onAdd(product)}
                className="flex items-center gap-1.5 rounded-full bg-[#141414] px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-[#2a2a2a] active:bg-[#333] transition-colors"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="h-3.5 w-3.5">
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
                {t(locale, "add")}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
