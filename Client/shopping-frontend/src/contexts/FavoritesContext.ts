import { createContext, useContext } from "react";
import type { Product } from "../components/ui/ProductCard";

export interface FavoritesContextValue {
  favorites: Product[];
  isFavorite: (productId: string) => boolean;
  toggleFavorite: (product: Product) => void;
  storageError: string | null;
}

export const FavoritesContext = createContext<FavoritesContextValue | undefined>(
  undefined,
);

export function useFavorites() {
  const context = useContext(FavoritesContext);

  if (!context) {
    throw new Error("useFavorites must be used inside FavoritesProvider");
  }

  return context;
}
