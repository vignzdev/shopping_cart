import { beforeEach, describe, expect, it } from "vitest";
import { ZodError } from "zod";
import { addProduct } from "@product/application/addProduct";
import { deleteProduct } from "@product/application/deleteProduct";
import { getProduct } from "@product/application/getProduct";
import { listProducts } from "@product/application/listProducts";
import { updateProduct } from "@product/application/updateProduct";
import { InMemoryProductImageStorage } from "@product/infrastructure/inMemoryProductImageStorage";
import { InMemoryProductRepository } from "@product/infrastructure/inMemoryProductRepository";
import { NotFoundError, ValidationError } from "@shared/domain/errors";
import { GIF_BYTES, JPEG_BYTES, PNG_BYTES } from "./imageFixtures";

describe("product use cases", () => {
  let repository: InMemoryProductRepository;

  beforeEach(() => {
    repository = new InMemoryProductRepository();
  });

  it("adds a product", async () => {
    const product = await addProduct(repository, {
      name: "Tea",
      price: 4.5,
      stock: 8,
    });

    expect(product.name).toBe("Tea");
    expect(await repository.getById(product.id)).not.toBeNull();
  });

  it("rejects invalid add input", async () => {
    await expect(
      addProduct(repository, { name: "", price: 4.5, stock: 1 }),
    ).rejects.toBeInstanceOf(ZodError);
  });

  it("updates a product", async () => {
    const created = await addProduct(repository, {
      name: "Tea",
      price: 4.5,
      stock: 8,
    });

    const updated = await updateProduct(repository, created.id, {
      name: "Coffee",
      price: 6,
    });

    expect(updated.name).toBe("Coffee");
    expect(updated.price.amount).toBe(6);
    expect(updated.stock).toBe(8);
  });

  it("throws when updating a missing product", async () => {
    await expect(
      updateProduct(repository, crypto.randomUUID(), { name: "Unknown" }),
    ).rejects.toBeInstanceOf(NotFoundError);
  });

  it("gets a product by id", async () => {
    const created = await addProduct(repository, {
      name: "Tea",
      price: 4.5,
      stock: 8,
    });

    const found = await getProduct(repository, created.id);
    expect(found.id).toBe(created.id);
  });

  it("lists products", async () => {
    await addProduct(repository, { name: "Tea", price: 4.5, stock: 1 });
    await addProduct(repository, { name: "Mug", price: 12, stock: 2 });

    const products = await listProducts(repository);
    expect(products).toHaveLength(2);
  });

  it("deletes a product", async () => {
    const created = await addProduct(repository, {
      name: "Tea",
      price: 4.5,
      stock: 8,
    });

    await deleteProduct(repository, created.id);
    await expect(getProduct(repository, created.id)).rejects.toBeInstanceOf(
      NotFoundError,
    );
  });

  it("throws when deleting a missing product", async () => {
    await expect(deleteProduct(repository, crypto.randomUUID())).rejects.toBeInstanceOf(
      NotFoundError,
    );
  });

  it("uploads a PNG image when adding a product", async () => {
    const images = new InMemoryProductImageStorage();
    const product = await addProduct(
      repository,
      { name: "Tea", price: 4.5, stock: 8 },
      { bytes: PNG_BYTES, mimeType: "image/png", fileName: "tea.png" },
      images,
    );

    expect(product.imageUrl).toMatch(/^https:\/\/cdn\.test\/products\//);
    expect(images.files.size).toBe(1);
  });

  it("rejects a GIF image", async () => {
    const images = new InMemoryProductImageStorage();
    await expect(
      addProduct(
        repository,
        { name: "Tea", price: 4.5, stock: 8 },
        { bytes: GIF_BYTES, mimeType: "image/gif", fileName: "tea.gif" },
        images,
      ),
    ).rejects.toBeInstanceOf(ValidationError);
  });

  it("replaces an existing image on update", async () => {
    const images = new InMemoryProductImageStorage();
    const created = await addProduct(
      repository,
      { name: "Tea", price: 4.5, stock: 8 },
      { bytes: PNG_BYTES, mimeType: "image/png", fileName: "tea.png" },
      images,
    );
    const oldKey = created.imageKey;

    const updated = await updateProduct(
      repository,
      created.id,
      { name: "Tea" },
      { bytes: JPEG_BYTES, mimeType: "image/jpeg", fileName: "tea.jpg" },
      images,
    );

    expect(updated.imageKey).not.toBe(oldKey);
    expect(images.deletedKeys).toContain(oldKey);
    expect(images.files.has(updated.imageKey ?? "")).toBe(true);
  });

  it("deletes the stored image with the product", async () => {
    const images = new InMemoryProductImageStorage();
    const created = await addProduct(
      repository,
      { name: "Tea", price: 4.5, stock: 8 },
      { bytes: PNG_BYTES, mimeType: "image/png", fileName: "tea.png" },
      images,
    );

    await deleteProduct(repository, created.id, images);
    expect(images.deletedKeys).toContain(created.imageKey);
    expect(images.files.size).toBe(0);
  });
});
