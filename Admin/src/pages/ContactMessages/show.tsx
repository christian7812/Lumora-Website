import { useShow, useUpdate } from "@refinedev/core";
import { Link } from "react-router";
import { Button } from "@/components/ui/button";
interface Message { id: string; name: string; email: string; subject: string; message: string; status: "new" | "read" | "archived"; createdAt: string }
export default function ContactMessageShow() {
  const { result, query } = useShow<Message>({ resource: "contact" });
  const { mutateAsync, mutation } = useUpdate<Message>();
  if (query.isLoading) return <div className="p-6">Loading message…</div>;
  if (query.isError || !result) return <div className="p-6" role="alert">Message not found. <Link to="/contact" className="underline">Back to inbox</Link></div>;
  const item = result;
  const availableStatuses = item.status === "archived" ? ["new"] as const : item.status === "new" ? ["read", "archived"] as const : ["new", "archived"] as const;
  return <main className="mx-auto max-w-3xl space-y-5 p-6"><Link to="/contact" className="underline">← Inbox</Link><h1 className="text-3xl font-bold">{item.subject}</h1><p>From {item.name} · <a className="underline" href={`mailto:${item.email}`}>{item.email}</a></p><p className="whitespace-pre-wrap rounded border bg-card p-5">{item.message}</p><p>Status: {item.status}</p><div className="flex gap-2">{availableStatuses.map((status) => <Button key={status} variant="outline" disabled={mutation.isPending} onClick={() => void mutateAsync({ resource: "contact", id: item.id, values: { status } }).then(() => query.refetch())}>{status === "new" ? "Restore as new" : status}</Button>)}</div></main>;
}
