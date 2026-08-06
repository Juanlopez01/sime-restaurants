"use client";

import { createContext, useContext } from "react";
import type { Restaurant } from "@/types";

interface RestaurantContextValue {
  restaurant: Restaurant;
}

export const RestaurantContext = createContext<RestaurantContextValue | null>(null);

export function useRestaurant() {
  const ctx = useContext(RestaurantContext);
  if (!ctx) {
    throw new Error("useRestaurant must be used within RestaurantProvider");
  }
  return ctx.restaurant;
}
