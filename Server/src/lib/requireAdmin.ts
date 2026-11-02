import type { Request, Response } from "express";
import { fromNodeHeaders } from "better-auth/node";
import { auth } from "./auth.js";

export async function requireAdmin(
  req: Request,
  res: Response,
  resource: "orders" | "products" | "categories" | "customers" | "contact" | "dashboard",
): Promise<boolean> {
  const singularResource = {
    orders: "order",
    products: "product",
    categories: "category",
    customers: "customer",
    contact: "contact message",
    dashboard: "dashboard",
  }[resource];
  const adminEmails = new Set(
    (process.env.ADMIN_EMAILS || "christiancruiseratsagba@gmail.com")
      .split(",")
      .map((email) => email.trim().toLowerCase())
      .filter(Boolean),
  );

  if (adminEmails.size === 0) {
    res.status(503).json({ message: `Admin ${singularResource} access is not configured.` });
    return false;
  }

  const session = await auth.api.getSession({
    headers: fromNodeHeaders(req.headers),
  });

  if (!session) {
    res.status(401).json({ message: `Sign in to view ${resource}.` });
    return false;
  }

  if (!adminEmails.has(session.user.email.trim().toLowerCase())) {
    res.status(403).json({ message: `You are not allowed to view ${resource}.` });
    return false;
  }

  return true;
}
