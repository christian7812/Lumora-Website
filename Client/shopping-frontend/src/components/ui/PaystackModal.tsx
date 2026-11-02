import { useState } from "react";
import {
  X,
  ShieldCheck,
  CheckCircle2,
  Lock,
  ArrowRight,
  Loader2,
} from "lucide-react";

interface PaystackModalProps {
  isOpen: boolean;
  total: number;
  email: string;
  reference: string;
  isSandbox?: boolean;
  authorizationUrl?: string | null;
  onSuccess: (reference: string) => void;
  onClose: () => void;
}

export default function PaystackModal({
  isOpen,
  total,
  email,
  reference,
  isSandbox = true,
  authorizationUrl,
  onSuccess,
  onClose,
}: PaystackModalProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [step, setStep] = useState<"input" | "prompt" | "success">("input");
  const [statusMessage, setStatusMessage] = useState("");

  if (!isOpen) return null;

  async function handlePay() {
    setIsProcessing(true);

    if (authorizationUrl && !isSandbox) {
      // Redirect to official Paystack gateway checkout
      window.location.href = authorizationUrl;
      return;
    }

    // Sandbox mode simulates completing payment without collecting payment details.
    setStep("prompt");
    setStatusMessage("Completing sandbox payment...");

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
              <div className="rounded-2xl bg-gray-50 p-4 text-center">
                <p className="font-semibold text-gray-900">
                  Choose your payment method on Paystack
                </p>
                <p className="mt-2 text-sm text-gray-600">
                  Your receipt will be sent to {email}.
                </p>
                {isSandbox && (
                  <p className="mt-3 text-xs text-yellow-800">
                    Sandbox mode is active. No live payment will be made.
                  </p>
                )}
              </div>

              <button
                type="button"
                onClick={handlePay}
                disabled={isProcessing}
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-yellow-400 py-4 text-sm font-black text-black shadow-lg transition hover:bg-yellow-300 disabled:opacity-50"
              >
                <span>
                  {isSandbox ? "Simulate Payment" : "Continue to Paystack"}
                </span>
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
                Payment is being verified securely.
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
