import { Router } from "express";
import { and, count, countDistinct, desc, eq, sql } from "drizzle-orm";
import { db } from "../db/db.js";
import { orders, products } from "../schema/schema.js";
import { requireAdmin } from "../lib/requireAdmin.js";

const router = Router();
router.get("/", async (req, res) => {
  try {
    if (!(await requireAdmin(req, res, "dashboard"))) return;
    const [productCount, customerCount, orderStats, unpaidOrders, outOfStock, recentOrders] = await Promise.all([
      db.select({ total: count() }).from(products).where(eq(products.isActive, true)),
      db.select({ total: countDistinct(sql`lower(trim(${orders.email}))`) }).from(orders),
      db.select({ total: count(), revenue: sql<string>`coalesce(sum(${orders.total}::numeric) filter (where ${orders.paymentStatus} = 'paid' and ${orders.status} <> 'cancelled'), 0)::text` }).from(orders),
      db.select({ total: count() }).from(orders).where(and(eq(orders.paymentStatus, "unpaid"), sql`${orders.status} <> 'cancelled'`)),
      db.select({ total: count() }).from(products).where(and(eq(products.isActive, true), eq(products.stockQuantity, 0))),
      db.select().from(orders).orderBy(desc(orders.createdAt)).limit(8),
    ]);
    res.json({
      activeProducts: productCount[0]?.total ?? 0,
      customerCount: customerCount[0]?.total ?? 0,
      totalOrders: orderStats[0]?.total ?? 0,
      paidRevenue: Number(orderStats[0]?.revenue ?? 0),
      unpaidOrders: unpaidOrders[0]?.total ?? 0,
      outOfStockProducts: outOfStock[0]?.total ?? 0,
      recentOrders,
    });
  } catch (error) {
    console.error("Failed to load dashboard metrics:", error);
    res.status(500).json({ message: "Could not load dashboard metrics." });
  }
});
export default router;
