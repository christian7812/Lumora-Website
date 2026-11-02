import { useShow } from "@refinedev/core";
import { Link } from "react-router";
import { Button } from "@/components/ui/button";

interface CustomerOrder {
  id: string;
  total: string | number;
  status: string;
  paymentStatus?: string;
  createdAt: string;
}

interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  orderCount: number;
  totalSpent: string | number;
  orders: CustomerOrder[];
}

export default function CustomerShow() {
  const { result, query } = useShow<Customer>({ resource: "customers" });

  if (query.isLoading) {
    return <div className="p-6 text-muted-foreground">Loading customer details…</div>;
  }

  const customer = ((result as unknown as { data?: Customer })?.data ?? result) as Customer | undefined;

  if (query.isError || !customer) {
    return (
      <div className="space-y-4 p-6" role="alert">
        <h1 className="text-2xl font-bold">Could not load customer</h1>
        <p className="text-muted-foreground">
          The requested customer profile could not be found or loaded.
        </p>
        <Button asChild variant="outline">
          <Link to="/customers">← Back to customers</Link>
        </Button>
      </div>
    );
  }

  const orders = customer.orders ?? [];

  return (
    <main className="space-y-6 p-6">
      <div>
        <Button asChild variant="ghost" className="-ml-3">
          <Link to="/customers">← Back to customers</Link>
        </Button>
        <h1 className="mt-2 text-3xl font-bold tracking-tight">{customer.name || "Customer"}</h1>
        <p className="text-sm text-muted-foreground">
          {customer.email} {customer.phone ? `· ${customer.phone}` : ""}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-xl border border-border bg-card p-4">
          <span className="text-xs text-muted-foreground uppercase font-bold">Total Orders</span>
          <p className="mt-1 text-2xl font-extrabold">{customer.orderCount ?? orders.length}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <span className="text-xs text-muted-foreground uppercase font-bold">Total Spent</span>
          <p className="mt-1 text-2xl font-extrabold text-emerald-600">
            GH₵ {Number(customer.totalSpent ?? 0).toFixed(2)}
          </p>
        </div>
      </div>

      <div className="space-y-3">
        <h2 className="text-xl font-bold">Order History</h2>
        {orders.length === 0 ? (
          <p className="text-sm text-muted-foreground">No orders recorded for this customer yet.</p>
        ) : (
          <div className="divide-y divide-border rounded-xl border border-border bg-card">
            {orders.map((order) => (
              <div key={order.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
                <div>
                  <Link
                    to={`/orders/show/${order.id}`}
                    className="font-mono text-sm font-bold text-primary hover:underline"
                  >
                    {order.id}
                  </Link>
                  <p className="text-xs text-muted-foreground">
                    Placed on {new Date(order.createdAt).toLocaleDateString(undefined, { dateStyle: "medium" })}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-black">
                    GH₵ {Number(order.total).toFixed(2)}
                  </span>
                  <span className="rounded-full bg-secondary px-2.5 py-0.5 text-xs font-semibold uppercase">
                    {order.status}
                  </span>
                  <Button asChild size="sm" variant="outline">
                    <Link to={`/orders/show/${order.id}`}>View</Link>
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
