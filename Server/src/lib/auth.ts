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
    ipAddress: {
      ipAddressHeaders: ["cf-connecting-ip"],
    },
    defaultCookieAttributes:
      process.env.NODE_ENV === "production" ||
      process.env.RENDER === "true" ||
      (process.env.BETTER_AUTH_URL && process.env.BETTER_AUTH_URL.startsWith("https://"))
        ? { sameSite: "none", secure: true, partitioned: true }
        : { sameSite: "lax" },
  },

  trustedOrigins: Array.from(
    new Set([
      "http://localhost:5173",
      "http://localhost:5174",
      "http://localhost:5175",
      "http://localhost:3000",
      "http://127.0.0.1:5173",
      "http://127.0.0.1:5174",
      "http://127.0.0.1:5175",
      ...(process.env.BETTER_AUTH_URL ? [process.env.BETTER_AUTH_URL.trim()] : []),
      ...(process.env.CORS_ORIGINS ?? "")
        .split(",")
        .map((origin) => origin.trim())
        .filter(Boolean),
    ]),
  ),
});