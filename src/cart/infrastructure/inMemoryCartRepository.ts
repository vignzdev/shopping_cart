import { Cart } from "@cart/domain/cart";
import type { CartRepository } from "@cart/domain/cartRepository";

export class InMemoryCartRepository implements CartRepository {
  private readonly carts = new Map<string, Cart>();

  async create(): Promise<Cart> {
    const cart = new Cart(crypto.randomUUID());
    this.carts.set(cart.id, cart.clone());
    return cart.clone();
  }

  async getById(id: string): Promise<Cart | null> {
    const cart = this.carts.get(id);
    return cart ? cart.clone() : null;
  }

  async save(cart: Cart): Promise<void> {
    this.carts.set(cart.id, cart.clone());
  }
}
