"use client";

import { useEffect, useRef, useState } from "react";
import type { CategoryWithProducts } from "@/types";

interface CategoryNavProps {
  categories: CategoryWithProducts[];
  bgColor?: string;
  accentColor?: string;
}

export function CategoryNav({ categories, bgColor = "#141414", accentColor = "#b49a5a" }: CategoryNavProps) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const navRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.find((e) => e.isIntersecting);
        if (visible) {
          setActiveId(visible.target.id.replace("cat-", ""));
        }
      },
      { rootMargin: "-80px 0px -60% 0px", threshold: 0 }
    );

    categories.forEach((cat) => {
      const el = document.getElementById(`cat-${cat.id}`);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [categories]);

  useEffect(() => {
    if (!activeId || !navRef.current) return;
    const btn = navRef.current.querySelector(`[data-cat="${activeId}"]`);
    btn?.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
  }, [activeId]);

  const visibleCategories = categories.filter((c) => c.products.length > 0);

  if (visibleCategories.length <= 1) return null;

  return (
    <nav
      ref={navRef}
      className="sticky top-0 z-20 flex gap-1.5 overflow-x-auto px-4 py-2.5 scrollbar-hide"
      style={{ backgroundColor: bgColor, WebkitOverflowScrolling: "touch" }}
    >
      {visibleCategories.map((cat) => (
        <button
          key={cat.id}
          data-cat={cat.id}
          onClick={() => {
            document
              .getElementById(`cat-${cat.id}`)
              ?.scrollIntoView({ behavior: "smooth" });
          }}
          className="pill flex-shrink-0 transition-colors"
          style={
            activeId === cat.id
              ? { backgroundColor: accentColor, color: "#fff", fontWeight: 600 }
              : { backgroundColor: "rgba(255,255,255,0.06)", color: "#999" }
          }
        >
          {cat.name}
        </button>
      ))}
    </nav>
  );
}
