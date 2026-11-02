import { Link } from "react-router-dom";
import { ShoppingBag, Trash2, Minus, Plus, ArrowRight } from "lucide-react";
import Navbar from "../components/layout/Navbar";
import Footer from "../components/layout/Footer";
import { useCart } from "../contexts/CartContext";

export default function CartPage() {
  const { cart, cartTotal, updateQuantity, removeFromCart } =
    useCart();
  const subtotal = cartTotal;
  const shipping = 0;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <main className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div>
          <p className="text-sm font-bold uppercase tracking-widest text-yellow-600">
            Your selections
          </p>

          <h1 className="mt-2 text-4xl font-black text-gray-950">
            Shopping Cart
          </h1>

          <p className="mt-3 text-gray-600">
            Review your items before proceeding to checkout.
          </p>
        </div>

        {cart.length === 0 ? (
          <div className="mt-10 rounded-2xl border border-gray-200 bg-white px-6 py-16 text-center">
            <ShoppingBag
              size={52}
              className="mx-auto text-gray-400"
            />

            <h2 className="mt-5 text-2xl font-bold text-gray-900">
              Your cart is empty
            </h2>

            <p className="mt-3 text-gray-500">
              Explore our collection and find something you love.
            </p>

            <Link
              to="/products"
              className="mt-7 inline-flex items-center gap-2 rounded-xl bg-yellow-400 px-6 py-3 font-bold text-black transition hover:bg-yellow-500"
            >
              Start Shopping
              <ArrowRight size={18} />
            </Link>
          </div>
        ) : (
          <div className="mt-10 grid items-start gap-8 lg:grid-cols-[1fr_350px]">
            {/* Cart items */}
            <section className="space-y-4">
              {cart.map((item) => (
                <article
                  key={item.id}
                  className="flex flex-col gap-5 rounded-2xl border border-gray-200 bg-white p-4 sm:flex-row sm:items-center"
                >
                  <img
                    src={item.image}
                    alt={item.name}
                    className="h-28 w-full rounded-xl object-cover sm:w-28"
                  />

                  <div className="min-w-0 flex-1">
                    <h2 className="font-bold text-gray-900">
                      {item.name}
                    </h2>

                    <div className="mt-1.5 flex flex-wrap items-center gap-2">
                      <p className="font-semibold text-gray-900">
                        GH₵ {item.price.toFixed(2)}
                      </p>
                      {item.selectedSize && (
                        <span className="inline-flex items-center rounded-md bg-yellow-50 px-2 py-0.5 text-xs font-bold text-yellow-800 ring-1 ring-inset ring-yellow-600/20">
                          Size: {item.selectedSize}
                        </span>
                      )}
                      {item.selectedColor && (
                        <span className="inline-flex items-center rounded-md bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">
                          Color: {item.selectedColor}
                        </span>
                      )}
                    </div>

                    <div className="mt-4 flex items-center gap-3">
                      <button
                        type="button"
                        aria-label={`Decrease quantity of ${item.name}`}
                        disabled={item.quantity <= 1}
                        onClick={() =>
                          updateQuantity(item.id, item.quantity - 1, item.selectedSize)
                        }
                        className="rounded-lg border border-gray-300 p-2 disabled:opacity-40 hover:bg-gray-100 transition"
                      >
                        <Minus size={16} />
                      </button>

                      <span className="min-w-5 text-center font-semibold">
                        {item.quantity}
                      </span>

                      <button
                        type="button"
                        aria-label={`Increase quantity of ${item.name}`}
                        disabled={item.quantity >= item.stockQuantity}
                        onClick={() =>
                          updateQuantity(item.id, item.quantity + 1, item.selectedSize)
                        }
                        className="rounded-lg border border-gray-300 p-2 disabled:opacity-40 hover:bg-gray-100 transition"
                      >
                        <Plus size={16} />
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-4 sm:flex-col sm:items-end">
                    <p className="font-bold text-gray-950">
                      GH₵ {(item.price * item.quantity).toFixed(2)}
                    </p>

                    <button
                      type="button"
                      onClick={() => removeFromCart(item.id, item.selectedSize)}
                      className="inline-flex items-center gap-1.5 rounded-lg p-1.5 text-sm text-red-600 hover:bg-red-50 hover:text-red-800 transition"
                    >
                      <Trash2 size={16} />
                      Remove
                    </button>
                  </div>
                </article>
              ))}
            </section>

            {/* Order summary */}
            <aside className="rounded-2xl border border-gray-200 bg-white p-6">
              <h2 className="text-xl font-bold text-gray-950">
                Order Summary
              </h2>

              <div className="mt-6 flex justify-between text-gray-600">
                <span>Subtotal</span>
                <span>GH₵ {subtotal.toFixed(2)}</span>
              </div>

              <div className="mt-4 flex justify-between text-gray-600">
                <span>Shipping</span>
                <span>Free</span>
              </div>

              <div className="mt-6 border-t border-gray-200 pt-5">
                <div className="flex justify-between gap-4 text-lg font-bold">
                  <span>Total</span>
                  <span>GH₵ {(subtotal + shipping).toFixed(2)}</span>
                </div>

                <p className="mt-2 text-xs text-gray-500">
                  Free delivery on every order.
                </p>
              </div>

              <Link
                to="/checkout"
                className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-200 px-5 py-3.5 font-bold text-slate-800 transition hover:bg-indigo-300"
              >
                Proceed to Checkout
                <ArrowRight size={18} />
              </Link>

              <Link
                to="/products"
                className="mt-4 block text-center text-sm font-medium text-gray-600 hover:text-black"
              >
                Continue Shopping
              </Link>
            </aside>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
