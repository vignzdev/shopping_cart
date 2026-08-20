import { describe, expect, it } from "vitest";
import { Product } from "@product/domain/product";
import { ValidationError } from "@shared/domain/errors";

function makeProduct(
  overrides: Partial<Parameters<typeof Product.create>[0]> = {},
) {
  return Product.create({
    id: "product-1",
    name: "Apple",
    description: "Apple Macbook pro",
    price: 4.5,
    stock: 10,
    ...overrides,
  });
}

describe("Product", () => {
  it("creates a valid product", () => {
    const product = makeProduct();
    expect(product.name).toBe("Apple");
    expect(product.price.amount).toBe(4.5);
    expect(product.stock).toBe(10);
  });

  it("trims name and description", () => {
    const product = makeProduct({
      name: "  Apple  ",
      description: "  Apple Macbook pro  ",
    });
    expect(product.name).toBe("Apple");
    expect(product.description).toBe("Apple Macbook pro");
  });

  it("rejects a name shorter than the minimum", () => {
    expect(() => makeProduct({ name: "Ab" })).toThrow(ValidationError);
  });

  it("rejects an empty name", () => {
    expect(() => makeProduct({ name: " " })).toThrow(ValidationError);
  });

  it("rejects a non-positive price", () => {
    expect(() => makeProduct({ price: 0 })).toThrow(ValidationError);
  });

  it("rejects negative stock", () => {
    expect(() => makeProduct({ stock: -1 })).toThrow(ValidationError);
  });

  it("updates details in place", () => {
    const product = makeProduct();
    product.updateDetails({ name: "Coffee", price: 6, stock: 3 });
    expect(product.name).toBe("Coffee");
    expect(product.price.amount).toBe(6);
    expect(product.stock).toBe(3);
  });

  it("stores an optional image", () => {
    const product = makeProduct({
      imageUrl: "https://cdn.test/apple.png",
      imageKey: "products/product-1/apple.png",
    });
    expect(product.imageUrl).toBe("https://cdn.test/apple.png");
  });

  it("rejects image URL without a storage key", () => {
    expect(() =>
      makeProduct({ imageUrl: "https://cdn.test/apple.png" }),
    ).toThrow(ValidationError);
  });

  it("reports available stock", () => {
    const product = makeProduct({ stock: 2 });
    expect(product.hasStock(2)).toBe(true);
    expect(product.hasStock(3)).toBe(false);
  });
});
