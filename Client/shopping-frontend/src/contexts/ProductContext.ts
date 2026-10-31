import { createContext, useContext } from "react";
import type { Product } from "../components/ui/ProductCard";

export interface ProductContextValue {
  products: Product[];
  categories: string[];
  productCategories: string[];
  featuredProducts: Product[];
  isLoading: boolean;
  error: string;
  reloadProducts: () => void;
}

export const ProductContext = createContext<ProductContextValue | undefined>(
  undefined,
);

export function useProducts() {
  const context = useContext(ProductContext);

  if (!context) {
    throw new Error("useProducts must be used inside ProductProvider");
  }

  return context;
}
