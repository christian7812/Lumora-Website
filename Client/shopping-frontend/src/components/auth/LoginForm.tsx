import { useState, type SubmitEvent } from "react";
import { useNavigate } from "react-router-dom";
import { authClient } from "../../lib/auth-client";
import AuthInput from "../ui/AuthInput";

interface LoginFormProps {
  onSwitchToRegister: () => void;
  redirectTo: string;
}

export default function LoginForm({
  onSwitchToRegister,
  redirectTo,
}: LoginFormProps) {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const result = await authClient.signIn.email({
        email,
        password,
      });

      if (result.error) {
        setError(result.error.message ?? "Unable to sign in.");
        return;
      }

      navigate(redirectTo, { replace: true });
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">
          Welcome back
        </h2>
        <p className="mt-2 text-sm text-gray-500">
          Sign in to continue shopping with Lumora.
        </p>
      </div>

      {error && (
        <div
          role="alert"
          className="rounded-lg bg-red-50 p-3 text-sm text-red-600"
        >
          {error}
        </div>
      )}

      <AuthInput
        label="Email address"
        name="email"
        type="email"
        placeholder="you@example.com"
        autoComplete="email"
        value={email}
        onChange={(event) => setEmail(event.target.value)}
        required
      />

      <AuthInput
        label="Password"
        name="password"
        type="password"
        placeholder="Enter your password"
        autoComplete="current-password"
        value={password}
        onChange={(event) => setPassword(event.target.value)}
        required
      />

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-lg bg-yellow-400 px-4 py-3 font-semibold text-black transition hover:bg-yellow-500 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {loading ? "Signing in..." : "Sign in"}
      </button>

      <p className="text-center text-sm text-gray-600">
        Don't have an account?{" "}
        <button
          type="button"
          onClick={onSwitchToRegister}
          className="font-semibold text-yellow-700 hover:text-yellow-800"
        >
          Create account
        </button>
      </p>
    </form>
  );
}