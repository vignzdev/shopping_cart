import { useEffect, useState, type FormEvent } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import type { ProductDto } from "@product/application/serializeProduct";

type FormState = {
  name: string;
  description: string;
  price: string;
  stock: string;
  image: File | null;
};

const emptyForm: FormState = {
  name: "",
  description: "",
  price: "",
  stock: "",
  image: null,
};

export function ProductManager() {
  const [products, setProducts] = useState<ProductDto[]>([]);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [listLoading, setListLoading] = useState(true);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  async function loadProducts() {
    const response = await fetch("/api/products");
    if (!response.ok) {
      throw new Error(await readError(response));
    }
    setProducts((await response.json()) as ProductDto[]);
  }

  useEffect(() => {
    loadProducts()
      .catch((cause: unknown) => {
        setError(
          cause instanceof Error ? cause.message : "Failed to load products",
        );
      })
      .finally(() => setListLoading(false));
  }, []);

  function startEdit(product: ProductDto) {
    setEditingId(product.id);
    setForm({
      name: product.name,
      description: product.description ?? "",
      price: String(product.price),
      stock: String(product.stock),
      image: null,
    });
    setImagePreview(product.imageUrl);
    setError(null);
  }

  function resetForm() {
    setEditingId(null);
    setForm(emptyForm);
    setImagePreview(null);
  }

  function onImageChange(file: File | null) {
    if (!file) {
      setForm((current) => ({ ...current, image: null }));
      return;
    }

    const extension = file.name.split(".").pop()?.toLowerCase() ?? "";
    const allowedType =
      (file.type === "image/png" && extension === "png") ||
      (file.type === "image/jpeg" && ["jpg", "jpeg"].includes(extension));

    if (!allowedType) {
      setError("Image must be a PNG, JPEG, or JPG file");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setError("Image must be 10 MB or smaller");
      return;
    }

    setError(null);
    setForm((current) => ({ ...current, image: file }));
    setImagePreview(URL.createObjectURL(file));
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    const payload = new FormData();
    payload.set("name", form.name);
    if (form.description) {
      payload.set("description", form.description);
    }
    payload.set("price", form.price);
    payload.set("stock", form.stock);
    if (form.image) {
      payload.set("image", form.image);
    }

    try {
      const response = await fetch(
        editingId ? `/api/products/${editingId}` : "/api/products",
        {
          method: editingId ? "PUT" : "POST",
          body: payload,
        },
      );

      if (!response.ok) {
        throw new Error(await readError(response));
      }

      resetForm();
      await loadProducts();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Save failed");
    } finally {
      setLoading(false);
    }
  }

  async function onDelete(product: ProductDto) {
    if (!window.confirm(`Delete "${product.name}"?`)) {
      return;
    }

    setError(null);
    const response = await fetch(`/api/products/${product.id}`, {
      method: "DELETE",
    });

    if (!response.ok) {
      setError(await readError(response));
      return;
    }

    if (editingId === product.id) {
      resetForm();
    }

    await loadProducts();
  }

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Product management
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Add, update, and delete catalog products.
        </p>
      </div>

      {error ? (
        <Alert className="border-destructive/40 bg-destructive/5">
          <AlertDescription className="text-destructive">
            {error}
          </AlertDescription>
        </Alert>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,22rem)_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>{editingId ? "Edit product" : "Add product"}</CardTitle>
            <CardDescription>
              {editingId
                ? "Update the selected product."
                : "Create a new catalog item."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form className="grid gap-4" onSubmit={onSubmit}>
              <div className="grid gap-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={form.name}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      name: event.target.value,
                    }))
                  }
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={form.description}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      description: event.target.value,
                    }))
                  }
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="grid gap-2">
                  <Label htmlFor="price">Price</Label>
                  <Input
                    id="price"
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={form.price}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        price: event.target.value,
                      }))
                    }
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="stock">Stock</Label>
                  <Input
                    id="stock"
                    type="number"
                    min="0"
                    step="1"
                    value={form.stock}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        stock: event.target.value,
                      }))
                    }
                    required
                  />
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="image">Image (PNG, JPEG, JPG, max 10 MB)</Label>
                <Input
                  id="image"
                  type="file"
                  accept=".png,.jpg,.jpeg,image/png,image/jpeg"
                  onChange={(event) => onImageChange(event.target.files?.[0] ?? null)}
                />
                {imagePreview ? (
                  <img
                    src={imagePreview}
                    alt="Product preview"
                    className="h-32 w-full rounded-md border object-cover"
                  />
                ) : null}
              </div>
              <div className="flex flex-wrap gap-2">
                <Button type="submit" disabled={loading}>
                  {loading ? "Saving..." : editingId ? "Update" : "Add product"}
                </Button>
                {editingId ? (
                  <Button type="button" variant="outline" onClick={resetForm}>
                    Cancel
                  </Button>
                ) : null}
              </div>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Catalog</CardTitle>
            <CardDescription>{products.length} product(s)</CardDescription>
          </CardHeader>
          <CardContent>
            {listLoading ? (
              <CatalogSkeleton />
            ) : products.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No products yet. Add one to get started.
              </p>
            ) : (
              <>
                <div className="hidden md:block">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Image</TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead>Price</TableHead>
                        <TableHead>Stock</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {products.map((product) => (
                        <TableRow key={product.id}>
                          <TableCell>
                            {product.imageUrl ? (
                              <img
                                src={product.imageUrl}
                                alt={product.name}
                                className="h-12 w-12 rounded-md object-cover"
                              />
                            ) : (
                              <div className="flex h-12 w-12 items-center justify-center rounded-md bg-muted text-xs text-muted-foreground">
                                None
                              </div>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="font-medium">{product.name}</div>
                            {product.description ? (
                              <div className="text-xs text-muted-foreground">
                                {product.description}
                              </div>
                            ) : null}
                          </TableCell>
                          <TableCell>{formatMoney(product.price)}</TableCell>
                          <TableCell>
                            <StockBadge stock={product.stock} />
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => startEdit(product)}
                              >
                                Edit
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => onDelete(product)}
                              >
                                Delete
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                <div className="grid gap-3 md:hidden">
                  {products.map((product) => (
                    <div key={product.id} className="rounded-lg border p-4">
                      {product.imageUrl ? (
                        <img
                          src={product.imageUrl}
                          alt={product.name}
                          className="mb-3 h-32 w-full rounded-md object-cover"
                        />
                      ) : null}
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="font-medium">{product.name}</div>
                          {product.description ? (
                            <p className="mt-1 text-sm text-muted-foreground">
                              {product.description}
                            </p>
                          ) : null}
                        </div>
                        <StockBadge stock={product.stock} />
                      </div>
                      <p className="mt-2 text-sm">
                        {formatMoney(product.price)}
                      </p>
                      <div className="mt-3 flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => startEdit(product)}
                        >
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => onDelete(product)}
                        >
                          Delete
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function CatalogSkeleton() {
  return (
    <>
      <div className="hidden space-y-3 md:block">
        {Array.from({ length: 4 }, (_, index) => (
          <div key={index} className="flex items-center gap-4">
            <Skeleton className="h-12 w-12 rounded-md" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-3 w-64" />
            </div>
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-5 w-20" />
            <Skeleton className="h-8 w-28" />
          </div>
        ))}
      </div>
      <div className="grid gap-3 md:hidden">
        {Array.from({ length: 3 }, (_, index) => (
          <div key={index} className="space-y-3 rounded-lg border p-4">
            <Skeleton className="h-32 w-full rounded-md" />
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-3 w-24" />
            <div className="flex gap-2">
              <Skeleton className="h-8 w-16" />
              <Skeleton className="h-8 w-16" />
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

function StockBadge({ stock }: { stock: number }) {
  if (stock === 0) {
    return <Badge variant="destructive">Out of stock</Badge>;
  }

  return <Badge variant="secondary">{stock} in stock</Badge>;
}

function formatMoney(amount: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
}

async function readError(response: Response): Promise<string> {
  const body = (await response.json().catch(() => ({}))) as {
    error?: string;
    issues?: Array<{ message?: string }>;
  };
  return body.error ?? body.issues?.[0]?.message ?? "Request failed";
}
