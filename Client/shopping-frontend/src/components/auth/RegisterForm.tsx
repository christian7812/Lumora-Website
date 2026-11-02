import { useState, type SubmitEvent } from "react";
import { useNavigate } from "react-router-dom";
import { authClient } from "../../lib/auth-client";
import AuthInput from "../ui/AuthInput";
import { Sparkles, Check } from "lucide-react";
import "./RegisterForm.css";

interface RegisterFormProps {
  onSwitchToLogin: () => void;
  redirectTo: string;
}

const REGISTRATION_AVATARS = [
  {
    id: "preset-1",
    name: "Golden Chic",
    url: "https://api.dicebear.com/7.x/lorelei/svg?seed=GoldenChic&backgroundColor=ffd5dc,ffdfbf",
  },
  {
    id: "preset-2",
    name: "Urban Explorer",
    url: "https://api.dicebear.com/7.x/adventurer/svg?seed=UrbanExplorer&backgroundColor=b6e3f4,c0aede",
  },
  {
    id: "preset-3",
    name: "Cosmic Shopper",
    url: "https://api.dicebear.com/7.x/bottts/svg?seed=CosmicShopper&backgroundColor=d1d4f9,c0aede",
  },
  {
    id: "preset-4",
    name: "Modern Nomad",
    url: "https://api.dicebear.com/7.x/notionists/svg?seed=ModernMinimalist&backgroundColor=ffdfbf,ffd5dc",
  },
];

export default function RegisterForm({
  onSwitchToLogin,
  redirectTo,
}: RegisterFormProps) {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [selectedAvatar, setSelectedAvatar] = useState(REGISTRATION_AVATARS[0].url);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (password.length < 8) {
      setError("Your password must be at least 8 characters long.");
      return;
    }

    setLoading(true);

    try {
      const avatarUrl =
        selectedAvatar ||
        `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(
          name || email || "Lumora",
        )}&backgroundColor=facc15&textColor=000000&fontWeight=700`;

      const result = await authClient.signUp.email({
        name,
        email,
        password,
        image: avatarUrl,
      });

      if (result.error) {
        setError(result.error.message ?? "Unable to create your account.");
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
    <form onSubmit={handleSubmit} className="register-form space-y-4">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">
          Create your account
        </h2>
        <p className="mt-1 text-sm text-gray-500">
          Join Lumora for fast checkout, order tracking, and exclusive deals.
        </p>
      </div>

      {error && (
        <div
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-600 font-medium"
        >
          {error}
        </div>
      )}

      {/* Avatar Picker Preview */}
      <div className="rounded-2xl border border-yellow-200/70 bg-yellow-50/40 p-3.5">
        <label className="mb-2 flex items-center justify-between text-xs font-bold text-gray-800">
          <span className="flex items-center gap-1.5">
            <Sparkles size={14} className="text-yellow-600" />
            <span>Choose Your Avatar</span>
          </span>
          <span className="text-[11px] font-normal text-gray-400">
            Can be changed anytime
          </span>
        </label>
        <div className="flex items-center gap-3">
          {REGISTRATION_AVATARS.map((avatar) => {
            const isSelected = selectedAvatar === avatar.url;
            return (
              <button
                key={avatar.id}
                type="button"
                onClick={() => setSelectedAvatar(avatar.url)}
                className={`relative flex h-12 w-12 items-center justify-center rounded-full transition-transform ${
                  isSelected
                    ? "ring-4 ring-yellow-400 ring-offset-2 scale-105"
                    : "opacity-70 hover:opacity-100 hover:scale-105"
                }`}
                title={avatar.name}
              >
                <img
                  src={avatar.url}
                  alt={avatar.name}
                  className="h-full w-full rounded-full object-cover"
                />
                {isSelected && (
                  <span className="absolute -bottom-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-yellow-400 text-black shadow-sm">
                    <Check size={10} strokeWidth={3} />
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      <AuthInput
        label="Full name"
        name="name"
        type="text"
        placeholder="Enter your full name"
        autoComplete="name"
        value={name}
        onChange={(event) => setName(event.target.value)}
        required
      />

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
        placeholder="At least 8 characters"
        autoComplete="new-password"
        minLength={8}
        value={password}
        onChange={(event) => setPassword(event.target.value)}
        required
      />

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-xl bg-yellow-400 py-3 text-sm font-black text-black shadow-md shadow-yellow-400/20 transition hover:bg-yellow-500 hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-60"
      >
        {loading ? "Creating your account…" : "Create account"}
      </button>

      <p className="text-center text-sm text-gray-600 pt-1">
        Already have an account?{" "}
        <button
          type="button"
          onClick={onSwitchToLogin}
          className="font-bold text-yellow-700 hover:text-yellow-800 underline underline-offset-4"
        >
          Sign in
        </button>
      </p>
    </form>
  );
}
