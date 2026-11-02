import { useOne, useUpdate, type HttpError } from "@refinedev/core";
import { Link, useNavigate, useParams } from "react-router";
import { Button } from "@/components/ui/button";
import { ProductForm, type Product, type ProductPayload } from "./ProductForm";

function getHttpStatus(error: unknown): number | undefined {
  if (typeof error !== "object" || error === null) return undefined;
  if ("statusCode" in error && typeof error.statusCode === "number") {
    return error.statusCode;
  }
  if ("response" in error && typeof error.response === "object" && error.response !== null) {
    const response = error.response as { status?: unknown };
    return typeof response.status === "number" ? response.status : undefined;
  }
  return undefined;
}

export default function EditProductPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { result, query } = useOne<Product>({
    resource: "products",
    id: id ?? "",
    queryOptions: { enabled: Boolean(id) },
  });
  const { mutateAsync } = useUpdate<Product, HttpError, ProductPayload>();

  async function saveProduct(values: ProductPayload) {
    if (!id) throw new Error("Product ID is missing.");
    await mutateAsync({ resource: "products", id, values });
    navigate("/products");
  }

  if (query.isLoading) {
    return <div className="p-6" role="status">Loading product...</div>;
  }

  if (query.isError || !result) {
    const status = getHttpStatus(query.error);
    const isNotFound = status === 404;
    const needsAdminSignIn = status === 401 || status === 403;
    return (
      <div className="space-y-4 p-6" role="alert">
        <h1 className="text-2xl font-bold">
          {isNotFound ? "Product not found" : needsAdminSignIn ? "Admin access required" : "Could not load product"}
        </h1>
        <p className="text-muted-foreground">
          {isNotFound
            ? "The product may have been removed or the product ID is incorrect."
            : needsAdminSignIn
              ? "Sign in with an email on the server's ADMIN_EMAILS allowlist to manage products."
              : "Check the backend connection and try again."}
        </p>
        <div className="flex gap-3">
          <Button asChild variant="outline"><Link to="/products">Back to products</Link></Button>
          {needsAdminSignIn && <Button asChild variant="outline"><Link to="/orders">Go to admin sign in</Link></Button>}
          {!isNotFound && !needsAdminSignIn && (
            <Button variant="outline" onClick={() => query.refetch()}>Try again</Button>
          )}
        </div>
      </div>
    );
  }

  return <ProductForm product={result} onSave={saveProduct} />;
}
