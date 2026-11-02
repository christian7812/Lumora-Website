import { useState, useEffect } from "react";
import {
  X,
  Star,
  ShieldCheck,
  Truck,
  RotateCcw,
  Check,
  ShoppingBag,
  Heart,
  Zap,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import type { Product } from "./ProductCard";
import { useFavorites } from "../../contexts/FavoritesContext";

interface ProductDetailModalProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
  onAddToCart: (
    product: Product,
    quantity?: number,
    selectedSize?: string,
    selectedColor?: string,
  ) => void;
}

const COLOR_OPTIONS = [
  { name: "Classic Black", class: "bg-neutral-900" },
  { name: "Pure White", class: "bg-white border border-gray-300" },
  { name: "Amber Gold", class: "bg-amber-400" },
  { name: "Navy Blue", class: "bg-indigo-900" },
];

function getCategorySizes(category: string, productName: string): string[] {
  const cat = category.toLowerCase();
  const name = productName.toLowerCase();

  if (cat.includes("fashion") || cat.includes("bag") || cat.includes("access")) {
    if (name.includes("shoe") || name.includes("sneaker") || name.includes("boot")) {
      return ["EU 39", "EU 40", "EU 41", "EU 42", "EU 43", "EU 44"];
    }
    return ["S", "M", "L", "XL", "XXL"];
  }

  if (cat.includes("elect") || name.includes("phone") || name.includes("laptop")) {
    return ["Standard", "Pro (256GB)", "Ultra (512GB)"];
  }

  return ["Standard", "Plus", "Deluxe"];
}

interface ProductDetailDialogProps {
  product: Product;
  onClose: () => void;
  onAddToCart: (
    product: Product,
    quantity?: number,
    selectedSize?: string,
    selectedColor?: string,
  ) => void;
}

function ProductDetailDialog({
  product,
  onClose,
  onAddToCart,
}: ProductDetailDialogProps) {
  const navigate = useNavigate();
  const { isFavorite, toggleFavorite } = useFavorites();
  const sizes = getCategorySizes(product.category, product.name);

  const [quantity, setQuantity] = useState(1);
  const [selectedSize, setSelectedSize] = useState<string>(sizes[0] ?? "Standard");
  const [selectedColor, setSelectedColor] = useState<string>("Classic Black");
  const [isAdded, setIsAdded] = useState(false);
  const isWishlisted = isFavorite(product.id);

  const discountPercent =
    product.oldPrice && product.oldPrice > product.price
      ? Math.round(((product.oldPrice - product.price) / product.oldPrice) * 100)
      : null;

  function handleAddToCart() {
    onAddToCart(product, quantity, selectedSize, selectedColor);
    setIsAdded(true);
    setTimeout(() => setIsAdded(false), 2000);
  }

  function handleBuyNow() {
    onAddToCart(product, quantity, selectedSize, selectedColor);
    onClose();
    navigate("/checkout");
  }

  return (
    <div className="relative z-10 flex max-h-[92vh] w-full max-w-4xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl ring-1 ring-black/5 md:flex-row">
      {/* Close Button */}
      <button
        type="button"
        onClick={onClose}
        aria-label="Close product modal"
        className="absolute right-4 top-4 z-20 flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-gray-700 shadow-md backdrop-blur transition hover:bg-gray-100 hover:text-black"
      >
        <X size={20} />
      </button>

      {/* Left Side: Product Image Display */}
      <div className="relative flex flex-col items-center justify-center bg-gradient-to-b from-gray-50 to-gray-100 p-6 sm:p-8 md:w-1/2">
        {discountPercent !== null && (
          <span className="absolute left-4 top-4 z-10 rounded-full bg-red-600 px-3.5 py-1 text-xs font-black tracking-wider text-white shadow-md">
            SAVE {discountPercent}%
          </span>
        )}

        <div className="group relative aspect-square w-full max-w-sm overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-gray-900/5">
          <img
            src={product.image}
            alt={product.name}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        </div>

        {/* Quick thumbnails / preview indicators */}
        <div className="mt-4 flex items-center gap-3">
          <div className="h-2.5 w-8 rounded-full bg-yellow-400" />
          <div className="h-2.5 w-2.5 rounded-full bg-gray-300" />
          <div className="h-2.5 w-2.5 rounded-full bg-gray-300" />
        </div>

        <p className="mt-3 text-center text-xs text-gray-500">
          Hover image to zoom · Authentic Lumora Collection
        </p>
      </div>

      {/* Right Side: Product Details & Purchase Actions */}
      <div className="flex flex-1 flex-col overflow-y-auto p-6 sm:p-8">
        {/* Header & Category */}
        <div className="flex items-center justify-between gap-4">
          <span className="inline-flex items-center rounded-full bg-yellow-100 px-3 py-1 text-xs font-bold uppercase tracking-wider text-yellow-800">
            {product.category}
          </span>

          <button
            type="button"
            onClick={() => toggleFavorite(product)}
            aria-label={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
            aria-pressed={isWishlisted}
            className={`rounded-full p-2 transition ${
              isWishlisted
                ? "bg-red-50 text-red-600"
                : "bg-gray-100 text-gray-500 hover:text-red-500"
            }`}
          >
            <Heart size={18} fill={isWishlisted ? "currentColor" : "none"} />
          </button>
        </div>

        {/* Product Title */}
        <h2
          id="modal-product-title"
          className="mt-3 text-2xl font-black tracking-tight text-gray-950 sm:text-3xl"
        >
          {product.name}
        </h2>

        {/* Rating & Reviews */}
        <div className="mt-3 flex items-center gap-2">
          <div className="flex text-yellow-400">
            {[...Array(5)].map((_, i) => (
              <Star key={i} size={16} fill="currentColor" />
            ))}
          </div>
          <span className="text-sm font-bold text-gray-900">4.9</span>
          <span className="text-sm text-gray-500">(128 verified ratings)</span>
        </div>

        {/* Pricing */}
        <div className="mt-4 flex flex-wrap items-baseline gap-3 border-b border-gray-100 pb-4">
          <span className="text-3xl font-black text-gray-950">
            GH₵ {product.price.toFixed(2)}
          </span>

          {product.oldPrice && product.oldPrice > product.price && (
            <>
              <span className="text-lg font-medium text-gray-400 line-through">
                GH₵ {product.oldPrice.toFixed(2)}
              </span>
              <span className="rounded-md bg-emerald-50 px-2.5 py-0.5 text-xs font-bold text-emerald-700">
                You save GH₵ {(product.oldPrice - product.price).toFixed(2)}
              </span>
            </>
          )}
        </div>

        {/* Stock Status Indicator */}
        <div className="mt-4 flex items-center gap-2 text-sm">
          <span className="relative flex h-3 w-3">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex h-3 w-3 rounded-full bg-emerald-500" />
          </span>
          <span className="font-semibold text-emerald-800">
            In Stock
          </span>
          <span className="text-gray-500">
            — {product.stockQuantity} units available
          </span>
        </div>

        {/* Size Selector */}
        <div className="mt-5">
          <div className="flex items-center justify-between text-sm">
            <span className="font-bold text-gray-900">Choose Size / Variant</span>
            <span className="text-xs font-semibold text-yellow-600">
              Selected: {selectedSize}
            </span>
          </div>

          <div className="mt-2.5 flex flex-wrap gap-2.5">
            {sizes.map((size) => (
              <button
                key={size}
                type="button"
                onClick={() => setSelectedSize(size)}
                className={`min-h-10 rounded-xl px-4 py-2 text-xs font-bold transition sm:text-sm ${
                  selectedSize === size
                    ? "bg-black text-white shadow-sm ring-2 ring-black"
                    : "border border-gray-200 bg-white text-gray-700 hover:border-gray-900"
                }`}
              >
                {size}
              </button>
            ))}
          </div>
        </div>

        {/* Color Selector */}
        <div className="mt-5">
          <div className="text-sm font-bold text-gray-900">
            Color: <span className="font-normal text-gray-600">{selectedColor}</span>
          </div>
          <div className="mt-2.5 flex items-center gap-3">
            {COLOR_OPTIONS.map((c) => (
              <button
                key={c.name}
                type="button"
                onClick={() => setSelectedColor(c.name)}
                aria-label={`Select ${c.name}`}
                className={`relative flex h-8 w-8 items-center justify-center rounded-full transition ${c.class} ${
                  selectedColor === c.name
                    ? "ring-2 ring-black ring-offset-2"
                    : "opacity-80 hover:opacity-100"
                }`}
              >
                {selectedColor === c.name && (
                  <Check
                    size={14}
                    className={c.name === "Pure White" ? "text-black" : "text-white"}
                  />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Quantity and Actions */}
        <div className="mt-6 space-y-3 pt-2">
          <div className="flex items-center gap-3">
            <span className="text-sm font-bold text-gray-900">Quantity:</span>
            <div className="inline-flex items-center rounded-xl border border-gray-200 bg-gray-50">
              <button
                type="button"
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                disabled={quantity <= 1}
                className="flex h-10 w-10 items-center justify-center text-lg font-bold text-gray-600 transition hover:bg-gray-200 disabled:opacity-40"
              >
                -
              </button>
              <span className="w-10 text-center font-bold text-gray-900">
                {quantity}
              </span>
              <button
                type="button"
                onClick={() => setQuantity((q) => Math.min(product.stockQuantity, q + 1))}
                disabled={quantity >= product.stockQuantity}
                className="flex h-10 w-10 items-center justify-center text-lg font-bold text-gray-600 transition hover:bg-gray-200 disabled:opacity-40"
              >
                +
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <button
              type="button"
              onClick={handleAddToCart}
              disabled={isAdded}
              className={`flex h-13 w-full items-center justify-center gap-2 rounded-2xl px-5 py-3.5 text-sm font-bold shadow-lg transition duration-200 ${
                isAdded
                  ? "bg-emerald-600 text-white"
                  : "bg-yellow-400 text-black hover:bg-yellow-500"
              }`}
            >
              {isAdded ? (
                <>
                  <Check size={18} />
                  Added to Bag!
                </>
              ) : (
                <>
                  <ShoppingBag size={18} />
                  Add to Cart · GH₵ {(product.price * quantity).toFixed(2)}
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleBuyNow}
              className="flex h-13 w-full items-center justify-center gap-2 rounded-2xl bg-black px-5 py-3.5 text-sm font-bold text-white shadow-lg transition duration-200 hover:bg-gray-800"
            >
              <Zap size={18} />
              Buy Now
            </button>
          </div>
        </div>

        {/* Guarantees & Trust Badges */}
        <div className="mt-6 grid grid-cols-3 gap-2 rounded-2xl border border-gray-100 bg-gray-50/75 p-3.5 text-center text-[11px] text-gray-600 sm:text-xs">
          <div className="flex flex-col items-center gap-1">
            <Truck size={18} className="text-yellow-600" />
            <span className="font-semibold text-gray-900">Free Delivery</span>
            <span>Orders over GH₵ 500</span>
          </div>
          <div className="flex flex-col items-center gap-1 border-x border-gray-200">
            <RotateCcw size={18} className="text-yellow-600" />
            <span className="font-semibold text-gray-900">30-Day Return</span>
            <span>Hassle-free guarantee</span>
          </div>
          <div className="flex flex-col items-center gap-1">
            <ShieldCheck size={18} className="text-yellow-600" />
            <span className="font-semibold text-gray-900">100% Genuine</span>
            <span>Certified quality</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ProductDetailModal({
  product,
  isOpen,
  onClose,
  onAddToCart,
}: ProductDetailModalProps) {
  // Handle escape key
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    if (isOpen) {
      window.addEventListener("keydown", onKeyDown);
      document.body.style.overflow = "hidden";
    }
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, onClose]);

  if (!isOpen || !product) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-product-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 md:p-6"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Dialog Content (Keyed by product ID to naturally reset state) */}
      <ProductDetailDialog
        key={product.id}
        product={product}
        onClose={onClose}
        onAddToCart={onAddToCart}
      />
    </div>
  );
}
