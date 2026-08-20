import { describe, expect, it } from "vitest";
import { Cart } from "@cart/domain/cart";
import { Product } from "@product/domain/product";
import {
  InsufficientStockError,
  NotFoundError,
  ValidationError,
} from "@shared/domain/errors";

function makeProduct(stock = 10) {
  return Product.create({
    id: "1231241124214",
    name: "Tester",
    price: 102,
    stock,
  });
}

describe("Cart", () => {
  it("adds a new item", () => {
    const cart = new Cart("cart-1");
    cart.addItem(makeProduct(), 2);

    expect(cart.getItems()).toHaveLength(1);
    expect(cart.getItems()[0]?.quantity).toBe(2);
    expect(cart.subtotal().amount).toBe(204);
  });

  it("merges quantities for the same product", () => {
    const cart = new Cart("cart-1");
    const product = makeProduct();
    cart.addItem(product, 2);
    cart.addItem(product, 3);

    expect(cart.getItems()).toHaveLength(1);
    expect(cart.getItems()[0]?.quantity).toBe(5);
  });

  it("rejects adding more than available stock", () => {
    const cart = new Cart("cart-1");
    expect(() => cart.addItem(makeProduct(2), 3)).toThrow(
      InsufficientStockError,
    );
  });

  it("rejects a non-positive add quantity", () => {
    const cart = new Cart("cart-1");
    expect(() => cart.addItem(makeProduct(), 0)).toThrow(ValidationError);
  });

  it("removes an item", () => {
    const cart = new Cart("cart-1");
    const product = makeProduct();
    cart.addItem(product, 1);
    cart.removeItem(product.id);
    expect(cart.getItems()).toHaveLength(0);
  });

  it("throws when removing a missing item", () => {
    const cart = new Cart("cart-1");
    expect(() => cart.removeItem(makeProduct().id)).toThrow(NotFoundError);
  });

  it("updates quantity", () => {
    const cart = new Cart("cart-1");
    const product = makeProduct();
    cart.addItem(product, 1);
    cart.updateQuantity(product.id, 4, product);
    expect(cart.getItems()[0]?.quantity).toBe(4);
  });

  it("removes an item when quantity is set to 0", () => {
    const cart = new Cart("cart-1");
    const product = makeProduct();
    cart.addItem(product, 1);
    cart.updateQuantity(product.id, 0, product);
    expect(cart.getItems()).toHaveLength(0);
  });

  it("rejects updating quantity above stock", () => {
    const cart = new Cart("cart-1");
    const product = makeProduct(2);
    cart.addItem(product, 1);
    expect(() => cart.updateQuantity(product.id, 3, product)).toThrow(
      InsufficientStockError,
    );
  });
});
