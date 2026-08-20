import { CartItem } from "@cart/domain/cartItem";
import type { Product } from "@product/domain/product";
import {
  InsufficientStockError,
  NotFoundError,
  ValidationError,
} from "@shared/domain/errors";
import { Money } from "@shared/domain/money";

export class Cart {
  readonly id: string;
  private items: CartItem[];

  constructor(id: string, items: CartItem[] = []) {
    if (!id.trim()) {
      throw new ValidationError("Cart id is required");
    }

    this.id = id;
    this.items = items.map((item) => item.clone());
  }

  getItems(): CartItem[] {
    return this.items.map((item) => item.clone());
  }

  addItem(product: Product, quantity: number): void {
    assertPositiveQuantity(quantity);

    const existing = this.items.find((item) => item.productId === product.id);
    const nextQuantity = (existing?.quantity ?? 0) + quantity;

    if (!product.hasStock(nextQuantity)) {
      throw new InsufficientStockError(
        `Not enough stock for "${product.name}". Available: ${product.stock}`,
      );
    }

    if (existing) {
      existing.quantity = nextQuantity;
      existing.name = product.name;
      existing.unitPrice = product.price;
      return;
    }

    this.items.push(
      new CartItem(product.id, product.name, product.price, quantity),
    );
  }

  removeItem(productId: string): void {
    const index = this.items.findIndex((item) => item.productId === productId);

    if (index === -1) {
      throw new NotFoundError("Item not in cart");
    }

    this.items.splice(index, 1);
  }

  updateQuantity(productId: string, quantity: number, product: Product): void {
    if (!Number.isInteger(quantity) || quantity < 0) {
      throw new ValidationError("Quantity must be a non-negative integer");
    }

    if (quantity === 0) {
      this.removeItem(productId);
      return;
    }

    const existing = this.items.find((item) => item.productId === productId);

    if (!existing) {
      throw new NotFoundError("Item not in cart");
    }

    if (!product.hasStock(quantity)) {
      throw new InsufficientStockError(
        `Not enough stock for "${product.name}". Available: ${product.stock}`,
      );
    }

    existing.quantity = quantity;
    existing.name = product.name;
    existing.unitPrice = product.price;
  }

  subtotal(): Money {
    return this.items.reduce(
      (total, item) => total.add(item.lineTotal()),
      new Money(0),
    );
  }

  clone(): Cart {
    return new Cart(this.id, this.items);
  }
}

function assertPositiveQuantity(quantity: number): void {
  if (!Number.isInteger(quantity) || quantity < 1) {
    throw new ValidationError("Quantity must be a positive integer");
  }
}
