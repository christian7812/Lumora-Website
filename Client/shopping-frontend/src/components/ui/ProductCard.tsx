import { ShoppingCart, Heart, Eye } from "lucide-react";

export interface Product {
  id: string;
  name: string;
  price: number;
  image: string;
  category: string;
  oldPrice?: number;
  stockQuantity: number;
}

interface ProductCardProps {
  product: Product;
  onAddToCart?: (product: Product) => void;
  onQuickView?: (product: Product) => void;
}

export default function ProductCard({
  product,
  onAddToCart,
  onQuickView,
}: ProductCardProps) {
  const isOutOfStock = product.stockQuantity <= 0;
  const hasDiscount = Boolean(product.oldPrice && product.oldPrice > product.price);
  const discountPercent = hasDiscount && product.oldPrice
    ? Math.round(((product.oldPrice - product.price) / product.oldPrice) * 100)
    : 0;

  return (
    <article className="group relative flex flex-col overflow-hidden rounded-2xl border border-gray-200/80 bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:border-gray-300 hover:shadow-xl">
      {/* Product image container */}
      <div
        className="relative aspect-square w-full cursor-pointer overflow-hidden bg-gray-50"
        onClick={() => onQuickView?.(product)}
      >
        <img
          src={product.image}
          alt={product.name}
          loading="lazy"
          className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
        />

        {/* Badges overlay */}
        <div className="absolute left-2.5 top-2.5 flex flex-col gap-1.5 sm:left-3 sm:top-3">
          {hasDiscount && (
            <span className="rounded-full bg-red-600 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-white shadow-sm sm:text-xs">
              -{discountPercent}%
            </span>
          )}

          {!isOutOfStock ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-white/95 px-2 py-0.5 text-[10px] font-bold text-emerald-700 shadow-sm backdrop-blur sm:text-xs">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              In Stock
            </span>
          ) : (
            <span className="rounded-full bg-neutral-900 px-2.5 py-0.5 text-[10px] font-bold text-white shadow-sm sm:text-xs">
              Sold Out
            </span>
          )}
        </div>

        {/* Action icons: Wishlist & Quick View */}
        <div className="absolute right-2.5 top-2.5 flex flex-col gap-1.5 sm:right-3 sm:top-3">
          <button
            type="button"
            aria-label={`Add ${product.name} to wishlist`}
            onClick={(e) => {
              e.stopPropagation();
            }}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-gray-700 shadow transition hover:bg-yellow-400 hover:text-black sm:h-9 sm:w-9"
          >
            <Heart size={16} />
          </button>

          <button
            type="button"
            aria-label={`Quick view ${product.name}`}
            onClick={(e) => {
              e.stopPropagation();
              onQuickView?.(product);
            }}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-gray-700 shadow transition hover:bg-black hover:text-white sm:h-9 sm:w-9"
          >
            <Eye size={16} />
          </button>
        </div>

        {/* Hover Quick View banner on desktop */}
        <div className="absolute inset-x-3 bottom-3 hidden transition duration-300 md:block md:translate-y-4 md:opacity-0 md:group-hover:translate-y-0 md:group-hover:opacity-100">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onQuickView?.(product);
            }}
            className="w-full rounded-xl bg-white/95 py-2.5 text-xs font-bold text-gray-900 shadow-lg backdrop-blur transition hover:bg-black hover:text-white"
          >
            Quick View & Sizes
          </button>
        </div>
      </div>

      {/* Product details */}
      <div className="flex flex-1 flex-col justify-between p-3.5 sm:p-5">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-yellow-600 sm:text-xs">
            {product.category}
          </span>

          <h3
            onClick={() => onQuickView?.(product)}
            className="mt-1 line-clamp-2 min-h-10 cursor-pointer text-xs font-bold text-gray-900 transition hover:text-yellow-600 sm:min-h-12 sm:text-sm"
          >
            {product.name}
          </h3>
        </div>

        <div className="mt-2.5">
          {/* Prices */}
          <div className="flex flex-wrap items-baseline gap-1.5 sm:gap-2">
            <span className="text-sm font-black text-gray-950 sm:text-lg">
              GH₵ {product.price.toFixed(2)}
            </span>

            {hasDiscount && product.oldPrice && (
              <span className="text-xs text-gray-400 line-through">
                GH₵ {product.oldPrice.toFixed(2)}
              </span>
            )}
          </div>

          {/* Add to Cart button */}
          <button
            type="button"
            onClick={() => onAddToCart?.(product)}
            disabled={isOutOfStock}
            className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-xl bg-black px-3 py-2.5 text-xs font-bold text-white transition hover:bg-yellow-400 hover:text-black disabled:cursor-not-allowed disabled:bg-gray-200 disabled:text-gray-500 sm:gap-2 sm:px-4 sm:py-3 sm:text-sm"
          >
            <ShoppingCart size={16} />
            {isOutOfStock ? "Out of Stock" : "Add to Cart"}
          </button>
        </div>
      </div>
    </article>
  );
}
