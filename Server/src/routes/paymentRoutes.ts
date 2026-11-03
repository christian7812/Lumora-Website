import { randomUUID } from "node:crypto";
import { Router, type Request, type Response } from "express";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "../db/db.js";
import { orders, telegramNotifications } from "../schema/schema.js";
import {
  failedPaymentMessage,
  successfulPaymentMessage,
} from "../services/telegram.service.js";
import {
  isValidPaystackSignature,
  matchesOrderAmountAndCurrency,
} from "../services/paystack.service.js";

const paymentRouter = Router();

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY?.trim() || "";
const PAYSTACK_PUBLIC_KEY = process.env.PAYSTACK_PUBLIC_KEY?.trim() || "";

const paystackTransactionSchema = z.object({
  status: z.boolean(),
  message: z.string().optional(),
  data: z
    .object({
      status: z.string(),
      reference: z.string(),
      amount: z.number().int().nonnegative(),
      currency: z.string(),
      channel: z.string().optional(),
      paid_at: z.string().optional(),
      metadata: z
        .object({ orderId: z.string().optional() })
        .passthrough()
        .optional(),
    })
    .passthrough(),
});

const webhookSchema = z.object({
  event: z.string(),
  data: z.object({
    reference: z.string(),
  }).passthrough(),
});

type PaystackTransaction = z.infer<typeof paystackTransactionSchema>["data"];

class PaymentProcessingError extends Error {
  constructor(
    message: string,
    readonly statusCode: number,
  ) {
    super(message);
    this.name = "PaymentProcessingError";
  }
}

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
    const [order] = await db
      .select()
      .from(orders)
      .where(eq(orders.id, orderId))
      .limit(1);

    if (!order) {
      res.status(404).json({ message: "Order not found." });
      return;
    }

    if (order.email.trim().toLowerCase() !== email.toLowerCase()) {
      res.status(403).json({ message: "The email does not match this order." });
      return;
    }

    if (order.paymentStatus !== "unpaid" || order.status === "cancelled") {
      res.status(409).json({
        message: "This order is not available for payment.",
      });
      return;
    }

    const amountInPesewas = Math.round(Number(order.total) * 100);
    const reference = `LMR_${randomUUID()}`;
    const paystackResponse = await fetch(
      "https://api.paystack.co/transaction/initialize",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: order.email,
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
        signal: AbortSignal.timeout(15_000),
      },
    );

    const responseBody: unknown = await paystackResponse
      .json()
      .catch(() => undefined);
    const result = z
      .object({
        status: z.boolean(),
        message: z.string().optional(),
        data: z.object({
          authorization_url: z.string().url(),
          access_code: z.string().optional(),
        }).passthrough(),
      })
      .safeParse(responseBody);

    if (!paystackResponse.ok || !result.success || !result.data.status) {
      console.error("Paystack transaction initialization was rejected.");
      res.status(502).json({
        message: "Failed to initialize payment with Paystack.",
      });
      return;
    }

    const [updatedOrder] = await db
      .update(orders)
      .set({ paymentReference: reference, paymentMethod: "paystack" })
      .where(
        and(eq(orders.id, order.id), eq(orders.paymentStatus, "unpaid")),
      )
      .returning({ id: orders.id });

    if (!updatedOrder) {
      res.status(409).json({
        message: "The order changed while payment was being initialized.",
      });
      return;
    }

    res.json({
      status: "success",
      authorization_url: result.data.data.authorization_url,
      access_code: result.data.data.access_code,
      reference,
      amount: Number(order.total),
      currency: "GHS",
      isSandbox: false,
    });
  } catch {
    console.error("Payment initialization failed.");
    res.status(500).json({ message: "Could not initialize payment." });
  }
});

const verifySchema = z.object({
  reference: z.string().trim().min(3).max(100),
  orderId: z.string().uuid().optional(),
});

async function fetchVerifiedTransaction(reference: string): Promise<PaystackTransaction> {
  const response = await fetch(
    `https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`,
    {
      headers: { Authorization: `Bearer ${PAYSTACK_SECRET_KEY}` },
      signal: AbortSignal.timeout(15_000),
    },
  );
  const body: unknown = await response.json().catch(() => undefined);
  const parsed = paystackTransactionSchema.safeParse(body);

  if (!response.ok || !parsed.success || !parsed.data.status) {
    throw new PaymentProcessingError(
      "Paystack could not verify this transaction.",
      502,
    );
  }
  if (parsed.data.data.reference !== reference) {
    throw new PaymentProcessingError(
      "Paystack returned a different transaction reference.",
      502,
    );
  }
  return parsed.data.data;
}

async function processVerifiedTransaction(
  transaction: PaystackTransaction,
  reference: string,
  expectedOrderId?: string,
) {
  const [matchedOrder] = await db
    .select()
    .from(orders)
    .where(eq(orders.paymentReference, reference))
    .limit(1);

  if (
    !matchedOrder ||
    (expectedOrderId && expectedOrderId !== matchedOrder.id) ||
    (transaction.metadata?.orderId &&
      transaction.metadata.orderId !== matchedOrder.id)
  ) {
    throw new PaymentProcessingError(
      "Payment reference does not match an order.",
      400,
    );
  }

  if (!matchesOrderAmountAndCurrency(transaction, matchedOrder.total)) {
    throw new PaymentProcessingError(
      "Verified payment amount or currency does not match the order.",
      400,
    );
  }

  if (transaction.status === "success") {
    return db.transaction(async (tx) => {
      const [current] = await tx
        .select()
        .from(orders)
        .where(eq(orders.id, matchedOrder.id))
        .for("update");

      if (!current || current.paymentReference !== reference) {
        throw new PaymentProcessingError(
          "Payment reference no longer matches the order.",
          409,
        );
      }

      if (current.paymentStatus === "paid") {
        return { order: current, newlyPaid: false };
      }
      if (current.paymentStatus !== "unpaid" || current.status === "cancelled") {
        throw new PaymentProcessingError("Order cannot transition to paid.", 409);
      }

      const reportedPaymentDate = transaction.paid_at
        ? new Date(transaction.paid_at)
        : new Date();
      const paymentDate = Number.isNaN(reportedPaymentDate.getTime())
        ? new Date()
        : reportedPaymentDate;
      const paymentMethod = `paystack (${transaction.channel || "paystack"})`;
      const [paidOrder] = await tx
        .update(orders)
        .set({
          paymentStatus: "paid",
          status: current.status === "pending" ? "processing" : current.status,
          paymentMethod,
        })
        .where(eq(orders.id, current.id))
        .returning();

      await tx
        .insert(telegramNotifications)
        .values({
          eventKey: `successful-payment:${current.id}`,
          message: successfulPaymentMessage({
            id: paidOrder.id,
            fullName: paidOrder.fullName,
            email: paidOrder.email,
            total: paidOrder.total,
            paymentReference: reference,
            paymentMethod: paidOrder.paymentMethod,
            paymentStatus: paidOrder.paymentStatus,
            paymentDate,
          }),
        })
        .onConflictDoNothing({ target: telegramNotifications.eventKey });

      return { order: paidOrder, newlyPaid: true };
    });
  }

  if (transaction.status === "failed") {
    return db.transaction(async (tx) => {
      const [current] = await tx
        .select()
        .from(orders)
        .where(eq(orders.id, matchedOrder.id))
        .for("update");

      if (!current || current.paymentReference !== reference) {
        throw new PaymentProcessingError(
          "Payment reference no longer matches the order.",
          409,
        );
      }

      if (current.paymentStatus === "unpaid") {
        await tx
          .insert(telegramNotifications)
          .values({
            eventKey: `failed-payment:${reference}`,
            message: failedPaymentMessage({
              id: current.id,
              fullName: current.fullName,
              total: current.total,
              paymentReference: reference,
            }),
          })
          .onConflictDoNothing({ target: telegramNotifications.eventKey });
      }
      return { order: current, newlyPaid: false };
    });
  }

  throw new PaymentProcessingError(
    "Paystack has not confirmed a successful or failed payment.",
    409,
  );
}

/**
 * Verify a payment with Paystack before updating its order or notifying Telegram.
 */
paymentRouter.post("/verify", async (req: Request, res: Response) => {
  const parsed = verifySchema.safeParse(req.body);

  if (!parsed.success) {
    res.status(400).json({ message: "Provide a valid payment reference." });
    return;
  }
  if (!PAYSTACK_SECRET_KEY) {
    res.status(503).json({ message: "Paystack payment verification is unavailable." });
    return;
  }

  const { reference, orderId } = parsed.data;
  try {
    const transaction = await fetchVerifiedTransaction(reference);
    const result = await processVerifiedTransaction(
      transaction,
      reference,
      orderId,
    );

    if (transaction.status !== "success") {
      res.status(400).json({
        message: "Paystack confirmed that this payment failed.",
        paymentStatus: "unpaid",
      });
      return;
    }

    res.json({
      success: true,
      message: "Payment successfully verified and recorded.",
      orderId: result.order.id,
      reference,
      paymentStatus: result.order.paymentStatus,
      total: Number(result.order.total),
      customerName: result.order.fullName,
      customerEmail: result.order.email,
      paymentMethod: result.order.paymentMethod,
      createdAt: result.order.createdAt,
      paidAt: transaction.paid_at,
    });
  } catch (error) {
    if (error instanceof PaymentProcessingError) {
      res.status(error.statusCode).json({ message: error.message });
      return;
    }
    console.error("Payment verification could not be completed.");
    res.status(500).json({ message: "Could not verify this payment." });
  }
});

/**
 * Paystack webhook. The app mounts express.raw before express.json for this path.
 */
paymentRouter.post("/webhook", async (req: Request, res: Response) => {
  const rawBody = Buffer.isBuffer(req.body) ? req.body : undefined;
  const signature = req.headers["x-paystack-signature"];
  if (!rawBody || typeof signature !== "string") {
    res.status(401).send("Missing signed webhook body.");
    return;
  }

  if (!isValidPaystackSignature(rawBody, signature, PAYSTACK_SECRET_KEY)) {
    res.status(401).send("Invalid signature.");
    return;
  }

  let eventBody: unknown;
  try {
    eventBody = JSON.parse(rawBody.toString("utf8"));
  } catch {
    res.status(400).send("Invalid webhook payload.");
    return;
  }

  const parsedEvent = webhookSchema.safeParse(eventBody);
  if (!parsedEvent.success) {
    res.status(400).send("Invalid webhook payload.");
    return;
  }

  const { event, data } = parsedEvent.data;
  if (event !== "charge.success" && event !== "charge.failed") {
    res.status(200).send("Event ignored.");
    return;
  }

  if (!PAYSTACK_SECRET_KEY) {
    res.status(503).send("Payment verification is unavailable.");
    return;
  }

  try {
    const transaction = await fetchVerifiedTransaction(data.reference);
    if (
      (event === "charge.success" && transaction.status !== "success") ||
      (event === "charge.failed" && transaction.status !== "failed")
    ) {
      res.status(400).send("Webhook event does not match Paystack verification.");
      return;
    }

    await processVerifiedTransaction(transaction, data.reference);
    res.status(200).send("Webhook handled.");
  } catch (error) {
    if (error instanceof PaymentProcessingError && error.statusCode < 500) {
      res.status(error.statusCode).send(error.message);
      return;
    }
    console.error("Paystack webhook processing failed.");
    res.status(500).send("Webhook processing failed.");
  }
});

export default paymentRouter;
