import { Router } from "express";
import { countDistinct, desc, eq, ilike, inArray, or, sql } from "drizzle-orm";
import { z } from "zod";
import { db } from "../db/db.js";
import { orders } from "../schema/schema.js";
import { requireAdmin } from "../lib/requireAdmin.js";

const router = Router();
const normalizedEmail = sql<string>`lower(trim(${orders.email}))`;

router.get("/admin", async (req, res) => {
  try {
    if (!(await requireAdmin(req, res, "customers"))) return;
    const startValue = Number.parseInt(String(req.query._start ?? "0"), 10);
    const endValue = Number.parseInt(String(req.query._end ?? "20"), 10);
    const start = Number.isInteger(startValue) && startValue >= 0 ? startValue : 0;
    const end = Number.isInteger(endValue) && endValue > start ? endValue : start + 20;
    const search = typeof req.query.q === "string" ? req.query.q.trim().slice(0, 100) : "";
    const filter = search ? or(ilike(orders.email, `%${search}%`), ilike(orders.fullName, `%${search}%`), ilike(orders.phone, `%${search}%`)) : undefined;
    const matchingEmails = search
      ? db.select({ email: normalizedEmail }).from(orders).where(filter).groupBy(normalizedEmail)
      : undefined;
    const customerFilter = matchingEmails ? inArray(normalizedEmail, matchingEmails) : undefined;
    const rows = await db.select({
      id: normalizedEmail,
      email: normalizedEmail,
      name: sql<string>`(array_agg(${orders.fullName} order by ${orders.createdAt} desc))[1]`,
      phone: sql<string>`(array_agg(${orders.phone} order by ${orders.createdAt} desc))[1]`,
      lastOrderAt: sql<Date>`max(${orders.createdAt})`,
      orderCount: sql<number>`count(*) filter (where ${orders.status} <> 'cancelled')::int`,
      totalSpent: sql<string>`coalesce(sum(${orders.total}::numeric) filter (where ${orders.paymentStatus} = 'paid' and ${orders.status} <> 'cancelled'), 0)::text`,
    }).from(orders).where(customerFilter).groupBy(normalizedEmail).orderBy(desc(sql`max(${orders.createdAt})`), normalizedEmail).limit(Math.min(end - start, 100)).offset(start);
    const [total] = await db.select({ total: countDistinct(normalizedEmail) }).from(orders).where(filter);
    res.setHeader("x-total-count", String(total?.total ?? 0));
    res.json(rows);
  } catch (error) {
    console.error("Failed to list customers:", error);
    res.status(500).json({ message: "Could not load customers." });
  }
});

router.get("/:email", async (req, res) => {
  try {
    if (!(await requireAdmin(req, res, "customers"))) return;
    const parsed = z.string().email().safeParse(req.params.email);
    if (!parsed.success) { res.status(400).json({ message: "Invalid customer email." }); return; }
    const email = parsed.data.trim().toLowerCase();
    const customerOrders = await db.select().from(orders).where(eq(normalizedEmail, email)).orderBy(desc(orders.createdAt));
    if (!customerOrders.length) { res.status(404).json({ message: "Customer not found." }); return; }
    const latest = customerOrders[0]!;
    const visibleOrders = customerOrders.filter((order) => order.status !== "cancelled");
    res.json({
      id: email,
      email,
      name: latest.fullName,
      phone: latest.phone,
      lastOrderAt: latest.createdAt,
      orderCount: visibleOrders.length,
      totalSpent: visibleOrders.filter((order) => order.paymentStatus === "paid").reduce((sum, order) => sum + Number(order.total), 0),
      orders: customerOrders,
    });
  } catch (error) {
    console.error("Failed to fetch customer:", error);
    res.status(500).json({ message: "Could not load customer." });
  }
});

export default router;
