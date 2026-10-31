import { Link, useLocation } from "react-router-dom";
import { Check, PackageCheck, ShieldCheck, Clock, Truck } from "lucide-react";
import Navbar from "../components/layout/Navbar";
import Footer from "../components/layout/Footer";

interface OrderConfirmation {
  orderId: string;
  total: string;
  paymentMethod?: string;
  paymentReference?: string;
  paymentStatus?: "unpaid" | "paid" | "refunded";
}

export default function OrderSuccessPage() {
  const location = useLocation();
  const confirmation = location.state as OrderConfirmation | null;

  const isPaid =
    confirmation?.paymentStatus === "paid" ||
    confirmation?.paymentMethod === "paystack" ||
    confirmation?.paymentMethod === "paystack (mobile_money)" ||
    confirmation?.paymentMethod === "paystack (card)";

  const isCod = confirmation?.paymentMethod === "cash_on_delivery";

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <main className="mx-auto flex max-w-3xl flex-col items-center px-4 py-14 text-center sm:px-6 lg:py-20">
        <div className="relative mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 shadow-sm">
          <PackageCheck size={40} strokeWidth={1.8} />
          <span className="absolute -right-1 -top-1 flex h-8 w-8 items-center justify-center rounded-full border-4 border-gray-50 bg-emerald-600 text-white shadow-sm">
            <Check size={16} strokeWidth={3} />
          </span>
        </div>

        <p className="text-xs font-bold uppercase tracking-widest text-yellow-600">
          Lumora Store GH
        </p>
        <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-gray-900 sm:text-4xl">
          Thank you for your order!
        </h1>

        {isPaid ? (
          <div className="mt-3 max-w-xl space-y-2">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 border border-emerald-200">
              <ShieldCheck size={14} className="text-emerald-600" />
              Payment Confirmed & Verified via Paystack
            </div>
            <p className="text-gray-600">
              Your payment has been successfully processed. We have received your order and our fulfillment team is preparing it for dispatch right now.
            </p>
          </div>
        ) : isCod ? (
          <div className="mt-3 max-w-xl space-y-2">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-800 border border-amber-200">
              <Clock size={14} className="text-amber-600" />
              Cash on Delivery Selected
            </div>
            <p className="text-gray-600">
              Your order has been placed. Our courier will call you before delivery to confirm your location. Please have the exact cash amount ready upon delivery.
            </p>
          </div>
        ) : (
          <p className="mt-3 max-w-xl text-gray-600">
            Your order has been received. We’ll prepare it for delivery and contact you with any updates.
          </p>
        )}

        {/* Quick Highlights Strip */}
        <div className="mt-8 grid w-full max-w-lg grid-cols-2 gap-3 text-left">
          <div className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white p-3.5 shadow-xs">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-yellow-50 text-yellow-700">
              <Truck size={20} />
            </div>
            <div>
              <p className="text-xs font-bold text-gray-900">Delivery Window</p>
              <p className="text-xs text-gray-500">24 – 48 Hours in Ghana</p>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white p-3.5 shadow-xs">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700">
              <ShieldCheck size={20} />
            </div>
            <div>
              <p className="text-xs font-bold text-gray-900">Buyer Protection</p>
              <p className="text-xs text-gray-500">100% Genuine Guaranteed</p>
            </div>
          </div>
        </div>

        {confirmation?.orderId && (
          <section
            aria-label="Order details"
            className="mt-6 w-full rounded-2xl border border-gray-200 bg-white p-6 text-left shadow-sm sm:p-8"
          >
            <div className="flex items-center justify-between border-b border-gray-100 pb-4">
              <h2 className="text-lg font-bold text-gray-900">Order Summary</h2>
              <span
                className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                  isPaid
                    ? "bg-emerald-100 text-emerald-800"
                    : "bg-amber-100 text-amber-800"
                }`}
              >
                {isPaid ? "Paid" : "Pending Payment"}
              </span>
            </div>

            <dl className="mt-5 space-y-4 text-sm">
              <div className="flex flex-wrap justify-between gap-2">
                <dt className="text-gray-600">Order ID</dt>
                <dd className="break-all font-mono font-semibold text-gray-900">
                  {confirmation.orderId}
                </dd>
              </div>

              {confirmation.paymentReference && (
                <div className="flex flex-wrap justify-between gap-2 border-t border-gray-100 pt-3">
                  <dt className="text-gray-600">Payment Reference</dt>
                  <dd className="break-all font-mono text-xs text-gray-700">
                    {confirmation.paymentReference}
                  </dd>
                </div>
              )}

              {confirmation.total && (
                <div className="flex justify-between gap-2 border-t border-gray-100 pt-3">
                  <dt className="text-gray-600">Amount Charged</dt>
                  <dd className="font-bold text-gray-900">
                    GH₵ {Number(confirmation.total).toFixed(2)}
                  </dd>
                </div>
              )}

              {confirmation.paymentMethod && (
                <div className="flex justify-between gap-2 border-t border-gray-100 pt-3">
                  <dt className="text-gray-600">Payment Channel</dt>
                  <dd className="font-medium capitalize text-gray-900">
                    {confirmation.paymentMethod === "paystack" || confirmation.paymentMethod.startsWith("paystack")
                      ? "Paystack (MoMo / Card)"
                      : confirmation.paymentMethod === "cash_on_delivery"
                      ? "Cash on Delivery"
                      : confirmation.paymentMethod.replace("_", " ")}
                  </dd>
                </div>
              )}
            </dl>
          </section>
        )}

        {!confirmation?.orderId && (
          <p className="mt-6 rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-900">
            Order details aren’t available in this page session. If you just
            placed an order, it was submitted successfully.
          </p>
        )}

        <div className="mt-8 flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
          <Link
            to="/products"
            className="rounded-xl bg-yellow-400 px-6 py-3 font-bold text-black shadow-sm transition hover:bg-yellow-300"
          >
            Continue shopping
          </Link>
          <Link
            to="/"
            className="rounded-xl border border-gray-300 bg-white px-6 py-3 font-semibold text-gray-800 shadow-sm transition hover:bg-gray-50"
          >
            Back to home
          </Link>
        </div>
      </main>

      <Footer />
    </div>
  );
}
