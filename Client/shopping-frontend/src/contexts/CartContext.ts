import { createContext, useContext } from "react";
import type { Product } from "../components/ui/ProductCard";

export interface CartItem extends Product {
  quantity: number;
  selectedSize?: string;
  selectedColor?: string;
}

export interface CartContextValue {
  cart: CartItem[];
  addToCart: (
    product: Product,
    quantity?: number,
    selectedSize?: string,
    selectedColor?: string,
  ) => void;
  updateQuantity: (id: string, quantity: number, selectedSize?: string) => void;
  removeFromCart: (id: string, selectedSize?: string) => void;
  clearCart: () => void;
  cartCount: number;
  cartTotal: number;
  storageError: string | null;
}

export const CartContext = createContext<CartContextValue | undefined>(
  undefined,
);

export function useCart() {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error("useCart must be used inside CartProvider");
  }

  return context;
}
