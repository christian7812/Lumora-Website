import { useEffect, useMemo, useState, type ReactNode } from "react";
import type { Product } from "../components/ui/ProductCard";
import { CartContext, type CartContextValue, type CartItem } from "./CartContext";
import { useProducts } from "./ProductContext";

interface CartState {
  cart: CartItem[];
  storageError: string | null;
}

const storageKey = "lumora-store-cart";

function isCartItem(value: unknown): value is CartItem {
  if (typeof value !== "object" || value === null) return false;

  const item = value as Record<string, unknown>;

  return (
    typeof item.id === "string" &&
    typeof item.name === "string" &&
    typeof item.price === "number" &&
    Number.isFinite(item.price) &&
    item.price >= 0 &&
    typeof item.image === "string" &&
    typeof item.category === "string" &&
    typeof item.quantity === "number" &&
    Number.isSafeInteger(item.quantity) &&
    item.quantity > 0 &&
    (item.selectedSize === undefined || typeof item.selectedSize === "string") &&
    (item.selectedColor === undefined || typeof item.selectedColor === "string")
  );
}

function loadCart(): CartState {
  try {
    const savedCart = localStorage.getItem(storageKey);

    if (savedCart === null) {
      return { cart: [], storageError: null };
    }

    const parsed: unknown = JSON.parse(savedCart);

    if (!Array.isArray(parsed) || !parsed.every(isCartItem)) {
      throw new Error("Saved cart data has an invalid format.");
    }

    return { cart: parsed, storageError: null };
  } catch (error) {
    console.error("Could not load the saved cart:", error);

    return {
      cart: [],
      storageError:
        "Your saved cart could not be loaded. You can continue shopping, but it may not be saved.",
    };
  }
}

function saveCart(cart: CartItem[]): string | null {
  try {
    localStorage.setItem(storageKey, JSON.stringify(cart));
    return null;
  } catch (error) {
    console.error("Could not save the cart:", error);
    return "Your cart could not be saved on this device. It may be lost when you leave or refresh the page.";
  }
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<CartState>(loadCart);
  const { cart: savedCart, storageError } = state;
  const { products, isLoading: productsLoading } = useProducts();

  const cart = useMemo(() => {
    if (productsLoading) return savedCart;

    const currentProducts = new Map(products.map((product) => [product.id, product]));
    return savedCart.map((item) => {
      const currentProduct = currentProducts.get(item.id);

      if (!currentProduct) return item;

      const hasChanged =
        item.name !== currentProduct.name ||
        item.price !== currentProduct.price ||
        item.image !== currentProduct.image ||
        item.category !== currentProduct.category ||
        item.oldPrice !== currentProduct.oldPrice ||
        item.stockQuantity !== currentProduct.stockQuantity;

      return hasChanged
        ? {
            ...currentProduct,
            quantity: item.quantity,
            selectedSize: item.selectedSize,
            selectedColor: item.selectedColor,
          }
        : item;
    });
  }, [products, productsLoading, savedCart]);

  useEffect(() => {
    if (!productsLoading) {
      const saveError = saveCart(cart);
      if (saveError) console.error(saveError);
    }
  }, [cart, productsLoading]);

  function addToCart(
    product: Product,
    quantity = 1,
    selectedSize?: string,
    selectedColor?: string,
  ) {
    const existingIndex = cart.findIndex(
      (item) => item.id === product.id && item.selectedSize === selectedSize,
    );
    const existingItem = existingIndex >= 0 ? cart[existingIndex] : null;
    const currentQty = existingItem ? existingItem.quantity : 0;
    const nextQty = currentQty + quantity;

    if (product.stockQuantity <= 0 || nextQty > product.stockQuantity) return;

    let nextCart: CartItem[];
    if (existingItem) {
      nextCart = cart.map((item, idx) =>
        idx === existingIndex ? { ...item, quantity: nextQty } : item,
      );
    } else {
      nextCart = [
        ...cart,
        {
          ...product,
          quantity,
          selectedSize: selectedSize || undefined,
          selectedColor: selectedColor || undefined,
        },
      ];
    }

    setState({ cart: nextCart, storageError: saveCart(nextCart) });
  }

  function updateQuantity(id: string, quantity: number, selectedSize?: string) {
    if (!Number.isSafeInteger(quantity) || quantity < 1) return;
    const available = products.find((product) => product.id === id)?.stockQuantity;
    if (available !== undefined && quantity > available) return;

    const nextCart = cart.map((item) =>
      item.id === id && item.selectedSize === selectedSize
        ? { ...item, quantity }
        : item,
    );

    setState({ cart: nextCart, storageError: saveCart(nextCart) });
  }

  function removeFromCart(id: string, selectedSize?: string) {
    const nextCart = cart.filter(
      (item) => !(item.id === id && item.selectedSize === selectedSize),
    );
    setState({ cart: nextCart, storageError: saveCart(nextCart) });
  }

  function clearCart() {
    setState({ cart: [], storageError: saveCart([]) });
  }

  const cartCount = useMemo(
    () => cart.reduce((total, item) => total + item.quantity, 0),
    [cart],
  );

  const cartTotal = useMemo(
    () => cart.reduce((total, item) => total + item.price * item.quantity, 0),
    [cart],
  );

  const value: CartContextValue = {
    cart,
    addToCart,
    updateQuantity,
    removeFromCart,
    clearCart,
    cartCount,
    cartTotal,
    storageError,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}
