import { useEffect, useRef, useState, useCallback } from "react";
import { ArrowRight, ChevronLeft, ChevronRight, ShoppingBag } from "lucide-react";
import { Link } from "react-router-dom";

interface Slide {
  id: number;
  badge: string;
  heading: string;
  highlight: string;
  sub: string;
  shopLink: string;
  shopLabel: string;
  image: string;
  imageAlt: string;
  overlay: string;
  accentColor: string;
  badgeBg: string;
  badgeText: string;
  btnBg: string;
  btnText: string;
  btnHover: string;
}

const SLIDES: Slide[] = [
  {
    id: 0,
    badge: "Welcome to Lumora",
    heading: "Your Style. Your Choice.",
    highlight: "Your Store.",
    sub: "Discover quality products, explore new arrivals, and find something you love — all in one place.",
    shopLink: "/products",
    shopLabel: "Shop Now",
    image: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1400&auto=format&fit=crop&q=80",
    imageAlt: "Fashion and retail shopping store",
    overlay: "from-slate-900/80 via-slate-800/50 to-transparent",
    accentColor: "text-teal-300",
    badgeBg: "bg-teal-400/20 border border-teal-300/40",
    badgeText: "text-teal-200",
    btnBg: "bg-teal-500",
    btnText: "text-white",
    btnHover: "hover:bg-teal-400",
  },
  {
    id: 1,
    badge: "New Arrivals",
    heading: "Fresh Drops. Bold Looks.",
    highlight: "New Season.",
    sub: "Stay ahead of the trend with our latest collection — curated for the modern shopper.",
    shopLink: "/products?category=Fashion",
    shopLabel: "Explore Fashion",
    image: "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=1400&auto=format&fit=crop&q=80",
    imageAlt: "Fashion clothing collection",
    overlay: "from-stone-900/85 via-stone-800/50 to-transparent",
    accentColor: "text-amber-300",
    badgeBg: "bg-amber-400/20 border border-amber-300/40",
    badgeText: "text-amber-200",
    btnBg: "bg-amber-500",
    btnText: "text-white",
    btnHover: "hover:bg-amber-400",
  },
  {
    id: 2,
    badge: "Best Sellers",
    heading: "Top Picks. Loved by All.",
    highlight: "Shop Bestsellers.",
    sub: "From electronics to home & living — our best-selling products are waiting for you.",
    shopLink: "/products",
    shopLabel: "See Best Sellers",
    image: "https://images.unsplash.com/photo-1498049794561-7780e7231661?w=1400&auto=format&fit=crop&q=80",
    imageAlt: "Electronics and gadgets collection",
    overlay: "from-indigo-900/85 via-indigo-800/50 to-transparent",
    accentColor: "text-indigo-200",
    badgeBg: "bg-indigo-400/20 border border-indigo-300/40",
    badgeText: "text-indigo-200",
    btnBg: "bg-indigo-500",
    btnText: "text-white",
    btnHover: "hover:bg-indigo-400",
  },
  {
    id: 3,
    badge: "Special Deals",
    heading: "Big Savings. Every Day.",
    highlight: "Deals You'll Love.",
    sub: "Unlock amazing discounts on hundreds of products. Don't miss out on our limited-time offers.",
    shopLink: "/products",
    shopLabel: "Grab Deals",
    image: "https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=1400&auto=format&fit=crop&q=80",
    imageAlt: "Shopping bags and sale items",
    overlay: "from-rose-900/85 via-rose-800/50 to-transparent",
    accentColor: "text-rose-200",
    badgeBg: "bg-rose-400/20 border border-rose-300/40",
    badgeText: "text-rose-200",
    btnBg: "bg-rose-500",
    btnText: "text-white",
    btnHover: "hover:bg-rose-400",
  },
  {
    id: 4,
    badge: "Home & Living",
    heading: "Comfort Meets Style.",
    highlight: "For Your Home.",
    sub: "Transform your living space with our curated home & lifestyle collection, delivered to you.",
    shopLink: "/products?category=Home%20%26%20Living",
    shopLabel: "Shop Home & Living",
    image: "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=1400&auto=format&fit=crop&q=80",
    imageAlt: "Home and living products",
    overlay: "from-emerald-900/80 via-emerald-800/50 to-transparent",
    accentColor: "text-emerald-200",
    badgeBg: "bg-emerald-400/20 border border-emerald-300/40",
    badgeText: "text-emerald-200",
    btnBg: "bg-emerald-500",
    btnText: "text-white",
    btnHover: "hover:bg-emerald-400",
  },
  {
    id: 5,
    badge: "Electronics",
    heading: "Tech That Moves You.",
    highlight: "Next-Gen Gadgets.",
    sub: "Explore the latest phones, accessories and smart devices at unbeatable prices.",
    shopLink: "/products?category=Electronics",
    shopLabel: "Shop Electronics",
    image: "https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=1400&auto=format&fit=crop&q=80",
    imageAlt: "Electronics and tech gadgets",
    overlay: "from-sky-900/85 via-sky-800/50 to-transparent",
    accentColor: "text-sky-200",
    badgeBg: "bg-sky-400/20 border border-sky-300/40",
    badgeText: "text-sky-200",
    btnBg: "bg-sky-500",
    btnText: "text-white",
    btnHover: "hover:bg-sky-400",
  },
];

const INTERVAL_MS = 6000;

export default function Hero() {
  const [current, setCurrent] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const goTo = useCallback(
    (index: number) => {
      if (isTransitioning) return;
      setIsTransitioning(true);
      setCurrent((index + SLIDES.length) % SLIDES.length);
      setTimeout(() => setIsTransitioning(false), 700);
    },
    [isTransitioning],
  );

  const next = useCallback(() => goTo(current + 1), [current, goTo]);
  const prev = useCallback(() => goTo(current - 1), [current, goTo]);

  useEffect(() => {
    if (isPaused) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }
    timerRef.current = setInterval(next, INTERVAL_MS);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [next, isPaused]);

  const s = SLIDES[current];

  return (
    <section
      className="relative w-full overflow-hidden"
      style={{ height: "clamp(480px, 75vh, 720px)" }}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      aria-roledescription="carousel"
      aria-label="Featured promotions"
    >
      {/* Full-width background images */}
      {SLIDES.map((slide, i) => (
        <div
          key={slide.id}
          aria-hidden={i !== current}
          className="absolute inset-0 transition-opacity duration-700"
          style={{ opacity: i === current ? 1 : 0, zIndex: i === current ? 1 : 0 }}
        >
          <img
            src={slide.image}
            alt={slide.imageAlt}
            className="h-full w-full object-cover object-center"
            loading={i === 0 ? "eager" : "lazy"}
          />
          {/* gradient overlay */}
          <div className={`absolute inset-0 bg-gradient-to-r ${slide.overlay}`} />
        </div>
      ))}

      {/* Content */}
      <div className="relative z-10 flex h-full items-center">
        <div className="mx-auto w-full max-w-7xl px-6 sm:px-10 lg:px-16">
          <div
            className="max-w-xl transition-all duration-700"
            style={{ opacity: isTransitioning ? 0 : 1, transform: isTransitioning ? "translateY(16px)" : "translateY(0)" }}
          >
            {/* Badge */}
            <span className={`inline-block rounded-full px-3.5 py-1 text-xs font-bold uppercase tracking-widest backdrop-blur-sm ${s.badgeBg} ${s.badgeText}`}>
              {s.badge}
            </span>

            {/* Heading */}
            <h1 className="mt-4 text-4xl font-black leading-tight tracking-tight text-white sm:text-5xl lg:text-6xl">
              {s.heading}{" "}
              <span className={s.accentColor}>{s.highlight}</span>
            </h1>

            {/* Sub */}
            <p className="mt-4 text-base text-white/80 leading-relaxed sm:text-lg max-w-md">
              {s.sub}
            </p>

            {/* Buttons */}
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                to={s.shopLink}
                className={`inline-flex items-center gap-2 rounded-xl px-6 py-3.5 text-sm font-bold shadow-lg transition ${s.btnBg} ${s.btnText} ${s.btnHover}`}
              >
                {s.shopLabel}
                <ArrowRight size={18} />
              </Link>
              <a
                href="#featured-products"
                className="inline-flex items-center gap-2 rounded-xl border border-white/30 px-6 py-3.5 text-sm font-bold text-white backdrop-blur-sm transition hover:bg-white/10"
              >
                <ShoppingBag size={18} />
                Explore Products
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Prev / Next buttons */}
      <button
        type="button"
        onClick={prev}
        aria-label="Previous slide"
        className="absolute left-4 top-1/2 z-20 -translate-y-1/2 rounded-full bg-black/25 p-2.5 text-white backdrop-blur-sm transition hover:bg-black/50 sm:left-6 sm:p-3"
      >
        <ChevronLeft size={22} />
      </button>
      <button
        type="button"
        onClick={next}
        aria-label="Next slide"
        className="absolute right-4 top-1/2 z-20 -translate-y-1/2 rounded-full bg-black/25 p-2.5 text-white backdrop-blur-sm transition hover:bg-black/50 sm:right-6 sm:p-3"
      >
        <ChevronRight size={22} />
      </button>

      {/* Slide count & dots */}
      <div className="absolute bottom-5 left-1/2 z-20 flex -translate-x-1/2 items-center gap-2" role="tablist" aria-label="Slide indicators">
        {SLIDES.map((sl, i) => (
          <button
            key={sl.id}
            type="button"
            role="tab"
            aria-selected={i === current}
            aria-label={`Go to slide ${i + 1}`}
            onClick={() => goTo(i)}
            className={`rounded-full transition-all duration-300 ${
              i === current ? "w-8 h-2.5 bg-white" : "w-2.5 h-2.5 bg-white/40 hover:bg-white/70"
            }`}
          />
        ))}
      </div>

      {/* Progress bar */}
      {!isPaused && (
        <div className="absolute bottom-0 left-0 z-20 h-0.5 w-full overflow-hidden bg-white/10">
          <div
            key={`${current}-progress`}
            className="h-full bg-white/50"
            style={{ animation: `heroProgress ${INTERVAL_MS}ms linear forwards` }}
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
