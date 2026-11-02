import { useState, useRef, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  ShoppingBag,
  Heart,
  Search,
  Menu,
  X,
  UserRound,
  LogOut,
  Package,
  ChevronDown,
  Sparkles,
} from "lucide-react";
import { useCart } from "../../contexts/CartContext";
import { useFavorites } from "../../contexts/FavoritesContext";
import { authClient } from "../../lib/auth-client";
import ProfileModal from "../ui/ProfileModal";

export default function Navbar() {
  const { cartCount } = useCart();
  const { favorites } = useFavorites();
  const navigate = useNavigate();
  const location = useLocation();
  const authLinkState = {
    from: {
      pathname: location.pathname,
      search: location.search,
      hash: location.hash,
    },
  };

  const [menuOpen, setMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Better-Auth reactive session hook
  const { data: session } = authClient.useSession();
  const user = (session as { user?: { name?: string; email?: string; image?: string; role?: string } } | null)?.user;

  // Compute initials for avatar fallback (e.g. "John Doe" -> "JD")
  const initials = user?.name
    ? user.name
        .split(" ")
        .filter(Boolean)
        .map((part) => part[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : user?.email
    ? user.email.slice(0, 2).toUpperCase()
    : "U";

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setUserDropdownOpen(false);
      }
    }
    if (userDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [userDropdownOpen]);

  async function handleSignOut() {
    setUserDropdownOpen(false);
    setMenuOpen(false);
    try {
      await (authClient.signOut as () => Promise<unknown>)();
      navigate("/");
      window.location.reload();
    } catch (err) {
      console.error("Sign-out failed:", err);
    }
  }

  return (
    <>
    <header className="sticky top-0 z-40 border-b border-gray-200/80 bg-white/95 backdrop-blur-md">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3.5 sm:px-6 lg:px-8">
        {/* Brand Logo */}
        <Link
          to="/"
          className="flex items-center gap-1.5 text-2xl font-black tracking-tighter text-black transition hover:opacity-90 sm:text-3xl"
        >
          <span>LUMORA</span>
          <span className="flex h-2.5 w-2.5 rounded-full bg-yellow-400 ring-2 ring-yellow-400/40" />
        </Link>

        {/* Desktop Navigation Links */}
        <div className="hidden items-center gap-7 md:flex">
          <Link
            to="/"
            className="text-sm font-bold text-gray-800 transition hover:text-yellow-600"
          >
            Home
          </Link>
          <Link
            to="/products"
            className="text-sm font-bold text-gray-800 transition hover:text-yellow-600"
          >
            Products
          </Link>
          <Link
            to="/categories"
            className="text-sm font-bold text-gray-800 transition hover:text-yellow-600"
          >
            Categories
          </Link>
          <Link
            to="/contact"
            className="text-sm font-bold text-gray-800 transition hover:text-yellow-600"
          >
            Contact
          </Link>
        </div>

        {/* Actions (Search, Cart, User Avatar / Sign In) */}
        <div className="flex items-center gap-2 sm:gap-4">
          <Link
            to="/products"
            aria-label="Search catalog"
            className="hidden rounded-full p-2 text-gray-600 transition hover:bg-gray-100 hover:text-black sm:flex"
          >
            <Search size={20} />
          </Link>

          {/* User Avatar when Signed In */}
          {user ? (
            <div className="relative" ref={dropdownRef}>
              <button
                type="button"
                onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                aria-expanded={userDropdownOpen}
                aria-label="User account menu"
                className="group flex items-center gap-2 rounded-full p-1 transition hover:ring-2 hover:ring-yellow-400"
              >
                {/* Avatar with image or initials */}
                <div className="relative flex h-9 w-9 items-center justify-center overflow-hidden rounded-full bg-gradient-to-tr from-yellow-400 to-amber-500 font-black text-black shadow-sm ring-2 ring-white">
                  {user.image ? (
                    <img
                      src={user.image}
                      alt={user.name || "User avatar"}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <span className="text-xs tracking-wider">{initials}</span>
                  )}
                  {/* Online indicator dot */}
                  <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-white" />
                </div>

                <span className="hidden max-w-[100px] truncate text-xs font-bold text-gray-800 sm:inline-block">
                  {user.name?.split(" ")[0] || "Account"}
                </span>

                <ChevronDown
                  size={14}
                  className={`hidden text-gray-500 transition duration-200 sm:block ${
                    userDropdownOpen ? "rotate-180" : ""
                  }`}
                />
              </button>

              {/* Floating Dropdown Menu */}
              {userDropdownOpen && (
                <div className="absolute right-0 mt-2.5 w-64 origin-top-right rounded-2xl border border-gray-100 bg-white p-2 shadow-2xl ring-1 ring-black/5 animate-in fade-in zoom-in-95">
                  {/* User Profile Header */}
                  <div className="flex items-center gap-3 border-b border-gray-100 px-3 py-3">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-tr from-yellow-400 to-amber-500 text-sm font-black text-black ring-2 ring-yellow-400/50">
                      {user.image ? (
                        <img
                          src={user.image}
                          alt={user.name || "User avatar"}
                          className="h-full w-full rounded-full object-cover"
                        />
                      ) : (
                        initials
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-bold text-gray-900">
                        {user.name || "Lumora Shopper"}
                      </p>
                      <p className="truncate text-xs text-gray-500">
                        {user.email}
                      </p>
                    </div>
                  </div>

                  {/* Menu Links */}
                  <div className="space-y-1 py-1.5 text-sm">
                    <button
                      type="button"
                      onClick={() => {
                        setUserDropdownOpen(false);
                        setProfileModalOpen(true);
                      }}
                      className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 font-semibold text-gray-700 transition hover:bg-yellow-50 hover:text-yellow-800 text-left"
                    >
                      <Sparkles size={17} className="text-yellow-600" />
                      <span>Profile & Avatar</span>
                    </button>

                    <Link
                      to="/account/orders"
                      onClick={() => setUserDropdownOpen(false)}
                      className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 font-semibold text-gray-700 transition hover:bg-yellow-50 hover:text-yellow-800"
                    >
                      <Package size={17} className="text-yellow-600" />
                      <span>My Orders</span>
                    </Link>

                    <Link
                      to="/favorites"
                      onClick={() => setUserDropdownOpen(false)}
                      className="flex items-center justify-between rounded-xl px-3 py-2.5 font-semibold text-gray-700 transition hover:bg-yellow-50 hover:text-yellow-800"
                    >
                      <span className="flex items-center gap-2.5">
                        <Heart size={17} className="text-red-500" />
                        <span>Favorites</span>
                      </span>
                      {favorites.length > 0 && (
                        <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-bold text-red-700">
                          {favorites.length}
                        </span>
                      )}
                    </Link>

                    <Link
                      to="/cart"
                      onClick={() => setUserDropdownOpen(false)}
                      className="flex items-center justify-between rounded-xl px-3 py-2.5 font-semibold text-gray-700 transition hover:bg-yellow-50 hover:text-yellow-800"
                    >
                      <div className="flex items-center gap-2.5">
                        <ShoppingBag size={17} className="text-yellow-600" />
                        <span>Shopping Bag</span>
                      </div>
                      {cartCount > 0 && (
                        <span className="rounded-full bg-yellow-400 px-2 py-0.5 text-xs font-bold text-black">
                          {cartCount}
                        </span>
                      )}
                    </Link>

                  </div>

                  {/* Sign Out Button */}
                  <div className="border-t border-gray-100 pt-1">
                    <button
                      type="button"
                      onClick={() => void handleSignOut()}
                      className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-bold text-red-600 transition hover:bg-red-50"
                    >
                      <LogOut size={17} />
                      <span>Sign Out</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* When Signed Out: Sign In Button */
            <Link
              to="/login"
              state={authLinkState}
              className="inline-flex items-center gap-1.5 rounded-full bg-slate-800 px-4 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-slate-700 sm:text-sm"
            >
              <UserRound size={16} />
              <span>Sign In</span>
            </Link>
          )}

          {/* Cart Icon with reactive quantity pill */}
          <Link
            to="/favorites"
            aria-label={`Favorites, ${favorites.length} saved products`}
            className="relative flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 p-2 text-black transition hover:bg-red-100 hover:text-red-600"
          >
            <Heart size={19} />
            {favorites.length > 0 && (
              <span className="absolute -right-1.5 -top-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-600 px-1.5 text-[11px] font-black text-white shadow-sm">
                {favorites.length}
              </span>
            )}
          </Link>

          <Link
            to="/cart"
            aria-label={`Shopping bag, ${cartCount} items`}
            className="relative flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 p-2 text-black transition hover:bg-yellow-400"
          >
            <ShoppingBag size={19} />
            {cartCount > 0 && (
              <span className="absolute -right-1.5 -top-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-black px-1.5 text-[11px] font-black text-yellow-400 shadow-sm animate-in zoom-in">
                {cartCount}
              </span>
            )}
          </Link>

          {/* Mobile Menu Hamburger */}
          <button
            type="button"
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 text-gray-800 transition hover:bg-gray-200 md:hidden"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            {menuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </nav>

      {/* Mobile Drawer Navigation */}
      {menuOpen && (
        <div className="space-y-4 border-t border-gray-200 bg-white px-5 py-6 shadow-xl md:hidden animate-in slide-in-from-top-2">
          {/* User Card if logged in */}
          {user ? (
            <div className="flex items-center justify-between rounded-2xl bg-gradient-to-r from-yellow-50 to-amber-50 p-4 border border-yellow-200/60">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-yellow-400 text-sm font-black text-black">
                  {user.image ? (
                    <img
                      src={user.image}
                      alt={user.name || "Avatar"}
                      className="h-full w-full rounded-full object-cover"
                    />
                  ) : (
                    initials
                  )}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold text-gray-900">
                    {user.name || "Lumora Customer"}
                  </p>
                  <p className="truncate text-xs text-gray-500">{user.email}</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => void handleSignOut()}
                className="rounded-lg p-2 text-red-600 hover:bg-red-100/50"
                title="Sign Out"
              >
                <LogOut size={18} />
              </button>
            </div>
          ) : (
            <Link
              to="/login"
              state={authLinkState}
              onClick={() => setMenuOpen(false)}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-yellow-400 py-3.5 text-center text-sm font-bold text-black shadow"
            >
              <UserRound size={18} />
              Sign In or Register
            </Link>
          )}

          {/* Links */}
          <div className="space-y-2 text-sm font-bold text-gray-800">
            <Link
              to="/"
              className="flex items-center justify-between rounded-xl p-3 hover:bg-gray-100"
              onClick={() => setMenuOpen(false)}
            >
              <span>Home</span>
            </Link>
            <Link
              to="/products"
              className="flex items-center justify-between rounded-xl p-3 hover:bg-gray-100"
              onClick={() => setMenuOpen(false)}
            >
              <span>All Products</span>
            </Link>
            <Link
              to="/categories"
              className="flex items-center justify-between rounded-xl p-3 hover:bg-gray-100"
              onClick={() => setMenuOpen(false)}
            >
              <span>Categories</span>
            </Link>
            <Link
              to="/contact"
              className="flex items-center justify-between rounded-xl p-3 hover:bg-gray-100"
              onClick={() => setMenuOpen(false)}
            >
              <span>Contact Us</span>
            </Link>
            {user && (
              <>
                <button
                  type="button"
                  className="flex w-full items-center justify-between rounded-xl p-3 text-left font-bold text-gray-800 hover:bg-yellow-50"
                  onClick={() => {
                    setMenuOpen(false);
                    setProfileModalOpen(true);
                  }}
                >
                  <span className="flex items-center gap-2">
                    <Sparkles size={18} className="text-yellow-600" />
                    <span>Profile & Avatar</span>
                  </span>
                </button>
                <Link
                  to="/account/orders"
                  className="flex items-center justify-between rounded-xl p-3 hover:bg-gray-100"
                  onClick={() => setMenuOpen(false)}
                >
                  <span>My Orders</span>
                </Link>
                <Link
                  to="/favorites"
                  className="flex items-center justify-between rounded-xl p-3 hover:bg-gray-100"
                  onClick={() => setMenuOpen(false)}
                >
                  <span className="flex items-center gap-2">
                    <Heart size={18} className="text-red-500" />
                    <span>Favorites ({favorites.length})</span>
                  </span>
                </Link>
              </>
            )}
          </div>
        </div>
      )}

    </header>

    {/* Profile & Avatar Modal — rendered OUTSIDE <header> to escape backdrop-blur stacking context */}
    <ProfileModal
      isOpen={profileModalOpen}
      onClose={() => setProfileModalOpen(false)}
      currentUser={user}
    />
    </>
  );
}
