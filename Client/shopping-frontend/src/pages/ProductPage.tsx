import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import Navbar from "../components/layout/Navbar";
import Footer from "../components/layout/Footer";
import ProductCard, { type Product } from "../components/ui/ProductCard";
import ProductDetailModal from "../components/ui/ProductDetailModal";
import { useProducts } from "../contexts/ProductContext";
import { useCart } from "../contexts/CartContext";

export default function ProductsPage() {
  const { addToCart } = useCart();
  const {
    products,
    productCategories,
    isLoading,
    error,
    reloadProducts,
  } = useProducts();

  const [search, setSearch] = useState("");
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const requestedCategory = searchParams.get("category");
  const category = productCategories.includes(requestedCategory ?? "")
    ? requestedCategory ?? "All"
    : "All";

  const filteredProducts = products.filter((product) => {
    const matchesSearch = product.name
      .toLowerCase()
      .includes(search.toLowerCase());

    const matchesCategory =
      category === "All" || product.category === category;

    return matchesSearch && matchesCategory;
  });

  function handleOpenQuickView(product: Product) {
    setSelectedProduct(product);
    setIsModalOpen(true);
  }

  function handleCloseModal() {
    setIsModalOpen(false);
    setSelectedProduct(null);
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <main className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div>
          <p className="text-sm font-bold uppercase tracking-widest text-yellow-600">
            Discover your favourites
          </p>

          <h1 className="mt-2 text-4xl font-black text-gray-950 sm:text-5xl">
            All Products
          </h1>

          <p className="mt-3 text-gray-600">
            Explore our curated catalog of {products.length} quality products. Click any item for sizes & details.
          </p>
        </div>

        {/* Search and category filters */}
        <div className="mt-8 flex flex-col gap-4 sm:flex-row">
          <input
            type="search"
            placeholder="Search products by name..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="w-full rounded-2xl border border-gray-300 bg-white px-5 py-3.5 text-sm shadow-sm outline-none transition focus:border-yellow-500 focus:ring-2 focus:ring-yellow-400/20 sm:max-w-md"
          />

          <select
            value={category}
            onChange={(event) =>
              setSearchParams(
                event.target.value === "All"
                  ? {}
                  : { category: event.target.value },
              )
            }
            className="rounded-2xl border border-gray-300 bg-white px-5 py-3.5 text-sm font-semibold shadow-sm outline-none transition focus:border-yellow-500"
          >
            {productCategories.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </div>

        {isLoading ? (
          <div className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
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
          <div className="mt-8 rounded-xl border border-red-200 bg-red-50 p-5" role="alert">
            <p className="text-sm text-red-800">{error}</p>
            <button
              type="button"
              onClick={reloadProducts}
              className="mt-3 font-semibold text-red-900 underline"
            >
              Try again
            </button>
          </div>
        ) : (
          <>
            <p className="mt-6 text-sm font-medium text-gray-500">
              Showing {filteredProducts.length} of {products.length} products
            </p>

            {filteredProducts.length > 0 ? (
              <div className="mt-6 grid grid-cols-2 gap-3.5 sm:gap-6 md:grid-cols-3 lg:grid-cols-4">
                {filteredProducts.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    onAddToCart={(p) => addToCart(p, 1)}
                    onQuickView={handleOpenQuickView}
                  />
                ))}
              </div>
            ) : (
              <div className="py-20 text-center">
                <h2 className="text-xl font-bold text-gray-900">
                  No products found
                </h2>
                <p className="mt-2 text-gray-500">
                  Try another search term or filter category.
                </p>
              </div>
            )}
          </>
        )}
      </main>

      {/* Modern Product Detail Modal (Quick View & Sizes) */}
      <ProductDetailModal
        product={selectedProduct}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onAddToCart={(product, quantity, size, color) => {
          addToCart(product, quantity, size, color);
        }}
      />

      <Footer />
    </div>
  );
}
