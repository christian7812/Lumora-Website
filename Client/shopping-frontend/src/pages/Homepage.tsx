import { Truck, ShieldCheck, Headphones, Sparkles, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import Navbar from "../components/layout/Navbar";
import Footer from "../components/layout/Footer";
import Hero from "../components/ui/Hero";
import ProductSection from "../components/ui/ProductSection";
import { useCart } from "../contexts/CartContext";

export default function HomePage() {
  const { addToCart } = useCart();

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      <main>
        {/* Animated Hero Carousel */}
        <Hero />

        {/* Value Proposition Highlights Bar */}
        <section className="border-b border-gray-100 bg-white py-8 shadow-sm">
          <div className="mx-auto grid max-w-7xl grid-cols-2 gap-6 px-4 sm:grid-cols-2 sm:px-6 lg:grid-cols-4 lg:px-8">
            <div className="flex items-center gap-3.5">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-yellow-100 text-yellow-800">
                <Truck size={22} />
              </div>
              <div>
                <h4 className="text-sm font-bold text-gray-950">Free Express Delivery</h4>
                <p className="text-xs text-gray-500">Orders above GH₵ 500 across Ghana</p>
              </div>
            </div>

            <div className="flex items-center gap-3.5">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-800">
                <ShieldCheck size={22} />
              </div>
              <div>
                <h4 className="text-sm font-bold text-gray-950">100% Secure Checkout</h4>
                <p className="text-xs text-gray-500">MoMo, Card & Pay On Delivery</p>
              </div>
            </div>

            <div className="flex items-center gap-3.5">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-indigo-100 text-indigo-800">
                <Sparkles size={22} />
              </div>
              <div>
                <h4 className="text-sm font-bold text-gray-950">Authentic Guarantee</h4>
                <p className="text-xs text-gray-500">Verified products & warranties</p>
              </div>
            </div>

            <div className="flex items-center gap-3.5">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-rose-100 text-rose-800">
                <Headphones size={22} />
              </div>
              <div>
                <h4 className="text-sm font-bold text-gray-950">24/7 Dedicated Support</h4>
                <p className="text-xs text-gray-500">Fast assistance whenever you need</p>
              </div>
            </div>
          </div>
        </section>

        {/* Dynamic & Rich Products Section with Quick View */}
        <ProductSection onAddToCart={addToCart} />

        {/* Creative Promotional Banner */}
        <section className="bg-slate-100 px-4 py-16 sm:px-6 lg:px-8">
          <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-8 rounded-3xl bg-gradient-to-br from-slate-800 to-slate-900 px-6 py-12 text-white sm:px-12 md:flex-row">
            <div className="max-w-xl text-center md:text-left">
              <span className="inline-block rounded-full bg-teal-400/20 border border-teal-400/40 px-3.5 py-1 text-xs font-black uppercase tracking-widest text-teal-300">
                Special Offer
              </span>
              <h3 className="mt-4 text-3xl font-black tracking-tight text-white sm:text-4xl">
                Ready to Upgrade Your Shopping?
              </h3>
              <p className="mt-3 text-sm text-gray-300 sm:text-base">
                Join thousands of satisfied shoppers. Discover new arrivals with express delivery to your doorstep.
              </p>
            </div>

            <Link
              to="/products"
              className="inline-flex items-center gap-2 rounded-2xl bg-teal-500 px-8 py-4 text-sm font-black text-white shadow-lg transition hover:bg-teal-400 hover:scale-105"
            >
              <span>Start Shopping Now</span>
              <ArrowRight size={18} />
            </Link>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
