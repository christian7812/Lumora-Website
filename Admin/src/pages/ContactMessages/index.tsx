import { useList } from "@refinedev/core";
import { Link } from "react-router";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Search, Mail, Eye, Inbox } from "lucide-react";

interface Message {
  id: string;
  name: string;
  email: string;
  subject: string;
  status: string;
  createdAt: string;
}

export default function ContactMessagesPage() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const { result, query } = useList<Message>({
    resource: "contact",
    pagination: { currentPage: page, pageSize: 20 },
    filters: search.trim()
      ? [{ field: "q", operator: "eq", value: search.trim() }]
      : [],
  });

  if (query.isLoading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center p-6 text-sm text-muted-foreground">
        Loading contact messages…
      </div>
    );
  }

  if (query.isError) {
    return (
      <div className="space-y-4 p-6" role="alert">
        <h1 className="text-2xl font-bold text-destructive">
          Could not load contact messages
        </h1>
        <p className="text-muted-foreground">
          Check your admin authorization status and server connection.
        </p>
        <Button variant="outline" onClick={() => void query.refetch()}>
          Retry
        </Button>
      </div>
    );
  }

  const messages = (result.data ?? []) as Message[];
  const total = result.total ?? messages.length;
  const pages = Math.max(1, Math.ceil(total / 20));

  return (
    <div className="space-y-6 p-6 lg:p-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2.5">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10 text-blue-500">
            <Inbox className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tight text-foreground">
              Contact Inbox
            </h1>
            <p className="text-xs text-muted-foreground">
              Messages and inquiries submitted by visitors from the storefront
            </p>
          </div>
        </div>

        <span className="text-xs font-semibold text-muted-foreground">
          Total: {total} inquiry message{total !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Search Bar */}
      <div className="relative max-w-md">
        <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="search"
          aria-label="Search contact messages"
          placeholder="Search by sender name, email, or subject…"
          value={search}
          onChange={(event) => {
            setSearch(event.target.value);
            setPage(1);
          }}
          className="rounded-xl pl-10 pr-4"
        />
      </div>

      {/* Table Card */}
      <Card className="overflow-hidden rounded-2xl border border-border/80 shadow-sm">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-border/60 bg-muted/40 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="px-6 py-3.5">Sender</th>
                  <th className="px-6 py-3.5">Subject</th>
                  <th className="px-6 py-3.5">Status</th>
                  <th className="px-6 py-3.5">Received Date</th>
                  <th className="px-6 py-3.5 text-right">Action</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-border/60">
                {messages.map((message) => {
                  const initials = message.name
                    ? message.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")
                        .toUpperCase()
                        .slice(0, 2)
                    : "CT";

                  const isNew = message.status === "new";

                  return (
                    <tr
                      key={message.id}
                      className={`transition-colors hover:bg-muted/30 ${isNew ? "bg-primary/5 font-semibold" : ""}`}
                    >
                      <td className="px-6 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-tr from-blue-500 to-cyan-500 text-xs font-black text-white">
                            {initials}
                          </div>
                          <div className="min-w-0">
                            <p className="font-bold text-foreground">
                              {message.name}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {message.email}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-3.5">
                        <Link
                          to={`/contact/show/${message.id}`}
                          className="font-medium text-foreground transition hover:text-primary hover:underline line-clamp-1"
                        >
                          {message.subject}
                        </Link>
                      </td>

                      <td className="px-6 py-3.5">
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-black uppercase tracking-wider ${
                            message.status === "new"
                              ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                              : message.status === "read"
                              ? "bg-blue-500/15 text-blue-600 dark:text-blue-400"
                              : "bg-muted text-muted-foreground"
                          }`}
                        >
                          {message.status}
                        </span>
                      </td>

                      <td className="px-6 py-3.5 text-xs text-muted-foreground">
                        {new Date(message.createdAt).toLocaleString(undefined, {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </td>

                      <td className="px-6 py-3.5 text-right">
                        <Button
                          asChild
                          size="sm"
                          variant="outline"
                          className="rounded-xl gap-1.5 h-8 text-xs font-bold"
                        >
                          <Link to={`/contact/show/${message.id}`}>
                            <Eye className="h-3.5 w-3.5" />
                            <span>Read</span>
                          </Link>
                        </Button>
                      </td>
                    </tr>
                  );
                })}

                {messages.length === 0 && (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-6 py-12 text-center text-sm text-muted-foreground"
                    >
                      {search
                        ? "No messages match your search query."
                        : "No contact messages received yet."}
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
