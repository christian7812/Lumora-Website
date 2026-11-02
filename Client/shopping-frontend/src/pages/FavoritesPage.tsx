import { useState } from "react";
import { Link } from "react-router-dom";
import { Heart, ShoppingBag } from "lucide-react";
import Navbar from "../components/layout/Navbar";
import Footer from "../components/layout/Footer";
import ProductCard, { type Product } from "../components/ui/ProductCard";
import ProductDetailModal from "../components/ui/ProductDetailModal";
import { useCart } from "../contexts/CartContext";
import { useFavorites } from "../contexts/FavoritesContext";

export default function FavoritesPage() {
  const { addToCart } = useCart();
  const { favorites } = useFavorites();
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <main className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3">
          <Heart className="text-red-500" size={28} fill="currentColor" />
          <div>
            <p className="text-sm font-bold uppercase tracking-widest text-yellow-600">
              Your saved products
            </p>
            <h1 className="mt-1 text-3xl font-black text-gray-950 sm:text-4xl">
              Favorites
            </h1>
          </div>
        </div>

        {favorites.length > 0 ? (
          <div className="mt-8 grid grid-cols-2 gap-3.5 sm:gap-6 md:grid-cols-3 lg:grid-cols-4">
            {favorites.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onAddToCart={(item) => addToCart(item, 1)}
                onQuickView={setSelectedProduct}
              />
            ))}
          </div>
        ) : (
          <div className="mt-8 rounded-3xl border border-dashed border-gray-300 bg-white px-6 py-16 text-center">
            <Heart className="mx-auto text-gray-300" size={44} />
            <h2 className="mt-4 text-xl font-bold text-gray-900">
              No favorites yet
            </h2>
            <p className="mt-2 text-sm text-gray-500">
              Tap the heart on a product to save it here.
            </p>
            <Link
              to="/products"
              className="mt-6 inline-flex items-center gap-2 rounded-xl bg-yellow-400 px-5 py-3 text-sm font-bold text-black transition hover:bg-yellow-300"
            >
              <ShoppingBag size={17} />
              Browse products
            </Link>
          </div>
        )}
      </main>

      <ProductDetailModal
        product={selectedProduct}
        isOpen={selectedProduct !== null}
        onClose={() => setSelectedProduct(null)}
        onAddToCart={(product, quantity, size, color) =>
          addToCart(product, quantity, size, color)
        }
      />

      <Footer />
    </div>
  );
}
