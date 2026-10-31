import { ArrowDown, ArrowRight, Package, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import Footer from "../components/layout/Footer";
import Navbar from "../components/layout/Navbar";
import { categoryDetails } from "../data/categoryDetails";
import { useProducts } from "../contexts/ProductContext";

export default function CategoriesPage() {
  const {
    categories: productCategories,
    products,
    isLoading,
    error,
    reloadProducts,
  } = useProducts();
  const categories = productCategories.map((name) => {
    const categoryProducts = products.filter(
      (product) => product.category === name,
    );
    const details = categoryDetails[name] ?? {
      description: "Browse products in this collection.",
      icon: Package,
      accent: "bg-slate-100 text-slate-800",
    };

    return {
      name,
      count: categoryProducts.length,
      image: categoryProducts[0]?.image,
      ...details,
    };
  });

  return (
    <div className="min-h-screen bg-stone-50">
      <Navbar />

      <main>
        <section className="bg-white px-4 pb-10 pt-12 sm:px-6 sm:pb-14 sm:pt-16 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <div className="max-w-3xl">
              <span className="inline-flex items-center gap-2 rounded-full bg-yellow-100 px-3 py-1.5 text-xs font-bold uppercase tracking-[0.16em] text-yellow-900">
                <Sparkles size={14} aria-hidden="true" />
                Find your next favourite
              </span>
              <h1 className="mt-5 text-4xl font-black tracking-tight text-gray-950 sm:text-5xl lg:text-6xl">
                A little something
                <span className="text-yellow-500"> for everyone.</span>
              </h1>
              <p className="mt-5 max-w-2xl text-base leading-7 text-gray-600 sm:text-lg">
                Browse the Lumora collection by category and find good things
                for your home, your everyday, and everyone you love.
              </p>
              <a
                href="#all-categories"
                className="mt-7 inline-flex min-h-11 items-center gap-2 rounded-full bg-gray-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-gray-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-yellow-500"
              >
                Explore categories
                <ArrowDown size={16} aria-hidden="true" />
              </a>
            </div>
          </div>
        </section>

        <section
          id="all-categories"
          className="scroll-mt-24 px-4 py-10 sm:px-6 sm:py-14 lg:px-8"
        >
          <div className="mx-auto max-w-7xl">
            <div className="mb-7 flex flex-wrap items-end justify-between gap-4 sm:mb-9">
              <div>
                <p className="text-sm font-semibold text-yellow-700">
                  Curated for you
                </p>
                <h2 className="mt-1 text-2xl font-bold tracking-tight text-gray-950 sm:text-3xl">
                  Explore all categories
                </h2>
              </div>
              <p className="text-sm text-gray-500">
                {isLoading
                  ? "Loading collections…"
                  : error
                    ? "Collections unavailable"
                    : `${categories.length} collections to explore`}
              </p>
            </div>

            {isLoading ? (
              <p className="py-12 text-center text-gray-600" role="status">
                Loading categories…
              </p>
            ) : error ? (
              <div className="rounded-xl border border-red-200 bg-red-50 p-5 text-center" role="alert">
                <p className="text-sm text-red-800">{error}</p>
                <button
                  type="button"
                  onClick={reloadProducts}
                  className="mt-3 font-semibold text-red-900 underline"
                >
                  Try again
                </button>
              </div>
            ) : categories.length > 0 ? (
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {categories.map((category) => {
                  const Icon = category.icon;

                  return (
                    <Link
                      key={category.name}
                      to={`/products?category=${encodeURIComponent(category.name)}`}
                      aria-label={`Browse ${category.name}: ${category.count} products`}
                      className="group relative isolate flex min-h-80 flex-col justify-between overflow-hidden rounded-3xl bg-gray-900 p-5 text-white shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-yellow-500 sm:min-h-96 sm:p-6"
                    >
                      {category.image && (
                        <img
                          src={category.image}
                          alt=""
                          loading="lazy"
                          className="absolute inset-0 -z-20 h-full w-full object-cover transition duration-700 group-hover:scale-105"
                        />
                      )}
                      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-black/35 via-black/10 to-black/85" />

                      <div className="flex items-start justify-between gap-3">
                        <span
                          className={`inline-flex h-11 w-11 items-center justify-center rounded-2xl ${category.accent}`}
                        >
                          <Icon size={21} aria-hidden="true" />
                        </span>
                        <span className="rounded-full border border-white/30 bg-black/25 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur-sm">
                          {category.count}{" "}
                          {category.count === 1 ? "item" : "items"}
                        </span>
                      </div>

                      <div>
                        <p className="mb-2 text-sm leading-6 text-white/85">
                          {category.description}
                        </p>
                        <div className="flex items-end justify-between gap-3">
                          <h3 className="text-xl font-bold tracking-tight sm:text-2xl">
                            {category.name}
                          </h3>
                          <span className="mb-0.5 inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white text-gray-950 transition group-hover:bg-yellow-400">
                            <ArrowRight size={19} aria-hidden="true" />
                          </span>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            ) : (
              <p className="py-12 text-center text-gray-600">
                No product categories are available yet.
              </p>
            )}

            <div className="mt-10 flex flex-col items-center justify-between gap-4 rounded-3xl bg-yellow-400 p-6 sm:flex-row sm:p-8">
              <div>
                <p className="text-sm font-semibold text-black/70">
                  Still looking around?
                </p>
                <h2 className="mt-1 text-xl font-bold text-black sm:text-2xl">
                  There’s more to discover.
                </h2>
              </div>
              <Link
                to="/products"
                className="inline-flex min-h-11 items-center gap-2 rounded-full bg-black px-5 py-3 text-sm font-semibold text-white transition hover:bg-gray-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black"
              >
                Shop all products
                <ArrowRight size={17} aria-hidden="true" />
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
