import { useEffect, useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import Navbar from "../components/layout/Navbar";
import Footer from "../components/layout/Footer";
import { authClient } from "../lib/auth-client";
import ProfileModal from "../components/ui/ProfileModal";
import {
  Package,
  ShoppingBag,
  Clock,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
  Sparkles,
  ChevronRight,
  Receipt,
  Truck,
  CreditCard,
} from "lucide-react";

interface OrderItem {
  id: string;
  productName: string;
  quantity: number;
  price: string | number;
}

interface Order {
  id: string;
  fullName: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  region?: string;
  total: string | number;
  subtotal?: string | number;
  shipping?: string | number;
  status: string;
  paymentStatus: string;
  paymentMethod: string;
  createdAt: string;
  items?: OrderItem[];
}

export default function AccountOrdersPage() {
  const { id } = useParams();
  const location = useLocation();
  const [orders, setOrders] = useState<Order[]>([]);
  const [order, setOrder] = useState<Order | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const { data: session } = authClient.useSession();
  const user = (
    session as {
      user?: { name?: string; email?: string; image?: string };
    } | null
  )?.user;

  const initials = user?.name
    ? user.name
        .split(" ")
        .filter(Boolean)
        .map((p) => p[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "CU";

  useEffect(() => {
    const controller = new AbortController();
    const base = import.meta.env.VITE_API_URL || "http://localhost:8000";

    setLoading(true);
    setError("");

    fetch(
      `${base}/api/account/orders${id ? `/${encodeURIComponent(id)}` : ""}`,
      {
        credentials: "include",
        signal: controller.signal,
      },
    )
      .then(async (response) => {
        const data: Order | Order[] | { message?: string } = await response
          .json()
          .catch(() => ({}));
        if (!response.ok)
          throw new Error(
            "message" in data && typeof data.message === "string"
              ? data.message
              : "Could not load your orders.",
          );
        if (id) {
          setOrder(data as Order);
        } else {
          setOrders(data as Order[]);
        }
      })
      .catch((reason: unknown) => {
        if (!controller.signal.aborted) {
          setError(
            reason instanceof Error
              ? reason.message
              : "Could not load your orders.",
          );
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, [id]);

  const totalSpent = orders
    .filter((o) => o.paymentStatus === "paid")
    .reduce((sum, o) => sum + Number(o.total || 0), 0);

  const filteredOrders = orders.filter((o) => {
    if (statusFilter === "all") return true;
    if (statusFilter === "paid") return o.paymentStatus === "paid";
    if (statusFilter === "pending")
      return o.status === "pending" || o.paymentStatus === "unpaid";
    if (statusFilter === "delivered") return o.status === "delivered";
    return true;
  });

  return (
    <div className="min-h-screen bg-gray-50/70 flex flex-col justify-between">
      <Navbar />

      <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Customer Profile Banner */}
        <div className="relative mb-8 overflow-hidden rounded-3xl bg-gradient-to-r from-gray-950 via-gray-900 to-black p-6 sm:p-8 text-white shadow-xl">
          <div className="absolute right-0 top-0 -mt-10 -mr-10 h-64 w-64 rounded-full bg-yellow-400/10 blur-3xl" />

          <div className="relative flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4 sm:gap-6">
              {/* Avatar */}
              <div className="relative">
                <div className="flex h-16 w-16 sm:h-20 sm:w-20 items-center justify-center overflow-hidden rounded-full border-2 border-yellow-400 bg-gradient-to-tr from-yellow-400 to-amber-500 font-black text-black shadow-lg ring-4 ring-yellow-400/30">
                  {user?.image ? (
                    <img
                      src={user.image}
                      alt={user.name || "Customer avatar"}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <span className="text-xl sm:text-2xl font-black">
                      {initials}
                    </span>
                  )}
                </div>
                <span className="absolute bottom-1 right-1 h-4 w-4 rounded-full bg-emerald-500 ring-2 ring-black" />
              </div>

              <div>
                <h1 className="text-xl font-black sm:text-2xl">
                  {user?.name || "Lumora Customer"}
                </h1>
                <p className="mt-1 text-xs sm:text-sm text-gray-400">
                  {user?.email || "Signed in customer"}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setProfileModalOpen(true)}
              className="inline-flex items-center gap-2 rounded-2xl bg-white/10 px-5 py-2.5 text-xs font-bold text-white backdrop-blur-md transition hover:bg-yellow-400 hover:text-black"
            >
              <Sparkles size={16} />
              <span>Customize Avatar & Profile</span>
            </button>
          </div>

          {/* Quick Metrics */}
          {!id && (
            <div className="relative mt-8 grid grid-cols-2 gap-4 border-t border-white/10 pt-6 sm:grid-cols-3">
              <div>
                <p className="text-xs text-gray-400">Total Orders Placed</p>
                <p className="mt-1 text-xl font-black text-yellow-400">
                  {orders.length}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-400">Total Spent</p>
                <p className="mt-1 text-xl font-black text-yellow-400">
                  GH₵ {totalSpent.toFixed(2)}
                </p>
              </div>
              <div className="col-span-2 sm:col-span-1">
                <p className="text-xs text-gray-400">Account Status</p>
                <p className="mt-1 text-sm font-bold text-emerald-400 flex items-center gap-1.5">
                  <CheckCircle2 size={16} />
                  <span>Active & Verified</span>
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Error Alert */}
        {error && (
          <div
            role="alert"
            className="mb-8 flex items-center justify-between rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
          >
            <div className="flex items-center gap-3">
              <AlertCircle size={20} className="shrink-0 text-red-500" />
              <span>{error}</span>
            </div>
            {error.includes("Sign in") && (
              <Link
                to="/login"
                state={{
                  from: {
                    pathname: location.pathname,
                    search: location.search,
                    hash: location.hash,
                  },
                }}
                className="rounded-xl bg-yellow-400 px-4 py-1.5 text-xs font-bold text-black shadow-sm hover:bg-yellow-500"
              >
                Sign In
              </Link>
            )}
          </div>
        )}

        {/* SINGLE ORDER VIEW */}
        {id && order && (
          <div className="space-y-6">
            <Link
              to="/account/orders"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-gray-600 transition hover:text-black"
            >
              <ArrowLeft size={16} />
              <span>Back to all orders</span>
            </Link>

            <div className="rounded-3xl border border-gray-200/80 bg-white p-6 sm:p-8 shadow-sm">
              <div className="flex flex-col gap-4 border-b border-gray-100 pb-6 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-gray-400">
                    Order Reference
                  </span>
                  <h2 className="mt-0.5 text-lg font-black text-gray-900 font-mono">
                    {order.id}
                  </h2>
                  <p className="mt-1 text-xs text-gray-500 flex items-center gap-1.5">
                    <Clock size={13} />
                    <span>
                      Placed on{" "}
                      {new Date(order.createdAt).toLocaleDateString(undefined, {
                        month: "long",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </span>
                  </p>
                  <div className="mt-3 flex flex-wrap gap-4 text-xs text-gray-600">
                    <span className="flex items-center gap-1.5">
                      <CreditCard size={14} className="text-yellow-600" />
                      <span className="capitalize">
                        Payment: {order.paymentMethod ? order.paymentMethod.replace("_", " ") : "Card / MoMo"}
                      </span>
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Truck size={14} className="text-yellow-600" />
                      <span>
                        Delivery: {order.city ? `${order.city}, ${order.region || "Ghana"}` : "Standard Express Delivery"}
                      </span>
                    </span>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-bold capitalize ${
                      order.status === "delivered"
                        ? "bg-emerald-100 text-emerald-800"
                        : order.status === "cancelled"
                        ? "bg-red-100 text-red-800"
                        : "bg-amber-100 text-amber-800"
                    }`}
                  >
                    Fulfilment: {order.status}
                  </span>

                  <span
                    className={`rounded-full px-3 py-1 text-xs font-black uppercase ${
                      order.paymentStatus === "paid"
                        ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                        : "bg-amber-50 text-amber-700 border border-amber-200"
                    }`}
                  >
                    Payment:{" "}
                    {order.paymentStatus.charAt(0).toUpperCase() +
                      order.paymentStatus.slice(1)}
                  </span>
                </div>
              </div>

              {/* Items in this order */}
              <div className="mt-6">
                <h3 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <Receipt size={17} className="text-yellow-600" />
                  <span>Items in This Order</span>
                </h3>

                <div className="divide-y divide-gray-100 rounded-2xl border border-gray-100 bg-gray-50/50 p-4">
                  {order.items?.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between py-3 text-sm"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white border border-gray-200 text-gray-600 shadow-sm font-black text-xs">
                          {item.quantity}×
                        </div>
                        <div>
                          <p className="font-bold text-gray-900">
                            {item.productName}
                          </p>
                          <p className="text-xs text-gray-500">
                            GH₵ {Number(item.price).toFixed(2)} each
                          </p>
                        </div>
                      </div>
                      <span className="font-black text-gray-950">
                        GH₵ {(Number(item.price) * item.quantity).toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Order Breakdown / Totals */}
              <div className="mt-6 flex flex-col items-end border-t border-gray-100 pt-6">
                <div className="w-full max-w-xs space-y-2 text-sm">
                  {order.subtotal && (
                    <div className="flex justify-between text-gray-600">
                      <span>Subtotal</span>
                      <span>GH₵ {Number(order.subtotal).toFixed(2)}</span>
                    </div>
                  )}
                  {order.shipping !== undefined && (
                    <div className="flex justify-between text-gray-600">
                      <span>Shipping Delivery</span>
                      <span>
                        {Number(order.shipping) === 0
                          ? "FREE"
                          : `GH₵ ${Number(order.shipping).toFixed(2)}`}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between border-t border-gray-200 pt-2 text-base font-black text-gray-950">
                    <span>
                      {order.paymentStatus === "paid" ? "Total Paid" : "Order Total"}
                    </span>
                    <span className="text-yellow-700">
                      GH₵ {Number(order.total).toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ALL ORDERS LIST */}
        {!id && (
          <div>
            <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-xl font-black text-gray-900 sm:text-2xl">
                  Order History
                </h2>
                <p className="text-xs text-gray-500">
                  Track and inspect details for all your store purchases
                </p>
              </div>

              {/* Status Filter Tabs */}
              <div className="flex items-center gap-1.5 rounded-2xl bg-white p-1 border border-gray-200 shadow-sm">
                {[
                  { label: "All Orders", value: "all" },
                  { label: "Pending", value: "pending" },
                  { label: "Paid", value: "paid" },
                  { label: "Delivered", value: "delivered" },
                ].map((tab) => (
                  <button
                    key={tab.value}
                    type="button"
                    onClick={() => setStatusFilter(tab.value)}
                    className={`rounded-xl px-3 py-1.5 text-xs font-bold transition ${
                      statusFilter === tab.value
                        ? "bg-yellow-400 text-black shadow-sm"
                        : "text-gray-600 hover:text-black"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {loading && (
              <div className="space-y-4">
                {[1, 2, 3].map((n) => (
                  <div
                    key={n}
                    className="h-28 w-full animate-pulse rounded-3xl bg-gray-200"
                  />
                ))}
              </div>
            )}

            {!loading && filteredOrders.length > 0 && (
              <div className="space-y-4">
                {filteredOrders.map((item) => (
                  <Link
                    key={item.id}
                    to={`/account/orders/${item.id}`}
                    className="group block rounded-3xl border border-gray-200/80 bg-white p-5 sm:p-6 shadow-sm transition hover:border-yellow-400 hover:shadow-md"
                  >
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex items-start gap-4">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-yellow-100 text-yellow-800 transition group-hover:bg-yellow-400 group-hover:text-black">
                          <Package size={22} />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-black font-mono text-gray-900">
                              Order #{item.id.slice(0, 8)}
                            </span>
                            <span
                              className={`rounded-full px-2 py-0.5 text-[10px] font-black uppercase ${
                                item.paymentStatus === "paid"
                                  ? "bg-emerald-100 text-emerald-800"
                                  : "bg-amber-100 text-amber-800"
                              }`}
                            >
                              {item.paymentStatus}
                            </span>
                          </div>
                          <p className="mt-1 text-xs text-gray-500 flex items-center gap-2">
                            <span>
                              {new Date(item.createdAt).toLocaleDateString(
                                undefined,
                                {
                                  month: "short",
                                  day: "numeric",
                                  year: "numeric",
                                },
                              )}
                            </span>
                            <span>•</span>
                            <span className="capitalize font-semibold text-gray-700">
                              Status: {item.status}
                            </span>
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between sm:justify-end gap-4 border-t border-gray-100 pt-3 sm:border-t-0 sm:pt-0">
                        <div className="text-left sm:text-right">
                          <span className="text-[11px] font-semibold text-gray-400">
                            Total Price
                          </span>
                          <p className="text-base font-black text-gray-900">
                            GH₵ {Number(item.total).toFixed(2)}
                          </p>
                        </div>
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-50 text-gray-400 transition group-hover:bg-yellow-400 group-hover:text-black">
                          <ChevronRight size={18} />
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}

            {!loading && filteredOrders.length === 0 && (
              <div className="rounded-3xl border border-gray-200/80 bg-white p-12 text-center shadow-sm">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-yellow-100 text-yellow-800">
                  <ShoppingBag size={28} />
                </div>
                <h3 className="mt-4 text-lg font-black text-gray-900">
                  No orders found
                </h3>
                <p className="mx-auto mt-2 max-w-sm text-xs text-gray-500">
                  {statusFilter !== "all"
                    ? `No orders match the "${statusFilter}" filter right now.`
                    : "You haven't placed any orders yet. Discover our latest collections and shop with confidence."}
                </p>
                <Link
                  to="/products"
                  className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-yellow-400 px-6 py-3 text-xs font-black text-black shadow-md shadow-yellow-400/20 transition hover:bg-yellow-500"
                >
                  <ShoppingBag size={16} />
                  <span>Start Shopping</span>
                </Link>
              </div>
            )}
          </div>
        )}
      </main>

      <Footer />

      {/* Profile & Avatar Customization Modal */}
      <ProfileModal
        isOpen={profileModalOpen}
        onClose={() => setProfileModalOpen(false)}
        currentUser={user}
      />
    </div>
  );
}
