import { useShow } from "@refinedev/core";
import { Link } from "react-router";
interface CustomerOrder { id: string; total: string | number; status: string; createdAt: string }
interface Customer { id: string; name: string; email: string; phone: string; orderCount: number; totalSpent: string | number; orders: CustomerOrder[] }
export default function CustomerShow() {
  const { result, query } = useShow<Customer>({ resource: "customers" });
  if (query.isLoading) return <div className="p-6">Loading customer…</div>;
  if (query.isError || !result) return <div className="p-6" role="alert">Could not load this customer. <Link to="/customers" className="underline">Back to customers</Link></div>;
  const customer = result;
  return <main className="space-y-6 p-6"><Link to="/customers" className="underline">← Customers</Link><h1 className="text-3xl font-bold">{customer.name}</h1><p>{customer.email} · {customer.phone}</p><p>{customer.orderCount} active orders · GH₵ {Number(customer.totalSpent).toFixed(2)} paid</p><h2 className="text-xl font-semibold">Orders</h2><ul className="space-y-2">{customer.orders.map((order) => <li key={order.id} className="rounded border p-4"><Link className="underline" to={`/orders/show/${order.id}`}>{order.id}</Link> · {order.status} · GH₵ {Number(order.total).toFixed(2)} · {new Date(order.createdAt).toLocaleDateString()}</li>)}</ul>{customer.orders.length === 0 && <p>No orders yet.</p>}</main>;
}
