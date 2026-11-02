import { useShow, useUpdate, type BaseRecord, type HttpError } from "@refinedev/core";
import { useState } from "react";
import { Link } from "react-router";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const orderStatuses = [
  "pending",
  "processing",
  "shipped",
  "delivered",
  "cancelled",
] as const;

type OrderStatus = (typeof orderStatuses)[number];

function isOrderStatus(value: string): value is OrderStatus {
  return orderStatuses.some((status) => status === value);
}

interface OrderItem {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  price: string | number;
}

interface OrderDetails extends BaseRecord {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  region: string;
  paymentMethod: string;
  subtotal: string | number;
  shipping: string | number;
  total: string | number;
  status: string;
  paymentStatus: "unpaid" | "paid" | "refunded";
  paymentReference?: string | null;
  createdAt: string;
  items: OrderItem[];
}

function getHttpStatus(error: unknown): number | undefined {
  if (typeof error !== "object" || error === null) return undefined;

  if ("statusCode" in error && typeof error.statusCode === "number") {
    return error.statusCode;
  }

  if ("response" in error && typeof error.response === "object" && error.response !== null) {
    const response = error.response as { status?: unknown };
    return typeof response.status === "number" ? response.status : undefined;
  }

  return undefined;
}

function formatMoney(value: string | number): string {
  const amount = Number(value);
  return Number.isFinite(amount) ? `GH₵ ${amount.toFixed(2)}` : "—";
}

function formatDate(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
}

export default function OrderDetailsPage() {
  const [statusDraft, setStatusDraft] = useState<string>();
  const [statusMessage, setStatusMessage] = useState("");
  const [statusError, setStatusError] = useState("");
  const { result: showResult, query } = useShow<OrderDetails>({
    resource: "orders",
  });
  const order = showResult?.data;
  const { mutateAsync: updateOrderStatus, mutation: statusMutation } = useUpdate<
    OrderDetails,
    HttpError,
    { status?: OrderStatus; paymentStatus?: "unpaid" | "paid" | "refunded" }
  >();

  if (query.isLoading) {
    return <div className="p-6" role="status">Loading order details...</div>;
  }

  if (query.isError) {
    const isNotFound = getHttpStatus(query.error) === 404;

    return (
      <div className="space-y-4 p-6" role="alert">
        <h1 className="text-2xl font-bold">
          {isNotFound ? "Order not found" : "Could not load this order"}
        </h1>
        <p className="text-muted-foreground">
          {isNotFound
            ? "The order may have been removed or the order ID is incorrect."
            : "Check your admin sign-in and backend connection, then try again."}
        </p>
        <div className="flex gap-3">
          <Button asChild variant="outline">
            <Link to="/orders">Back to orders</Link>
          </Button>
          {!isNotFound && (
            <Button variant="outline" onClick={() => query.refetch()}>
              Try again
            </Button>
          )}
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="space-y-4 p-6">
        <h1 className="text-2xl font-bold">Order not found</h1>
        <p className="text-muted-foreground">No order details were returned.</p>
        <Button asChild variant="outline">
          <Link to="/orders">Back to orders</Link>
        </Button>
      </div>
    );
  }

  const orderId = order.id;
  const selectedStatus = statusDraft ?? order.status;
  const hasStatusChange =
    selectedStatus !== order.status && isOrderStatus(selectedStatus);
  const nextPaymentStatus = order.paymentStatus === "unpaid" ? "paid" : order.paymentStatus === "paid" ? "refunded" : undefined;

  async function saveStatus() {
    if (!hasStatusChange || !isOrderStatus(selectedStatus)) return;

    setStatusError("");
    setStatusMessage("");
    try {
      await updateOrderStatus({
        resource: "orders",
        id: orderId,
        values: { status: selectedStatus },
      });
      setStatusDraft(undefined);
      setStatusMessage("Order status updated.");
      void query.refetch();
    } catch (error) {
      setStatusError(
        error instanceof Error ? error.message : "Could not update the order status.",
      );
    }
  }

  async function savePaymentStatus() {
    if (!nextPaymentStatus) return;
    setStatusError(""); setStatusMessage("");
    try {
      await updateOrderStatus({ resource: "orders", id: orderId, values: { paymentStatus: nextPaymentStatus } });
      setStatusMessage(`Payment marked ${nextPaymentStatus}.`);
      void query.refetch();
    } catch (error) {
      setStatusError(error instanceof Error ? error.message : "Could not update payment status.");
    }
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-2">
          <Button asChild variant="ghost" className="-ml-3">
            <Link to="/orders">← Back to orders</Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Order details</h1>
            <p className="break-all text-sm text-muted-foreground">{order.id}</p>
          </div>
        </div>
        <Badge variant="secondary" className="capitalize">
          {order.status}
        </Badge>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Customer and delivery</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-5 sm:grid-cols-2">
            <Detail label="Customer" value={order.fullName} />
            <Detail label="Email" value={order.email} />
            <Detail label="Phone" value={order.phone} />
            <Detail label="City" value={order.city} />
            <Detail label="Region" value={order.region} />
            <Detail label="Delivery address" value={order.address} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Order summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Detail label="Payment method" value={order.paymentMethod} />
            <Detail label="Payment status" value={order.paymentStatus} />
            {order.paymentReference && (
              <Detail label="Paystack reference" value={order.paymentReference} />
            )}
            <Detail label="Order status" value={order.status} />
            <Detail label="Created" value={formatDate(order.createdAt)} />
            <div className="space-y-3 border-t pt-4">
              {nextPaymentStatus && (
                <Button type="button" variant="outline" onClick={() => void savePaymentStatus()} disabled={statusMutation.isPending}>
                  Mark payment {nextPaymentStatus}
                </Button>
              )}
              <Label htmlFor="order-status">Update fulfillment status</Label>
              <Select
                value={selectedStatus}
                onValueChange={(value) => {
                  setStatusDraft(value);
                  setStatusMessage("");
                  setStatusError("");
                }}
                disabled={statusMutation.isPending}
              >
                <SelectTrigger id="order-status" className="w-full">
                  <SelectValue placeholder="Choose a status" />
                </SelectTrigger>
                <SelectContent>
                  {!isOrderStatus(order.status) && (
                    <SelectItem value={order.status}>
                      {order.status} (current)
                    </SelectItem>
                  )}
                  {orderStatuses.map((status) => (
                    <SelectItem key={status} value={status}>
                      <span className="capitalize">{status}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                type="button"
                onClick={() => void saveStatus()}
                disabled={!hasStatusChange || statusMutation.isPending}
              >
                {statusMutation.isPending ? "Saving status…" : "Save status"}
              </Button>
              {statusMessage && (
                <p className="text-sm text-green-700" role="status" aria-live="polite">
                  {statusMessage}
                </p>
              )}
              {statusError && (
                <div className="space-y-1 text-sm text-destructive" role="alert">
                  <p>{statusError}</p>
                  {(getHttpStatus(statusMutation.error) === 401 ||
                    getHttpStatus(statusMutation.error) === 403) && (
                    <Link className="underline" to="/orders">
                      Go to admin sign in
                    </Link>
                  )}
                </div>
              )}
            </div>
            <div className="space-y-3 border-t pt-4 text-sm">
              <Amount label="Subtotal" value={order.subtotal} />
              <Amount label="Shipping" value={order.shipping} />
              <Amount label="Total" value={order.total} emphasized />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Purchased items</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead className="text-right">Quantity</TableHead>
                <TableHead className="text-right">Unit price</TableHead>
                <TableHead className="text-right">Line total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(order.items ?? []).map((item: OrderItem) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{item.productName}</TableCell>
                  <TableCell className="text-right">{item.quantity}</TableCell>
                  <TableCell className="text-right">{formatMoney(item.price)}</TableCell>
                  <TableCell className="text-right">
                    {formatMoney(Number(item.price) * item.quantity)}
                  </TableCell>
                </TableRow>
              ))}
              {(order.items ?? []).length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="py-8 text-center text-muted-foreground">
                    This order has no saved line items.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 space-y-1">
      <dt className="text-sm text-muted-foreground">{label}</dt>
      <dd className="break-words font-medium">{value || "—"}</dd>
    </div>
  );
}

function Amount({
  label,
  value,
  emphasized = false,
}: {
  label: string;
  value: string | number;
  emphasized?: boolean;
}) {
  return (
    <div className={`flex justify-between gap-4 ${emphasized ? "border-t pt-3 text-base font-bold" : ""}`}>
      <span className={emphasized ? "text-foreground" : "text-muted-foreground"}>
        {label}
      </span>
      <span>{formatMoney(value)}</span>
    </div>
  );
}
