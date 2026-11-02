// Client/shopping-frontend/src/lib/auth-client.ts (or wherever you call createAuthClient)
import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
  baseURL: import.meta.env.VITE_API_URL || "https://lumora-server-kwev.onrender.com",
});