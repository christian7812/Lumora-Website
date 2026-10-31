import { Router, type Request, type Response } from "express";
import { fromNodeHeaders } from "better-auth/node";
import { desc, eq, and } from "drizzle-orm";
import { z } from "zod";
import { auth } from "../lib/auth.js";
import { db } from "../db/db.js";
import { orderItems, orders } from "../schema/schema.js";

const router = Router();
async function getUserId(req: Request, res: Response) {
  const session = await auth.api.getSession({ headers: fromNodeHeaders(req.headers) });
  if (!session) { res.status(401).json({ message: "Sign in to view your orders." }); return null; }
  return session.user.id;
}

router.get("/orders", async (req, res) => {
  try {
    const userId = await getUserId(req, res);
    if (!userId) return;
    const rows = await db.select().from(orders).where(eq(orders.userId, userId)).orderBy(desc(orders.createdAt));
    res.json(rows);
  } catch (error) {
    console.error("Failed to fetch account orders:", error);
    res.status(500).json({ message: "Could not load your orders." });
  }
});

router.get("/orders/:id", async (req, res) => {
  try {
    const userId = await getUserId(req, res);
    if (!userId) return;
    const parsed = z.string().uuid().safeParse(req.params.id);
    if (!parsed.success) { res.status(400).json({ message: "Order ID must be a valid UUID." }); return; }
    const [order] = await db.select().from(orders).where(and(eq(orders.id, parsed.data), eq(orders.userId, userId))).limit(1);
    if (!order) { res.status(404).json({ message: "Order not found." }); return; }
    const items = await db.select().from(orderItems).where(eq(orderItems.orderId, order.id));
    res.json({ ...order, items });
  } catch (error) {
    console.error("Failed to fetch account order:", error);
    res.status(500).json({ message: "Could not load your order." });
  }
});

export default router;
