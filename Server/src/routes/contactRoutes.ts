import { Router } from "express";
import { count, desc, eq, ilike, or } from "drizzle-orm";
import { z } from "zod";
import { db } from "../db/db.js";
import { contactMessages } from "../schema/schema.js";
import { requireAdmin } from "../lib/requireAdmin.js";
import { contactArcjetMiddleware } from "../lib/arcjet.js";

const router = Router();
const messageSchema = z.object({
  name: z.string().trim().min(2).max(120),
  email: z.string().trim().email().max(254),
  subject: z.string().trim().min(2).max(160),
  message: z.string().trim().min(10).max(5000),
});

router.post("/", contactArcjetMiddleware, async (req, res) => {
  const parsed = messageSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ message: "Please provide valid contact details." });
    return;
  }
  try {
    const [created] = await db.insert(contactMessages).values(parsed.data).returning({ id: contactMessages.id });
    res.status(201).json({ message: "Your message has been received.", id: created.id });
  } catch (error) {
    console.error("Failed to save contact message:", error);
    res.status(500).json({ message: "Could not send your message." });
  }
});

router.get("/admin", async (req, res) => {
  try {
    if (!(await requireAdmin(req, res, "contact"))) return;
    const start = Math.max(0, Number.parseInt(String(req.query._start ?? "0"), 10) || 0);
    const end = Math.max(start + 1, Number.parseInt(String(req.query._end ?? "20"), 10) || start + 20);
    const search = typeof req.query.q === "string" ? req.query.q.trim().slice(0, 100) : "";
    const filter = search ? or(ilike(contactMessages.name, `%${search}%`), ilike(contactMessages.email, `%${search}%`), ilike(contactMessages.subject, `%${search}%`)) : undefined;
    const [rows, total] = await Promise.all([
      db.select().from(contactMessages).where(filter).orderBy(desc(contactMessages.createdAt)).limit(Math.min(end - start, 100)).offset(start),
      db.select({ total: count() }).from(contactMessages).where(filter),
    ]);
    res.setHeader("x-total-count", String(total[0]?.total ?? 0));
    res.json(rows);
  } catch (error) {
    console.error("Failed to list contact messages:", error);
    res.status(500).json({ message: "Could not load contact messages." });
  }
});

router.get("/:id", async (req, res) => {
  try {
    if (!(await requireAdmin(req, res, "contact"))) return;
    const parsedId = z.string().uuid().safeParse(req.params.id);
    if (!parsedId.success) { res.status(400).json({ message: "Message ID must be a valid UUID." }); return; }
    const [message] = await db.select().from(contactMessages).where(eq(contactMessages.id, parsedId.data)).limit(1);
    if (!message) { res.status(404).json({ message: "Contact message not found." }); return; }
    res.json(message);
  } catch (error) {
    console.error("Failed to fetch contact message:", error);
    res.status(500).json({ message: "Could not load contact message." });
  }
});

router.patch("/:id", async (req, res) => {
  try {
    if (!(await requireAdmin(req, res, "contact"))) return;
    const parsedId = z.string().uuid().safeParse(req.params.id);
    if (!parsedId.success) { res.status(400).json({ message: "Message ID must be a valid UUID." }); return; }
    const parsed = z.object({ status: z.enum(["new", "read", "archived"]) }).safeParse(req.body);
    if (!parsed.success) { res.status(400).json({ message: "Provide a valid message status." }); return; }
    const [current] = await db.select().from(contactMessages).where(eq(contactMessages.id, parsedId.data)).limit(1);
    if (!current) { res.status(404).json({ message: "Contact message not found." }); return; }
    const allowed = (current.status === "new" && (parsed.data.status === "read" || parsed.data.status === "archived")) || (current.status === "read" && (parsed.data.status === "new" || parsed.data.status === "archived")) || (current.status === "archived" && parsed.data.status === "new");
    if (!allowed) { res.status(409).json({ message: "Archived messages can only be restored to new." }); return; }
    const [message] = await db.update(contactMessages).set(parsed.data).where(eq(contactMessages.id, parsedId.data)).returning();
    if (!message) { res.status(404).json({ message: "Contact message not found." }); return; }
    res.json(message);
  } catch (error) {
    console.error("Failed to update contact message:", error);
    res.status(500).json({ message: "Could not update contact message." });
  }
});

export default router;
