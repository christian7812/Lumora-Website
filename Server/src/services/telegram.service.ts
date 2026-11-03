import {
  and,
  asc,
  eq,
  lte,
  lt,
  or,
} from "drizzle-orm";
import { db } from "../db/db.js";
import { telegramNotifications } from "../schema/schema.js";

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN?.trim() ?? "";
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID?.trim() ?? "";
const TELEGRAM_MESSAGE_LIMIT = 4096;
const RETRY_DELAY_CAP_MS = 60 * 60 * 1000;

interface OrderNotification {
  id: string;
  fullName: string;
  email: string;
  total: string;
  status: string;
  paymentStatus: string;
  paymentMethod: string;
  createdAt: Date;
}

interface OrderNotificationItem {
  productName: string;
  quantity: number;
  price: string;
}

interface PaymentNotification {
  id: string;
  fullName: string;
  email: string;
  total: string;
  paymentReference: string;
  paymentMethod: string;
  paymentStatus: string;
  paymentDate: Date;
}

interface FailedPaymentNotification {
  id: string;
  fullName: string;
  total: string;
  paymentReference: string;
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function formatMoney(value: string | number): string {
  return `GH₵ ${Number(value).toFixed(2)}`;
}

function fitMessage(title: string, lines: string[]): string {
  let message = `<b>${title}</b>`;
  for (const line of lines) {
    if (message.length + line.length + 1 > TELEGRAM_MESSAGE_LIMIT) break;
    message += `\n${line}`;
  }
  return message;
}

export function newOrderMessage(
  order: OrderNotification,
  items: OrderNotificationItem[],
): string {
  const lines = [
    `<b>Order:</b> ${escapeHtml(order.id)}`,
    `<b>Customer:</b> ${escapeHtml(order.fullName)}`,
    `<b>Email:</b> ${escapeHtml(order.email)}`,
    "<b>Products:</b>",
  ];

  let includedItems = 0;
  for (const item of items) {
    const line =
      `• ${escapeHtml(item.productName)} × ${item.quantity} — ` +
      `${formatMoney(item.price)} each`;
    if (
      [`<b>NEW ORDER RECEIVED</b>`, ...lines, line].join("\n").length >
      TELEGRAM_MESSAGE_LIMIT - 700
    ) {
      break;
    }
    lines.push(line);
    includedItems += 1;
  }
  if (includedItems < items.length) {
    lines.push(`…and ${items.length - includedItems} more item(s).`);
  }

  lines.push(
    `<b>Total:</b> ${formatMoney(order.total)}`,
    `<b>Created:</b> ${escapeHtml(order.createdAt.toISOString())}`,
    `<b>Order status:</b> ${escapeHtml(order.status)}`,
    `<b>Payment status:</b> ${escapeHtml(order.paymentStatus)}`,
  );
  return fitMessage("NEW ORDER RECEIVED", lines);
}

export function successfulPaymentMessage(
  order: PaymentNotification,
): string {
  return fitMessage("PAYMENT SUCCESSFUL", [
    `<b>Order:</b> ${escapeHtml(order.id)}`,
    `<b>Customer:</b> ${escapeHtml(order.fullName)}`,
    `<b>Email:</b> ${escapeHtml(order.email)}`,
    `<b>Amount paid:</b> ${formatMoney(order.total)}`,
    `<b>Reference:</b> ${escapeHtml(order.paymentReference)}`,
    `<b>Method:</b> ${escapeHtml(order.paymentMethod)}`,
    `<b>Payment date:</b> ${escapeHtml(order.paymentDate.toISOString())}`,
    `<b>Payment status:</b> ${escapeHtml(order.paymentStatus)}`,
  ]);
}

export function failedPaymentMessage(
  payment: FailedPaymentNotification,
): string {
  return fitMessage("PAYMENT FAILED", [
    `<b>Order:</b> ${escapeHtml(payment.id)}`,
    `<b>Customer:</b> ${escapeHtml(payment.fullName)}`,
    `<b>Reference:</b> ${escapeHtml(payment.paymentReference)}`,
    `<b>Amount:</b> ${formatMoney(payment.total)}`,
    "<b>Failure status:</b> failed (confirmed by Paystack)",
  ]);
}

let drainIsRunning = false;
let missingConfigurationWasLogged = false;

class TelegramDeliveryError extends Error {
  constructor(message = "Telegram request failed.") {
    super(message);
    this.name = "TelegramDeliveryError";
  }
}

export async function sendTelegramMessage(
  message: string,
  botToken: string,
  chatId: string,
  fetchRequest: typeof fetch = fetch,
): Promise<void> {
  try {
    const response = await fetchRequest(
      `https://api.telegram.org/bot${botToken}/sendMessage`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: chatId,
          text: message,
          parse_mode: "HTML",
          disable_web_page_preview: true,
        }),
        signal: AbortSignal.timeout(10_000),
      },
    );
    const result: { ok?: boolean } = await response.json().catch(() => ({}));
    if (!response.ok || !result.ok) {
      throw new TelegramDeliveryError(
        `Telegram API returned HTTP ${response.status}.`,
      );
    }
  } catch (error) {
    if (error instanceof TelegramDeliveryError) throw error;
    throw new TelegramDeliveryError();
  }
}

async function claimNextNotification() {
  const now = new Date();
  const staleLock = new Date(now.getTime() - 2 * 60 * 1000);

  return db.transaction(async (tx) => {
    const [notification] = await tx
      .select()
      .from(telegramNotifications)
      .where(
        or(
          and(
            eq(telegramNotifications.status, "pending"),
            lte(telegramNotifications.nextAttemptAt, now),
          ),
          and(
            eq(telegramNotifications.status, "processing"),
            lt(telegramNotifications.lockedAt, staleLock),
          ),
        ),
      )
      .orderBy(asc(telegramNotifications.createdAt))
      .limit(1)
      .for("update", { skipLocked: true });

    if (!notification) return null;

    const [claimed] = await tx
      .update(telegramNotifications)
      .set({
        status: "processing",
        lockedAt: now,
        attempts: notification.attempts + 1,
      })
      .where(eq(telegramNotifications.id, notification.id))
      .returning();

    return claimed;
  });
}

async function deliverNotification(
  notification: NonNullable<Awaited<ReturnType<typeof claimNextNotification>>>,
): Promise<void> {
  try {
    await sendTelegramMessage(
      notification.message,
      TELEGRAM_BOT_TOKEN,
      TELEGRAM_CHAT_ID,
    );

    await db
      .update(telegramNotifications)
      .set({
        status: "sent",
        lockedAt: null,
        processedAt: new Date(),
        lastError: null,
      })
      .where(eq(telegramNotifications.id, notification.id));
  } catch (error) {
    const retryDelay = Math.min(
      15_000 * 2 ** Math.min(notification.attempts - 1, 8),
      RETRY_DELAY_CAP_MS,
    );
    const safeError =
      error instanceof TelegramDeliveryError &&
      error.message.startsWith("Telegram API returned")
        ? error.message
        : "Telegram request failed.";

    await db
      .update(telegramNotifications)
      .set({
        status: "pending",
        lockedAt: null,
        nextAttemptAt: new Date(Date.now() + retryDelay),
        lastError: safeError,
      })
      .where(eq(telegramNotifications.id, notification.id));
    console.warn("Telegram notification delivery failed; it will be retried.");
  }
}

async function drainTelegramNotifications(): Promise<void> {
  if (drainIsRunning) return;
  if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
    if (!missingConfigurationWasLogged) {
      console.warn(
        "Telegram notifications are queued but not sent; TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID must be configured.",
      );
      missingConfigurationWasLogged = true;
    }
    return;
  }

  drainIsRunning = true;
  try {
    for (let count = 0; count < 10; count += 1) {
      const notification = await claimNextNotification();
      if (!notification) break;
      await deliverNotification(notification);
    }
  } catch {
    console.error("Could not process the Telegram notification queue.");
  } finally {
    drainIsRunning = false;
  }
}

export function startTelegramNotificationWorker(): void {
  void drainTelegramNotifications();
  const timer = setInterval(() => void drainTelegramNotifications(), 5_000);
  timer.unref();
}
