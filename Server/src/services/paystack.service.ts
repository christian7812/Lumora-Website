import { createHmac, timingSafeEqual } from "node:crypto";

export function isValidPaystackSignature(
  rawBody: Buffer,
  signature: string | undefined,
  secret: string,
): boolean {
  if (!secret || !signature || !/^[a-f\d]{128}$/i.test(signature)) {
    return false;
  }

  const expected = createHmac("sha512", secret).update(rawBody).digest();
  const received = Buffer.from(signature, "hex");
  return received.length === expected.length && timingSafeEqual(received, expected);
}

export function matchesOrderAmountAndCurrency(
  transaction: { amount: number; currency: string },
  orderTotal: string | number,
): boolean {
  return (
    transaction.amount === Math.round(Number(orderTotal) * 100) &&
    transaction.currency.toUpperCase() === "GHS"
  );
}
