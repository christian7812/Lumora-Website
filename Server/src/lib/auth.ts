import "dotenv/config";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "@better-auth/drizzle-adapter";
import { db } from "../db/db.js";
import { account, session, user, verification } from "../schema/schema.js";

if (!process.env.BETTER_AUTH_SECRET) {
  throw new Error("BETTER_AUTH_SECRET is missing from Server/.env");
}

if (!process.env.BETTER_AUTH_URL) {
  throw new Error("BETTER_AUTH_URL is missing from Server/.env");
}

export const auth = betterAuth({
  secret: process.env.BETTER_AUTH_SECRET,
  baseURL: process.env.BETTER_AUTH_URL,

  database: drizzleAdapter(db, {
    provider: "pg",
    schema: { user, session, account, verification },
  }),

  emailAndPassword: {
    enabled: true,
  },

  advanced: {
    defaultCookieAttributes:
      process.env.NODE_ENV === "production"
        ? { sameSite: "none", secure: true, partitioned: true }
        : { sameSite: "lax" },
  },

  trustedOrigins: (process.env.CORS_ORIGINS ??
    "http://localhost:5173,http://localhost:5174")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean),
});