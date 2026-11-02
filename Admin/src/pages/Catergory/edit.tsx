import { useOne, useUpdate, type HttpError } from "@refinedev/core";
import { Link, useNavigate, useParams } from "react-router";
import { Button } from "@/components/ui/button";
import { CategoryForm, type Category, type CategoryFormValues } from "./CategoryForm";

function getHttpStatus(error: unknown): number | undefined {
  if (typeof error !== "object" || error === null) return undefined;
  if ("statusCode" in error && typeof error.statusCode === "number") {
    return error.statusCode;
  }
  return undefined;
}

export default function EditCategoryPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { result, query } = useOne<Category>({
    resource: "categories",
    id: id ?? "",
    queryOptions: { enabled: Boolean(id) },
  });
  const { mutateAsync } = useUpdate<Category, HttpError, CategoryFormValues>();

  async function saveCategory(values: CategoryFormValues) {
    if (!id) throw new Error("Category ID is missing.");
    await mutateAsync({ resource: "categories", id, values });
    navigate("/categories");
  }

  if (query.isLoading) {
    return <div className="p-6" role="status">Loading category...</div>;
  }

  if (query.isError || !result) {
    const status = getHttpStatus(query.error);
    const isNotFound = status === 404;
    const needsAdminSignIn = status === 401 || status === 403;
    return (
      <div className="space-y-4 p-6" role="alert">
        <h1 className="text-2xl font-bold">
          {isNotFound ? "Category not found" : needsAdminSignIn ? "Admin access required" : "Could not load category"}
        </h1>
        <p className="text-muted-foreground">
          {isNotFound
            ? "The category may have been removed or the category ID is incorrect."
            : needsAdminSignIn
              ? "Sign in with an email on the server's ADMIN_EMAILS allowlist to manage categories."
              : "Check the backend connection and try again."}
        </p>
        <div className="flex gap-3">
          <Button asChild variant="outline"><Link to="/categories">Back to categories</Link></Button>
          {needsAdminSignIn && <Button asChild variant="outline"><Link to="/orders">Go to admin sign in</Link></Button>}
          {!isNotFound && !needsAdminSignIn && (
            <Button variant="outline" onClick={() => query.refetch()}>Try again</Button>
          )}
        </div>
      </div>
    );
  }

  return <CategoryForm category={result} onSave={saveCategory} />;
}
