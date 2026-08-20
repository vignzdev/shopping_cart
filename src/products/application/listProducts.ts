import type { Product } from "@product/domain/product";
import type { ProductRepository } from "@product/domain/productRepository";

export async function listProducts(
  repository: ProductRepository,
): Promise<Product[]> {
  return repository.list();
}
