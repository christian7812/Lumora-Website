/**
 * Shared admin auth context & Refine authProvider
 * Exposes sign-in / sign-out helpers, current user identity,
 * and provides a <RequireAdmin> gate with polished UI.
 */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";
import type { AuthProvider as RefineAuthProvider } from "@refinedev/core";
import { API_URL } from "./constants";
import { Shield, Mail, Lock, Eye, EyeOff, Loader2, AlertCircle } from "lucide-react";

export type AuthState = "checking" | "signed-in" | "signed-out";

export interface AdminUser {
  id: string;
  name: string;
  fullName: string;
  firstName: string;
  lastName: string;
  email: string;
  avatar: string;
  image: string;
  role: string;
  isAdmin: boolean;
}

export interface AuthContextValue {
  authState: AuthState;
  user: AdminUser | null;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
  updateProfile: (data: { name?: string; avatar?: string }) => Promise<AdminUser>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [authState, setAuthState] = useState<AuthState>("checking");
  const [user, setUser] = useState<AdminUser | null>(null);

  const fetchCurrentUser = useCallback(async (signal?: AbortSignal) => {
    try {
      const response = await fetch(`${API_URL}/auth/me`, {
        credentials: "include",
        signal,
      });

      if (response.ok) {
        const userData: AdminUser = await response.json();
        setUser(userData);
        setAuthState("signed-in");
        return userData;
      } else {
        setUser(null);
        setAuthState("signed-out");
        return null;
      }
    } catch {
      if (!signal?.aborted) {
        setUser(null);
        setAuthState("signed-out");
      }
      return null;
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    fetchCurrentUser(controller.signal);
    return () => controller.abort();
  }, [fetchCurrentUser]);

  const signIn = useCallback(
    async (email: string, password: string) => {
      const response = await fetch(`${API_URL}/auth/sign-in/email`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const body: { message?: string } = await response.json().catch(() => ({}));
        throw new Error(body.message || "Sign-in failed. Check your email and password.");
      }

      await fetchCurrentUser();
    },
    [fetchCurrentUser],
  );

  const signOut = useCallback(async () => {
    await fetch(`${API_URL}/auth/sign-out`, {
      method: "POST",
      credentials: "include",
    }).catch(() => {});
    setUser(null);
    setAuthState("signed-out");
  }, []);

  const refreshUser = useCallback(async () => {
    await fetchCurrentUser();
  }, [fetchCurrentUser]);

  const updateProfile = useCallback(
    async (data: { name?: string; avatar?: string }) => {
      const response = await fetch(`${API_URL}/auth/profile`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.message || "Could not update profile.");
      }

      const result = await response.json();
      const updatedUser: AdminUser = result.user;
      setUser(updatedUser);
      return updatedUser;
    },
    [],
  );

  return (
    <AuthContext.Provider
      value={{ authState, user, signIn, signOut, refreshUser, updateProfile }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}

/**
 * Refine AuthProvider implementation so Refine's internal hooks
 * like useGetIdentity() receive the full user profile including avatar.
 */
export const adminAuthProvider: RefineAuthProvider = {
  login: async ({ email, password }) => {
    try {
      const response = await fetch(`${API_URL}/auth/sign-in/email`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        return {
          success: false,
          error: new Error(body.message || "Sign-in failed. Please verify credentials."),
        };
      }

      return { success: true, redirectTo: "/" };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err : new Error("Network connection error"),
      };
    }
  },

  logout: async () => {
    await fetch(`${API_URL}/auth/sign-out`, {
      method: "POST",
      credentials: "include",
    }).catch(() => {});
    return { success: true, redirectTo: "/" };
  },

  check: async () => {
    try {
      const response = await fetch(`${API_URL}/auth/me`, {
        credentials: "include",
      });
      if (response.ok) {
        return { authenticated: true };
      }
    } catch {}
    return { authenticated: false, logout: true };
  },

  getIdentity: async () => {
    try {
      const response = await fetch(`${API_URL}/auth/me`, {
        credentials: "include",
      });
      if (response.ok) {
        return await response.json();
      }
    } catch {}
    return null;
  },

  onError: async (error) => {
    if (error?.status === 401 || error?.statusCode === 401) {
      return { logout: true };
    }
    return { error };
  },
};

/** Renders children when signed-in; otherwise shows a stunning modern sign-in form. */
export function RequireAdmin({ children }: { children: ReactNode }) {
  const { authState, signIn } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState("");
  const [isSigningIn, setIsSigningIn] = useState(false);

  async function handleSignIn(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoginError("");
    setIsSigningIn(true);
    try {
      await signIn(email, password);
    } catch (error) {
      setLoginError(
        error instanceof Error ? error.message : "Could not sign in. Try again.",
      );
    } finally {
      setIsSigningIn(false);
    }
  }

  if (authState === "checking") {
    return (
      <div className="flex min-h-[500px] flex-col items-center justify-center gap-3 text-muted-foreground">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm font-medium tracking-wide">
          Verifying administrator credentials…
        </p>
      </div>
    );
  }

  if (authState === "signed-out") {
    return (
      <div className="flex min-h-[75vh] items-center justify-center px-4 py-12">
        <div className="w-full max-w-md overflow-hidden rounded-2xl border border-border/80 bg-card p-8 shadow-xl shadow-black/5">
          <div className="mb-8 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-500 ring-8 ring-amber-500/5">
              <Shield className="h-7 w-7" />
            </div>
            <h1 className="text-2xl font-black tracking-tight text-foreground">
              Lumora Administration
            </h1>
            <p className="mt-2 text-xs text-muted-foreground">
              Sign in with an authorized email configured in the server's{" "}
              <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-[11px]">
                ADMIN_EMAILS
              </code>{" "}
              setting.
            </p>
          </div>

          {loginError && (
            <div
              className="mb-5 flex items-start gap-3 rounded-xl border border-destructive/20 bg-destructive/10 p-3.5 text-xs text-destructive"
              role="alert"
            >
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <p className="font-medium leading-relaxed">{loginError}</p>
            </div>
          )}

          <form onSubmit={(e) => void handleSignIn(e)} className="space-y-4">
            <div>
              <label className="mb-1.5 block text-xs font-bold text-foreground">
                Admin Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="email"
                  autoComplete="username"
                  value={email}
                  placeholder="admin@lumora.store"
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-xl border border-input bg-background/50 py-2.5 pl-10 pr-4 text-sm font-medium transition placeholder:text-muted-foreground/60 focus:border-primary focus:bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
                  required
                />
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-bold text-foreground">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  value={password}
                  placeholder="••••••••••••"
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-xl border border-input bg-background/50 py-2.5 pl-10 pr-10 text-sm font-medium transition placeholder:text-muted-foreground/60 focus:border-primary focus:bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition hover:text-foreground"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSigningIn}
              className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3 text-sm font-bold text-primary-foreground shadow-md shadow-primary/20 transition hover:bg-primary/90 hover:shadow-lg disabled:opacity-60"
            >
              {isSigningIn ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Verifying credentials…</span>
                </>
              ) : (
                <span>Sign in to Dashboard</span>
              )}
            </button>
          </form>

          <div className="mt-6 border-t border-border pt-4 text-center">
            <a
              href="http://localhost:5173"
              target="_blank"
              rel="noreferrer"
              className="text-xs font-semibold text-muted-foreground transition hover:text-primary"
            >
              ← Back to Client Store
            </a>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
