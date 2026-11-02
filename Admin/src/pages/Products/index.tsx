import { useEffect, useState } from "react";
import { useDelete, useList, useUpdate, type HttpError } from "@refinedev/core";
import { Link } from "react-router";
import { Archive, Plus, RotateCcw, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { Product, ProductPayload } from "./ProductForm";

const PAGE_SIZE = 20;

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

function formatMoney(value: number): string {
  return `GH₵ ${value.toFixed(2)}`;
}

export default function ProductsPage() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [actionError, setActionError] = useState("");
  const { result, query } = useList<Product>({
    resource: "products",
    pagination: { currentPage: page, pageSize: PAGE_SIZE },
    filters: search.trim()
      ? [{ field: "q", operator: "eq", value: search.trim() }]
      : [],
  });
  const { mutateAsync: archiveProduct, mutation: archiveMutation } = useDelete<Product>();
  const { mutateAsync: updateProduct, mutation: updateMutation } = useUpdate<
    Product,
    HttpError,
    ProductPayload
  >();

  const products = result.data ?? [];
  const total = result.total ?? 0;
  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const isMutating = archiveMutation.isPending || updateMutation.isPending;

  useEffect(() => {
    if (page > pageCount) setPage(pageCount);
  }, [page, pageCount]);

  async function changeProductVisibility(product: Product) {
    setActionError("");
    try {
      if (product.isActive) {
        await archiveProduct({ resource: "products", id: product.id });
      } else {
        await updateProduct({
          resource: "products",
          id: product.id,
          values: {
            name: product.name,
            categoryId: product.categoryId,
            image: product.image,
            price: Number(product.price).toFixed(2),
            oldPrice: product.oldPrice === null
              ? ""
              : Number(product.oldPrice).toFixed(2),
            stockQuantity: product.stockQuantity,
            isActive: true,
          },
        });
      }
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "Could not update product status.");
    }
  }

  if (query.isLoading) {
    return <div className="p-6" role="status">Loading products...</div>;
  }

  if (query.isError) {
    const status = getHttpStatus(query.error);
    const needsAdminSignIn = status === 401 || status === 403;
    return (
      <div className="space-y-4 p-6" role="alert">
        <h1 className="text-2xl font-bold">
          {needsAdminSignIn ? "Admin access required" : "Failed to load products"}
        </h1>
        <p className="text-muted-foreground">
          {needsAdminSignIn
            ? "Sign in with an email on the server's ADMIN_EMAILS allowlist to manage products."
            : "Check the backend connection and try again."}
        </p>
        {needsAdminSignIn && (
          <Button asChild variant="outline"><Link to="/orders">Go to admin sign in</Link></Button>
        )}
        {!needsAdminSignIn && (
          <Button variant="outline" onClick={() => query.refetch()}>Try again</Button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Products</h1>
          <p className="text-muted-foreground">Manage the products available in your store.</p>
        </div>
        <Button asChild>
          <Link to="/products/create"><Plus className="mr-2 h-4 w-4" />Add Product</Link>
        </Button>
      </div>

      {actionError && <p className="rounded-md bg-destructive/10 p-3 text-sm text-destructive" role="alert">{actionError}</p>}

      <Card>
        <CardHeader>
          <CardTitle>All Products ({total})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-4 flex max-w-md items-center gap-2">
            <Search className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
            <Input
              type="search"
              aria-label="Search products by name or category"
              placeholder="Search products..."
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setPage(1);
              }}
            />
          </div>

          <div className="w-full overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Stock</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {products.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell>
                      <div className="flex min-w-52 items-center gap-3">
                        <img
                          src={product.image}
                          alt=""
                          className="h-12 w-12 rounded-md border object-cover"
                          loading="lazy"
                        />
                        <span className="font-medium">{product.name}</span>
                      </div>
                    </TableCell>
                    <TableCell>{product.category}</TableCell>
                    <TableCell>{formatMoney(Number(product.price))}</TableCell>
                    <TableCell>{product.stockQuantity}</TableCell>
                    <TableCell>
                      <Badge variant={product.isActive ? "default" : "secondary"}>
                        {product.isActive ? "Active" : "Archived"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-2">
                        <Button asChild variant="outline" size="sm">
                          <Link to={`/products/edit/${encodeURIComponent(product.id)}`}>Edit</Link>
                        </Button>
                        <Button
                          variant={product.isActive ? "outline" : "secondary"}
                          size="sm"
                          disabled={isMutating}
                          onClick={() => void changeProductVisibility(product)}
                          aria-label={`${product.isActive ? "Archive" : "Restore"} ${product.name}`}
                        >
                          {product.isActive
                            ? <><Archive className="mr-1 h-4 w-4" />Archive</>
                            : <><RotateCcw className="mr-1 h-4 w-4" />Restore</>}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {products.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="py-10 text-center text-muted-foreground">
                      {search.trim() ? "No products match your search." : "No products have been added yet."}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          <div className="mt-4 flex items-center justify-between gap-4">
            <p className="text-sm text-muted-foreground">Page {page} of {pageCount}</p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1 || query.isFetching}
                onClick={() => setPage((current) => Math.max(1, current - 1))}
              >Previous</Button>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= pageCount || query.isFetching}
                onClick={() => setPage((current) => Math.min(pageCount, current + 1))}
              >Next</Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
