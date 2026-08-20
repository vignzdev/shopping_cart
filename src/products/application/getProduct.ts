import type { Product } from "@product/domain/product";
import type { ProductRepository } from "@product/domain/productRepository";
import { NotFoundError } from "@shared/domain/errors";

export async function getProduct(
  repository: ProductRepository,
  id: string,
): Promise<Product> {
  const product = await repository.getById(id);

  if (!product) {
    throw new NotFoundError("Product not found");
  }

  return product;
}
