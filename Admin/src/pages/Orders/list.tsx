import { useList } from "@refinedev/core";
import { Link } from "react-router";
import { Button } from "@/components/ui/button";

interface Order {
  id: string;
  fullName: string;
  email: string;
  total: string | number;
  paymentMethod: string;
  paymentStatus?: "unpaid" | "paid" | "refunded";
  status: string;
  createdAt: string;
}

function formatMoney(value: string | number): string {
  const amount = Number(value);
  return Number.isFinite(amount) ? `GH₵ ${amount.toFixed(2)}` : "—";
}

export default function OrdersList() {
  // RequireAdmin in App.tsx already gates this page — useList runs only when authenticated
  const { result, query } = useList<Order>({
    resource: "orders",
    pagination: { pageSize: 50 },
  });

  const orders: Order[] = (result.data ?? []) as Order[];

  if (query.isLoading) {
    return <div className="p-6 text-muted-foreground">Loading orders…</div>;
  }

  if (query.isError) {
    return (
      <div className="space-y-4 p-6" role="alert">
        <h1 className="text-2xl font-bold">Failed to load orders</h1>
        <p className="text-muted-foreground">
          Check your admin sign-in and backend connection, then try again.
        </p>
        <Button variant="outline" onClick={() => void query.refetch()}>
          Try again
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Orders</h1>
          <p className="text-muted-foreground">
            Manage and fulfil customer orders.
          </p>
        </div>
        <span className="text-sm text-muted-foreground">
          {orders.length} order{orders.length !== 1 ? "s" : ""}
        </span>
      </div>

      <div className="overflow-x-auto rounded-lg border">
        <table className="w-full text-left text-sm">
          <thead className="border-b bg-muted/50">
            <tr>
              <th className="p-3 font-medium">Order ID</th>
              <th className="p-3 font-medium">Customer</th>
              <th className="p-3 font-medium">Email</th>
              <th className="p-3 font-medium">Total</th>
              <th className="p-3 font-medium">Payment</th>
              <th className="p-3 font-medium">Status</th>
              <th className="p-3 font-medium">Action</th>
            </tr>
          </thead>

          <tbody>
            {orders.map((order) => (
              <tr key={order.id} className="border-t hover:bg-muted/30">
                <td className="p-3 font-mono text-xs text-muted-foreground">
                  {order.id.slice(0, 8)}…
                </td>
                <td className="p-3 font-medium">{order.fullName}</td>
                <td className="p-3">{order.email}</td>
                <td className="p-3">{formatMoney(order.total)}</td>
                <td className="p-3">
                  <div className="capitalize font-medium">
                    {order.paymentMethod ? order.paymentMethod.replace("_", " ") : "—"}
                  </div>
                  <span
                    className={`inline-block mt-0.5 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${
                      order.paymentStatus === "paid"
                        ? "bg-emerald-100 text-emerald-800"
                        : order.paymentStatus === "refunded"
                        ? "bg-purple-100 text-purple-800"
                        : "bg-amber-100 text-amber-800"
                    }`}
                  >
                    {order.paymentStatus ?? "unpaid"}
                  </span>
                </td>
                <td className="p-3">
                  <span
                    className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${
                      order.status === "delivered"
                        ? "bg-green-100 text-green-800"
                        : order.status === "cancelled"
                        ? "bg-red-100 text-red-800"
                        : order.status === "shipped"
                        ? "bg-blue-100 text-blue-800"
                        : order.status === "processing"
                        ? "bg-yellow-100 text-yellow-800"
                        : "bg-gray-100 text-gray-700"
                    }`}
                  >
                    {order.status}
                  </span>
                </td>
                <td className="p-3">
                  <Button asChild size="sm" variant="outline">
                    <Link to={`/orders/show/${order.id}`}>View details</Link>
                  </Button>
                </td>
              </tr>
            ))}

            {orders.length === 0 && (
              <tr>
                <td colSpan={7} className="p-8 text-center text-muted-foreground">
                  No orders found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
