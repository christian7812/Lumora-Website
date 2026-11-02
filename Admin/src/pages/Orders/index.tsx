import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ShoppingCart, Eye } from "lucide-react";
import { orders } from "./data";


function getStatusClass(status: string) {
  switch (status) {
    case "Paid":
    case "Delivered":
      return "bg-green-100 text-green-700";
    case "Pending":
    case "Processing":
      return "bg-yellow-100 text-yellow-700";
    case "Shipped":
      return "bg-blue-100 text-blue-700";
    case "Failed":
    case "Cancelled":
      return "bg-red-100 text-red-700";
    default:
      return "bg-muted text-muted-foreground";
  }
}

export default function OrdersPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Orders</h1>
        <p className="text-muted-foreground">
          View and manage customer purchases.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Total Orders
            </CardTitle>
            <ShoppingCart className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">4</p>
            <p className="text-xs text-muted-foreground">
              Sample orders
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Orders</CardTitle>
        </CardHeader>

        <CardContent>
          <div className="w-full overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b text-muted-foreground">
                  <th className="p-3">Order ID</th>
                  <th className="p-3">Customer</th>
                  <th className="p-3">Date</th>
                  <th className="p-3">Total</th>
                  <th className="p-3">Payment</th>
                  <th className="p-3">Order Status</th>
                  <th className="p-3">Action</th>
                </tr>
              </thead>

              <tbody>
                {orders.map((order) => (
                  <tr key={order.id} className="border-b last:border-0">
                    <td className="p-3 font-medium">{order.id}</td>
                    <td className="p-3">{order.customer}</td>
                    <td className="p-3">{order.date}</td>
                    <td className="p-3">{order.total}</td>
                    <td className="p-3">
                      <span
                        className={`rounded-full px-2 py-1 text-xs ${getStatusClass(
                          order.payment
                        )}`}
                      >
                        {order.payment}
                      </span>
                    </td>
                    <td className="p-3">
                      <span
                        className={`rounded-full px-2 py-1 text-xs ${getStatusClass(
                          order.status
                        )}`}
                      >
                        {order.status}
                      </span>
                    </td>
                    <td className="p-3">
                      <Button variant="outline" size="sm">
                        <Eye className="mr-2 h-4 w-4" />
                        View
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}