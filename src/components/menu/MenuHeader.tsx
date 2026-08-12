"use client";

import { useState, useRef, useEffect } from "react";
import { type Locale, LOCALES, t } from "@/lib/i18n";

interface MenuHeaderProps {
  restaurantName: string;
  address?: string | null;
  logoUrl?: string | null;
  tableNumber?: string | null;
  locale: Locale;
  onLocaleChange: (locale: Locale) => void;
  accentColor?: string;
  bgColor?: string;
  textColor?: string;
}

export function MenuHeader({
  restaurantName,
  address,
  logoUrl,
  tableNumber,
  locale,
  onLocaleChange,
  accentColor = "#b49a5a",
  bgColor = "#141414",
  textColor = "#ffffff",
}: MenuHeaderProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const current = LOCALES.find((l) => l.code === locale)!;
  const mutedText = `${textColor}99`;

  return (
    <header className="relative px-6 py-10 text-center" style={{ backgroundColor: bgColor }}>
      <div ref={ref} className="absolute right-4 top-4">
        <button
          onClick={() => setOpen(!open)}
          className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs transition-colors"
          style={{ backgroundColor: `${textColor}14`, color: mutedText }}
        >
          <span>{current.flag}</span>
          <span className="uppercase tracking-wider">{current.code}</span>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`h-3 w-3 transition-transform ${open ? "rotate-180" : ""}`}>
            <path d="M6 9l6 6 6-6" />
          </svg>
        </button>
        {open && (
          <div className="absolute right-0 mt-1.5 w-36 rounded-xl py-1.5 shadow-xl border z-50" style={{ backgroundColor: bgColor, borderColor: `${textColor}10` }}>
            {LOCALES.map((l) => (
              <button
                key={l.code}
                onClick={() => { onLocaleChange(l.code); setOpen(false); }}
                className="flex w-full items-center gap-2.5 px-3.5 py-2 text-left text-sm transition-colors"
                style={{
                  color: l.code === locale ? accentColor : mutedText,
                  backgroundColor: l.code === locale ? `${textColor}08` : "transparent",
                }}
              >
                <span>{l.flag}</span>
                <span>{l.label}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {logoUrl && (
        <img
          src={logoUrl}
          alt=""
          className="h-16 w-16 rounded-full object-cover mx-auto mb-3 border-2"
          style={{ borderColor: accentColor }}
        />
      )}
      <h1 className="font-display text-3xl font-bold tracking-tight" style={{ color: textColor }}>
        {restaurantName}
      </h1>
      {address && (
        <p className="mt-1.5 text-sm tracking-wider" style={{ color: `${textColor}66` }}>{address}</p>
      )}
      <div className="mx-auto mt-5 h-px w-16" style={{ backgroundColor: `${accentColor}80` }} />
      {tableNumber ? (
        <p className="mt-3 text-xs uppercase tracking-[0.2em]" style={{ color: accentColor }}>
          {t(locale, "table")} {tableNumber}
        </p>
      ) : (
        <p className="mt-3 text-xs uppercase tracking-[0.2em]" style={{ color: `${textColor}55` }}>
          {t(locale, "menu")}
        </p>
      )}
    </header>
  );
}
