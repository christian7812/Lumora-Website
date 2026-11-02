import { useList } from "@refinedev/core";
import { useState } from "react";
import { Link } from "react-router";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Search, Users, Eye, ShoppingBag } from "lucide-react";

interface Customer {
  id: string;
  name: string;
  email: string;
  lastOrderAt: string;
  orderCount: number;
  totalSpent: string | number;
}

export default function CustomersPage() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const { result, query } = useList<Customer>({
    resource: "customers",
    pagination: { currentPage: page, pageSize: 20 },
    filters: search.trim()
      ? [{ field: "q", operator: "eq", value: search.trim() }]
      : [],
  });

  if (query.isLoading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center p-6 text-sm text-muted-foreground">
        Loading customers directory…
      </div>
    );
  }

  if (query.isError) {
    return (
      <div className="space-y-4 p-6" role="alert">
        <h1 className="text-2xl font-bold text-destructive">
          Could not load customers
        </h1>
        <p className="text-muted-foreground">
          Verify your administrator privileges and server connection.
        </p>
        <Button variant="outline" onClick={() => void query.refetch()}>
          Retry
        </Button>
      </div>
    );
  }

  const rows = (result.data ?? []) as Customer[];
  const total = result.total ?? rows.length;
  const pages = Math.max(1, Math.ceil(total / 20));

  return (
    <div className="space-y-6 p-6 lg:p-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-500/10 text-purple-500">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tight text-foreground">
                Customers Directory
              </h1>
              <p className="text-xs text-muted-foreground">
                Grouped by normalized email address across all customer purchases
              </p>
            </div>
          </div>
        </div>

        <span className="text-xs font-semibold text-muted-foreground">
          Total: {total} registered & guest customer{total !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Search Input */}
      <div className="relative max-w-md">
        <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="search"
          aria-label="Search customers"
          placeholder="Search by name, email, or phone…"
          value={search}
          onChange={(event) => {
            setSearch(event.target.value);
            setPage(1);
          }}
          className="rounded-xl pl-10 pr-4"
        />
      </div>

      {/* Customers Table Card */}
      <Card className="overflow-hidden rounded-2xl border border-border/80 shadow-sm">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-border/60 bg-muted/40 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="px-6 py-3.5">Customer Name</th>
                  <th className="px-6 py-3.5">Email Address</th>
                  <th className="px-6 py-3.5">Orders</th>
                  <th className="px-6 py-3.5">Total Paid Spend</th>
                  <th className="px-6 py-3.5">Last Order Date</th>
                  <th className="px-6 py-3.5 text-right">Details</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-border/60">
                {rows.map((customer) => {
                  const initials = customer.name
                    ? customer.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")
                        .toUpperCase()
                        .slice(0, 2)
                    : "CU";

                  return (
                    <tr
                      key={customer.id}
                      className="transition-colors hover:bg-muted/30"
                    >
                      <td className="px-6 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-tr from-purple-500 to-indigo-500 text-xs font-black text-white">
                            {initials}
                          </div>
                          <span className="font-bold text-foreground">
                            {customer.name || "Customer"}
                          </span>
                        </div>
                      </td>

                      <td className="px-6 py-3.5 text-xs text-muted-foreground">
                        {customer.email}
                      </td>

                      <td className="px-6 py-3.5">
                        <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-bold text-primary">
                          <ShoppingBag className="h-3 w-3" />
                          <span>{customer.orderCount}</span>
                        </span>
                      </td>

                      <td className="px-6 py-3.5 font-bold text-foreground">
                        GH₵ {Number(customer.totalSpent).toFixed(2)}
                      </td>

                      <td className="px-6 py-3.5 text-xs text-muted-foreground">
                        {new Date(customer.lastOrderAt).toLocaleDateString(
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
                          size="sm"
                          variant="outline"
                          className="rounded-xl gap-1.5 h-8 text-xs font-bold"
                        >
                          <Link
                            to={`/customers/show/${encodeURIComponent(customer.id)}`}
                          >
                            <Eye className="h-3.5 w-3.5" />
                            <span>View</span>
                          </Link>
                        </Button>
                      </td>
                    </tr>
                  );
                })}

                {rows.length === 0 && (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-6 py-12 text-center text-sm text-muted-foreground"
                    >
                      {search
                        ? "No customers matched your search query."
                        : "No customer orders recorded yet."}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Pagination */}
      <div className="flex items-center justify-between pt-2">
        <span className="text-xs font-semibold text-muted-foreground">
          Page {page} of {pages}
        </span>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1 || query.isFetching}
            onClick={() => setPage((v) => v - 1)}
            className="rounded-xl text-xs"
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= pages || query.isFetching}
            onClick={() => setPage((v) => v + 1)}
            className="rounded-xl text-xs"
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}
