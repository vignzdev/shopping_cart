import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import type { CartDto } from "@cart/application/serializeCart";
import { CART_UPDATED_EVENT, totalCartQuantity } from "@shared/utils/cartEvents";

export function CartBadge() {
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/cart")
      .then((response) => (response.ok ? response.json() : null))
      .then((cart: CartDto | null) => {
        if (cart) {
          setCount(totalCartQuantity(cart.items));
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));

    function onUpdated(event: Event) {
      const itemCount = (event as CustomEvent<{ itemCount: number }>).detail?.itemCount;
      if (typeof itemCount === "number") {
        setCount(itemCount);
      }
    }

    window.addEventListener(CART_UPDATED_EVENT, onUpdated);
    return () => window.removeEventListener(CART_UPDATED_EVENT, onUpdated);
  }, []);

  if (loading) {
    return (
      <Skeleton className="absolute -top-1.5 -right-1.5 h-4 w-4 rounded-full" />
    );
  }

  return (
    <Badge
      className="absolute -top-1.5 -right-1.5 flex h-4 min-w-4 items-center justify-center rounded-full border-0 bg-orange-500 px-1 text-[10px] leading-none font-semibold text-white"
      aria-label={`${count} items in cart`}
    >
      {count}
    </Badge>
  );
}
