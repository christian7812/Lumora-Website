import { useShow, useUpdate } from "@refinedev/core";
import { Link } from "react-router";
import { Button } from "@/components/ui/button";

interface Message {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  status: "new" | "read" | "archived";
  createdAt: string;
}

export default function ContactMessageShow() {
  const { result, query } = useShow<Message>({ resource: "contact" });
  const { mutateAsync, mutation } = useUpdate<Message>();

  if (query.isLoading) {
    return <div className="p-6 text-muted-foreground">Loading message…</div>;
  }

  const item = ((result as unknown as { data?: Message })?.data ?? result) as Message | undefined;

  if (query.isError || !item) {
    return (
      <div className="space-y-4 p-6" role="alert">
        <h1 className="text-2xl font-bold">Message not found</h1>
        <Button asChild variant="outline">
          <Link to="/contact">← Back to inbox</Link>
        </Button>
      </div>
    );
  }

  const availableStatuses =
    item.status === "archived"
      ? (["new"] as const)
      : item.status === "new"
      ? (["read", "archived"] as const)
      : (["new", "archived"] as const);

  return (
    <main className="mx-auto max-w-3xl space-y-6 p-6">
      <div>
        <Button asChild variant="ghost" className="-ml-3">
          <Link to="/contact">← Back to Inbox</Link>
        </Button>
        <h1 className="mt-2 text-2xl font-bold">{item.subject}</h1>
        <p className="text-sm text-muted-foreground">
          From <span className="font-semibold text-foreground">{item.name}</span> ·{" "}
          <a className="text-primary hover:underline" href={`mailto:${item.email}`}>
            {item.email}
          </a>
        </p>
      </div>

      <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
        <div className="mb-4 flex items-center justify-between border-b border-border pb-3">
          <span className="text-xs uppercase font-bold text-muted-foreground">Message Body</span>
          <span className="rounded-full bg-secondary px-2.5 py-0.5 text-xs font-semibold capitalize">
            {item.status}
          </span>
        </div>
        <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">
          {item.message}
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <span className="text-xs font-semibold text-muted-foreground">Change status:</span>
        {availableStatuses.map((status) => (
          <Button
            key={status}
            variant="outline"
            size="sm"
            disabled={mutation.isPending}
            onClick={() =>
              void mutateAsync({
                resource: "contact",
                id: item.id,
                values: { status },
              }).then(() => query.refetch())
            }
          >
            {status === "new" ? "Restore as New" : status === "read" ? "Mark as Read" : "Archive"}
          </Button>
        ))}
      </div>
    </main>
  );
}
