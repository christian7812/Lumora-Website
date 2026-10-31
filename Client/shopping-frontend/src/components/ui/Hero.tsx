import { useEffect, useRef, useState, useCallback } from "react";
import { ArrowRight, ChevronLeft, ChevronRight, ShoppingBag } from "lucide-react";
import { Link } from "react-router-dom";

interface Slide {
  id: number;
  badge: string;
  heading: string[];
  highlight: string;
  sub: string;
  shopLink: string;
  shopLabel: string;
  image: string;
  imageAlt: string;
  tag: string;
  tagSub: string;
  bg: string;
  accentText: string;
  badgeBg: string;
  badgeText: string;
  btnBg: string;
  btnText: string;
  outlineBorder: string;
  outlineText: string;
  outlineHoverBg: string;
  outlineHoverText: string;
}

const SLIDES: Slide[] = [
  {
    id: 0,
    badge: "Welcome to Lumora",
    heading: ["Your Style.", "Your Choice."],
    highlight: "Your Store.",
    sub: "Discover quality products, explore new arrivals, and find something you love — all in one place.",
    shopLink: "/products",
    shopLabel: "Shop Now",
    image: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1000&auto=format&fit=crop&q=80",
    imageAlt: "Fashion and retail shopping store",
    tag: "Your next favourite find",
    tagSub: "Shop Lumora",
    bg: "bg-yellow-400",
    accentText: "text-white",
    badgeBg: "bg-black",
    badgeText: "text-yellow-400",
    btnBg: "bg-black hover:bg-gray-800",
    btnText: "text-white",
    outlineBorder: "border-black",
    outlineText: "text-black",
    outlineHoverBg: "hover:bg-black",
    outlineHoverText: "hover:text-yellow-400",
  },
  {
    id: 1,
    badge: "New Arrivals",
    heading: ["Fresh Drops.", "Bold Looks."],
    highlight: "New Season.",
    sub: "Stay ahead of the trend with our latest collection — curated for the modern shopper.",
    shopLink: "/products?category=Fashion",
    shopLabel: "Explore Fashion",
    image: "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=1000&auto=format&fit=crop&q=80",
    imageAlt: "Fashion clothing collection",
    tag: "Trending this season",
    tagSub: "View Collection",
    bg: "bg-slate-900",
    accentText: "text-yellow-400",
    badgeBg: "bg-yellow-400",
    badgeText: "text-black",
    btnBg: "bg-yellow-400 hover:bg-yellow-300",
    btnText: "text-black",
    outlineBorder: "border-yellow-400",
    outlineText: "text-yellow-400",
    outlineHoverBg: "hover:bg-yellow-400",
    outlineHoverText: "hover:text-black",
  },
  {
    id: 2,
    badge: "Best Sellers",
    heading: ["Top Picks.", "Loved by All."],
    highlight: "Shop Bestsellers.",
    sub: "From electronics to home & living — our best-selling products are waiting for you.",
    shopLink: "/products",
    shopLabel: "See Best Sellers",
    image: "https://images.unsplash.com/photo-1498049794561-7780e7231661?w=1000&auto=format&fit=crop&q=80",
    imageAlt: "Electronics and gadgets collection",
    tag: "Customers love these",
    tagSub: "Top Rated",
    bg: "bg-emerald-600",
    accentText: "text-white",
    badgeBg: "bg-white",
    badgeText: "text-emerald-700",
    btnBg: "bg-white hover:bg-gray-100",
    btnText: "text-emerald-700",
    outlineBorder: "border-white",
    outlineText: "text-white",
    outlineHoverBg: "hover:bg-white",
    outlineHoverText: "hover:text-emerald-700",
  },
  {
    id: 3,
    badge: "Special Deals",
    heading: ["Big Savings.", "Every Day."],
    highlight: "Deals You'll Love.",
    sub: "Unlock amazing discounts on hundreds of products. Don't miss out on our limited-time offers.",
    shopLink: "/products",
    shopLabel: "Grab Deals",
    image: "https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=1000&auto=format&fit=crop&q=80",
    imageAlt: "Shopping bags and sale items",
    tag: "Limited time only",
    tagSub: "Shop Deals",
    bg: "bg-rose-600",
    accentText: "text-white",
    badgeBg: "bg-white",
    badgeText: "text-rose-600",
    btnBg: "bg-white hover:bg-gray-100",
    btnText: "text-rose-600",
    outlineBorder: "border-white",
    outlineText: "text-white",
    outlineHoverBg: "hover:bg-white",
    outlineHoverText: "hover:text-rose-600",
  },
];

const INTERVAL_MS = 5000;

export default function Hero() {
  const [current, setCurrent] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const goTo = useCallback((index: number) => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    setCurrent((index + SLIDES.length) % SLIDES.length);
    setTimeout(() => setIsTransitioning(false), 600);
  }, [isTransitioning]);

  const next = useCallback(() => goTo(current + 1), [current, goTo]);
  const prev = useCallback(() => goTo(current - 1), [current, goTo]);

  // Auto-advance
  useEffect(() => {
    if (isPaused) return;
    timerRef.current = setInterval(next, INTERVAL_MS);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [next, isPaused]);

  // Keyboard navigation
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "ArrowLeft") prev();
      else if (e.key === "ArrowRight") next();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [prev, next]);

  return (
    <section
      className="relative overflow-hidden"
      aria-label="Hero carousel"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Slides container */}
      <div className="relative min-h-[520px]">
        {SLIDES.map((s, i) => (
          <div
            key={s.id}
            className={`absolute inset-0 transition-all duration-600 ease-in-out ${s.bg} ${
              i === current
                ? "opacity-100 translate-x-0 z-10"
                : i === (current - 1 + SLIDES.length) % SLIDES.length
                ? "opacity-0 -translate-x-full z-0"
                : "opacity-0 translate-x-full z-0"
            }`}
            style={{ transition: "opacity 0.6s ease, transform 0.6s ease" }}
            aria-hidden={i !== current}
          >
            <div className="mx-auto grid min-h-[520px] max-w-7xl items-center gap-12 px-4 py-12 sm:px-6 sm:py-16 md:grid-cols-2 md:gap-8 lg:gap-12 lg:px-8">
              {/* Text */}
              <div className="relative z-10">
                <span
                  className={`inline-block rounded-full px-3 py-2 text-[0.65rem] font-bold uppercase tracking-widest sm:px-4 sm:text-xs ${s.badgeBg} ${s.badgeText}`}
                >
                  {s.badge}
                </span>

                <h1 className={`mt-5 text-4xl font-black leading-[1.05] tracking-tight sm:mt-6 sm:text-5xl lg:text-6xl ${
                  i === current ? "text-black" : "text-black"
                } ${s.bg === "bg-slate-900" ? "text-white" : "text-black"}`}>
                  {s.heading.map((line, li) => (
                    <span key={li}>
                      {line}
                      <br />
                    </span>
                  ))}
                  <span className={s.accentText}>{s.highlight}</span>
                </h1>

                <p className={`mt-5 max-w-lg text-sm leading-6 sm:mt-6 sm:text-lg sm:leading-7 ${
                  s.bg === "bg-slate-900" ? "text-gray-300" : "text-black/75"
                }`}>
                  {s.sub}
                </p>

                <div className="mt-7 flex flex-col gap-3 min-[520px]:flex-row min-[520px]:flex-wrap min-[520px]:gap-4 sm:mt-8">
                  <Link
                    to={s.shopLink}
                    className={`inline-flex min-h-12 items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-bold transition min-[520px]:px-5 sm:px-6 sm:py-4 sm:text-base ${s.btnBg} ${s.btnText}`}
                  >
                    {s.shopLabel}
                    <ArrowRight size={20} />
                  </Link>

                  <a
                    href="#featured-products"
                    className={`inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border-2 px-4 py-3 text-sm font-bold transition min-[520px]:px-5 sm:px-6 sm:py-4 sm:text-base ${s.outlineBorder} ${s.outlineText} ${s.outlineHoverBg} ${s.outlineHoverText}`}
                  >
                    <ShoppingBag size={20} />
                    Explore Products
                  </a>
                </div>

                {/* Stats */}
                <div className={`mt-8 grid grid-cols-3 gap-3 border-t pt-5 sm:mt-10 sm:flex sm:flex-wrap sm:gap-8 sm:pt-6 ${
                  s.bg === "bg-slate-900" ? "border-white/20" : "border-black/20"
                }`}>
                  {["Quality", "Variety", "Convenience"].map((stat, si) => (
                    <div key={si}>
                      <p className={`text-lg font-black sm:text-2xl ${s.bg === "bg-slate-900" ? "text-white" : "text-black"}`}>
                        {stat}
                      </p>
                      <p className={`mt-1 text-xs sm:text-sm ${s.bg === "bg-slate-900" ? "text-gray-400" : "text-black/70"}`}>
                        {["Products you love", "More choices", "Easy shopping"][si]}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Image */}
              <div className="relative mx-auto mb-5 w-full max-w-lg min-w-0">
                <div className={`absolute inset-3 rotate-6 rounded-[2rem] sm:inset-4 ${
                  s.bg === "bg-yellow-400" ? "bg-black" : "bg-black/30"
                }`} />
                <img
                  src={s.image}
                  alt={s.imageAlt}
                  className="relative h-[280px] w-full rounded-3xl object-cover shadow-2xl sm:h-[360px] sm:rounded-[2rem] lg:h-[450px]"
                  loading={i === 0 ? "eager" : "lazy"}
                />
                <div className="absolute -bottom-5 left-2 max-w-[calc(100%_-_1rem)] rounded-2xl bg-white p-3 shadow-xl sm:left-4 sm:p-4 lg:-left-6">
                  <p className="text-xs font-medium text-gray-500">{s.tag}</p>
                  <p className="mt-1 font-bold text-black">{s.tagSub}</p>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Prev / Next buttons */}
      <button
        type="button"
        onClick={prev}
        aria-label="Previous slide"
        className="absolute left-3 top-1/2 z-20 -translate-y-1/2 rounded-full bg-black/20 p-2 text-white backdrop-blur-sm transition hover:bg-black/50 sm:left-4 sm:p-3"
      >
        <ChevronLeft size={22} />
      </button>
      <button
        type="button"
        onClick={next}
        aria-label="Next slide"
        className="absolute right-3 top-1/2 z-20 -translate-y-1/2 rounded-full bg-black/20 p-2 text-white backdrop-blur-sm transition hover:bg-black/50 sm:right-4 sm:p-3"
      >
        <ChevronRight size={22} />
      </button>

      {/* Dot indicators */}
      <div className="absolute bottom-4 left-1/2 z-20 flex -translate-x-1/2 gap-2" role="tablist" aria-label="Slide indicators">
        {SLIDES.map((s, i) => (
          <button
            key={s.id}
            type="button"
            role="tab"
            aria-selected={i === current}
            aria-label={`Go to slide ${i + 1}`}
            onClick={() => goTo(i)}
            className={`h-2.5 rounded-full transition-all duration-300 ${
              i === current
                ? "w-8 bg-white"
                : "w-2.5 bg-white/50 hover:bg-white/75"
            }`}
          />
        ))}
      </div>

      {/* Progress bar */}
      {!isPaused && (
        <div className="absolute bottom-0 left-0 z-20 h-0.5 w-full overflow-hidden bg-black/10">
          <div
            key={`${current}-progress`}
            className="h-full bg-white/60"
            style={{
              animation: `heroProgress ${INTERVAL_MS}ms linear forwards`,
            }}
          />
        </div>
      )}

      <style>{`
        @keyframes heroProgress {
          from { width: 0% }
          to   { width: 100% }
        }
      `}</style>
    </section>
  );
}
