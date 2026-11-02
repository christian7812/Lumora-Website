import { useState, type FormEvent } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { ArrowLeft, ShoppingBag, Truck, ShieldCheck } from "lucide-react";
import Navbar from "../components/layout/Navbar";
import Footer from "../components/layout/Footer";
import PaystackModal from "../components/ui/PaystackModal";
import { useCart } from "../contexts/CartContext";
import { authClient } from "../lib/auth-client";
import { API_URL } from "../lib/constants";

export default function CheckoutPage() {
  const { cart, cartTotal, clearCart } = useCart();
  const navigate = useNavigate();
  const { data: session, isPending: isSessionPending } = authClient.useSession();

  const [form, setForm] = useState({
    fullName: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    region: "",
    paymentMethod: "paystack",
  });

  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Paystack modal state
  const [paystackData, setPaystackData] = useState<{
    isOpen: boolean;
    orderId: string;
    total: number;
    email: string;
    phone: string;
    reference: string;
    isSandbox: boolean;
    authorizationUrl?: string | null;
  }>({
    isOpen: false,
    orderId: "",
    total: 0,
    email: "",
    phone: "",
    reference: "",
    isSandbox: true,
  });

  const shipping = 0;
  const total = cartTotal + shipping;

  if (isSessionPending) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gray-50 text-sm text-gray-600">
        Checking your sign-in status...
      </main>
    );
  }

  if (!session) {
    return <Navigate to="/login?redirect=%2Fcheckout" replace />;
  }

  function handleChange(
    event: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >,
  ) {
    setForm({ ...form, [event.target.name]: event.target.value });
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (cart.length === 0) {
      setError("Your cart is empty. Add products before checkout.");
      return;
    }

    setIsSubmitting(true);

    try {
      const apiUrl = API_URL;

      if (form.paymentMethod === "paystack") {
        const configResponse = await fetch(`${apiUrl}/api/payments/config`);
        const config: { isConfigured?: boolean } = await configResponse
          .json()
          .catch(() => ({}));

        if (!configResponse.ok || !config.isConfigured) {
          throw new Error(
            "Paystack is not configured right now. Choose Cash on Delivery or try again later.",
          );
        }
      }

      // 1. Create the order in the database
      const response = await fetch(`${apiUrl}/api/orders`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          items: cart.map((item) => ({
            productId: item.id,
            quantity: item.quantity,
          })),
        }),
      });

      const result: { message?: string; orderId?: string; total?: string } = await response
        .json()
        .catch(() => ({}));

      if (!response.ok || !result.orderId) {
        throw new Error(result.message || "Could not create your order.");
      }

      // 2. If Paystack is chosen, initialize Paystack transaction
      if (form.paymentMethod === "paystack") {
        const initRes = await fetch(`${apiUrl}/api/payments/initialize`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            orderId: result.orderId,
            email: form.email,
            callbackUrl: `${window.location.origin}/order-success?orderId=${encodeURIComponent(result.orderId)}`,
          }),
        });

        const initData: {
          status?: string;
          reference?: string;
          authorization_url?: string;
          isSandbox?: boolean;
          message?: string;
        } = await initRes.json().catch(() => ({}));

        if (
          !initRes.ok ||
          !initData.reference ||
          !initData.authorization_url
        ) {
          throw new Error(initData.message || "Failed to initialize payment.");
        }

        // Open Paystack payment modal / redirect
        setPaystackData({
          isOpen: true,
          orderId: result.orderId,
          total,
          email: form.email,
          phone: form.phone,
          reference: initData.reference,
          isSandbox: Boolean(initData.isSandbox),
          authorizationUrl: initData.authorization_url,
        });
        setIsSubmitting(false);
        return;
      }

      // 3. For Cash on Delivery, finish order immediately
      clearCart();
      navigate("/order-success", {
        state: {
          orderId: result.orderId,
          total: result.total ?? total.toFixed(2),
          paymentMethod: "Cash on Delivery",
          paymentStatus: "unpaid",
        },
        replace: true,
      });
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Could not create your order. Please try again.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  function handlePaymentSuccess(reference: string) {
    setPaystackData((prev) => ({ ...prev, isOpen: false }));
    clearCart();
    navigate("/order-success", {
      state: {
        orderId: paystackData.orderId,
        total: total.toFixed(2),
        paymentMethod: "paystack",
        paymentStatus: "paid",
        paymentReference: reference,
        reference,
      },
      replace: true,
    });
  }

  const inputClass =
    "mt-2 w-full rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none transition focus:border-yellow-400 focus:ring-2 focus:ring-yellow-100";

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <Link
          to="/cart"
          className="mb-6 inline-flex items-center gap-2 text-sm text-gray-600 hover:text-black"
        >
          <ArrowLeft size={16} />
          Back to cart
        </Link>

        <div className="mb-8">
          <p className="text-sm font-bold uppercase tracking-widest text-yellow-600">
            Lumora Store
          </p>
          <h1 className="mt-2 text-3xl font-extrabold text-gray-900 sm:text-4xl">
            Checkout
          </h1>
          <p className="mt-2 text-gray-600">
            Enter your delivery details and choose your preferred payment method.
          </p>
        </div>

        {error && (
          <div
            role="alert"
            className="mb-6 rounded-2xl border border-red-300 bg-red-50 p-4 text-sm font-medium text-red-800"
          >
            {error}
          </div>
        )}

        {cart.length === 0 ? (
          <div className="rounded-3xl bg-white p-10 text-center shadow-sm">
            <ShoppingBag className="mx-auto mb-4 text-gray-400" size={48} />
            <h2 className="text-xl font-bold">Your cart is empty</h2>
            <p className="mt-2 text-gray-600">
              Add some products before proceeding to checkout.
            </p>
            <Link
              to="/products"
              className="mt-6 inline-block rounded-xl bg-yellow-400 px-6 py-3 font-bold text-black hover:bg-yellow-300"
            >
              Browse Products
            </Link>
          </div>
        ) : (
          <div className="grid gap-8 lg:grid-cols-3">
            <form
              onSubmit={handleSubmit}
              className="space-y-8 rounded-3xl bg-white p-6 shadow-sm sm:p-8 lg:col-span-2"
            >
              <section>
                <h2 className="flex items-center gap-2 text-xl font-bold">
                  <Truck size={22} className="text-yellow-600" />
                  Delivery Information
                </h2>

                <div className="mt-6 grid gap-5 sm:grid-cols-2">
                  <label className="block text-sm font-semibold text-gray-700">
                    Full Name
                    <input
                      type="text"
                      name="fullName"
                      value={form.fullName}
                      onChange={handleChange}
                      placeholder="e.g. Ama Mensah"
                      required
                      className={inputClass}
                    />
                  </label>

                  <label className="block text-sm font-semibold text-gray-700">
                    Email Address
                    <input
                      type="email"
                      name="email"
                      value={form.email}
                      onChange={handleChange}
                      placeholder="e.g. ama@example.com"
                      required
                      className={inputClass}
                    />
                  </label>

                  <label className="block text-sm font-semibold text-gray-700">
                    Phone Number
                    <input
                      type="tel"
                      name="phone"
                      value={form.phone}
                      onChange={handleChange}
                      placeholder="e.g. 0244123456"
                      required
                      className={inputClass}
                    />
                  </label>

                  <label className="block text-sm font-semibold text-gray-700">
                    Street Address
                    <input
                      type="text"
                      name="address"
                      value={form.address}
                      onChange={handleChange}
                      placeholder="e.g. 12 Ring Road Central"
                      required
                      className={inputClass}
                    />
                  </label>

                  <label className="block text-sm font-semibold text-gray-700">
                    City / Town
                    <input
                      type="text"
                      name="city"
                      value={form.city}
                      onChange={handleChange}
                      placeholder="e.g. Accra"
                      required
                      className={inputClass}
                    />
                  </label>

                  <label className="block text-sm font-semibold text-gray-700">
                    Region
                    <select
                      name="region"
                      value={form.region}
                      onChange={handleChange}
                      required
                      className={inputClass}
                    >
                      <option value="">Select a region</option>
                      <option value="Greater Accra">Greater Accra</option>
                      <option value="Ashanti">Ashanti</option>
                      <option value="Western">Western</option>
                      <option value="Central">Central</option>
                      <option value="Eastern">Eastern</option>
                      <option value="Volta">Volta</option>
                      <option value="Northern">Northern</option>
                      <option value="Upper East">Upper East</option>
                      <option value="Upper West">Upper West</option>
                      <option value="Oti">Oti</option>
                      <option value="Bono">Bono</option>
                      <option value="Bono East">Bono East</option>
                      <option value="Ahafo">Ahafo</option>
                    </select>
                  </label>
                </div>
              </section>

              {/* Payment Method Section */}
              <section className="border-t border-gray-100 pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">Payment Method</h2>
                    <p className="mt-1 text-sm text-gray-500">
                      Choose how you would prefer to pay.
                    </p>
                  </div>
                  <ShieldCheck size={24} className="text-emerald-600" />
                </div>

                <div className="mt-5 space-y-3.5">
                  {/* Paystack Option (Recommended) */}
                  <label
                    className={`flex cursor-pointer items-start gap-4 rounded-2xl border p-4.5 transition ${
                      form.paymentMethod === "paystack"
                        ? "border-yellow-500 bg-yellow-50/50 ring-2 ring-yellow-400"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="paystack"
                      checked={form.paymentMethod === "paystack"}
                      onChange={handleChange}
                      className="mt-1 accent-yellow-500"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="font-bold text-gray-900">
                          Paystack
                        </span>
                        <span className="rounded-full bg-yellow-400 px-2.5 py-0.5 text-[11px] font-black uppercase tracking-wider text-black">
                          Recommended
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-gray-600">
                        Choose your preferred payment method securely on Paystack.
                      </p>
                    </div>
                  </label>

                  {/* Cash on Delivery Option */}
                  <label
                    className={`flex cursor-pointer items-start gap-4 rounded-2xl border p-4.5 transition ${
                      form.paymentMethod === "cash"
                        ? "border-yellow-500 bg-yellow-50/50 ring-2 ring-yellow-400"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="cash"
                      checked={form.paymentMethod === "cash"}
                      onChange={handleChange}
                      className="mt-1 accent-yellow-500"
                    />
                    <div className="min-w-0 flex-1">
                      <span className="block font-bold text-gray-900">
                        Cash on Delivery
                      </span>
                      <p className="mt-1 text-xs text-gray-600">
                        Pay with physical cash when your package is delivered to your doorstep.
                      </p>
                    </div>
                  </label>
                </div>
              </section>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full rounded-2xl bg-yellow-400 px-6 py-4 font-black text-black shadow-lg transition hover:bg-yellow-300 hover:shadow-xl disabled:opacity-60"
              >
                {isSubmitting
                  ? "Processing Order…"
                  : form.paymentMethod === "paystack"
                  ? `Pay with Paystack · GH₵ ${total.toFixed(2)}`
                  : `Place Order (Cash on Delivery) · GH₵ ${total.toFixed(2)}`}
              </button>
            </form>

            <aside className="h-fit rounded-3xl bg-white p-6 shadow-sm sm:p-7">
              <h2 className="text-xl font-bold">Order Summary</h2>

              <div className="mt-6 space-y-4 max-h-72 overflow-y-auto pr-1">
                {cart.map((item) => (
                  <div key={`${item.id}-${item.selectedSize || "std"}`} className="flex gap-3">
                    <img
                      src={item.image}
                      alt={item.name}
                      className="h-14 w-14 rounded-xl bg-gray-100 object-cover shrink-0"
                    />

                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-bold text-gray-900">{item.name}</p>
                      <p className="text-[11px] text-gray-500">
                        Qty: {item.quantity} {item.selectedSize && `· Size: ${item.selectedSize}`}
                      </p>
                      <p className="mt-1 text-xs font-black text-gray-900">
                        GH₵ {(item.price * item.quantity).toFixed(2)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6 space-y-3 border-t border-gray-100 pt-5 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="font-semibold">GH₵ {cartTotal.toFixed(2)}</span>
                </div>

                <div className="flex justify-between">
                  <span className="text-gray-600">Shipping</span>
                  <span className="font-semibold">Free</span>
                </div>

                <p className="text-xs text-emerald-700 font-medium">
                  ✓ Free delivery on every order.
                </p>

                <div className="flex justify-between border-t border-gray-100 pt-4 text-xl font-black">
                  <span>Total</span>
                  <span className="text-yellow-600">GH₵ {total.toFixed(2)}</span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => navigate("/cart")}
                className="mt-6 w-full rounded-xl border border-gray-300 py-3 text-xs font-bold text-gray-800 transition hover:bg-gray-100"
              >
                Edit Shopping Cart
              </button>
            </aside>
          </div>
        )}
      </main>

      {/* Paystack Payment Modal */}
      <PaystackModal
        isOpen={paystackData.isOpen}
        total={paystackData.total}
        email={paystackData.email}
        reference={paystackData.reference}
        isSandbox={paystackData.isSandbox}
        authorizationUrl={paystackData.authorizationUrl}
        onSuccess={handlePaymentSuccess}
        onClose={() => setPaystackData((prev) => ({ ...prev, isOpen: false }))}
      />

      <Footer />
    </div>
  );
}
