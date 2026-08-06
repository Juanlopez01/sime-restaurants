"use client";

import { createContext, useContext, useState, useCallback, useEffect } from "react";
import { useParams } from "next/navigation";

export interface StaffUser {
  id: string;
  name: string;
  role: string;
  restaurant_id: string;
}

interface StaffContextType {
  staff: StaffUser | null;
  loading: boolean;
  login: (pin: string) => Promise<{ error?: string }>;
  logout: () => void;
}

const StaffContext = createContext<StaffContextType | null>(null);

function storageKey(slug: string) {
  return `mise-staff-${slug}`;
}

export function StaffProvider({ children }: { children: React.ReactNode }) {
  const params = useParams<{ slug: string }>();
  const slug = params.slug;
  const [staff, setStaff] = useState<StaffUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const stored = sessionStorage.getItem(storageKey(slug));
      if (stored) setStaff(JSON.parse(stored));
    } catch {}
    setLoading(false);
  }, [slug]);

  const login = useCallback(
    async (pin: string) => {
      const res = await fetch(`/api/${slug}/auth`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin }),
      });

      const data = await res.json();

      if (!res.ok) {
        return { error: data.error || "PIN inválido" };
      }

      const user: StaffUser = data.user;
      setStaff(user);
      sessionStorage.setItem(storageKey(slug), JSON.stringify(user));
      return {};
    },
    [slug]
  );

  const logout = useCallback(() => {
    setStaff(null);
    sessionStorage.removeItem(storageKey(slug));
  }, [slug]);

  return (
    <StaffContext.Provider value={{ staff, loading, login, logout }}>
      {children}
    </StaffContext.Provider>
  );
}

export function useStaff() {
  const ctx = useContext(StaffContext);
  if (!ctx) throw new Error("useStaff must be used within StaffProvider");
  return ctx;
}
