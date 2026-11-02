import { useEffect, useState, type FormEvent } from "react";
import { Link } from "react-router";
import { AlertCircle, UploadCloud, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { API_URL } from "@/providers/constants";

export interface Product {
  id: string;
  name: string;
  categoryId: string;
  category: string;
  image: string;
  price: number;
  oldPrice: number | null;
  stockQuantity: number;
  isActive: boolean;
}

export interface ProductPayload {
  name: string;
  categoryId: string;
  image: string;
  price: string;
  oldPrice: string;
  stockQuantity: number;
  isActive: boolean;
}

interface CategoryOption {
  id: string;
  name: string;
  isActive: boolean;
}

interface ProductFormProps {
  product?: Product;
  onSave: (values: ProductPayload) => Promise<void>;
}

const MONEY_VALUE_RE = /^\d+(?:\.\d{1,2})?$/;
const MAX_PRODUCT_PRICE = 99_999_999.99;

function loadCloudinaryScript(): Promise<void> {
  if (typeof window !== "undefined" && window.cloudinary) {
    return Promise.resolve();
  }
  return new Promise((resolve, reject) => {
    const existing = document.querySelector('script[src*="upload-widget.cloudinary.com"]');
    if (existing) {
      if (window.cloudinary) return resolve();
      existing.addEventListener("load", () => resolve());
      existing.addEventListener("error", () => reject(new Error("Failed to load Cloudinary Upload Widget script.")));
      return;
    }
    const script = document.createElement("script");
    script.src = "https://upload-widget.cloudinary.com/latest/global/all.js";
    script.type = "text/javascript";
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Failed to load Cloudinary Upload Widget script."));
    document.body.appendChild(script);
  });
}

function productToForm(product?: Product): ProductPayload {
  return {
    name: product?.name ?? "",
    categoryId: product?.categoryId ?? "",
    image: product?.image ?? "",
    price: product ? Number(product.price).toFixed(2) : "",
    oldPrice: product?.oldPrice === null || product?.oldPrice === undefined
      ? ""
      : Number(product.oldPrice).toFixed(2),
    stockQuantity: product?.stockQuantity ?? 0,
    isActive: product?.isActive ?? true,
  };
}

async function responseMessage(response: Response): Promise<string> {
  const body: { message?: unknown } = await response.json().catch(() => ({}));
  return typeof body.message === "string"
    ? body.message
    : `Request failed (HTTP ${response.status}).`;
}

export function ProductForm({ product, onSave }: ProductFormProps) {
  const [form, setForm] = useState<ProductPayload>(() => productToForm(product));
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [isLoadingCategories, setIsLoadingCategories] = useState(true);
  const [categoryError, setCategoryError] = useState("");
  const [isCategoryAuthError, setIsCategoryAuthError] = useState(false);
  const [formError, setFormError] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isOpeningWidget, setIsOpeningWidget] = useState(false);
  const [uploadNotice, setUploadNotice] = useState("");

  useEffect(() => {
    const controller = new AbortController();

    async function loadCategories() {
      setIsLoadingCategories(true);
      setCategoryError("");
      setIsCategoryAuthError(false);
      try {
        const response = await fetch(`${API_URL}/categories/admin/options`, {
          credentials: "include",
          signal: controller.signal,
        });
        if (!response.ok) {
          if (response.status === 401 || response.status === 403) {
            setIsCategoryAuthError(true);
          }
          throw new Error(await responseMessage(response));
        }

        const rows: CategoryOption[] = await response.json();
        setCategories(rows);
      } catch (error) {
        if (controller.signal.aborted) return;
        setCategoryError(error instanceof Error ? error.message : "Could not load categories.");
      } finally {
        if (!controller.signal.aborted) setIsLoadingCategories(false);
      }
    }

    void loadCategories();
    return () => controller.abort();
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError("");

    const price = Number(form.price);
    const oldPrice = form.oldPrice === "" ? null : Number(form.oldPrice);
    if (!form.categoryId) {
      setFormError("Choose a product category.");
      return;
    }
    if (!MONEY_VALUE_RE.test(form.price) || !Number.isFinite(price) || price > MAX_PRODUCT_PRICE) {
      setFormError("Enter a current price with up to two decimal places.");
      return;
    }
    if (
      oldPrice !== null &&
      (!MONEY_VALUE_RE.test(form.oldPrice) || !Number.isFinite(oldPrice) || oldPrice > MAX_PRODUCT_PRICE)
    ) {
      setFormError("Enter an old price with up to two decimal places.");
      return;
    }
    if (oldPrice !== null && oldPrice <= price) {
      setFormError("Old price must be greater than the current price.");
      return;
    }
    try {
      const url = new URL(form.image);
      if (!/^https?:$/.test(url.protocol)) {
        setFormError("Image URL must begin with http:// or https://.");
        return;
      }
    } catch {
      setFormError("Enter a valid image URL or upload an image via Cloudinary.");
      return;
    }

    setIsSaving(true);
    try {
      await onSave(form);
    } catch (error) {
      setFormError(error instanceof Error ? error.message : "Could not save product.");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleOpenCloudinaryWidget() {
    setFormError("");
    setUploadNotice("");
    setIsOpeningWidget(true);

    try {
      await loadCloudinaryScript();
      if (!window.cloudinary) {
        throw new Error("Cloudinary Upload Widget is not available. Please check your internet connection.");
      }

      // Step 1: Request Cloudinary credentials and folder from server
      const setupRes = await fetch(`${API_URL}/products/upload-signature`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });

      if (!setupRes.ok) {
        throw new Error(await responseMessage(setupRes));
      }

      const setup: { cloudName?: string; apiKey?: string; folder?: string } = await setupRes.json();
      if (!setup.cloudName || !setup.apiKey) {
        throw new Error("Server returned incomplete Cloudinary settings.");
      }

      const widget = window.cloudinary.createUploadWidget(
        {
          cloudName: setup.cloudName,
          apiKey: setup.apiKey,
          folder: setup.folder ?? "cruiser-store/products",
          sources: [
            "local",
            "url",
            "camera",
            "image_search",
            "google_drive",
            "dropbox",
            "shutterstock",
            "getty",
            "istock",
            "unsplash",
          ],
          multiple: false,
          maxFileSize: 5_000_000,
          clientAllowedFormats: ["jpg", "jpeg", "png", "webp"],
          cropping: false,
          uploadSignature: (callback, paramsToSign) => {
            fetch(`${API_URL}/products/upload-signature`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              credentials: "include",
              body: JSON.stringify({ paramsToSign }),
            })
              .then(async (res) => {
                if (!res.ok) {
                  const data = await res.json().catch(() => ({}));
                  throw new Error(data.message ?? "Could not generate upload signature.");
                }
                return res.json();
              })
              .then((data: { signature?: string }) => {
                if (data?.signature) {
                  callback(data.signature);
                } else {
                  callback(null);
                }
              })
              .catch((err) => {
                console.error("Signature error:", err);
                setFormError(err instanceof Error ? err.message : "Failed to sign upload request.");
                callback(null);
              });
          },
        },
        (error, result) => {
          if (error) {
            console.error("Cloudinary widget error:", error);
            setFormError("Upload error from Cloudinary. Please try again.");
            return;
          }
          if (result && result.event === "success" && result.info?.secure_url) {
            setForm((current) => ({ ...current, image: result.info!.secure_url! }));
            setUploadNotice("Image uploaded to Cloudinary successfully. Save product to apply changes.");
            setFormError("");
          }
        },
      );

      widget.open();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Failed to open Cloudinary upload widget.");
    } finally {
      setIsOpeningWidget(false);
    }
  }

  const availableCategories = categories.filter(
    (category) => category.isActive || category.id === product?.categoryId,
  );

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-6">
      <div>
        <Button asChild variant="ghost" className="-ml-3 mb-2">
          <Link to="/products">← Back to products</Link>
        </Button>
        <h1 className="text-3xl font-bold tracking-tight">
          {product ? "Edit product" : "Add product"}
        </h1>
        <p className="text-muted-foreground">Update the information customers see in your store.</p>
      </div>

      {categoryError && (
        <div className="flex items-start gap-3 rounded-md border border-destructive/30 bg-destructive/5 p-4 text-sm" role="alert">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
          <div>
            <p>{categoryError}</p>
            {isCategoryAuthError && <Link className="mt-2 inline-block underline" to="/orders">Go to admin sign in</Link>}
          </div>
        </div>
      )}

      {formError && <p className="rounded-md bg-destructive/10 p-3 text-sm text-destructive" role="alert">{formError}</p>}

      <Card>
        <CardHeader><CardTitle>Product details</CardTitle></CardHeader>
        <CardContent>
          <form className="space-y-5" onSubmit={(event) => void handleSubmit(event)}>
            <div className="space-y-2">
              <Label htmlFor="product-name">Product name</Label>
              <Input
                id="product-name"
                value={form.name}
                onChange={(event) => setForm({ ...form, name: event.target.value })}
                minLength={1}
                maxLength={160}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="product-category">Category</Label>
              <Select
                value={form.categoryId}
                onValueChange={(categoryId) => setForm({ ...form, categoryId })}
                disabled={isLoadingCategories || availableCategories.length === 0}
              >
                <SelectTrigger id="product-category" className="w-full">
                  <SelectValue placeholder={isLoadingCategories ? "Loading categories..." : "Select a category"} />
                </SelectTrigger>
                <SelectContent>
                  {availableCategories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}{category.isActive ? "" : " (inactive)"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {!isLoadingCategories && categories.length === 0 && !categoryError && (
                <p className="text-sm text-muted-foreground">
                  No categories exist yet. Add categories in the Categories workflow before creating products.
                </p>
              )}
            </div>

            <div className="space-y-3 rounded-lg border p-4 bg-muted/20">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <Label className="text-base font-medium">Product image</Label>
                  <p className="text-xs text-muted-foreground">
                    Upload securely with the Cloudinary Upload Widget (up to 5 MB) or paste a direct image URL.
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => void handleOpenCloudinaryWidget()}
                  disabled={isOpeningWidget || isSaving}
                  className="gap-2 shrink-0"
                >
                  <UploadCloud className="h-4 w-4" />
                  {isOpeningWidget ? "Opening..." : form.image ? "Change image" : "Upload with Cloudinary"}
                </Button>
              </div>

              {form.image && (
                <div className="mt-2 flex items-center gap-4">
                  <img
                    src={form.image}
                    alt="Product preview"
                    className="h-28 w-28 rounded-md border object-cover shadow-sm bg-background"
                  />
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground break-all max-w-sm line-clamp-2">
                      {form.image}
                    </p>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:bg-destructive/10 gap-1 h-8 px-2"
                      onClick={() => {
                        setForm((curr) => ({ ...curr, image: "" }));
                        setUploadNotice("");
                      }}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      Remove
                    </Button>
                  </div>
                </div>
              )}

              {uploadNotice && (
                <p className="text-xs font-medium text-green-600" role="status">
                  ✓ {uploadNotice}
                </p>
              )}

              <div className="space-y-1.5 pt-2 border-t">
                <Label htmlFor="product-image" className="text-xs text-muted-foreground">
                  Direct image URL
                </Label>
                <Input
                  id="product-image"
                  type="url"
                  value={form.image}
                  onChange={(event) => {
                    setForm({ ...form, image: event.target.value });
                    setUploadNotice("");
                  }}
                  placeholder="https://res.cloudinary.com/... or https://example.com/image.jpg"
                  required
                  disabled={isSaving}
                />
              </div>
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="product-price">Price (GH₵)</Label>
                <Input
                  id="product-price"
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.price}
                  onChange={(event) => setForm({ ...form, price: event.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="product-old-price">Old price (optional, GH₵)</Label>
                <Input
                  id="product-old-price"
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.oldPrice}
                  onChange={(event) => setForm({ ...form, oldPrice: event.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="product-stock">Available stock</Label>
              <Input
                id="product-stock"
                type="number"
                min="0"
                step="1"
                value={form.stockQuantity}
                onChange={(event) => setForm({ ...form, stockQuantity: Number(event.target.value) })}
                required
              />
              <p className="text-xs text-muted-foreground">
                New catalog items start at zero until you enter the actual inventory count.
              </p>
            </div>

            <label className="flex items-center gap-3 text-sm font-medium">
              <input
                type="checkbox"
                checked={form.isActive}
                onChange={(event) => setForm({ ...form, isActive: event.target.checked })}
                className="h-4 w-4 accent-primary"
              />
              Show this product in the storefront
            </label>

            <div className="flex flex-wrap gap-3 border-t pt-5">
              <Button type="submit" disabled={isSaving || isLoadingCategories || availableCategories.length === 0}>
                {isSaving ? "Saving..." : product ? "Save changes" : "Create product"}
              </Button>
              <Button asChild type="button" variant="outline"><Link to="/products">Cancel</Link></Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
