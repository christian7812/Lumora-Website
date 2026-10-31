import { useState, useEffect } from "react";
import {
  X,
  CreditCard,
  Smartphone,
  ShieldCheck,
  CheckCircle2,
  Lock,
  ArrowRight,
  Loader2,
} from "lucide-react";

interface PaystackModalProps {
  isOpen: boolean;
  orderId: string;
  total: number;
  email: string;
  phone: string;
  reference: string;
  isSandbox?: boolean;
  authorizationUrl?: string | null;
  onSuccess: (reference: string) => void;
  onClose: () => void;
}

type PaymentChannel = "momo" | "card";
type MoMoNetwork = "mtn" | "telecel" | "at";

export default function PaystackModal({
  isOpen,
  orderId: _orderId,
  total,
  email,
  phone: defaultPhone,
  reference,
  isSandbox = true,
  authorizationUrl,
  onSuccess,
  onClose,
}: PaystackModalProps) {
  const [channel, setChannel] = useState<PaymentChannel>("momo");
  const [momoNetwork, setMomoNetwork] = useState<MoMoNetwork>("mtn");
  const [momoNumber, setMomoNumber] = useState(defaultPhone || "");
  const [cardNumber, setCardNumber] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvv, setCardCvv] = useState("");

  const [isProcessing, setIsProcessing] = useState(false);
  const [step, setStep] = useState<"input" | "prompt" | "success">("input");
  const [statusMessage, setStatusMessage] = useState("");

  useEffect(() => {
    if (isOpen) {
      setIsProcessing(false);
      setStep("input");
      setStatusMessage("");
      if (defaultPhone) setMomoNumber(defaultPhone);
    }
  }, [isOpen, defaultPhone]);

  if (!isOpen) return null;

  async function handlePay() {
    setIsProcessing(true);

    if (authorizationUrl && !isSandbox) {
      // Redirect to official Paystack gateway checkout
      window.location.href = authorizationUrl;
      return;
    }

    // Interactive Demo / Sandbox Paystack verification
    setStep("prompt");
    setStatusMessage(
      channel === "momo"
        ? `A prompt has been sent to ${momoNumber}. Authorizing payment...`
        : "Contacting your bank for 3D Secure verification...",
    );

    try {
      // Simulate real-world network approval delay (1.8s)
      await new Promise((r) => setTimeout(r, 1800));

      const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:8000";
      const verifyRes = await fetch(`${apiUrl}/api/payments/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reference }),
      });

      const data = await verifyRes.json().catch(() => ({}));

      if (!verifyRes.ok) {
        throw new Error(data.message || "Payment verification failed.");
      }

      setStep("success");
      setStatusMessage("Payment Confirmed! Updating your order...");

      setTimeout(() => {
        onSuccess(reference);
      }, 1200);
    } catch (err) {
      console.error("Paystack processing error:", err);
      setIsProcessing(false);
      setStep("input");
      alert(err instanceof Error ? err.message : "Payment processing error.");
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={() => !isProcessing && onClose()}
      />

      {/* Modal Dialog */}
      <div className="relative z-10 w-full max-w-md overflow-hidden rounded-3xl bg-white shadow-2xl ring-1 ring-black/5 animate-in fade-in zoom-in-95">
        {/* Header with Paystack branding */}
        <div className="relative border-b border-gray-100 bg-gradient-to-r from-neutral-900 to-black px-6 py-5 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-yellow-400 font-black text-black">
                P
              </div>
              <div>
                <span className="text-xs font-semibold text-yellow-400 uppercase tracking-widest">
                  Secure Checkout
                </span>
                <h3 className="text-base font-bold text-white">
                  Pay with Paystack
                </h3>
              </div>
            </div>

            {!isProcessing && (
              <button
                type="button"
                onClick={onClose}
                aria-label="Close payment modal"
                className="rounded-full p-1 text-gray-400 hover:bg-white/10 hover:text-white"
              >
                <X size={18} />
              </button>
            )}
          </div>

          <div className="mt-4 flex items-baseline justify-between rounded-xl bg-white/10 px-4 py-2.5 backdrop-blur-sm">
            <span className="text-xs text-gray-300">Amount to Pay</span>
            <span className="text-xl font-black text-yellow-400">
              GH₵ {total.toFixed(2)}
            </span>
          </div>

          {isSandbox && (
            <p className="mt-2 text-center text-[11px] text-yellow-300/80">
              ⚡ Paystack Sandbox Mode (Simulation Active)
            </p>
          )}
        </div>

        {/* Content Body */}
        <div className="p-6">
          {step === "input" && (
            <div className="space-y-5">
              {/* Channel Selector: Mobile Money vs Card */}
              <div className="grid grid-cols-2 gap-2.5 rounded-2xl bg-gray-100 p-1.5">
                <button
                  type="button"
                  onClick={() => setChannel("momo")}
                  className={`flex items-center justify-center gap-2 rounded-xl py-2.5 text-xs font-bold transition ${
                    channel === "momo"
                      ? "bg-white text-black shadow-sm ring-1 ring-gray-950/5"
                      : "text-gray-600 hover:text-black"
                  }`}
                >
                  <Smartphone size={16} className="text-yellow-600" />
                  Mobile Money
                </button>

                <button
                  type="button"
                  onClick={() => setChannel("card")}
                  className={`flex items-center justify-center gap-2 rounded-xl py-2.5 text-xs font-bold transition ${
                    channel === "card"
                      ? "bg-white text-black shadow-sm ring-1 ring-gray-950/5"
                      : "text-gray-600 hover:text-black"
                  }`}
                >
                  <CreditCard size={16} className="text-yellow-600" />
                  Bank Card
                </button>
              </div>

              {channel === "momo" ? (
                /* Mobile Money Channel */
                <div className="space-y-4">
                  {/* Network Selector */}
                  <div>
                    <label className="text-xs font-bold text-gray-700">
                      Choose Mobile Network
                    </label>
                    <div className="mt-2 grid grid-cols-3 gap-2">
                      <button
                        type="button"
                        onClick={() => setMomoNetwork("mtn")}
                        className={`rounded-xl border p-2.5 text-center text-xs font-bold transition ${
                          momoNetwork === "mtn"
                            ? "border-yellow-500 bg-yellow-50 text-yellow-950 ring-2 ring-yellow-400"
                            : "border-gray-200 hover:border-gray-300"
                        }`}
                      >
                        <span className="block text-sm">🟡 MTN</span>
                        <span className="text-[10px] text-gray-500">MoMo</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setMomoNetwork("telecel")}
                        className={`rounded-xl border p-2.5 text-center text-xs font-bold transition ${
                          momoNetwork === "telecel"
                            ? "border-red-500 bg-red-50 text-red-950 ring-2 ring-red-400"
                            : "border-gray-200 hover:border-gray-300"
                        }`}
                      >
                        <span className="block text-sm">🔴 Telecel</span>
                        <span className="text-[10px] text-gray-500">Cash</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setMomoNetwork("at")}
                        className={`rounded-xl border p-2.5 text-center text-xs font-bold transition ${
                          momoNetwork === "at"
                            ? "border-blue-500 bg-blue-50 text-blue-950 ring-2 ring-blue-400"
                            : "border-gray-200 hover:border-gray-300"
                        }`}
                      >
                        <span className="block text-sm">🔵 AT</span>
                        <span className="text-[10px] text-gray-500">Money</span>
                      </button>
                    </div>
                  </div>

                  {/* MoMo Number Input */}
                  <div>
                    <label
                      htmlFor="paystack-momo-phone"
                      className="text-xs font-bold text-gray-700"
                    >
                      Mobile Money Number
                    </label>
                    <input
                      id="paystack-momo-phone"
                      type="tel"
                      value={momoNumber}
                      onChange={(e) => setMomoNumber(e.target.value)}
                      placeholder="e.g. 0244123456"
                      required
                      className="mt-1.5 w-full rounded-xl border border-gray-300 px-4 py-3 text-sm font-semibold outline-none transition focus:border-yellow-500 focus:ring-2 focus:ring-yellow-400/20"
                    />
                    <p className="mt-1 text-[11px] text-gray-500">
                      Receipt will be sent to {email}
                    </p>
                  </div>
                </div>
              ) : (
                /* Card Payment Channel */
                <div className="space-y-3.5">
                  <div>
                    <label
                      htmlFor="paystack-card-number"
                      className="text-xs font-bold text-gray-700"
                    >
                      Card Number
                    </label>
                    <input
                      id="paystack-card-number"
                      type="text"
                      maxLength={19}
                      value={cardNumber}
                      onChange={(e) => setCardNumber(e.target.value)}
                      placeholder="4000 1234 5678 9010"
                      className="mt-1.5 w-full rounded-xl border border-gray-300 px-4 py-3 text-sm font-semibold outline-none transition focus:border-yellow-500"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label
                        htmlFor="paystack-card-expiry"
                        className="text-xs font-bold text-gray-700"
                      >
                        Valid Thru
                      </label>
                      <input
                        id="paystack-card-expiry"
                        type="text"
                        maxLength={5}
                        value={cardExpiry}
                        onChange={(e) => setCardExpiry(e.target.value)}
                        placeholder="MM/YY"
                        className="mt-1.5 w-full rounded-xl border border-gray-300 px-4 py-3 text-sm font-semibold outline-none transition focus:border-yellow-500"
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="paystack-card-cvv"
                        className="text-xs font-bold text-gray-700"
                      >
                        CVV
                      </label>
                      <input
                        id="paystack-card-cvv"
                        type="password"
                        maxLength={4}
                        value={cardCvv}
                        onChange={(e) => setCardCvv(e.target.value)}
                        placeholder="123"
                        className="mt-1.5 w-full rounded-xl border border-gray-300 px-4 py-3 text-sm font-semibold outline-none transition focus:border-yellow-500"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Pay Button */}
              <button
                type="button"
                onClick={handlePay}
                disabled={isProcessing || (channel === "momo" && !momoNumber.trim())}
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-yellow-400 py-4 text-sm font-black text-black shadow-lg transition hover:bg-yellow-300 disabled:opacity-50"
              >
                <span>Authorize GH₵ {total.toFixed(2)}</span>
                <ArrowRight size={17} />
              </button>
            </div>
          )}

          {step === "prompt" && (
            <div className="py-8 text-center">
              <Loader2
                size={48}
                className="mx-auto animate-spin text-yellow-600"
              />
              <h4 className="mt-5 text-lg font-black text-gray-900">
                Processing Authorization
              </h4>
              <p className="mt-2 text-sm text-gray-600">{statusMessage}</p>
              <div className="mt-6 rounded-2xl bg-yellow-50 p-3 text-xs text-yellow-900">
                Please check your phone if an authorization prompt appears.
              </div>
            </div>
          )}

          {step === "success" && (
            <div className="py-8 text-center">
              <CheckCircle2
                size={54}
                className="mx-auto text-emerald-600 animate-in zoom-in"
              />
              <h4 className="mt-5 text-xl font-black text-emerald-700">
                Payment Confirmed!
              </h4>
              <p className="mt-2 text-sm text-gray-600">{statusMessage}</p>
            </div>
          )}

          {/* Footer Security Badges */}
          <div className="mt-6 flex items-center justify-center gap-4 border-t border-gray-100 pt-4 text-[11px] text-gray-500">
            <span className="flex items-center gap-1 font-medium">
              <Lock size={12} className="text-emerald-600" />
              256-Bit SSL Encrypted
            </span>
            <span className="flex items-center gap-1 font-medium">
              <ShieldCheck size={13} className="text-yellow-600" />
              Paystack PCI-DSS Level 1
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
