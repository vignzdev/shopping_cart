import { beforeEach, describe, expect, it } from "vitest";
import { ZodError } from "zod";
import { addCartItem } from "@cart/application/addCartItem";
import { getCart } from "@cart/application/getCart";
import { removeCartItem } from "@cart/application/removeCartItem";
import { serializeCart } from "@cart/application/serializeCart";
import { updateCartItemQuantity } from "@cart/application/updateCartItemQuantity";
import { InMemoryCartRepository } from "@cart/infrastructure/inMemoryCartRepository";
import { addProduct } from "@product/application/addProduct";
import { InMemoryProductRepository } from "@product/infrastructure/inMemoryProductRepository";
import { InsufficientStockError, NotFoundError } from "@shared/domain/errors";

describe("cart use cases", () => {
  let cartRepository: InMemoryCartRepository;
  let productRepository: InMemoryProductRepository;

  beforeEach(() => {
    cartRepository = new InMemoryCartRepository();
    productRepository = new InMemoryProductRepository();
  });

  async function seedProduct(stock = 10) {
    return addProduct(productRepository, {
      name: "Mug",
      price: 12,
      stock,
    });
  }

  it("creates a cart on first add", async () => {
    const product = await seedProduct();
    const cart = await addCartItem(cartRepository, productRepository, undefined, {
      productId: product.id,
      quantity: 2,
    });

    expect(cart.getItems()).toHaveLength(1);
    expect(serializeCart(cart).subtotal).toBe(24);
  });

  it("merges items when adding the same product", async () => {
    const product = await seedProduct();
    const first = await addCartItem(cartRepository, productRepository, undefined, {
      productId: product.id,
      quantity: 2,
    });
    const second = await addCartItem(cartRepository, productRepository, first.id, {
      productId: product.id,
      quantity: 1,
    });

    expect(second.getItems()[0]?.quantity).toBe(3);
  });

  it("rejects adding more than stock", async () => {
    const product = await seedProduct(1);
    await expect(
      addCartItem(cartRepository, productRepository, undefined, {
        productId: product.id,
        quantity: 2,
      }),
    ).rejects.toBeInstanceOf(InsufficientStockError);
  });

  it("rejects an unknown product", async () => {
    await expect(
      addCartItem(cartRepository, productRepository, undefined, {
        productId: crypto.randomUUID(),
        quantity: 1,
      }),
    ).rejects.toBeInstanceOf(NotFoundError);
  });

  it("rejects invalid add payload", async () => {
    await expect(
      addCartItem(cartRepository, productRepository, undefined, {
        productId: "not-a-uuid",
        quantity: 1,
      }),
    ).rejects.toBeInstanceOf(ZodError);
  });

  it("updates quantity and removes at zero", async () => {
    const product = await seedProduct();
    const cart = await addCartItem(cartRepository, productRepository, undefined, {
      productId: product.id,
      quantity: 2,
    });

    const updated = await updateCartItemQuantity(
      cartRepository,
      productRepository,
      cart.id,
      product.id,
      { quantity: 0 },
    );

    expect(updated.getItems()).toHaveLength(0);
  });

  it("removes an item", async () => {
    const product = await seedProduct();
    const cart = await addCartItem(cartRepository, productRepository, undefined, {
      productId: product.id,
      quantity: 1,
    });

    const next = await removeCartItem(cartRepository, cart.id, product.id);
    expect(next.getItems()).toHaveLength(0);
  });

  it("returns null when viewing a missing cart", async () => {
    expect(await getCart(cartRepository, undefined)).toBeNull();
    expect(await getCart(cartRepository, crypto.randomUUID())).toBeNull();
  });

  it("throws when removing without a cart", async () => {
    await expect(
      removeCartItem(cartRepository, undefined, crypto.randomUUID()),
    ).rejects.toBeInstanceOf(NotFoundError);
  });
});
