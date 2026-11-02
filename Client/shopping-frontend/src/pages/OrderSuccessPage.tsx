import { useEffect, useState } from "react";
import { Link, useLocation, useSearchParams } from "react-router-dom";
import {
  Check,
  PackageCheck,
  ShieldCheck,
  Clock,
  Truck,
  Copy,
  CheckCheck,
  RotateCcw,
  ShoppingBag,
  ReceiptText,
} from "lucide-react";
import Navbar from "../components/layout/Navbar";
import Footer from "../components/layout/Footer";
import { useCart } from "../contexts/CartContext";

interface OrderConfirmation {
  orderId?: string;
  total?: string | number;
  paymentMethod?: string;
  paymentReference?: string;
  paymentStatus?: "unpaid" | "paid" | "refunded";
  customerName?: string;
}

interface PaymentVerification {
  success?: boolean;
  message?: string;
  orderId?: string;
  reference?: string;
  paymentStatus?: "unpaid" | "paid" | "refunded";
  total?: string | number;
  customerName?: string;
  customerEmail?: string;
  paymentMethod?: string;
}

export default function OrderSuccessPage() {
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { clearCart } = useCart();

  const confirmation = location.state as OrderConfirmation | null;
  const reference =
    searchParams.get("reference") || searchParams.get("trxref");
  const callbackOrderId = searchParams.get("orderId");

  const [verifiedPayment, setVerifiedPayment] =
    useState<PaymentVerification | null>(null);
  const [isVerifyingPayment, setIsVerifyingPayment] = useState(Boolean(reference));
  const [verificationError, setVerificationError] = useState("");
  const [copiedOrderId, setCopiedOrderId] = useState(false);
  const [copiedRef, setCopiedRef] = useState(false);

  // Automatically clear cart once an order has been successfully placed or reached this page
  useEffect(() => {
    clearCart();
  }, [clearCart]);

  const verifyPayment = (ref: string, ordId?: string | null) => {
    setIsVerifyingPayment(true);
    setVerificationError("");

    const apiUrl = import.meta.env.VITE_API_URL || "https://lumora-server-kwev.onrender.com";

    fetch(`${apiUrl}/api/payments/verify`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        reference: ref,
        ...(ordId ? { orderId: ordId } : {}),
      }),
    })
      .then(async (response) => {
        const result: PaymentVerification = await response
          .json()
          .catch(() => ({}));
        if (!response.ok || !result.success || result.paymentStatus !== "paid") {
          throw new Error(result.message || "Could not verify your payment with Paystack.");
        }
        setVerifiedPayment(result);
      })
      .catch((error: unknown) => {
        setVerificationError(
          error instanceof Error
            ? error.message
            : "Could not verify your payment.",
        );
      })
      .finally(() => {
        setIsVerifyingPayment(false);
      });
  };

  useEffect(() => {
    if (!reference) return;
    verifyPayment(reference, callbackOrderId);
  }, [reference, callbackOrderId]);

  const isPaid =
    confirmation?.paymentStatus === "paid" ||
    verifiedPayment?.paymentStatus === "paid";

  const isCod =
    confirmation?.paymentMethod?.toLowerCase().replaceAll(" ", "_") ===
    "cash_on_delivery";

  const orderId =
    verifiedPayment?.orderId || confirmation?.orderId || callbackOrderId;

  const paymentReference =
    verifiedPayment?.reference || confirmation?.paymentReference || reference;

  const total = verifiedPayment?.total ?? confirmation?.total;

  const copyText = (text: string, type: "order" | "ref") => {
    if (!navigator?.clipboard) return;
    navigator.clipboard.writeText(text);
    if (type === "order") {
      setCopiedOrderId(true);
      setTimeout(() => setCopiedOrderId(false), 2000);
    } else {
      setCopiedRef(true);
      setTimeout(() => setCopiedRef(false), 2000);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-between">
      <Navbar />

      <main className="mx-auto flex max-w-3xl flex-col items-center px-4 py-12 text-center sm:px-6 lg:py-16 flex-1">
        {/* Animated Celebration Icon */}
        <div className="relative mb-6 flex h-24 w-24 items-center justify-center rounded-3xl bg-emerald-100 text-emerald-700 shadow-md ring-8 ring-emerald-50">
          <PackageCheck size={48} strokeWidth={1.8} className="animate-in zoom-in duration-300" />
          <span className="absolute -right-2 -top-2 flex h-9 w-9 items-center justify-center rounded-full border-4 border-gray-50 bg-emerald-600 text-white shadow">
            <Check size={18} strokeWidth={3} />
          </span>
        </div>

        <p className="text-xs font-bold uppercase tracking-widest text-yellow-600">
          Lumora Store GH
        </p>
        <h1 className="mt-2 text-3xl font-black tracking-tight text-gray-900 sm:text-4xl">
          Thank you for your order!
        </h1>

        {/* Verification in Progress State */}
        {isVerifyingPayment && (
          <div className="mt-4 flex items-center justify-center gap-2 rounded-2xl bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-900 border border-amber-200 animate-pulse">
            <Clock size={18} className="animate-spin text-amber-600" />
            <span>Detecting and verifying your payment with Paystack…</span>
          </div>
        )}

        {/* Verification Error with Retry */}
        {verificationError && (
          <div className="mt-4 w-full max-w-lg rounded-2xl border border-red-200 bg-red-50 p-4 text-left shadow-sm">
            <p className="text-xs font-bold uppercase tracking-wider text-red-600">
              Payment Verification Notice
            </p>
            <p className="mt-1 text-sm font-medium text-red-900">
              {verificationError}
            </p>
            {reference && (
              <button
                type="button"
                onClick={() => verifyPayment(reference, callbackOrderId)}
                className="mt-3 inline-flex items-center gap-1.5 rounded-xl bg-red-600 px-3.5 py-1.5 text-xs font-bold text-white shadow-sm transition hover:bg-red-700"
              >
                <RotateCcw size={14} />
                <span>Retry Payment Verification</span>
              </button>
            )}
          </div>
        )}

        {/* Status Callout */}
        {isPaid ? (
          <div className="mt-4 max-w-xl space-y-2">
            <div className="inline-flex items-center gap-2 rounded-full bg-emerald-100 px-4 py-1.5 text-xs font-black uppercase tracking-wider text-emerald-800 border border-emerald-300 shadow-sm">
              <ShieldCheck size={16} className="text-emerald-700" />
              <span>Payment Detected & Confirmed Paid</span>
            </div>
            <p className="text-sm text-gray-600">
              Your payment has been successfully recorded. Our fulfillment team has received your order and is preparing it for dispatch.
            </p>
          </div>
        ) : isCod ? (
          <div className="mt-4 max-w-xl space-y-2">
            <div className="inline-flex items-center gap-2 rounded-full bg-amber-100 px-4 py-1.5 text-xs font-black uppercase tracking-wider text-amber-800 border border-amber-300 shadow-sm">
              <Clock size={16} className="text-amber-700" />
              <span>Cash on Delivery Placed</span>
            </div>
            <p className="text-sm text-gray-600">
              Your order has been placed. Our courier will call you before delivery to confirm your location. Please have the exact cash amount ready upon delivery.
            </p>
          </div>
        ) : (
          !isVerifyingPayment && (
            <p className="mt-4 max-w-xl text-sm text-gray-600">
              Your order has been received. We’ll prepare it for delivery and contact you with updates.
            </p>
          )
        )}

        {/* Quick Highlights Strip */}
        <div className="mt-8 grid w-full max-w-lg grid-cols-2 gap-3 text-left">
          <div className="flex items-center gap-3 rounded-2xl border border-gray-200/80 bg-white p-3.5 shadow-sm">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-yellow-50 text-yellow-700">
              <Truck size={20} />
            </div>
            <div>
              <p className="text-xs font-bold text-gray-900">Fast Delivery</p>
              <p className="text-[11px] text-gray-500">24 – 48 Hours Across Ghana</p>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-2xl border border-gray-200/80 bg-white p-3.5 shadow-sm">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
              <ShieldCheck size={20} />
            </div>
            <div>
              <p className="text-xs font-bold text-gray-900">Buyer Protection</p>
              <p className="text-[11px] text-gray-500">100% Genuine Guaranteed</p>
            </div>
          </div>
        </div>

        {/* Order Details Card */}
        {orderId && (
          <section
            aria-label="Order details"
            className="mt-6 w-full max-w-xl rounded-3xl border border-gray-200/80 bg-white p-6 text-left shadow-md sm:p-8"
          >
            <div className="flex items-center justify-between border-b border-gray-100 pb-4">
              <h2 className="text-lg font-black text-gray-900">Order Summary</h2>
              <span
                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-black uppercase tracking-wider ${
                  isPaid
                    ? "bg-emerald-500/15 text-emerald-700 border border-emerald-300"
                    : "bg-amber-500/15 text-amber-700 border border-amber-300"
                }`}
              >
                <span
                  className={`h-2 w-2 rounded-full ${
                    isPaid ? "bg-emerald-600 animate-pulse" : "bg-amber-600"
                  }`}
                />
                {isPaid ? "Paid" : "Pending Payment"}
              </span>
            </div>

            <dl className="mt-5 space-y-4 text-sm">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <dt className="text-gray-500 font-medium">Order ID</dt>
                <dd className="flex items-center gap-2">
                  <span className="break-all font-mono font-bold text-gray-900 text-xs sm:text-sm">
                    {orderId}
                  </span>
                  <button
                    type="button"
                    onClick={() => copyText(orderId, "order")}
                    title="Copy Order ID"
                    className="rounded-md p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
                  >
                    {copiedOrderId ? (
                      <CheckCheck size={14} className="text-emerald-600" />
                    ) : (
                      <Copy size={14} />
                    )}
                  </button>
                </dd>
              </div>

              {paymentReference && (
                <div className="flex flex-wrap items-center justify-between gap-2 border-t border-gray-100 pt-3">
                  <dt className="text-gray-500 font-medium">Payment Reference</dt>
                  <dd className="flex items-center gap-2">
                    <span className="break-all font-mono text-xs text-gray-700">
                      {paymentReference}
                    </span>
                    <button
                      type="button"
                      onClick={() => copyText(paymentReference, "ref")}
                      title="Copy Reference"
                      className="rounded-md p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
                    >
                      {copiedRef ? (
                        <CheckCheck size={14} className="text-emerald-600" />
                      ) : (
                        <Copy size={14} />
                      )}
                    </button>
                  </dd>
                </div>
              )}

              {total !== undefined && total !== "" && (
                <div className="flex justify-between gap-2 border-t border-gray-100 pt-3">
                  <dt className="text-gray-500 font-medium">
                    {isPaid ? "Total Paid" : "Order Total"}
                  </dt>
                  <dd className="text-base font-black text-gray-900">
                    GH₵ {Number(total).toFixed(2)}
                  </dd>
                </div>
              )}

              {(confirmation?.paymentMethod || verifiedPayment) && (
                <div className="flex justify-between gap-2 border-t border-gray-100 pt-3">
                  <dt className="text-gray-500 font-medium">Payment Channel</dt>
                  <dd className="font-semibold text-gray-900">
                    {verifiedPayment ||
                    confirmation?.paymentMethod === "paystack" ||
                    confirmation?.paymentMethod?.startsWith("paystack")
                      ? "Paystack (MoMo / Card)"
                      : confirmation?.paymentMethod === "cash_on_delivery"
                      ? "Cash on Delivery"
                      : confirmation?.paymentMethod?.replace("_", " ")}
                  </dd>
                </div>
              )}
            </dl>
          </section>
        )}

        {!orderId && !isVerifyingPayment && (
          <p className="mt-6 rounded-2xl bg-amber-50 px-4 py-3 text-sm text-amber-900 border border-amber-200">
            Order submitted successfully. Check your account orders page for tracking.
          </p>
        )}

        {/* Action Buttons */}
        <div className="mt-8 flex w-full max-w-md flex-col gap-3 sm:flex-row sm:justify-center">
          <Link
            to="/account/orders"
            className="flex items-center justify-center gap-2 rounded-2xl bg-slate-800 px-6 py-3.5 text-xs font-bold text-white shadow-md transition hover:bg-slate-700"
          >
            <ReceiptText size={16} />
            <span>View My Orders</span>
          </Link>
          <Link
            to="/products"
            className="flex items-center justify-center gap-2 rounded-2xl bg-teal-500 px-6 py-3.5 text-xs font-bold text-white shadow-md transition hover:bg-teal-400"
          >
            <ShoppingBag size={16} />
            <span>Continue Shopping</span>
          </Link>
        </div>
      </main>

      <Footer />
    </div>
  );
}
