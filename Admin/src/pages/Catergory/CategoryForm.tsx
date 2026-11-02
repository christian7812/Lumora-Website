import { useState, type FormEvent } from "react";
import { Link } from "react-router";
import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export interface Category {
  id: string;
  name: string;
  description: string | null;
  isActive: boolean;
  productCount: number;
  activeProductCount: number;
}

export interface CategoryFormValues {
  name: string;
  description: string;
  isActive: boolean;
}

interface CategoryFormProps {
  category?: Category;
  onSave: (values: CategoryFormValues) => Promise<void>;
}

function getHttpStatus(error: unknown): number | undefined {
  if (typeof error !== "object" || error === null) return undefined;
  if ("statusCode" in error && typeof error.statusCode === "number") {
    return error.statusCode;
  }
  return undefined;
}

export function CategoryForm({ category, onSave }: CategoryFormProps) {
  const [name, setName] = useState(category?.name ?? "");
  const [description, setDescription] = useState(category?.description ?? "");
  const [isActive, setIsActive] = useState(category?.isActive ?? true);
  const [error, setError] = useState("");
  const [errorStatus, setErrorStatus] = useState<number | undefined>();
  const [isSaving, setIsSaving] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setErrorStatus(undefined);

    if (!name.trim()) {
      setError("Enter a category name.");
      return;
    }

    setIsSaving(true);
    try {
      await onSave({ name: name.trim(), description: description.trim(), isActive });
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Could not save category.");
      setErrorStatus(getHttpStatus(saveError));
    } finally {
      setIsSaving(false);
    }
  }

  const needsAdminSignIn = errorStatus === 401 || errorStatus === 403;
  const canChangeActive = !category || !category.isActive || category.activeProductCount === 0;

  return (
    <div className="mx-auto max-w-2xl space-y-6 p-6">
      <div>
        <Button asChild variant="ghost" className="-ml-3 mb-2">
          <Link to="/categories">← Back to categories</Link>
        </Button>
        <h1 className="text-3xl font-bold tracking-tight">
          {category ? "Edit category" : "Add category"}
        </h1>
        <p className="text-muted-foreground">Organize products into clear groups.</p>
      </div>

      {error && (
        <div className="flex items-start gap-3 rounded-md border border-destructive/30 bg-destructive/5 p-4 text-sm" role="alert">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
          <div>
            <p>{error}</p>
            {needsAdminSignIn && <Link className="mt-2 inline-block underline" to="/orders">Go to admin sign in</Link>}
          </div>
        </div>
      )}

      <Card>
        <CardHeader><CardTitle>Category details</CardTitle></CardHeader>
        <CardContent>
          <form className="space-y-5" onSubmit={(event) => void handleSubmit(event)}>
            <div className="space-y-2">
              <Label htmlFor="category-name">Name</Label>
              <Input
                id="category-name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                maxLength={100}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="category-description">Description (optional)</Label>
              <Textarea
                id="category-description"
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                maxLength={500}
                rows={4}
              />
              <p className="text-xs text-muted-foreground">Up to 500 characters.</p>
            </div>

            {category && (
              <div className="space-y-2 border-t pt-4">
                <label className="flex items-center gap-3 text-sm font-medium">
                  <input
                    type="checkbox"
                    checked={isActive}
                    disabled={!canChangeActive}
                    onChange={(event) => setIsActive(event.target.checked)}
                    className="h-4 w-4 accent-primary"
                  />
                  Active category
                </label>
                {category.isActive && category.activeProductCount > 0 && (
                  <p className="text-sm text-muted-foreground">
                    This category cannot be archived while active products use it. <Link className="underline" to="/products">Manage products</Link> first.
                  </p>
                )}
              </div>
            )}

            <div className="flex flex-wrap gap-3 border-t pt-5">
              <Button type="submit" disabled={isSaving}>
                {isSaving ? "Saving..." : category ? "Save changes" : "Create category"}
              </Button>
              <Button asChild type="button" variant="outline"><Link to="/categories">Cancel</Link></Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
