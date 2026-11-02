import { useEffect, useState } from "react";
import { useDelete, useList, useUpdate, type HttpError } from "@refinedev/core";
import { Link } from "react-router";
import { Archive, FolderOpen, Plus, RotateCcw, Search } from "lucide-react";
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
import type { Category, CategoryFormValues } from "./CategoryForm";

const PAGE_SIZE = 20;

function getHttpStatus(error: unknown): number | undefined {
  if (typeof error !== "object" || error === null) return undefined;
  if ("statusCode" in error && typeof error.statusCode === "number") {
    return error.statusCode;
  }
  return undefined;
}

export default function CategoriesPage() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [actionError, setActionError] = useState("");
  const { result, query } = useList<Category>({
    resource: "categories",
    pagination: { currentPage: page, pageSize: PAGE_SIZE },
    filters: search.trim()
      ? [{ field: "q", operator: "eq", value: search.trim() }]
      : [],
  });
  const { mutateAsync: archiveCategory, mutation: archiveMutation } = useDelete<Category>();
  const { mutateAsync: updateCategory, mutation: updateMutation } = useUpdate<
    Category,
    HttpError,
    CategoryFormValues
  >();

  const categories = result.data ?? [];
  const total = result.total ?? 0;
  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const isMutating = archiveMutation.isPending || updateMutation.isPending;

  useEffect(() => {
    if (page > pageCount) setPage(pageCount);
  }, [page, pageCount]);

  async function changeCategoryVisibility(category: Category) {
    setActionError("");
    try {
      if (category.isActive) {
        await archiveCategory({ resource: "categories", id: category.id });
      } else {
        await updateCategory({
          resource: "categories",
          id: category.id,
          values: {
            name: category.name,
            description: category.description ?? "",
            isActive: true,
          },
        });
      }
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "Could not update category status.");
    }
  }

  if (query.isLoading) {
    return <div className="p-6" role="status">Loading categories...</div>;
  }

  if (query.isError) {
    const status = getHttpStatus(query.error);
    const needsAdminSignIn = status === 401 || status === 403;
    return (
      <div className="space-y-4 p-6" role="alert">
        <h1 className="text-2xl font-bold">
          {needsAdminSignIn ? "Admin access required" : "Failed to load categories"}
        </h1>
        <p className="text-muted-foreground">
          {needsAdminSignIn
            ? "Sign in with an email on the server's ADMIN_EMAILS allowlist to manage categories."
            : "Check the backend connection and try again."}
        </p>
        {needsAdminSignIn && <Button asChild variant="outline"><Link to="/orders">Go to admin sign in</Link></Button>}
        {!needsAdminSignIn && <Button variant="outline" onClick={() => query.refetch()}>Try again</Button>}
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Categories</h1>
          <p className="text-muted-foreground">Organize products into clear groups.</p>
        </div>
        <Button asChild>
          <Link to="/categories/create"><Plus className="mr-2 h-4 w-4" />Add Category</Link>
        </Button>
      </div>

      <p className="text-sm text-muted-foreground">
        Categories with active products cannot be archived. Reassign or archive those products first.
      </p>
      {actionError && <p className="rounded-md bg-destructive/10 p-3 text-sm text-destructive" role="alert">{actionError}</p>}

      <Card>
        <CardHeader>
          <CardTitle>All Categories ({total})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-4 flex max-w-md items-center gap-2">
            <Search className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
            <Input
              type="search"
              aria-label="Search categories by name or description"
              placeholder="Search categories..."
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
                  <TableHead>Category</TableHead>
                  <TableHead>Products</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {categories.map((category) => (
                  <TableRow key={category.id}>
                    <TableCell>
                      <div className="flex min-w-56 items-start gap-3">
                        <span className="mt-1 rounded-md bg-muted p-2"><FolderOpen className="h-4 w-4" /></span>
                        <div>
                          <p className="font-medium">{category.name}</p>
                          <p className="mt-1 max-w-lg whitespace-normal text-sm text-muted-foreground">
                            {category.description || "No description"}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span>{category.productCount} total</span>
                      <span className="block text-xs text-muted-foreground">{category.activeProductCount} active</span>
                    </TableCell>
                    <TableCell>
                      <Badge variant={category.isActive ? "default" : "secondary"}>
                        {category.isActive ? "Active" : "Archived"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-2">
                        <Button asChild variant="outline" size="sm">
                          <Link to={`/categories/edit/${encodeURIComponent(category.id)}`}>Edit</Link>
                        </Button>
                        <Button
                          variant={category.isActive ? "outline" : "secondary"}
                          size="sm"
                          disabled={isMutating || (category.isActive && category.activeProductCount > 0)}
                          title={category.activeProductCount > 0 ? "Reassign or archive active products first" : undefined}
                          onClick={() => void changeCategoryVisibility(category)}
                          aria-label={`${category.isActive ? "Archive" : "Restore"} ${category.name}`}
                        >
                          {category.isActive
                            ? <><Archive className="mr-1 h-4 w-4" />Archive</>
                            : <><RotateCcw className="mr-1 h-4 w-4" />Restore</>}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {categories.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="py-10 text-center text-muted-foreground">
                      {search.trim() ? "No categories match your search." : "No categories have been added yet."}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          <div className="mt-4 flex items-center justify-between gap-4">
            <p className="text-sm text-muted-foreground">Page {page} of {pageCount}</p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" disabled={page <= 1 || query.isFetching} onClick={() => setPage((current) => Math.max(1, current - 1))}>Previous</Button>
              <Button variant="outline" size="sm" disabled={page >= pageCount || query.isFetching} onClick={() => setPage((current) => Math.min(pageCount, current + 1))}>Next</Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
