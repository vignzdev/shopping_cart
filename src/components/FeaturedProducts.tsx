import { useEffect, useState } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type { CartDto } from "@cart/application/serializeCart";
import type { ProductDto } from "@product/application/serializeProduct";
import { notifyCartUpdated, totalCartQuantity } from "@shared/utils/cartEvents";
import { ArrowRight, Heart, Star } from "lucide-react";

const FEATURED_COUNT = 4;

export function FeaturedProducts() {
  const [products, setProducts] = useState<ProductDto[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [showAll, setShowAll] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/products")
      .then(async (response) => {
        if (!response.ok) {
          throw new Error(await readError(response));
        }
        setProducts((await response.json()) as ProductDto[]);
      })
      .catch((cause: unknown) => {
        setError(
          cause instanceof Error ? cause.message : "Failed to load products",
        );
      })
      .finally(() => setLoading(false));
  }, []);

  const visible = showAll ? products : products.slice(0, FEATURED_COUNT);

  async function addToCart(productId: string) {
    setPendingId(productId);
    setError(null);
    try {
      const response = await fetch("/api/cart/items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId, quantity: 1 }),
      });
      if (!response.ok) {
        throw new Error(await readError(response));
      }
      const cart = (await response.json()) as CartDto;
      notifyCartUpdated(totalCartQuantity(cart.items));
      window.location.href = "/cart";
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Could not add to cart",
      );
      setPendingId(null);
    }
  }

  return (
    <section
      id="featured"
      className="mx-auto w-full max-w-7xl px-4 py-12 sm:px-6 sm:py-16"
    >
      <div className="mb-8 flex items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">Products</h2>
        </div>
        {products.length > FEATURED_COUNT && !showAll ? (
          <button
            type="button"
            className="inline-flex items-center gap-1 text-sm font-medium text-neutral-800 hover:underline"
            onClick={() => setShowAll(true)}
          >
            See all
            <ArrowRight className="size-4" />
          </button>
        ) : (
          <span className="inline-flex items-center gap-1 text-sm font-medium text-neutral-800">
            See all
            <ArrowRight className="size-4" />
          </span>
        )}
      </div>

      {error ? (
        <Alert className="mb-6 border-destructive/40 bg-destructive/5">
          <AlertDescription className="text-destructive">
            {error}
          </AlertDescription>
        </Alert>
      ) : null}

      {loading ? (
        <FeaturedProductsSkeleton />
      ) : products.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No products yet. Check back soon.
        </p>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {visible.map((product, index) => (
            <ProductCard
              key={product.id}
              product={product}
              index={index}
              pending={pendingId === product.id}
              onAdd={() => addToCart(product.id)}
            />
          ))}
        </div>
      )}
    </section>
  );
}

function FeaturedProductsSkeleton() {
  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: 4 }, (_, index) => (
        <article
          key={index}
          className="flex flex-col rounded-xl border bg-card p-3 shadow-sm"
        >
          <Skeleton className="aspect-square w-full rounded-lg" />
          <div className="space-y-2 px-1 pt-3">
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-5 w-3/4" />
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-4 w-14" />
            <Skeleton className="mt-2 h-10 w-full" />
          </div>
        </article>
      ))}
    </div>
  );
}

function ProductCard({
  product,
  index,
  pending,
  onAdd,
}: {
  product: ProductDto;
  index: number;
  pending: boolean;
  onAdd: () => void;
}) {
  const soldOut = product.stock === 0;
  const badge = productBadge(product, index);
  const rating = displayRating(product.id);

  return (
    <article className="flex flex-col rounded-xl border bg-card p-3 shadow-sm">
      <div className="relative overflow-hidden rounded-lg bg-neutral-100">
        {product.imageUrl ? (
          <img
            src={product.imageUrl}
            alt={product.name}
            className="aspect-square w-full object-cover"
          />
        ) : (
          <div className="flex aspect-square items-center justify-center text-sm text-muted-foreground">
            No image
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col px-1 pt-3">
        <p className="text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
          {categoryFor(product)}
        </p>
        <h3 className="mt-1 font-semibold tracking-tight">{product.name}</h3>
        <div className="mt-1.5 flex items-center gap-1.5 text-sm">
          <div className="flex text-orange-400" aria-hidden="true">
            {Array.from({ length: 5 }, (_, star) => (
              <Star
                key={star}
                className="size-3.5"
                fill={star < Math.round(rating) ? "currentColor" : "none"}
              />
            ))}
          </div>
          <span className="text-xs text-muted-foreground">
            {rating.toFixed(1)}
          </span>
        </div>
        <p className="mt-2 text-sm font-semibold">
          {formatMoney(product.price)}
        </p>
        <Button
          className="mt-4 h-10 w-full rounded-md bg-neutral-950 text-white hover:bg-neutral-800"
          disabled={soldOut || pending}
          onClick={onAdd}
        >
          {soldOut ? "Sold out" : pending ? "Adding…" : "Add to Cart"}
        </Button>
      </div>
    </article>
  );
}

function categoryFor(product: ProductDto): string {
  const text = `${product.name} ${product.description ?? ""}`.toLowerCase();
  if (/watch|headphone|phone|laptop|mobile|electronic/.test(text))
    return "Electronics";
  if (/jacket|shirt|dress|fashion|shoe|pant/.test(text)) return "Fashion";
  if (/serum|beauty|skin|cream|lotion/.test(text)) return "Beauty";
  return "Featured";
}

function productBadge(
  product: ProductDto,
  index: number,
): { label: string; className: string } | null {
  if (product.stock === 0) {
    return { label: "Sold out", className: "bg-neutral-800 text-white" };
  }
  if (index === 0) {
    return { label: "New", className: "bg-blue-500 text-white" };
  }
  if (product.stock <= 3) {
    return { label: "Hot", className: "bg-orange-500 text-white" };
  }
  return null;
}

function displayRating(id: string): number {
  const sum = [...id].reduce((total, char) => total + char.charCodeAt(0), 0);
  return 4 + (sum % 10) / 10;
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
