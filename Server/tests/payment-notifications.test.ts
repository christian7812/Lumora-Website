import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import { test } from "node:test";

process.env.DATABASE_URL ??= "postgresql://test:test@127.0.0.1:5432/test";

const {
  isValidPaystackSignature,
  matchesOrderAmountAndCurrency,
} = await import("../src/services/paystack.service.js");
const {
  failedPaymentMessage,
  newOrderMessage,
  sendTelegramMessage,
  serializeQueueError,
  successfulPaymentMessage,
} = await import("../src/services/telegram.service.js");

test("Paystack signature validation requires the exact raw request body", () => {
  const body = Buffer.from('{"event":"charge.success"}');
  const secret = "test-paystack-secret";
  const signature = createHmac("sha512", secret).update(body).digest("hex");

  assert.equal(isValidPaystackSignature(body, signature, secret), true);
  assert.equal(
    isValidPaystackSignature(Buffer.from(`${body.toString()} `), signature, secret),
    false,
  );
  assert.equal(isValidPaystackSignature(body, "invalid", secret), false);
  assert.equal(isValidPaystackSignature(body, signature, ""), false);
});

test("payment is accepted only for the exact order amount and GHS currency", () => {
  assert.equal(
    matchesOrderAmountAndCurrency(
      { amount: 12550, currency: "GHS" },
      "125.50",
    ),
    true,
  );
  assert.equal(
    matchesOrderAmountAndCurrency(
      { amount: 12549, currency: "GHS" },
      "125.50",
    ),
    false,
  );
  assert.equal(
    matchesOrderAmountAndCurrency(
      { amount: 12550, currency: "USD" },
      "125.50",
    ),
    false,
  );
});

test("Telegram order message includes order and line-item details safely", () => {
  const message = newOrderMessage(
    {
      id: "order-1",
      fullName: "<Admin & Customer>",
      email: "customer@example.com",
      total: "25.50",
      status: "pending",
      paymentStatus: "unpaid",
      paymentMethod: "paystack",
      createdAt: new Date("2026-11-03T10:00:00.000Z"),
    },
    [{ productName: "Ring <Gold>", quantity: 2, price: "12.75" }],
  );

  assert.match(message, /NEW ORDER RECEIVED/);
  assert.match(message, /&lt;Admin &amp; Customer&gt;/);
  assert.match(message, /Ring &lt;Gold&gt; × 2 — GH₵ 12\.75 each/);
  assert.match(message, /GH₵ 25\.50/);
  assert.match(message, /Payment status:<\/b> unpaid/);
});

test("Telegram messages stay within the Bot API message length limit", () => {
  const message = newOrderMessage(
    {
      id: "order-3",
      fullName: "Customer",
      email: "customer@example.com",
      total: "100.00",
      status: "pending",
      paymentStatus: "unpaid",
      paymentMethod: "paystack",
      createdAt: new Date("2026-11-03T10:00:00.000Z"),
    },
    Array.from({ length: 100 }, (_, index) => ({
      productName: `Product ${index} ${"long name ".repeat(10)}`,
      quantity: 1,
      price: "1.00",
    })),
  );

  assert.ok(message.length <= 4096);
});

test("payment notification messages include required successful and failed details", () => {
  const success = successfulPaymentMessage({
    id: "order-2",
    fullName: "Customer",
    email: "customer@example.com",
    total: "40.00",
    paymentReference: "LMR-ref",
    paymentMethod: "paystack (card)",
    paymentStatus: "paid",
    paymentDate: new Date("2026-11-03T10:00:00.000Z"),
  });
  const failure = failedPaymentMessage({
    id: "order-2",
    fullName: "Customer",
    total: "40.00",
    paymentReference: "LMR-ref",
  });

  assert.match(success, /PAYMENT SUCCESSFUL/);
  assert.match(success, /customer@example\.com/);
  assert.match(success, /GH₵ 40\.00/);
  assert.match(success, /LMR-ref/);
  assert.match(success, /paystack \(card\)/);
  assert.match(failure, /PAYMENT FAILED/);
  assert.match(failure, /confirmed by Paystack/);
});

test("Telegram API failure is reported without exposing request credentials", async () => {
  const sendMock: typeof fetch = async () =>
    new Response(JSON.stringify({ ok: false }), { status: 500 });

  await assert.rejects(
    sendTelegramMessage("test", "token-must-not-leak", "chat", sendMock),
    (error: unknown) =>
      error instanceof Error &&
      error.message.includes("HTTP 500") &&
      !error.message.includes("token-must-not-leak"),
  );
});

test("queue error serialization preserves SQLSTATE and redacts bot tokens", () => {
  const error = Object.assign(
    new Error(
      'request to https://api.telegram.org/bot123456:ABCDEFGHIJKLMNOPQRSTUVWXYZ012345/sendMessage failed',
    ),
    { code: "42P01" },
  );
  const serialized = serializeQueueError(error);

  assert.equal(serialized.name, "Error");
  assert.equal(serialized.code, "42P01");
  assert.match(serialized.message, /REDACTED/);
  assert.doesNotMatch(serialized.message, /ABCDEFGHIJKLMNOPQRSTUVWXYZ/);
});
