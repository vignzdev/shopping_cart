import type { ProductRepository } from "@product/domain/productRepository";
import type { ProductImageStorage } from "@product/domain/productImageStorage";
import { NotFoundError } from "@shared/domain/errors";

export async function deleteProduct(
  repository: ProductRepository,
  id: string,
  imageStorage?: ProductImageStorage,
): Promise<void> {
  const product = await repository.getById(id);

  if (!product) {
    throw new NotFoundError("Product not found");
  }

  if (product.imageKey && imageStorage) {
    await imageStorage.delete(product.imageKey);
  }

  const deleted = await repository.delete(id);

  if (!deleted) {
    throw new NotFoundError("Product not found");
  }
}
