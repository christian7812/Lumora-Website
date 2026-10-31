import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { Sparkles, ArrowRight, Layers, Flame } from "lucide-react";
import ProductCard, { type Product } from "./ProductCard";
import ProductDetailModal from "./ProductDetailModal";
import { useProducts } from "../../contexts/ProductContext";

interface ProductSectionProps {
  onAddToCart?: (
    product: Product,
    quantity?: number,
    selectedSize?: string,
    selectedColor?: string,
  ) => void;
}

const INITIAL_VISIBLE_COUNT = 16;
const PAGE_INCREMENT = 12;

export default function ProductSection({ onAddToCart }: ProductSectionProps) {
  const {
    products,
    categories: productCategories,
    isLoading,
    error,
    reloadProducts,
  } = useProducts();

  const [activeCategory, setActiveCategory] = useState("All");
  const [visibleCount, setVisibleCount] = useState(INITIAL_VISIBLE_COUNT);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const categories = ["All", ...productCategories];

  // Filter products by selected category
  const filteredProducts = useMemo(() => {
    if (activeCategory === "All") return products;
    return products.filter((product) => product.category === activeCategory);
  }, [products, activeCategory]);

  const displayedProducts = filteredProducts.slice(0, visibleCount);
  const hasMore = visibleCount < filteredProducts.length;

  function handleOpenQuickView(product: Product) {
    setSelectedProduct(product);
    setIsModalOpen(true);
  }

  function handleCloseModal() {
    setIsModalOpen(false);
    setSelectedProduct(null);
  }

  return (
    <section id="featured-products" className="bg-gray-50/70 px-4 py-16 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        {/* Section Heading */}
        <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-yellow-400/20 px-3.5 py-1 text-xs font-black uppercase tracking-widest text-yellow-800">
              <Sparkles size={14} className="text-yellow-600" />
              Curated Catalog
            </div>

            <h2 className="mt-3 text-3xl font-black tracking-tight text-gray-950 sm:text-4xl lg:text-5xl">
              Explore Our Products
            </h2>

            <p className="mt-2 text-sm text-gray-600 sm:text-base">
              Showing top picks from over {products.length} hand-picked items across Ghana.
            </p>
          </div>

          <Link
            to="/products"
            className="group inline-flex items-center gap-2 rounded-xl bg-black px-5 py-3 text-sm font-bold text-white shadow-md transition hover:bg-yellow-400 hover:text-black"
          >
            <span>View All ({products.length})</span>
            <ArrowRight size={16} className="transition group-hover:translate-x-1" />
          </Link>
        </div>

        {/* Category Pills (horizontally scrollable on mobile) */}
        <div className="mt-8 flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none sm:gap-2.5">
          {categories.map((category) => {
            const isActive = activeCategory === category;
            return (
              <button
                key={category}
                type="button"
                onClick={() => {
                  setActiveCategory(category);
                  setVisibleCount(INITIAL_VISIBLE_COUNT);
                }}
                className={`whitespace-nowrap rounded-full px-5 py-2.5 text-xs font-bold transition sm:text-sm ${
                  isActive
                    ? "bg-yellow-400 text-black shadow-sm ring-2 ring-yellow-400/50"
                    : "border border-gray-200 bg-white text-gray-600 hover:border-gray-900 hover:text-black"
                }`}
              >
                {category}
              </button>
            );
          })}
        </div>

        {/* Loading / Error States */}
        {isLoading ? (
          <div className="mt-12 grid grid-cols-2 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {[...Array(8)].map((_, i) => (
              <div
                key={i}
                className="animate-pulse rounded-2xl border border-gray-200 bg-white p-4"
              >
                <div className="aspect-square w-full rounded-xl bg-gray-200" />
                <div className="mt-4 h-4 w-3/4 rounded bg-gray-200" />
                <div className="mt-2 h-4 w-1/2 rounded bg-gray-200" />
                <div className="mt-4 h-10 w-full rounded-xl bg-gray-200" />
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="mt-10 rounded-2xl border border-red-200 bg-red-50 p-6 text-center" role="alert">
            <p className="font-semibold text-red-800">{error}</p>
            <button
              type="button"
              onClick={reloadProducts}
              className="mt-4 inline-flex items-center gap-2 rounded-xl bg-red-600 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-red-700"
            >
              Try Reloading
            </button>
          </div>
        ) : (
          <>
            {/* Products Grid */}
            {displayedProducts.length > 0 ? (
              <div className="mt-8 grid grid-cols-2 gap-3.5 sm:gap-6 md:grid-cols-3 lg:grid-cols-4">
                {displayedProducts.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    onAddToCart={(p) => onAddToCart?.(p, 1)}
                    onQuickView={handleOpenQuickView}
                  />
                ))}
              </div>
            ) : (
              <div className="mt-12 rounded-3xl border border-dashed border-gray-300 bg-white py-16 text-center">
                <Layers size={40} className="mx-auto text-gray-400" />
                <h3 className="mt-4 text-lg font-bold text-gray-900">
                  No products in this category yet
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  Select another category or browse our full collection.
                </p>
                <button
                  type="button"
                  onClick={() => setActiveCategory("All")}
                  className="mt-5 rounded-xl bg-yellow-400 px-5 py-2.5 text-xs font-bold text-black"
                >
                  View All Products
                </button>
              </div>
            )}

            {/* Load More Products Button */}
            {hasMore && (
              <div className="mt-12 flex flex-col items-center justify-center gap-2 text-center">
                <p className="text-xs font-medium text-gray-500">
                  Showing {displayedProducts.length} of {filteredProducts.length} products
                </p>

                <button
                  type="button"
                  onClick={() => setVisibleCount((prev) => prev + PAGE_INCREMENT)}
                  className="inline-flex items-center gap-2 rounded-2xl bg-white px-8 py-4 text-sm font-bold text-black shadow-md ring-1 ring-gray-200 transition hover:bg-yellow-400 hover:ring-yellow-400"
                >
                  <Flame size={18} className="text-yellow-600" />
                  Load More Products ({filteredProducts.length - displayedProducts.length} remaining)
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Modern Product Detail Modal (Quick View & Sizes) */}
      <ProductDetailModal
        product={selectedProduct}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onAddToCart={(product, quantity, size, color) => {
          onAddToCart?.(product, quantity, size, color);
        }}
      />
    </section>
  );
}
