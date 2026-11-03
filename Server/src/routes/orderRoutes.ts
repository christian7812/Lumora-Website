import { Router } from "express";
import { db } from "../db/db.js";
import {
  orderItems,
  orders,
  products,
  telegramNotifications,
} from "../schema/schema.js";
import { z } from "zod";
import { fromNodeHeaders } from "better-auth/node";
import { count, desc, eq, inArray, asc, sql } from "drizzle-orm";
import { requireAdmin } from "../lib/requireAdmin.js";
import { auth } from "../lib/auth.js";
import { orderArcjetMiddleware } from "../lib/arcjet.js";
import { newOrderMessage } from "../services/telegram.service.js";

const orderRouter = Router();

//Retrieving Orders
orderRouter.get("/", async (req, res) => {
  try {
    if (!(await requireAdmin(req, res, "orders"))) return;

    const startValue = Number.parseInt(String(req.query._start ?? "0"), 10);
    const endValue = Number.parseInt(String(req.query._end ?? "10"), 10);
    const start = Number.isInteger(startValue) && startValue >= 0 ? startValue : 0;
    const requestedEnd = Number.isInteger(endValue) && endValue > start
      ? endValue
      : start + 10;
    const limit = Math.min(requestedEnd - start, 100);
    const [orderRows, totalRows] = await Promise.all([
      db
        .select()
        .from(orders)
        .orderBy(desc(orders.createdAt))
        .limit(limit)
        .offset(start),
      db.select({ total: count() }).from(orders),
    ]);

    res.setHeader("x-total-count", String(totalRows[0]?.total ?? 0));
    res.json(orderRows);
  } catch (error) {
    console.error("Failed to fetch orders:", error);
    res.status(500).json({ message: "Could not load orders." });
  }
});

orderRouter.get("/:id", async (req, res) => {
  try {
    if (!(await requireAdmin(req, res, "orders"))) return;

    const parsedId = z.string().uuid().safeParse(req.params.id);
    if (!parsedId.success) {
      res.status(400).json({ message: "Order ID must be a valid UUID." });
      return;
    }

    const [order] = await db
      .select()
      .from(orders)
      .where(eq(orders.id, parsedId.data))
      .limit(1);

    if (!order) {
      res.status(404).json({ message: "Order not found." });
      return;
    }

    const items = await db
      .select()
      .from(orderItems)
      .where(eq(orderItems.orderId, order.id));

    res.json({ ...order, items });
  } catch (error) {
    console.error("Failed to fetch order details:", error);
    res.status(500).json({ message: "Could not load order details." });
  }
});

const orderStatusSchema = z.enum([
  "pending",
  "processing",
  "shipped",
  "delivered",
  "cancelled",
]);
const paymentStatusSchema = z.enum(["unpaid", "paid", "refunded"]);
const orderUpdateSchema = z
  .object({
    status: orderStatusSchema.optional(),
    paymentStatus: paymentStatusSchema.optional(),
  })
  .refine(
    (values) => (values.status === undefined) !== (values.paymentStatus === undefined),
    "Update either fulfillment status or payment status.",
  );

type OrderStatus = z.infer<typeof orderStatusSchema>;

const allowedOrderTransitions: Record<OrderStatus, readonly OrderStatus[]> = {
  pending: ["processing", "cancelled"],
  processing: ["shipped", "cancelled"],
  shipped: ["delivered"],
  delivered: [],
  cancelled: [],
};

orderRouter.patch("/:id", async (req, res) => {
  try {
    if (!(await requireAdmin(req, res, "orders"))) return;

    const parsedId = z.string().uuid().safeParse(req.params.id);
    if (!parsedId.success) {
      res.status(400).json({ message: "Order ID must be a valid UUID." });
      return;
    }

    const parsedUpdate = orderUpdateSchema.safeParse(req.body);
    if (!parsedUpdate.success) {
      res.status(400).json({
        message: "Provide exactly one valid fulfillment or payment status.",
      });
      return;
    }

    const result = await db.transaction(async (tx) => {
      const [current] = await tx
        .select()
        .from(orders)
        .where(eq(orders.id, parsedId.data))
        .for("update");

      if (!current) return { kind: "not-found" as const };

      if (parsedUpdate.data.status !== undefined) {
        const nextStatus = parsedUpdate.data.status;
        if (nextStatus === current.status) {
          return { kind: "updated" as const, order: current };
        }

        const transitions = allowedOrderTransitions[current.status as OrderStatus];
        if (!transitions?.includes(nextStatus)) {
          return {
            kind: "conflict" as const,
            message: `Cannot change an order from ${current.status} to ${nextStatus}.`,
          };
        }

        if (
          nextStatus === "cancelled" &&
          current.paymentStatus === "paid"
        ) {
          return {
            kind: "conflict" as const,
            message: "Mark the manual payment as refunded before cancelling this order.",
          };
        }

        if (nextStatus === "cancelled" && current.stockDeducted) {
          const lineItems = await tx
            .select({ productId: orderItems.productId, quantity: orderItems.quantity })
            .from(orderItems)
            .where(eq(orderItems.orderId, current.id));
          const quantitiesByProduct = new Map<string, number>();
          for (const item of lineItems) {
            quantitiesByProduct.set(
              item.productId,
              (quantitiesByProduct.get(item.productId) ?? 0) + item.quantity,
            );
          }

          const productIds = [...quantitiesByProduct.keys()].sort();
          if (productIds.length > 0) {
            const lockedProducts = await tx
              .select({ id: products.id })
              .from(products)
              .where(inArray(products.id, productIds))
              .orderBy(asc(products.id))
              .for("update");
            if (lockedProducts.length !== productIds.length) {
              throw new Error(`Order ${current.id} references a missing product.`);
            }

            for (const [productId, quantity] of quantitiesByProduct) {
              await tx
                .update(products)
                .set({ stockQuantity: sql`${products.stockQuantity} + ${quantity}` })
                .where(eq(products.id, productId));
            }
          }
        }

        const [updatedOrder] = await tx
          .update(orders)
          .set({
            status: nextStatus,
            ...(nextStatus === "cancelled" ? { stockDeducted: false } : {}),
          })
          .where(eq(orders.id, current.id))
          .returning();
        return { kind: "updated" as const, order: updatedOrder };
      }

      const nextPaymentStatus = parsedUpdate.data.paymentStatus!;
      if (nextPaymentStatus === current.paymentStatus) {
        return { kind: "updated" as const, order: current };
      }
      if (current.status === "cancelled") {
        return {
          kind: "conflict" as const,
          message: "Payment status cannot be changed after an order is cancelled.",
        };
      }

      const validPaymentTransition =
        (current.paymentStatus === "unpaid" && nextPaymentStatus === "paid") ||
        (current.paymentStatus === "paid" && nextPaymentStatus === "refunded");
      if (!validPaymentTransition) {
        return {
          kind: "conflict" as const,
          message: `Cannot change payment from ${current.paymentStatus} to ${nextPaymentStatus}.`,
        };
      }
      if (
        nextPaymentStatus === "refunded" &&
        current.status !== "pending" &&
        current.status !== "processing"
      ) {
        return {
          kind: "conflict" as const,
          message: "Manual refunds can only be recorded before an order ships.",
        };
      }

      const [updatedOrder] = await tx
        .update(orders)
        .set({ paymentStatus: nextPaymentStatus })
        .where(eq(orders.id, current.id))
        .returning();
      return { kind: "updated" as const, order: updatedOrder };
    });

    if (result.kind === "not-found") {
      res.status(404).json({ message: "Order not found." });
      return;
    }

    if (result.kind === "conflict") {
      res.status(409).json({ message: result.message });
      return;
    }

    res.json(result.order);
  } catch (error) {
    console.error("Failed to update order status:", error);
    res.status(500).json({ message: "Could not update order status." });
  }
});

const orderSchema = z.object({
  fullName: z.string().trim().min(2),
  email: z.string().trim().email(),
  phone: z.string().trim().min(7),
  address: z.string().trim().min(5),
  city: z.string().trim().min(2),
  region: z.string().trim().min(2),
  paymentMethod: z.enum(["cash", "mobile_money", "paystack"]),
  items: z
    .array(
      z.object({
        productId: z.string().min(1),
        quantity: z.number().int().min(1).max(100),
      }),
    )
    .min(1)
    .max(100),
});


//Creating orders during checkout
orderRouter.post("/", orderArcjetMiddleware, async (req, res) => {
  const parsed = orderSchema.safeParse(req.body);

  if (!parsed.success) {
    res.status(400).json({
      message: "Please provide valid order details.",
      errors: parsed.error.flatten(),
    });
    return;
  }

  try {
    const data = parsed.data;
    const quantitiesByProduct = new Map<string, number>();
    for (const item of data.items) {
      const quantity = (quantitiesByProduct.get(item.productId) ?? 0) + item.quantity;
      if (quantity > 100) {
        res.status(400).json({
          message: "The quantity for each product cannot exceed 100.",
        });
        return;
      }
      quantitiesByProduct.set(item.productId, quantity);
    }

    const session = await auth.api.getSession({
      headers: fromNodeHeaders(req.headers),
    });
    if (!session) {
      res.status(401).json({ message: "Sign in before placing an order." });
      return;
    }

    const productIds = [...quantitiesByProduct.keys()].sort();
    const result = await db.transaction(async (tx) => {
      const productRows = await tx
        .select()
        .from(products)
        .where(inArray(products.id, productIds))
        .orderBy(asc(products.id))
        .for("update");
      const productsById = new Map(productRows.map((product) => [product.id, product]));

      for (const productId of productIds) {
        const product = productsById.get(productId);
        if (!product || !product.isActive) {
          return {
            kind: "unavailable" as const,
            message: "One or more products are no longer available. Update your cart and try again.",
          };
        }

        const requestedQuantity = quantitiesByProduct.get(productId)!;
        if (product.stockQuantity < requestedQuantity) {
          return {
            kind: "unavailable" as const,
            message: `${product.name} has only ${product.stockQuantity} available. Update your cart and try again.`,
          };
        }
      }

      const trustedItems = productIds.map((productId) => {
        const product = productsById.get(productId)!;
        return {
          productId: product.id,
          productName: product.name,
          priceCents: Math.round(Number(product.price) * 100),
          quantity: quantitiesByProduct.get(productId)!,
        };
      });
      const subtotalCents = trustedItems.reduce(
        (sum, item) => sum + item.priceCents * item.quantity,
        0,
      );
      const shippingCents = 0;
      const totalCents = subtotalCents + shippingCents;

      for (const item of trustedItems) {
        await tx
          .update(products)
          .set({ stockQuantity: sql`${products.stockQuantity} - ${item.quantity}` })
          .where(eq(products.id, item.productId));
      }

      const [order] = await tx
        .insert(orders)
        .values({
          userId: session.user.id,
          fullName: data.fullName,
          email: data.email,
          phone: data.phone,
          address: data.address,
          city: data.city,
          region: data.region,
          paymentMethod: data.paymentMethod,
          subtotal: (subtotalCents / 100).toFixed(2),
          shipping: (shippingCents / 100).toFixed(2),
          total: (totalCents / 100).toFixed(2),
          paymentStatus: "unpaid",
          stockDeducted: true,
        })
        .returning();

      const savedItems = await tx
        .insert(orderItems)
        .values(
          trustedItems.map((item) => ({
            orderId: order.id,
            productId: item.productId,
            productName: item.productName,
            quantity: item.quantity,
            price: (item.priceCents / 100).toFixed(2),
          })),
        )
        .returning({
          productName: orderItems.productName,
          quantity: orderItems.quantity,
          price: orderItems.price,
        });

      await tx
        .insert(telegramNotifications)
        .values({
          eventKey: `new-order:${order.id}`,
          message: newOrderMessage(order, savedItems),
        })
        .onConflictDoNothing({
          target: telegramNotifications.eventKey,
        });

      return {
        kind: "created" as const,
        id: order.id,
        total: (totalCents / 100).toFixed(2),
      };
    });

    if (result.kind === "unavailable") {
      res.status(409).json({ message: result.message });
      return;
    }

    res.status(201).json({
      message: "Order created successfully.",
      orderId: result.id,
      total: result.total,
    });
  } catch (error) {
    console.error("Failed to create order:", error);
    res.status(500).json({ message: "Could not create your order." });
  }
});

export default orderRouter;
