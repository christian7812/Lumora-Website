import { createHash, randomUUID } from "node:crypto";
import { Router } from "express";
import { asc, count, eq, ilike, or } from "drizzle-orm";
import { z } from "zod";
import { db } from "../db/db.js";
import { categories, products } from "../schema/schema.js";
import { requireAdmin } from "../lib/requireAdmin.js";

const productRouter = Router();

const UPLOAD_FOLDER = "cruiser-store/products";

productRouter.post("/upload-signature", async (req, res) => {
  try {
    if (!(await requireAdmin(req, res, "products"))) return;

    const cloudName = process.env.CLOUDINARY_CLOUD_NAME?.trim();
    const apiKey = process.env.CLOUDINARY_API_KEY?.trim();
    const apiSecret = process.env.CLOUDINARY_API_SECRET?.trim();
    if (!cloudName || !apiKey || !apiSecret) {
      res.status(503).json({ message: "Cloudinary image uploads are not configured on the server." });
      return;
    }

    res.setHeader("Cache-Control", "no-store");

    const paramsToSign = req.body?.paramsToSign ?? req.body?.params_to_sign;

    // Step 1: the admin form asks for the widget's setup values.
    if (!paramsToSign) {
      res.json({ cloudName, apiKey, folder: UPLOAD_FOLDER });
      return;
    }

    // Step 2: the widget sends the exact parameters it will upload with; sign those.
    if (typeof paramsToSign !== "object" || Array.isArray(paramsToSign)) {
      res.status(400).json({ message: "Invalid upload parameters." });
      return;
    }
    if (paramsToSign.folder && paramsToSign.folder !== UPLOAD_FOLDER) {
      res.status(400).json({ message: "Invalid upload folder." });
      return;
    }

    const signatureBase = Object.entries(paramsToSign)
      .filter(([key, value]) => key !== "file" && key !== "cloud_name" && key !== "resource_type" && key !== "api_key" && value !== undefined && value !== null && value !== "")
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, value]) => `${key}=${Array.isArray(value) ? value.join(",") : value}`)
      .join("&");
    const signature = createHash("sha1")
      .update(`${signatureBase}${apiSecret}`)
      .digest("hex");

    res.json({ signature });
  } catch (error) {
    console.error("Failed to create Cloudinary upload signature:", error);
    res.status(500).json({ message: "Could not prepare the image upload." });
  }
});

const moneySchema = z
  .string()
  .trim()
  .regex(/^\d+(?:\.\d{1,2})?$/, "Enter a valid amount.")
  .transform(Number)
  .refine((value:any) => value <= 99_999_999.99, "Amount is too large.");

const productSchema = z
  .object({
    name: z.string().trim().min(1).max(160),
    categoryId: z.string().uuid(),
    image: z
      .string()
      .trim()
      .url()
      .refine((value) => {
        const protocol = new URL(value).protocol;
        return protocol === "https:" || protocol === "http:";
      }, "Image must use an HTTP or HTTPS URL."),
    price: moneySchema,
    stockQuantity: z.number().int().min(0).max(2_147_483_647).optional(),
    oldPrice: z
      .union([moneySchema, z.literal(""), z.null()])
      .transform((value) => (value === "" || value === null ? null : value)),
    isActive: z.boolean(),
  })
  .superRefine((product, context) => {
    if (product.oldPrice !== null && product.oldPrice <= product.price) {
      context.addIssue({
        code: "custom",
        path: ["oldPrice"],
        message: "Old price must be greater than the current price.",
      });
    }
  });

function toProductResponse(product: {
  id: string;
  name: string;
  categoryId: string;
  category: string;
  image: string;
  price: string;
  oldPrice: string | null;
  stockQuantity: number;
  isActive: boolean;
}) {
  return {
    ...product,
    price: Number(product.price),
    oldPrice: product.oldPrice === null ? null : Number(product.oldPrice),
  };
}

async function getProductById(id: string) {
  const [product] = await db
    .select({
      id: products.id,
      name: products.name,
      categoryId: products.categoryId,
      category: categories.name,
      image: products.image,
      price: products.price,
      oldPrice: products.oldPrice,
      stockQuantity: products.stockQuantity,
      isActive: products.isActive,
    })
    .from(products)
    .innerJoin(categories, eq(products.categoryId, categories.id))
    .where(eq(products.id, id))
    .limit(1);

  return product ? toProductResponse(product) : undefined;
}

productRouter.get("/", async (_req, res) => {
  try {
    const rows = await db
      .select({
        id: products.id,
        name: products.name,
        category: categories.name,
        image: products.image,
        price: products.price,
        oldPrice: products.oldPrice,
        stockQuantity: products.stockQuantity,
      })
      .from(products)
      .innerJoin(categories, eq(products.categoryId, categories.id))
      .where(eq(products.isActive, true));

    rows.sort((left, right) => {
      const leftId = Number(left.id);
      const rightId = Number(right.id);
      if (Number.isFinite(leftId) && Number.isFinite(rightId)) return leftId - rightId;
      if (Number.isFinite(leftId)) return -1;
      if (Number.isFinite(rightId)) return 1;
      return left.id.localeCompare(right.id);
    });

    res.json({
      products: rows.map((product) => ({
        id: product.id,
        name: product.name,
        category: product.category,
        image: product.image,
        price: Number(product.price),
        ...(product.oldPrice === null
          ? {}
          : { oldPrice: Number(product.oldPrice) }),
        stockQuantity: product.stockQuantity,
      })),
    });
  } catch (error) {
    console.error("Failed to fetch products:", error);
    res.status(500).json({ message: "Could not load products." });
  }
});

productRouter.get("/admin", async (req, res) => {
  try {
    if (!(await requireAdmin(req, res, "products"))) return;

    const startValue = Number.parseInt(String(req.query._start ?? "0"), 10);
    const endValue = Number.parseInt(String(req.query._end ?? "20"), 10);
    const start = Number.isInteger(startValue) && startValue >= 0 ? startValue : 0;
    const requestedEnd = Number.isInteger(endValue) && endValue > start
      ? endValue
      : start + 20;
    const limit = Math.min(requestedEnd - start, 100);
    const search = typeof req.query.q === "string" ? req.query.q.trim().slice(0, 100) : "";
    const searchFilter = search
      ? or(ilike(products.name, `%${search}%`), ilike(categories.name, `%${search}%`))
      : undefined;

    const [rows, totalRows] = await Promise.all([
      db
        .select({
          id: products.id,
          name: products.name,
          categoryId: products.categoryId,
          category: categories.name,
          image: products.image,
          price: products.price,
          oldPrice: products.oldPrice,
          stockQuantity: products.stockQuantity,
          isActive: products.isActive,
        })
        .from(products)
        .innerJoin(categories, eq(products.categoryId, categories.id))
        .where(searchFilter)
        .orderBy(asc(products.name), asc(products.id))
        .limit(limit)
        .offset(start),
      db
        .select({ total: count() })
        .from(products)
        .innerJoin(categories, eq(products.categoryId, categories.id))
        .where(searchFilter),
    ]);

    res.setHeader("x-total-count", String(totalRows[0]?.total ?? 0));
    res.json(rows.map(toProductResponse));
  } catch (error) {
    console.error("Failed to fetch admin products:", error);
    res.status(500).json({ message: "Could not load products." });
  }
});

productRouter.get("/:id", async (req, res) => {
  try {
    if (!(await requireAdmin(req, res, "products"))) return;

    const product = await getProductById(req.params.id);
    if (!product) {
      res.status(404).json({ message: "Product not found." });
      return;
    }

    res.json(product);
  } catch (error) {
    console.error("Failed to fetch admin product:", error);
    res.status(500).json({ message: "Could not load product." });
  }
});

productRouter.post("/", async (req, res) => {
  try {
    if (!(await requireAdmin(req, res, "products"))) return;

    const parsed = productSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ message: "Please provide valid product details.", errors: parsed.error.flatten() });
      return;
    }

    const id = randomUUID();
    const createdProduct = await db.transaction(async (tx) => {
      const [category] = await tx
        .select({ id: categories.id, isActive: categories.isActive })
        .from(categories)
        .where(eq(categories.id, parsed.data.categoryId))
        .for("update");
      if (!category || !category.isActive) return false;

      await tx.insert(products).values({
        id,
        name: parsed.data.name,
        categoryId: category.id,
        image: parsed.data.image,
        price: parsed.data.price.toFixed(2),
        oldPrice: parsed.data.oldPrice?.toFixed(2) ?? null,
        stockQuantity: parsed.data.stockQuantity ?? 0,
        isActive: parsed.data.isActive,
      });
      return true;
    });

    if (!createdProduct) {
      res.status(400).json({ message: "Choose an active product category." });
      return;
    }

    const created = await getProductById(id);
    res.status(201).json(created);
  } catch (error) {
    console.error("Failed to create product:", error);
    res.status(500).json({ message: "Could not create product." });
  }
});

productRouter.patch("/:id", async (req, res) => {
  try {
    if (!(await requireAdmin(req, res, "products"))) return;

    const parsed = productSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ message: "Please provide valid product details.", errors: parsed.error.flatten() });
      return;
    }

    const updated = await db.transaction(async (tx) => {
      const [current] = await tx
        .select({ id: products.id, categoryId: products.categoryId })
        .from(products)
        .where(eq(products.id, req.params.id))
        .for("update");
      if (!current) return { kind: "not-found" as const };

      const [category] = await tx
        .select({ id: categories.id, isActive: categories.isActive })
        .from(categories)
        .where(eq(categories.id, parsed.data.categoryId))
        .for("update");
      if (
        !category ||
        (!category.isActive &&
          (category.id !== current.categoryId || parsed.data.isActive))
      ) {
        return { kind: "invalid-category" as const };
      }

      await tx
        .update(products)
        .set({
          name: parsed.data.name,
          categoryId: category.id,
          image: parsed.data.image,
          price: parsed.data.price.toFixed(2),
          oldPrice: parsed.data.oldPrice?.toFixed(2) ?? null,
          ...(parsed.data.stockQuantity === undefined
            ? {}
            : { stockQuantity: parsed.data.stockQuantity }),
          isActive: parsed.data.isActive,
        })
        .where(eq(products.id, req.params.id));

      return { kind: "updated" as const };
    });

    if (updated.kind === "not-found") {
      res.status(404).json({ message: "Product not found." });
      return;
    }
    if (updated.kind === "invalid-category") {
      res.status(400).json({ message: "Choose an active product category before activating this product." });
      return;
    }

    const product = await getProductById(req.params.id);
    if (!product) {
      res.status(404).json({ message: "Product not found." });
      return;
    }
    res.json(product);
  } catch (error) {
    console.error("Failed to update product:", error);
    res.status(500).json({ message: "Could not update product." });
  }
});

productRouter.delete("/:id", async (req, res) => {
  try {
    if (!(await requireAdmin(req, res, "products"))) return;

    const [archived] = await db
      .update(products)
      .set({ isActive: false })
      .where(eq(products.id, req.params.id))
      .returning({ id: products.id });

    if (!archived) {
      res.status(404).json({ message: "Product not found." });
      return;
    }

    res.json({ id: archived.id });
  } catch (error) {
    console.error("Failed to archive product:", error);
    res.status(500).json({ message: "Could not archive product." });
  }
});

export default productRouter;