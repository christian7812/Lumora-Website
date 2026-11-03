import { useEffect, useState } from "react";
import { Link, useLocation, useSearchParams } from "react-router-dom";
import {
  ArrowLeft,
  Check,
  Clock3,
  PackageCheck,
  ReceiptText,
  RotateCcw,
  ShieldCheck,
  ShoppingBag,
} from "lucide-react";
import Navbar from "../components/layout/Navbar";
import Footer from "../components/layout/Footer";
import { API_URL } from "../lib/constants";

interface OrderConfirmation {
  orderId?: string;
  total?: string | number;
  paymentMethod?: string;
  paymentReference?: string;
  reference?: string;
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
  paymentMethod?: string;
  paidAt?: string;
}

function formatPaymentDate(value?: string) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "long",
    timeStyle: "short",
  }).format(date);
}

export default function OrderSuccessPage() {
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const confirmation = location.state as OrderConfirmation | null;
  const reference =
    searchParams.get("reference") ||
    searchParams.get("trxref") ||
    confirmation?.paymentReference ||
    confirmation?.reference;
  const callbackOrderId =
    searchParams.get("orderId") || confirmation?.orderId;

  const [verifiedPayment, setVerifiedPayment] =
    useState<PaymentVerification | null>(null);
  const [verificationError, setVerificationError] = useState("");
  const [verificationAttempt, setVerificationAttempt] = useState(0);

  useEffect(() => {
    if (!reference) return;

    const controller = new AbortController();
    async function verifyPayment() {
      try {
        const response = await fetch(`${API_URL}/api/payments/verify`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            reference,
            ...(callbackOrderId ? { orderId: callbackOrderId } : {}),
          }),
          signal: controller.signal,
        });
        const result: PaymentVerification = await response
          .json()
          .catch(() => ({}));

        if (
          !response.ok ||
          result.success !== true ||
          result.paymentStatus !== "paid"
        ) {
          throw new Error(
            result.message || "We couldn't confirm this payment yet.",
          );
        }

        setVerifiedPayment(result);
        setVerificationError("");
      } catch (error: unknown) {
        if (controller.signal.aborted) return;
        setVerificationError(
          error instanceof Error
            ? error.message
            : "We couldn't confirm this payment yet.",
        );
      }
    }

    void verifyPayment();
    return () => controller.abort();
  }, [callbackOrderId, reference, verificationAttempt]);

  const isPaid =
    verifiedPayment?.success === true &&
    verifiedPayment.paymentStatus === "paid";
  const isVerifying = Boolean(reference) && !isPaid && !verificationError;
  const isCashOnDelivery =
    confirmation?.paymentMethod?.toLowerCase().replaceAll(" ", "_") ===
    "cash_on_delivery";
  const orderId = verifiedPayment?.orderId || callbackOrderId;
  const amount = verifiedPayment?.total ?? confirmation?.total;
  const paymentDate = formatPaymentDate(verifiedPayment?.paidAt);

  function retryVerification() {
    setVerificationError("");
    setVerifiedPayment(null);
    setVerificationAttempt((attempt) => attempt + 1);
  }

  return (
    <div className="flex min-h-screen flex-col bg-[#f7f8f6] text-slate-900">
      <Navbar />

      <main className="flex flex-1 items-center justify-center px-4 py-12 sm:px-6 lg:py-16">
        <div className="w-full max-w-2xl">
          <Link
            to="/products"
            className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition-colors hover:text-slate-900"
          >
            <ArrowLeft size={16} />
            Back to store
          </Link>

          <section className="overflow-hidden rounded-[2rem] border border-slate-200/80 bg-white shadow-[0_24px_70px_-36px_rgba(15,23,42,0.28)]">
            <div className="px-6 pb-8 pt-10 text-center sm:px-12 sm:pb-10 sm:pt-14">
              <div
                className={`mx-auto mb-7 flex h-20 w-20 items-center justify-center rounded-full ${
                  isPaid
                    ? "success-checkmark bg-emerald-50 text-emerald-700 ring-8 ring-emerald-50/70"
                    : isVerifying
                      ? "bg-slate-50 text-slate-400 ring-8 ring-slate-50"
                      : "bg-amber-50 text-amber-700 ring-8 ring-amber-50/70"
                }`}
                aria-hidden="true"
              >
                {isPaid ? (
                  <Check size={42} strokeWidth={2.2} />
                ) : isVerifying ? (
                  <Clock3 size={36} strokeWidth={1.7} />
                ) : (
                  <PackageCheck size={36} strokeWidth={1.7} />
                )}
              </div>

              <p className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-700">
                Lumora · Order update
              </p>
              <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
                {isPaid
                  ? "Payment Successful!"
                  : isVerifying
                    ? "Confirming your payment"
                    : isCashOnDelivery
                      ? "Order Confirmed"
                      : "Payment not confirmed"}
              </h1>

              {isPaid ? (
                <p className="mx-auto mt-4 max-w-md text-base leading-7 text-slate-600">
                  Your payment has been received successfully. Thank you for
                  shopping with Lumora!
                </p>
              ) : isVerifying ? (
                <p className="mx-auto mt-4 max-w-md text-sm leading-6 text-slate-600">
                  We’re securely checking your payment with Paystack. This
                  usually takes just a moment.
                </p>
              ) : isCashOnDelivery ? (
                <p className="mx-auto mt-4 max-w-md text-sm leading-6 text-slate-600">
                  Your order is confirmed. Payment will be collected when your
                  order is delivered.
                </p>
              ) : (
                <div className="mx-auto mt-4 max-w-md">
                  <p role="alert" className="text-sm leading-6 text-rose-700">
                    {verificationError ||
                      "No verified payment details were returned. Your order has not been marked as paid."}
                  </p>
                  {reference && (
                    <button
                      type="button"
                      onClick={retryVerification}
                      className="mt-4 inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 transition-colors hover:border-slate-300 hover:bg-slate-50"
                    >
                      <RotateCcw size={15} />
                      Try verification again
                    </button>
                  )}
                </div>
              )}
            </div>

            {orderId && (
              <div className="mx-5 mb-5 rounded-2xl border border-slate-200 bg-slate-50/70 p-5 sm:mx-8 sm:p-7">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Order number
                    </p>
                    <p className="mt-1 break-all font-mono text-sm font-semibold text-slate-800">
                      {orderId}
                    </p>
                  </div>
                  <span
                    className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold tracking-wide ${
                      isPaid
                        ? "bg-emerald-100 text-emerald-800"
                        : "bg-amber-100 text-amber-800"
                    }`}
                  >
                    {isPaid ? <Check size={14} /> : <Clock3 size={14} />}
                    {isPaid ? "PAID" : "PAYMENT PENDING"}
                  </span>
                </div>

                <dl className="mt-1 divide-y divide-slate-200">
                  <div className="flex items-center justify-between gap-4 py-4">
                    <dt className="text-sm text-slate-500">
                      {isPaid ? "Amount paid" : "Order amount"}
                    </dt>
                    <dd className="text-lg font-semibold tabular-nums text-slate-900">
                      {amount !== undefined
                        ? `GH₵ ${Number(amount).toFixed(2)}`
                        : "—"}
                    </dd>
                  </div>
                  <div className="flex items-center justify-between gap-4 py-4">
                    <dt className="text-sm text-slate-500">Payment method</dt>
                    <dd className="text-sm font-semibold text-slate-800">
                      {isPaid
                        ? "Paystack"
                        : isCashOnDelivery
                          ? "Cash on Delivery"
                          : "Paystack"}
                    </dd>
                  </div>
                  <div className="flex items-center justify-between gap-4 py-4">
                    <dt className="text-sm text-slate-500">Payment status</dt>
                    <dd
                      className={`text-sm font-bold ${
                        isPaid ? "text-emerald-700" : "text-amber-700"
                      }`}
                    >
                      {isPaid ? "PAID" : "PENDING"}
                    </dd>
                  </div>
                  <div className="flex items-center justify-between gap-4 py-4">
                    <dt className="text-sm text-slate-500">Date and time</dt>
                    <dd className="text-right text-sm font-medium text-slate-800">
                      {paymentDate || "Available after payment verification"}
                    </dd>
                  </div>
                </dl>
              </div>
            )}

            <div className="flex flex-col gap-3 px-5 pb-7 sm:flex-row sm:justify-center sm:px-8 sm:pb-9">
              {orderId && (
                <Link
                  to={`/account/orders/${encodeURIComponent(orderId)}`}
                  className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-slate-900 px-6 py-3 text-sm font-semibold text-white shadow-sm transition-all hover:bg-slate-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900"
                >
                  <ReceiptText size={17} />
                  View My Order
                </Link>
              )}
              <Link
                to="/products"
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-6 py-3 text-sm font-semibold text-slate-700 transition-all hover:border-emerald-200 hover:bg-emerald-50/60 hover:text-emerald-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700"
              >
                <ShoppingBag size={17} />
                Continue Shopping
              </Link>
            </div>

            <div className="flex items-center justify-center gap-2 border-t border-slate-100 px-5 py-4 text-xs text-slate-500">
              <ShieldCheck size={15} className="text-emerald-700" />
              Secure payment verification by Paystack
            </div>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}
