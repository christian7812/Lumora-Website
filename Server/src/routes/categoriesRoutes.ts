import { Router } from "express";
import { and, asc, count, eq, ilike, or, sql } from "drizzle-orm";
import { z } from "zod";
import { db } from "../db/db.js";
import { categories, products } from "../schema/schema.js";
import { requireAdmin } from "../lib/requireAdmin.js";

const categoriesRouter = Router();
const categoryIdSchema = z.string().uuid();
const categoryNameSchema = z.string().trim().min(1).max(100);
const categoryDescriptionSchema = z.string().trim().max(500).nullable().optional();
const createCategorySchema = z.object({
  name: categoryNameSchema,
  description: categoryDescriptionSchema,
});
const updateCategorySchema = createCategorySchema.extend({
  isActive: z.boolean(),
});

function hasDatabaseCode(error: unknown, code: string): boolean {
  if (typeof error !== "object" || error === null) return false;
  if ("code" in error && error.code === code) return true;
  if ("cause" in error && error.cause !== error) {
    return hasDatabaseCode(error.cause, code);
  }
  return false;
}

function archiveConflictMessage(activeProductCount: number): string {
  return `Cannot archive this category while it has ${activeProductCount} active product${activeProductCount === 1 ? "" : "s"}. Reassign or archive those products first.`;
}

async function getCategoryWithCounts(id: string) {
  const [row] = await db
    .select({
      id: categories.id,
      name: categories.name,
      description: categories.description,
      isActive: categories.isActive,
      productCount: count(products.id),
      activeProductCount: sql<number>`count(*) filter (where ${products.isActive} = true)`.mapWith(Number),
    })
    .from(categories)
    .leftJoin(products, eq(products.categoryId, categories.id))
    .where(eq(categories.id, id))
    .groupBy(categories.id)
    .limit(1);

  return row;
}

categoriesRouter.get("/", async (_req, res) => {
  try {
    const rows = await db
      .select({ id: categories.id, name: categories.name })
      .from(categories)
      .where(eq(categories.isActive, true))
      .orderBy(asc(categories.name));

    res.json(rows);
  } catch (error) {
    console.error("Failed to fetch categories:", error);
    res.status(500).json({ message: "Could not load categories." });
  }
});

categoriesRouter.get("/admin", async (req, res) => {
  try {
    if (!(await requireAdmin(req, res, "categories"))) return;

    const startValue = Number.parseInt(String(req.query._start ?? "0"), 10);
    const endValue = Number.parseInt(String(req.query._end ?? "20"), 10);
    const start = Number.isInteger(startValue) && startValue >= 0 ? startValue : 0;
    const requestedEnd = Number.isInteger(endValue) && endValue > start
      ? endValue
      : start + 20;
    const limit = Math.min(requestedEnd - start, 100);
    const search = typeof req.query.q === "string" ? req.query.q.trim().slice(0, 100) : "";
    const searchFilter = search
      ? or(
          ilike(categories.name, `%${search}%`),
          ilike(categories.description, `%${search}%`),
        )
      : undefined;

    const [rows, totalRows] = await Promise.all([
      db
        .select({
          id: categories.id,
          name: categories.name,
          description: categories.description,
          isActive: categories.isActive,
          productCount: count(products.id),
          activeProductCount: sql<number>`count(*) filter (where ${products.isActive} = true)`.mapWith(Number),
        })
        .from(categories)
        .leftJoin(products, eq(products.categoryId, categories.id))
        .where(searchFilter)
        .groupBy(categories.id)
        .orderBy(asc(categories.name), asc(categories.id))
        .limit(limit)
        .offset(start),
      db.select({ total: count() }).from(categories).where(searchFilter),
    ]);

    res.setHeader("x-total-count", String(totalRows[0]?.total ?? 0));
    res.json(rows);
  } catch (error) {
    console.error("Failed to fetch admin categories:", error);
    res.status(500).json({ message: "Could not load categories." });
  }
});

categoriesRouter.get("/admin/options", async (req, res) => {
  try {
    if (!(await requireAdmin(req, res, "categories"))) return;

    const rows = await db
      .select({
        id: categories.id,
        name: categories.name,
        isActive: categories.isActive,
      })
      .from(categories)
      .orderBy(asc(categories.name));

    res.json(rows);
  } catch (error) {
    console.error("Failed to fetch category options:", error);
    res.status(500).json({ message: "Could not load category options." });
  }
});

categoriesRouter.get("/:id", async (req, res) => {
  try {
    if (!(await requireAdmin(req, res, "categories"))) return;

    const parsedId = categoryIdSchema.safeParse(req.params.id);
    if (!parsedId.success) {
      res.status(400).json({ message: "Category ID must be a valid UUID." });
      return;
    }

    const category = await getCategoryWithCounts(parsedId.data);
    if (!category) {
      res.status(404).json({ message: "Category not found." });
      return;
    }

    res.json(category);
  } catch (error) {
    console.error("Failed to fetch category:", error);
    res.status(500).json({ message: "Could not load category." });
  }
});

categoriesRouter.post("/", async (req, res) => {
  try {
    if (!(await requireAdmin(req, res, "categories"))) return;

    const parsed = createCategorySchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ message: "Please provide a valid category name and description." });
      return;
    }

    const [created] = await db
      .insert(categories)
      .values({
        name: parsed.data.name,
        description: parsed.data.description?.trim() || null,
        isActive: true,
      })
      .returning({ id: categories.id });

    res.status(201).json(await getCategoryWithCounts(created.id));
  } catch (error) {
    if (hasDatabaseCode(error, "23505")) {
      res.status(409).json({ message: "A category with that name already exists." });
      return;
    }
    console.error("Failed to create category:", error);
    res.status(500).json({ message: "Could not create category." });
  }
});

categoriesRouter.patch("/:id", async (req, res) => {
  try {
    if (!(await requireAdmin(req, res, "categories"))) return;

    const parsedId = categoryIdSchema.safeParse(req.params.id);
    if (!parsedId.success) {
      res.status(400).json({ message: "Category ID must be a valid UUID." });
      return;
    }

    const parsed = updateCategorySchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ message: "Please provide a valid category name and status." });
      return;
    }

    const result = await db.transaction(async (tx) => {
      const [current] = await tx
        .select({ id: categories.id })
        .from(categories)
        .where(eq(categories.id, parsedId.data))
        .for("update");
      if (!current) return { kind: "not-found" as const };

      if (!parsed.data.isActive) {
        const [usage] = await tx
          .select({ total: count() })
          .from(products)
          .where(and(
            eq(products.categoryId, current.id),
            eq(products.isActive, true),
          ));
        const activeProductCount = Number(usage?.total ?? 0);
        if (activeProductCount > 0) {
          return { kind: "in-use" as const, activeProductCount };
        }
      }

      await tx
        .update(categories)
        .set({
          name: parsed.data.name,
          ...(parsed.data.description === undefined
            ? {}
            : { description: parsed.data.description?.trim() || null }),
          isActive: parsed.data.isActive,
        })
        .where(eq(categories.id, current.id));
      return { kind: "updated" as const, id: current.id };
    });

    if (result.kind === "not-found") {
      res.status(404).json({ message: "Category not found." });
      return;
    }
    if (result.kind === "in-use") {
      res.status(409).json({ message: archiveConflictMessage(result.activeProductCount) });
      return;
    }

    res.json(await getCategoryWithCounts(result.id));
  } catch (error) {
    if (hasDatabaseCode(error, "23505")) {
      res.status(409).json({ message: "A category with that name already exists." });
      return;
    }
    console.error("Failed to update category:", error);
    res.status(500).json({ message: "Could not update category." });
  }
});

categoriesRouter.delete("/:id", async (req, res) => {
  try {
    if (!(await requireAdmin(req, res, "categories"))) return;

    const parsedId = categoryIdSchema.safeParse(req.params.id);
    if (!parsedId.success) {
      res.status(400).json({ message: "Category ID must be a valid UUID." });
      return;
    }

    const result = await db.transaction(async (tx) => {
      const [category] = await tx
        .select({ id: categories.id })
        .from(categories)
        .where(eq(categories.id, parsedId.data))
        .for("update");
      if (!category) return { kind: "not-found" as const };

      const [usage] = await tx
        .select({ total: count() })
        .from(products)
        .where(and(
          eq(products.categoryId, category.id),
          eq(products.isActive, true),
        ));
      const activeProductCount = Number(usage?.total ?? 0);
      if (activeProductCount > 0) {
        return { kind: "in-use" as const, activeProductCount };
      }

      await tx
        .update(categories)
        .set({ isActive: false })
        .where(eq(categories.id, category.id));
      return { kind: "archived" as const, id: category.id };
    });

    if (result.kind === "not-found") {
      res.status(404).json({ message: "Category not found." });
      return;
    }
    if (result.kind === "in-use") {
      res.status(409).json({ message: archiveConflictMessage(result.activeProductCount) });
      return;
    }

    res.json({ id: result.id, isActive: false });
  } catch (error) {
    console.error("Failed to archive category:", error);
    res.status(500).json({ message: "Could not archive category." });
  }
});

export default categoriesRouter;
