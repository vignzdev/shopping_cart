import type { Cart } from "@cart/domain/cart";

export interface CartRepository {
  getById(id: string): Promise<Cart | null>;
  save(cart: Cart): Promise<void>;
  create(): Promise<Cart>;
}
