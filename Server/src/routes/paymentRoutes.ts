import { createHmac } from "node:crypto";
import { Router, type Request, type Response } from "express";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "../db/db.js";
import { orders } from "../schema/schema.js";

const paymentRouter = Router();

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY?.trim() || "";
const PAYSTACK_PUBLIC_KEY = process.env.PAYSTACK_PUBLIC_KEY?.trim() || "";

/**
 * Returns Paystack public credentials for the client.
 */
paymentRouter.get("/config", (_req: Request, res: Response) => {
  res.json({
    publicKey: PAYSTACK_PUBLIC_KEY,
    currency: "GHS",
    isConfigured: Boolean(PAYSTACK_SECRET_KEY),
  });
});

const initializeSchema = z.object({
  orderId: z.string().uuid(),
  email: z.string().trim().email(),
  callbackUrl: z.string().url().optional(),
});

/**
 * Initialize a Paystack transaction for an existing order.
 */
paymentRouter.post("/initialize", async (req: Request, res: Response) => {
  const parsed = initializeSchema.safeParse(req.body);

  if (!parsed.success) {
    res.status(400).json({
      message: "Please provide a valid order ID and customer email.",
      errors: parsed.error.flatten(),
    });
    return;
  }

  if (!PAYSTACK_SECRET_KEY) {
    res.status(503).json({
      message: "Paystack is not configured. Please try again later.",
    });
    return;
  }

  const { orderId, email, callbackUrl } = parsed.data;

  try {
    // 1. Fetch order details from database
    const [order] = await db
      .select()
      .from(orders)
      .where(eq(orders.id, orderId))
      .limit(1);

    if (!order) {
      res.status(404).json({ message: "Order not found." });
      return;
    }

    if (order.paymentStatus === "paid") {
      res.status(400).json({ message: "This order has already been paid." });
      return;
    }

    // Amount in pesewas (1 GHS = 100 pesewas)
    const amountInPesewas = Math.round(Number(order.total) * 100);
    const reference = `LMR_${order.id.slice(0, 8)}_${Date.now()}`;

    // 2. Call Paystack API if secret key is present
    if (PAYSTACK_SECRET_KEY) {
      const paystackResponse = await fetch(
        "https://api.paystack.co/transaction/initialize",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email,
            amount: amountInPesewas,
            currency: "GHS",
            reference,
            callback_url: callbackUrl,
            metadata: {
              orderId: order.id,
              customerName: order.fullName,
              phone: order.phone,
            },
            channels: ["mobile_money", "card"],
          }),
        },
      );

      const data = await paystackResponse.json().catch(() => ({}));

      if (
        !paystackResponse.ok ||
        !data.status ||
        typeof data.data?.authorization_url !== "string"
      ) {
        console.error("Paystack initialization failed:", data);
        res.status(502).json({
          message:
            data.message || "Failed to initialize payment gateway with Paystack.",
        });
        return;
      }

      // Save payment reference on order
      await db
        .update(orders)
        .set({ paymentReference: reference, paymentMethod: "paystack" })
        .where(eq(orders.id, order.id));

      res.json({
        status: "success",
        authorization_url: data.data.authorization_url,
        access_code: data.data.access_code,
        reference,
        amount: Number(order.total),
        currency: "GHS",
        isSandbox: false,
      });
      return;
    }

    // 3. Graceful Sandbox Simulation when PAYSTACK_SECRET_KEY is not yet set
    await db
      .update(orders)
      .set({ paymentReference: reference, paymentMethod: "paystack" })
      .where(eq(orders.id, order.id));

    res.json({
      status: "success",
      authorization_url: null,
      access_code: null,
      reference,
      amount: Number(order.total),
      currency: "GHS",
      isSandbox: true,
      message:
        "Paystack is in sandbox demo mode (add PAYSTACK_SECRET_KEY in Server/.env for live gateway).",
    });
  } catch (error) {
    console.error("Payment initialization error:", error);
    res.status(500).json({ message: "Could not initialize payment." });
  }
});

const verifySchema = z.object({
  reference: z.string().trim().min(3),
  orderId: z.string().uuid().optional(),
});

/**
 * Verify a Paystack payment by transaction reference.
 */
paymentRouter.post("/verify", async (req: Request, res: Response) => {
  const parsed = verifySchema.safeParse(req.body);

  if (!parsed.success) {
    res.status(400).json({ message: "Provide a valid payment reference." });
    return;
  }

  const { reference, orderId } = parsed.data;

  if (!PAYSTACK_SECRET_KEY) {
    res.status(503).json({
      message: "Paystack is not configured. Payment cannot be verified.",
    });
    return;
  }

  try {
    let isSuccess = false;
    let targetOrderId = orderId;
    let paymentChannel = "paystack";

    if (PAYSTACK_SECRET_KEY) {
      const verifyRes = await fetch(
        `https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`,
        {
          headers: {
            Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
          },
        },
      );

      const verifyData = await verifyRes.json().catch(() => ({}));

      if (!verifyRes.ok || !verifyData.status) {
        res.status(400).json({
          message: verifyData.message || "Could not verify payment with Paystack.",
        });
        return;
      }

      if (verifyData.data.status === "success") {
        isSuccess = true;
        targetOrderId = verifyData.data.metadata?.orderId || orderId;
        paymentChannel = verifyData.data.channel || "paystack";
      }
    } else {
      // Sandbox mode: accept sandbox test confirmation
      isSuccess = true;
    }

    if (!isSuccess) {
      res.status(400).json({
        message: "Payment was not successful or is still pending.",
      });
      return;
    }

    // Update order status in database
    if (targetOrderId) {
      await db
        .update(orders)
        .set({
          paymentStatus: "paid",
          status: "processing",
          paymentReference: reference,
          paymentMethod: `paystack (${paymentChannel})`,
        })
        .where(eq(orders.id, targetOrderId));
    }

    res.json({
      success: true,
      message: "Payment successfully verified and recorded.",
      orderId: targetOrderId,
      reference,
      paymentStatus: "paid",
    });
  } catch (error) {
    console.error("Payment verification error:", error);
    res.status(500).json({ message: "Could not complete payment verification." });
  }
});

/**
 * Paystack Webhook endpoint to listen for background payment events.
 */
paymentRouter.post("/webhook", async (req: Request, res: Response) => {
  if (!PAYSTACK_SECRET_KEY) {
    res.status(200).send("OK");
    return;
  }

  const signature = req.headers["x-paystack-signature"];
  if (typeof signature !== "string") {
    res.status(401).send("Missing signature");
    return;
  }

  const hash = createHmac("sha512", PAYSTACK_SECRET_KEY)
    .update(JSON.stringify(req.body))
    .digest("hex");

  if (hash !== signature) {
    res.status(401).send("Invalid signature");
    return;
  }

  const event = req.body;

  if (event.event === "charge.success") {
    const reference = event.data.reference;
    const orderId = event.data.metadata?.orderId;
    const channel = event.data.channel || "paystack";

    if (orderId) {
      await db
        .update(orders)
        .set({
          paymentStatus: "paid",
          status: "processing",
          paymentReference: reference,
          paymentMethod: `paystack (${channel})`,
        })
        .where(eq(orders.id, orderId));
    }
  }

  res.status(200).send("Webhook handled");
});

export default paymentRouter;
