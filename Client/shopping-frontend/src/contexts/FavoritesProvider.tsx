import { useState, type ReactNode } from "react";
import type { Product } from "../components/ui/ProductCard";
import { FavoritesContext, type FavoritesContextValue } from "./FavoritesContext";

const storageKey = "lumora-store-favorites";

function isProduct(value: unknown): value is Product {
  if (typeof value !== "object" || value === null) return false;

  const product = value as Record<string, unknown>;
  return (
    typeof product.id === "string" &&
    typeof product.name === "string" &&
    typeof product.price === "number" &&
    Number.isFinite(product.price) &&
    typeof product.image === "string" &&
    typeof product.category === "string" &&
    typeof product.stockQuantity === "number"
  );
}

function loadFavorites(): { favorites: Product[]; storageError: string | null } {
  try {
    const savedFavorites = localStorage.getItem(storageKey);
    if (savedFavorites === null) return { favorites: [], storageError: null };

    const parsed: unknown = JSON.parse(savedFavorites);
    if (!Array.isArray(parsed) || !parsed.every(isProduct)) {
      throw new Error("Saved favorites data has an invalid format.");
    }

    return { favorites: parsed, storageError: null };
  } catch (error) {
    console.error("Could not load saved favorites:", error);
    return {
      favorites: [],
      storageError: "Your saved favorites could not be loaded from this device.",
    };
  }
}

function saveFavorites(favorites: Product[]): string | null {
  try {
    localStorage.setItem(storageKey, JSON.stringify(favorites));
    return null;
  } catch (error) {
    console.error("Could not save favorites:", error);
    return "Your favorites could not be saved on this device.";
  }
}

export function FavoritesProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState(loadFavorites);
  const { favorites, storageError } = state;

  function isFavorite(productId: string) {
    return favorites.some((product) => product.id === productId);
  }

  function toggleFavorite(product: Product) {
    const nextFavorites = isFavorite(product.id)
      ? favorites.filter((item) => item.id !== product.id)
      : [...favorites, product];
    setState({
      favorites: nextFavorites,
      storageError: saveFavorites(nextFavorites),
    });
  }

  const value: FavoritesContextValue = {
    favorites,
    isFavorite,
    toggleFavorite,
    storageError,
  };

  return (
    <FavoritesContext.Provider value={value}>
      {children}
    </FavoritesContext.Provider>
  );
}
