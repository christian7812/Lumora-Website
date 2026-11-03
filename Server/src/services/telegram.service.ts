import {
  and,
  asc,
  eq,
  gte,
  lte,
  lt,
  or,
} from "drizzle-orm";
import { db } from "../db/db.js";
import { telegramNotifications } from "../schema/schema.js";

const TELEGRAM_MESSAGE_LIMIT = 4096;
const RETRY_DELAY_CAP_MS = 60 * 60 * 1000;
const MAX_DELIVERY_ATTEMPTS = 8;
const QUEUE_POLL_INTERVAL_MS = 5_000;
const QUEUE_POLL_BACKOFF_CAP_MS = 5 * 60 * 1000;

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

function getTelegramCredentials() {
  return {
    botToken: process.env.TELEGRAM_BOT_TOKEN?.trim() ?? "",
    chatId: process.env.TELEGRAM_CHAT_ID?.trim() ?? "",
  };
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
let workerIsRunning = false;
let missingConfigurationWasLogged = false;
let queuePollDelayMs = QUEUE_POLL_INTERVAL_MS;

class TelegramDeliveryError extends Error {
  constructor(
    message = "Telegram request failed.",
    options?: ErrorOptions,
  ) {
    super(message, options);
    this.name = "TelegramDeliveryError";
  }
}

function redactSecrets(value: string): string {
  return value
    .replace(/\b\d{5,}:[A-Za-z0-9_-]{20,}\b/g, "[REDACTED_BOT_TOKEN]")
    .replace(/(bot)[^/\s]+(?=\/sendMessage)/gi, "$1[REDACTED]")
    .replace(/\bpostgres(?:ql)?:\/\/[^@\s]+@/gi, "postgresql://[REDACTED]@");
}

interface SerializedQueueError {
  name: string;
  code?: string;
  message: string;
  stack?: string;
  cause?: SerializedQueueError;
}

export function serializeQueueError(
  error: unknown,
  depth = 0,
): SerializedQueueError {
  if (!(error instanceof Error)) {
    return {
      name: "NonErrorThrow",
      message: redactSecrets(String(error)),
    };
  }

  const code =
    "code" in error && typeof error.code === "string" ? error.code : undefined;

  return {
    name: error.name,
    ...(code ? { code } : {}),
    message: redactSecrets(error.message),
    ...(error.stack ? { stack: redactSecrets(error.stack) } : {}),
    ...(depth < 2 && error.cause !== undefined
      ? { cause: serializeQueueError(error.cause, depth + 1) }
      : {}),
  };
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
    throw new TelegramDeliveryError("Telegram request failed.", { cause: error });
  }
}

async function claimNextNotification() {
  const now = new Date();
  const staleLock = new Date(now.getTime() - 2 * 60 * 1000);

  return db.transaction(async (tx) => {
    await tx
      .update(telegramNotifications)
      .set({
        status: "failed",
        lockedAt: null,
        lastError: "Maximum delivery attempts exceeded.",
      })
      .where(
        and(
          eq(telegramNotifications.status, "pending"),
          gte(telegramNotifications.attempts, MAX_DELIVERY_ATTEMPTS),
        ),
      );

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

    if (notification.attempts >= MAX_DELIVERY_ATTEMPTS) {
      await tx
        .update(telegramNotifications)
        .set({
          status: "failed",
          lockedAt: null,
          lastError: "Worker lease expired after maximum delivery attempts.",
        })
        .where(eq(telegramNotifications.id, notification.id));
      return null;
    }

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
    const { botToken, chatId } = getTelegramCredentials();
    await sendTelegramMessage(
      notification.message,
      botToken,
      chatId,
    );
  } catch (error) {
    const retryDelay = Math.min(
      30_000 * 2 ** Math.min(notification.attempts - 1, 6),
      RETRY_DELAY_CAP_MS,
    );
    const permanentlyFailed = notification.attempts >= MAX_DELIVERY_ATTEMPTS;
    const safeError =
      error instanceof TelegramDeliveryError &&
      error.message.startsWith("Telegram API returned")
        ? error.message
        : "Telegram request failed.";

    await db
      .update(telegramNotifications)
      .set({
        status: permanentlyFailed ? "failed" : "pending",
        lockedAt: null,
        ...(permanentlyFailed
          ? {}
          : { nextAttemptAt: new Date(Date.now() + retryDelay) }),
        lastError: safeError,
      })
      .where(eq(telegramNotifications.id, notification.id));
    console.warn(
      JSON.stringify({
        event: "telegram_delivery_failed",
        notificationId: notification.id,
        attempt: notification.attempts,
        maxAttempts: MAX_DELIVERY_ATTEMPTS,
        retryInMs: permanentlyFailed ? null : retryDelay,
        terminal: permanentlyFailed,
        error: serializeQueueError(error),
      }),
    );
    return;
  }

  await db
    .update(telegramNotifications)
    .set({
      status: "sent",
      lockedAt: null,
      processedAt: new Date(),
      lastError: null,
    })
    .where(eq(telegramNotifications.id, notification.id));
}

async function drainTelegramNotifications(): Promise<boolean> {
  if (drainIsRunning) return true;
  const { botToken, chatId } = getTelegramCredentials();
  if (!botToken || !chatId) {
    if (!missingConfigurationWasLogged) {
      console.warn(
        "Telegram notifications are queued but not sent; TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID must be configured.",
      );
      missingConfigurationWasLogged = true;
    }
    return true;
  }

  drainIsRunning = true;
  try {
    for (let count = 0; count < 10; count += 1) {
      const notification = await claimNextNotification();
      if (!notification) break;
      await deliverNotification(notification);
    }
  } catch (error) {
    console.error(
      JSON.stringify({
        event: "telegram_queue_processing_failed",
        phase: "database_queue_claim_or_acknowledgement",
        error: serializeQueueError(error),
      }),
    );
    return false;
  } finally {
    drainIsRunning = false;
  }
  return true;
}

export function startTelegramNotificationWorker(): void {
  if (workerIsRunning) return;
  workerIsRunning = true;

  const poll = async () => {
    const succeeded = await drainTelegramNotifications();
    if (succeeded) {
      queuePollDelayMs = QUEUE_POLL_INTERVAL_MS;
    } else {
      queuePollDelayMs = Math.min(
        queuePollDelayMs * 2,
        QUEUE_POLL_BACKOFF_CAP_MS,
      );
    }

    const timer = setTimeout(poll, queuePollDelayMs);
    timer.unref();
  };

  void poll();
}
