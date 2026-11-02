import { useEffect, useState } from "react";
import { Link } from "react-router";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { API_URL } from "@/providers/constants";
import {
  Package,
  Users,
  ShoppingBag,
  Banknote,
  Clock,
  AlertTriangle,
  ArrowRight,
  TrendingUp,
  Plus,
  ExternalLink,
  RefreshCw,
  Eye,
} from "lucide-react";

interface RecentOrder {
  id: string;
  fullName: string;
  email: string;
  total: string | number;
  status: string;
  paymentStatus: string;
  createdAt: string;
}

interface DashboardData {
  activeProducts: number;
  customerCount: number;
  totalOrders: number;
  paidRevenue: number;
  unpaidOrders: number;
  outOfStockProducts: number;
  recentOrders: RecentOrder[];
}

export const DashboardPage = () => {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadData = () => {
    setLoading(true);
    setError("");
    fetch(`${API_URL}/dashboard`, { credentials: "include" })
      .then(async (response) => {
        const body: DashboardData | { message?: string } = await response
          .json()
          .catch(() => ({}));
        if (!response.ok)
          throw new Error(
            "message" in body ? body.message : "Could not load dashboard.",
          );
        setData(body as DashboardData);
      })
      .catch((reason: unknown) =>
        setError(
          reason instanceof Error
            ? reason.message
            : "Could not load dashboard.",
        ),
      )
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
  }, []);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  const statCards = data
    ? [
        {
          title: "Paid Revenue",
          value: `GH₵ ${data.paidRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
          icon: Banknote,
          color: "text-emerald-500",
          bg: "bg-emerald-500/10",
          badge: "Paid Invoices",
        },
        {
          title: "Total Orders",
          value: data.totalOrders,
          icon: ShoppingBag,
          color: "text-blue-500",
          bg: "bg-blue-500/10",
          badge: "All Time",
        },
        {
          title: "Active Products",
          value: data.activeProducts,
          icon: Package,
          color: "text-amber-500",
          bg: "bg-amber-500/10",
          badge: "In Catalog",
        },
        {
          title: "Customers",
          value: data.customerCount,
          icon: Users,
          color: "text-purple-500",
          bg: "bg-purple-500/10",
          badge: "Unique Buyers",
        },
        {
          title: "Pending Orders",
          value: data.unpaidOrders,
          icon: Clock,
          color: "text-orange-500",
          bg: "bg-orange-500/10",
          badge: "Requires Action",
        },
        {
          title: "Out of Stock",
          value: data.outOfStockProducts,
          icon: AlertTriangle,
          color:
            data.outOfStockProducts > 0
              ? "text-rose-500"
              : "text-muted-foreground",
          bg:
            data.outOfStockProducts > 0
              ? "bg-rose-500/10"
              : "bg-muted",
          badge: "Inventory Alert",
        },
      ]
    : [];

  return (
    <div className="space-y-8 p-6 lg:p-8">
      {/* Top Welcome Banner */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-black tracking-tight text-foreground">
              {getGreeting()}, Admin
            </h1>
            <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-500 ring-4 ring-emerald-500/20" />
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            Here is what is happening across your Lumora store today.
          </p>
        </div>

        {/* Quick Actions */}
        <div className="flex flex-wrap items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={loadData}
            disabled={loading}
            className="rounded-xl gap-1.5"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
            <span>Refresh</span>
          </Button>

          <Button asChild size="sm" className="rounded-xl gap-1.5 bg-primary text-primary-foreground font-bold shadow-sm">
            <Link to="/products/create">
              <Plus className="h-4 w-4" />
              <span>Add Product</span>
            </Link>
          </Button>

          <Button asChild variant="outline" size="sm" className="rounded-xl gap-1.5">
            <a href="http://localhost:5173" target="_blank" rel="noreferrer">
              <span>View Store</span>
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </Button>
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div
          role="alert"
          className="flex items-center justify-between rounded-2xl border border-destructive/20 bg-destructive/10 p-4 text-sm text-destructive"
        >
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 shrink-0" />
            <p className="font-semibold">{error}</p>
          </div>
          <Button variant="outline" size="sm" onClick={loadData}>
            Try again
          </Button>
        </div>
      )}

      {/* Metric Cards Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {loading
          ? Array.from({ length: 6 }).map((_, i) => (
              <Card key={i} className="rounded-2xl p-4 border border-border/80">
                <Skeleton className="h-4 w-20 mb-2" />
                <Skeleton className="h-8 w-28" />
              </Card>
            ))
          : statCards.map((stat) => {
              const Icon = stat.icon;
              return (
                <Card
                  key={stat.title}
                  className="rounded-2xl border border-border/80 bg-card transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
                >
                  <CardHeader className="flex flex-row items-center justify-between p-4 pb-2">
                    <span className="text-xs font-bold text-muted-foreground">
                      {stat.title}
                    </span>
                    <div
                      className={`flex h-8 w-8 items-center justify-center rounded-xl ${stat.bg} ${stat.color}`}
                    >
                      <Icon className="h-4 w-4" />
                    </div>
                  </CardHeader>

                  <CardContent className="p-4 pt-0">
                    <div className="text-xl font-black tracking-tight text-foreground">
                      {stat.value}
                    </div>
                    <span className="mt-1 inline-block text-[10px] font-semibold text-muted-foreground">
                      {stat.badge}
                    </span>
                  </CardContent>
                </Card>
              );
            })}
      </div>

      {/* Recent Orders Section */}
      <Card className="overflow-hidden rounded-2xl border border-border/80 shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between border-b border-border/60 bg-muted/20 px-6 py-4">
          <div>
            <CardTitle className="text-base font-bold text-foreground">
              Recent Customer Orders
            </CardTitle>
            <p className="text-xs text-muted-foreground">
              Live snapshot of customer purchases and fulfilment status
            </p>
          </div>

          <Button asChild variant="ghost" size="sm" className="rounded-xl gap-1 text-xs font-bold text-primary hover:text-primary">
            <Link to="/orders">
              <span>View All Orders</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </Button>
        </CardHeader>

        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-border/60 bg-muted/40 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="px-6 py-3.5">Customer</th>
                  <th className="px-6 py-3.5">Order ID</th>
                  <th className="px-6 py-3.5">Total Amount</th>
                  <th className="px-6 py-3.5">Fulfilment</th>
                  <th className="px-6 py-3.5">Payment</th>
                  <th className="px-6 py-3.5">Date</th>
                  <th className="px-6 py-3.5 text-right">Action</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-border/60">
                {loading ? (
                  Array.from({ length: 4 }).map((_, i) => (
                    <tr key={i}>
                      <td className="px-6 py-4" colSpan={7}>
                        <Skeleton className="h-5 w-full" />
                      </td>
                    </tr>
                  ))
                ) : data?.recentOrders && data.recentOrders.length > 0 ? (
                  data.recentOrders.map((order) => {
                    const initials = order.fullName
                      ? order.fullName
                          .split(" ")
                          .map((n) => n[0])
                          .join("")
                          .toUpperCase()
                          .slice(0, 2)
                      : "CU";

                    return (
                      <tr
                        key={order.id}
                        className="transition-colors hover:bg-muted/30"
                      >
                        <td className="px-6 py-3.5">
                          <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-tr from-amber-400 to-yellow-500 text-xs font-black text-black">
                              {initials}
                            </div>
                            <div className="min-w-0">
                              <p className="truncate font-bold text-foreground">
                                {order.fullName}
                              </p>
                              <p className="truncate text-xs text-muted-foreground">
                                {order.email}
                              </p>
                            </div>
                          </div>
                        </td>

                        <td className="px-6 py-3.5 font-mono text-xs text-muted-foreground">
                          {order.id.slice(0, 8)}…
                        </td>

                        <td className="px-6 py-3.5 font-bold text-foreground">
                          GH₵ {Number(order.total).toFixed(2)}
                        </td>

                        <td className="px-6 py-3.5">
                          <span
                            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold capitalize ${
                              order.status === "delivered"
                                ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                                : order.status === "cancelled"
                                ? "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300"
                                : order.status === "shipped"
                                ? "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300"
                                : "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                            }`}
                          >
                            {order.status}
                          </span>
                        </td>

                        <td className="px-6 py-3.5">
                          <span
                            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-black uppercase tracking-wider ${
                              order.paymentStatus === "paid"
                                ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                                : order.paymentStatus === "refunded"
                                ? "bg-purple-500/15 text-purple-600 dark:text-purple-400"
                                : "bg-amber-500/15 text-amber-600 dark:text-amber-400"
                            }`}
                          >
                            {order.paymentStatus}
                          </span>
                        </td>

                        <td className="px-6 py-3.5 text-xs text-muted-foreground">
                          {new Date(order.createdAt).toLocaleDateString(
                            undefined,
                            {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            },
                          )}
                        </td>

                        <td className="px-6 py-3.5 text-right">
                          <Button
                            asChild
                            variant="ghost"
                            size="sm"
                            className="rounded-xl h-8 w-8 p-0"
                          >
                            <Link to={`/orders/show/${order.id}`}>
                              <Eye className="h-4 w-4" />
                            </Link>
                          </Button>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-6 py-12 text-center text-sm text-muted-foreground"
                    >
                      No orders recorded yet. As customers shop on the store,
                      their purchases will display here in real time.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DashboardPage;
