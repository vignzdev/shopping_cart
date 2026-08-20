import type { Cart } from "@cart/domain/cart";

export type CartItemDto = {
  productId: string;
  name: string;
  unitPrice: number;
  quantity: number;
  lineTotal: number;
};

export type CartDto = {
  id: string | null;
  items: CartItemDto[];
  subtotal: number;
};

export function serializeCart(cart: Cart | null): CartDto {
  if (!cart) {
    return { id: null, items: [], subtotal: 0 };
  }

  return {
    id: cart.id,
    items: cart.getItems().map((item) => ({
      productId: item.productId,
      name: item.name,
      unitPrice: item.unitPrice.amount,
      quantity: item.quantity,
      lineTotal: item.lineTotal().amount,
    })),
    subtotal: cart.subtotal().amount,
  };
}
