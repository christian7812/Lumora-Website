import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import type { Product } from "../components/ui/ProductCard";
import { ProductContext, type ProductContextValue } from "./ProductContext";
import { API_URL } from "../lib/constants";

interface ProductResponse {
  products?: unknown;
}

function isProduct(value: unknown): value is Product {
  if (typeof value !== "object" || value === null) return false;

  const product = value as Record<string, unknown>;

  return (
    typeof product.id === "string" &&
    typeof product.name === "string" &&
    typeof product.category === "string" &&
    typeof product.image === "string" &&
    typeof product.price === "number" &&
    Number.isFinite(product.price) &&
    product.price >= 0 &&
    typeof product.stockQuantity === "number" &&
    Number.isInteger(product.stockQuantity) &&
    product.stockQuantity >= 0 &&
    (product.oldPrice === undefined ||
      (typeof product.oldPrice === "number" &&
        Number.isFinite(product.oldPrice) &&
        product.oldPrice >= 0))
  );
}

function parseProducts(payload: unknown): Product[] {
  if (
    typeof payload !== "object" ||
    payload === null ||
    !Array.isArray((payload as ProductResponse).products)
  ) {
    throw new Error("The product list returned an invalid response.");
  }

  const products = (payload as { products: unknown[] }).products;

  if (!products.every(isProduct)) {
    throw new Error("The product list contains invalid product data.");
  }

  return products;
}

export function ProductProvider({ children }: { children: ReactNode }) {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [reloadVersion, setReloadVersion] = useState(0);

  useEffect(() => {
    const controller = new AbortController();

    async function loadProducts() {
      setIsLoading(true);
      setError("");

      try {
        const response = await fetch(`${API_URL}/api/products`, {
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error("Could not load products. Please try again.");
        }

        const payload: unknown = await response.json();
        setProducts(parseProducts(payload));
      } catch (loadError) {
        if (controller.signal.aborted) return;

        setError(
          loadError instanceof Error
            ? loadError.message
            : "Could not load products. Please try again.",
        );
      } finally {
        if (!controller.signal.aborted) setIsLoading(false);
      }
    }

    void loadProducts();
    return () => controller.abort();
  }, [reloadVersion]);

  const categories = useMemo(
    () => [...new Set(products.map((product) => product.category))],
    [products],
  );
  const featuredProducts = useMemo(() => {
    const seenCategories = new Set<string>();

    return products.filter((product) => {
      if (seenCategories.has(product.category)) return false;
      seenCategories.add(product.category);
      return true;
    });
  }, [products]);
  const reloadProducts = useCallback(() => {
    setReloadVersion((version) => version + 1);
  }, []);

  const value: ProductContextValue = {
    products,
    categories,
    productCategories: ["All", ...categories],
    featuredProducts,
    isLoading,
    error,
    reloadProducts,
  };

  return <ProductContext.Provider value={value}>{children}</ProductContext.Provider>;
}
