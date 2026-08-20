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
import { API_ROUTES } from "@/constants/routes";
import { IMAGE_UPLOAD } from "@/constants/upload";
import { PRODUCT_DESCRIPTION, PRODUCT_TITLE } from "@/constants/validation";
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
    const response = await fetch(API_ROUTES.PRODUCTS);
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
    window.requestAnimationFrame(() => {
      document.getElementById("product-form")?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    });
  }

  function resetForm() {
    setEditingId(null);
    setForm(emptyForm);
    setImagePreview(null);
  }

  function onImageChange(file: File | null, fileList?: FileList | null) {
    if (!file) {
      setForm((current) => ({ ...current, image: null }));
      return;
    }

    if (fileList && fileList.length > IMAGE_UPLOAD.MAX_IMAGES) {
      setError(`You can upload at most ${IMAGE_UPLOAD.MAX_IMAGES} images`);
      return;
    }

    if (
      !(IMAGE_UPLOAD.ALLOWED_TYPES as readonly string[]).includes(file.type)
    ) {
      setError("Image must be a JPEG, PNG, or WebP file");
      return;
    }

    if (file.size > IMAGE_UPLOAD.MAX_SIZE) {
      setError(
        `Image must be ${IMAGE_UPLOAD.MAX_SIZE / (1024 * 1024)} MB or smaller`,
      );
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
        editingId ? API_ROUTES.product(editingId) : API_ROUTES.PRODUCTS,
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
    const response = await fetch(API_ROUTES.product(product.id), {
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
    <div className="mx-auto flex w-full min-w-0 max-w-6xl flex-col gap-4 overflow-x-clip px-4 py-6 sm:gap-6 sm:px-6 sm:py-8">
      <div className="min-w-0">
        <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">
          Product management
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Add, update, and delete catalog products.
        </p>
      </div>

      {error ? (
        <Alert className="border-destructive/40 bg-destructive/5">
          <AlertDescription className="wrap-break-word text-destructive">
            {error}
          </AlertDescription>
        </Alert>
      ) : null}

      <div className="grid min-w-0 gap-4 sm:gap-6 lg:grid-cols-[minmax(0,22rem)_1fr]">
        <Card id="product-form" className="min-w-0 overflow-hidden">
          <CardHeader className="p-4 sm:p-6">
            <CardTitle>{editingId ? "Edit product" : "Add product"}</CardTitle>
            <CardDescription>
              {editingId
                ? "Update the selected product."
                : "Create a new catalog item."}
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 pt-0 sm:p-6 sm:pt-0">
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
                  minLength={PRODUCT_TITLE.MIN_LENGTH}
                  maxLength={PRODUCT_TITLE.MAX_LENGTH}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={form.description}
                  maxLength={PRODUCT_DESCRIPTION.MAX_LENGTH}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      description: event.target.value,
                    }))
                  }
                />
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="grid gap-2">
                  <Label htmlFor="price">Price</Label>
                  <Input
                    id="price"
                    type="number"
                    min="0.01"
                    step="0.01"
                    inputMode="decimal"
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
                    inputMode="numeric"
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
              <div className="grid min-w-0 gap-2">
                <Label htmlFor="image">
                  Image
                  <span className="block text-xs font-normal text-muted-foreground sm:inline sm:text-sm">
                    {" "}
                    (JPEG, PNG, WebP, max{" "}
                    {IMAGE_UPLOAD.MAX_SIZE / (1024 * 1024)} MB)
                  </span>
                </Label>
                <Input
                  id="image"
                  type="file"
                  className="h-auto max-w-full min-w-0 py-2 text-sm file:mr-3 file:rounded-md file:border-0 file:bg-muted file:px-3 file:py-1.5 file:text-sm"
                  accept={IMAGE_UPLOAD.ALLOWED_TYPES.join(",")}
                  onChange={(event) =>
                    onImageChange(
                      event.target.files?.[0] ?? null,
                      event.target.files,
                    )
                  }
                />
                {imagePreview ? (
                  <img
                    src={imagePreview}
                    alt="Product preview"
                    className="h-36 w-full max-w-full rounded-md border object-cover sm:h-32"
                  />
                ) : null}
              </div>
              <div className="flex flex-col-reverse gap-2 sm:flex-row sm:flex-wrap">
                <Button
                  type="submit"
                  className="w-full sm:w-auto"
                  disabled={loading}
                >
                  {loading ? "Saving..." : editingId ? "Update" : "Add product"}
                </Button>
                {editingId ? (
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full sm:w-auto"
                    onClick={resetForm}
                  >
                    Cancel
                  </Button>
                ) : null}
              </div>
            </form>
          </CardContent>
        </Card>

        <Card className="min-w-0 overflow-hidden">
          <CardHeader className="p-4 sm:p-6">
            <CardTitle>Catalog</CardTitle>
            <CardDescription>{products.length} product(s)</CardDescription>
          </CardHeader>
          <CardContent className="p-4 pt-0 sm:p-6 sm:pt-0">
            {listLoading ? (
              <CatalogSkeleton />
            ) : products.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No products yet. Add one to get started.
              </p>
            ) : (
              <>
                <div className="hidden overflow-x-auto md:block">
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
                                className="h-12 w-12 shrink-0 rounded-md object-cover"
                              />
                            ) : (
                              <div className="flex h-12 w-12 items-center justify-center rounded-md bg-muted text-xs text-muted-foreground">
                                None
                              </div>
                            )}
                          </TableCell>
                          <TableCell className="max-w-56">
                            <div className="truncate font-medium">
                              {product.name}
                            </div>
                            {product.description ? (
                              <div className="truncate text-xs text-muted-foreground">
                                {product.description}
                              </div>
                            ) : null}
                          </TableCell>
                          <TableCell className="whitespace-nowrap tabular-nums">
                            {formatMoney(product.price)}
                          </TableCell>
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
                    <div
                      key={product.id}
                      className="min-w-0 rounded-lg border p-3 sm:p-4"
                    >
                      {product.imageUrl ? (
                        <img
                          src={product.imageUrl}
                          alt={product.name}
                          className="mb-3 h-36 w-full rounded-md object-cover"
                        />
                      ) : null}
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <div className="break-words font-medium">
                            {product.name}
                          </div>
                          {product.description ? (
                            <p className="mt-1 line-clamp-3 text-sm break-words text-muted-foreground">
                              {product.description}
                            </p>
                          ) : null}
                        </div>
                        <StockBadge stock={product.stock} />
                      </div>
                      <p className="mt-2 text-sm font-semibold tabular-nums">
                        {formatMoney(product.price)}
                      </p>
                      <div className="mt-3 grid grid-cols-2 gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="w-full"
                          onClick={() => startEdit(product)}
                        >
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          className="w-full"
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
            <div className="min-w-0 flex-1 space-y-2">
              <Skeleton className="h-4 w-40 max-w-full" />
              <Skeleton className="h-3 w-64 max-w-full" />
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
    return (
      <Badge variant="destructive" className="shrink-0 whitespace-nowrap">
        Out of stock
      </Badge>
    );
  }

  return (
    <Badge variant="secondary" className="shrink-0 whitespace-nowrap">
      {stock} in stock
    </Badge>
  );
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
