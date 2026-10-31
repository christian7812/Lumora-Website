import arcjet, {
  shield,
  detectBot,
  slidingWindow,
  type ArcjetDecision,
} from "@arcjet/node";
import type { Request, Response, NextFunction } from "express";

// Ensure ARCJET_ENV defaults to development if not in production and not explicitly set
if (!process.env.ARCJET_ENV && process.env.NODE_ENV !== "production") {
  process.env.ARCJET_ENV = "development";
}

const arcjetKey = process.env.ARCJET_KEY?.trim() || "";

if (!arcjetKey) {
  console.info(
    "[Arcjet] ARCJET_KEY is not set in environment. Set ARCJET_KEY to enable live bot, rate-limiting, and shield protection.",
  );
}

// 1. General protection for the API: Shield, Bot Detection, Sliding Window Rate Limit
export const httpArcjet = arcjetKey
  ? arcjet({
      key: arcjetKey,
      rules: [
        shield({
          mode: "LIVE",
        }),
        detectBot({
          mode: "LIVE",
          allow: [
            "CATEGORY:SEARCH_ENGINE", // Google, Bing, Yahoo etc.
            "CATEGORY:PREVIEW",       // Slack, Discord, Twitter previews
            "CATEGORY:MONITOR",       // Uptime monitoring services
          ],
        }),
        slidingWindow({
          mode: "LIVE",
          interval: "60s",
          max: 120, // 120 requests per minute
        }),
      ],
    })
  : null;

// 2. Strict Rate Limit for Auth endpoints (login / signup / session)
export const authArcjet = arcjetKey
  ? arcjet({
      key: arcjetKey,
      rules: [
        shield({
          mode: "LIVE",
        }),
        detectBot({
          mode: "LIVE",
          allow: [],
        }),
        slidingWindow({
          mode: "LIVE",
          interval: "60s",
          max: 15, // 15 auth attempts per minute to mitigate brute-force
        }),
      ],
    })
  : null;

// 3. Rate Limit & Bot Protection for Checkout / Orders
export const orderArcjet = arcjetKey
  ? arcjet({
      key: arcjetKey,
      rules: [
        shield({
          mode: "LIVE",
        }),
        detectBot({
          mode: "LIVE",
          allow: [],
        }),
        slidingWindow({
          mode: "LIVE",
          interval: "60s",
          max: 10, // 10 order creation attempts per minute
        }),
      ],
    })
  : null;

// 4. Rate Limit & Bot Protection for Contact Form submissions
export const contactArcjet = arcjetKey
  ? arcjet({
      key: arcjetKey,
      rules: [
        shield({
          mode: "LIVE",
        }),
        detectBot({
          mode: "LIVE",
          allow: [],
        }),
        slidingWindow({
          mode: "LIVE",
          interval: "60s",
          max: 5, // 5 messages per minute
        }),
      ],
    })
  : null;

/**
 * Handle an Arcjet decision and send an appropriate HTTP error response if denied.
 * Returns true if allowed, false if denied.
 */
export function handleArcjetDecision(
  decision: ArcjetDecision,
  res: Response,
  contextName = "Request",
): boolean {
  if (decision.isDenied()) {
    if (decision.reason.isRateLimit()) {
      res.status(429).json({
        error: "Too Many Requests",
        message: "Rate limit exceeded. Please slow down and try again later.",
      });
      return false;
    }

    if (decision.reason.isBot()) {
      res.status(403).json({
        error: "Forbidden",
        message: "Automated access is not allowed.",
      });
      return false;
    }

    if (decision.reason.isShield()) {
      res.status(403).json({
        error: "Forbidden",
        message: "Request blocked by security shield.",
      });
      return false;
    }

    res.status(403).json({
      error: "Forbidden",
      message: `${contextName} blocked by security policy.`,
    });
    return false;
  }

  return true;
}

/**
 * Express middleware for general API protection.
 */
export async function generalArcjetMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  if (!httpArcjet) {
    return next();
  }

  try {
    const decision = await httpArcjet.protect(req);
    if (!handleArcjetDecision(decision, res, "API request")) {
      return;
    }
  } catch (err) {
    // Fail-open: log warning but do not break normal user traffic
    console.warn("[Arcjet] Warning: API protect check failed (failing open):", err);
  }

  next();
}

/**
 * Express middleware for authentication route protection.
 */
export async function authArcjetMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  if (!authArcjet) {
    return next();
  }

  try {
    const decision = await authArcjet.protect(req);
    if (!handleArcjetDecision(decision, res, "Authentication attempt")) {
      return;
    }
  } catch (err) {
    console.warn("[Arcjet] Warning: auth protect check failed (failing open):", err);
  }

  next();
}

/**
 * Express middleware for order / checkout route protection.
 */
export async function orderArcjetMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  if (!orderArcjet) {
    return next();
  }

  try {
    const decision = await orderArcjet.protect(req);
    if (!handleArcjetDecision(decision, res, "Order submission")) {
      return;
    }
  } catch (err) {
    console.warn("[Arcjet] Warning: order protect check failed (failing open):", err);
  }

  next();
}

/**
 * Express middleware for contact form submission route protection.
 */
export async function contactArcjetMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  if (!contactArcjet) {
    return next();
  }

  try {
    const decision = await contactArcjet.protect(req);
    if (!handleArcjetDecision(decision, res, "Contact message")) {
      return;
    }
  } catch (err) {
    console.warn("[Arcjet] Warning: contact protect check failed (failing open):", err);
  }

  next();
}
