import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import LoginForm from "../components/auth/LoginForm";
import RegisterForm from "../components/auth/RegisterForm";

export default function AuthPage() {
  const [isRegistering, setIsRegistering] = useState(false);
  const [searchParams] = useSearchParams();
  const requestedRedirect = searchParams.get("redirect");
  const redirectTo =
    requestedRedirect?.startsWith("/") && !requestedRedirect.startsWith("//")
      ? requestedRedirect
      : "/";

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-100 px-4 py-10">
      <div className="grid w-full max-w-5xl overflow-hidden rounded-2xl bg-white shadow-xl md:grid-cols-2">
        {/* Left branding section */}
        <section className="flex flex-col justify-between bg-black p-8 text-white sm:p-12">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight">
              LUMORA
            </h1>

            <p className="mt-6 text-2xl font-bold leading-snug sm:text-4xl">
              Great style.
              <br />
              Great prices.
              <br />
              Great shopping.
            </p>

            <p className="mt-4 max-w-sm text-sm leading-6 text-gray-300">
              Discover products you love and enjoy a simple, convenient
              shopping experience with Lumora.
            </p>
          </div>

          <p className="mt-10 text-xs text-gray-400">
            Your style. Your choice. Your store.
          </p>
        </section>

        {/* Login and registration section */}
        <section className="flex items-center p-8 sm:p-12">
          <div className="w-full">
            {isRegistering ? (
              <RegisterForm
                onSwitchToLogin={() => setIsRegistering(false)}
                redirectTo={redirectTo}
              />
            ) : (
              <LoginForm
                onSwitchToRegister={() => setIsRegistering(true)}
                redirectTo={redirectTo}
              />
            )}
          </div>
        </section>
      </div>
    </main>
  );
}