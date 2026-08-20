import { useEffect, useMemo, useState } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import type { CartDto } from "@cart/application/serializeCart";
import type { ProductDto } from "@product/application/serializeProduct";
import { notifyCartUpdated, totalCartQuantity } from "@shared/utils/cartEvents";
import {
  ArrowRight,
  CreditCard,
  Lock,
  Minus,
  Plus,
  Shield,
  Store,
  Trash2,
} from "lucide-react";

export function CartView() {
  const [products, setProducts] = useState<ProductDto[]>([]);
  const [cart, setCart] = useState<CartDto>({
    id: null,
    items: [],
    subtotal: 0,
  });
  const [error, setError] = useState<string | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const imagesById = useMemo(
    () => new Map(products.map((product) => [product.id, product.imageUrl])),
    [products],
  );

  async function load() {
    const [productsResponse, cartResponse] = await Promise.all([
      fetch("/api/products"),
      fetch("/api/cart"),
    ]);

    if (!cartResponse.ok) {
      throw new Error(await readError(cartResponse));
    }

    if (productsResponse.ok) {
      setProducts((await productsResponse.json()) as ProductDto[]);
    }
    const nextCart = (await cartResponse.json()) as CartDto;
    setCart(nextCart);
    notifyCartUpdated(totalCartQuantity(nextCart.items));
  }

  useEffect(() => {
    load()
      .catch((cause: unknown) => {
        setError(
          cause instanceof Error ? cause.message : "Failed to load cart",
        );
      })
      .finally(() => setLoading(false));
  }, []);

  async function setQuantity(productId: string, quantity: number) {
    await mutate(productId, () =>
      fetch(`/api/cart/items/${productId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quantity }),
      }),
    );
  }

  async function removeItem(productId: string) {
    await mutate(productId, () =>
      fetch(`/api/cart/items/${productId}`, { method: "DELETE" }),
    );
  }

  async function mutate(pending: string, request: () => Promise<Response>) {
    setPendingId(pending);
    setError(null);
    try {
      const response = await request();
      if (!response.ok) {
        throw new Error(await readError(response));
      }
      const nextCart = (await response.json()) as CartDto;
      setCart(nextCart);
      notifyCartUpdated(totalCartQuantity(nextCart.items));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Cart update failed");
    } finally {
      setPendingId(null);
    }
  }

  const empty = cart.items.length === 0;

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-8 sm:px-6">
      {error ? (
        <Alert className="border-destructive/40 bg-destructive/5">
          <AlertDescription className="text-destructive">
            {error}
          </AlertDescription>
        </Alert>
      ) : null}

      {loading ? (
        <CartSkeleton />
      ) : empty ? (
        <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
          <p className="text-xl font-semibold tracking-tight">
            We don't have any products
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            Your cart is empty. Add items to get started.
          </p>
          <a
            href="/"
            className="mt-6 inline-flex items-center gap-2 rounded-md bg-neutral-950 px-5 py-2.5 text-sm font-medium text-white hover:bg-neutral-800"
          >
            Continue Shopping
            <ArrowRight className="size-4" />
          </a>
        </div>
      ) : (
        <>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              Shopping cart
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Review your items and proceed to checkout.
            </p>
          </div>

          <div className="grid items-start gap-6 lg:grid-cols-[1fr_minmax(0,22rem)]">
            <Card>
              <CardHeader>
                <CardTitle>Your items</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="divide-y">
                  {cart.items.map((item) => {
                    const imageUrl = imagesById.get(item.productId);
                    return (
                      <li
                        key={item.productId}
                        className="flex gap-4 py-4 first:pt-0 last:pb-0"
                      >
                        <div className="size-20 shrink-0 overflow-hidden rounded-lg bg-neutral-100">
                          {imageUrl ? (
                            <img
                              src={imageUrl}
                              alt={item.name}
                              className="size-full object-cover"
                            />
                          ) : null}
                        </div>
                        <div className="flex min-w-0 flex-1 flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                          <div className="min-w-0">
                            <p className="font-medium">{item.name}</p>
                            <p className="mt-0.5 text-sm text-muted-foreground">
                              {formatMoney(item.unitPrice)}
                            </p>
                          </div>
                          <div className="flex items-center justify-between gap-4 sm:justify-end">
                            <QuantityControls
                              quantity={item.quantity}
                              disabled={pendingId === item.productId}
                              onDecrease={() =>
                                setQuantity(item.productId, item.quantity - 1)
                              }
                              onIncrease={() =>
                                setQuantity(item.productId, item.quantity + 1)
                              }
                              onChange={(quantity) =>
                                setQuantity(item.productId, quantity)
                              }
                              onRemove={() => removeItem(item.productId)}
                            />
                            <p className="w-20 text-right text-sm font-semibold">
                              {formatMoney(item.lineTotal)}
                            </p>
                          </div>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </CardContent>
            </Card>

            <aside className="flex flex-col gap-4">
              <Card>
                <CardHeader>
                  <CardTitle>Order Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Subtotal</span>
                      <span>{formatMoney(cart.subtotal)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Shipping</span>
                      <span>Free</span>
                    </div>
                  </div>

                  <div className="flex items-start justify-between border-t pt-4">
                    <span className="font-semibold">Total</span>
                    <div className="text-right">
                      <p className="text-lg font-semibold">
                        {formatMoney(cart.subtotal)}
                      </p>
                    </div>
                  </div>

                  <Button
                    className="h-11 w-full bg-neutral-950 text-white hover:bg-neutral-800"
                    disabled={empty}
                  >
                    <CreditCard />
                    Proceed to Checkout
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="flex items-center gap-3 p-4">
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-amber-100 text-orange-500">
                    <Shield className="size-5" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold">Secure Checkout</p>
                    <p className="text-xs text-muted-foreground">
                      Your payment information is encrypted and secure.
                    </p>
                  </div>
                </CardContent>
              </Card>

              <a
                href="/"
                className="flex items-center justify-center gap-2 rounded-xl border bg-card px-4 py-3 text-sm font-medium shadow-sm transition hover:bg-accent"
              >
                <Store className="size-4" />
                Continue Shopping
                <ArrowRight className="size-4" />
              </a>
            </aside>
          </div>
        </>
      )}
    </div>
  );
}

function CartSkeleton() {
  return (
    <>
      <div>
        <Skeleton className="h-8 w-48" />
        <Skeleton className="mt-2 h-4 w-72" />
      </div>
      <div className="grid items-start gap-6 lg:grid-cols-[1fr_minmax(0,22rem)]">
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-28" />
          </CardHeader>
          <CardContent className="space-y-6">
            {Array.from({ length: 3 }, (_, index) => (
              <div key={index} className="flex gap-4">
                <Skeleton className="size-20 shrink-0 rounded-lg" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-40" />
                  <Skeleton className="h-3 w-20" />
                  <Skeleton className="h-8 w-36" />
                </div>
                <Skeleton className="h-4 w-16" />
              </div>
            ))}
          </CardContent>
        </Card>
        <aside className="flex flex-col gap-4">
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-36" />
            </CardHeader>
            <CardContent className="space-y-3">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="ml-auto h-6 w-24" />
              <Skeleton className="h-11 w-full" />
            </CardContent>
          </Card>
          <Skeleton className="h-16 w-full rounded-xl" />
          <Skeleton className="h-12 w-full rounded-xl" />
        </aside>
      </div>
    </>
  );
}

function QuantityControls({
  quantity,
  disabled,
  onDecrease,
  onIncrease,
  onChange,
  onRemove,
}: {
  quantity: number;
  disabled: boolean;
  onDecrease: () => void;
  onIncrease: () => void;
  onChange: (quantity: number) => void;
  onRemove: () => void;
}) {
  return (
    <div className="flex items-center gap-1.5">
      <Button
        size="icon"
        variant="outline"
        className="size-8"
        disabled={disabled}
        onClick={onDecrease}
        aria-label="Decrease quantity"
      >
        <Minus />
      </Button>
      <Input
        className="h-8 w-12 text-center"
        type="number"
        min="0"
        value={quantity}
        disabled={disabled}
        onChange={(event) => onChange(Number(event.target.value))}
      />
      <Button
        size="icon"
        variant="outline"
        className="size-8"
        disabled={disabled}
        onClick={onIncrease}
        aria-label="Increase quantity"
      >
        <Plus />
      </Button>
      <Button
        size="icon"
        variant="ghost"
        className="size-8"
        disabled={disabled}
        onClick={onRemove}
        aria-label="Remove item"
      >
        <Trash2 />
      </Button>
    </div>
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
