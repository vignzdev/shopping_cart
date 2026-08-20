import { NotFoundError } from "@shared/domain/errors";
import { Product } from "@product/domain/product";
import type { ProductRepository } from "@product/domain/productRepository";

export class InMemoryProductRepository implements ProductRepository {
  private readonly products = new Map<string, Product>();

  async add(product: Product): Promise<Product> {
    this.products.set(product.id, product.clone());
    return product.clone();
  }

  async update(product: Product): Promise<Product> {
    if (!this.products.has(product.id)) {
      throw new NotFoundError("Product not found");
    }

    this.products.set(product.id, product.clone());
    return product.clone();
  }

  async delete(id: string): Promise<boolean> {
    return this.products.delete(id);
  }

  async getById(id: string): Promise<Product | null> {
    const product = this.products.get(id);
    return product ? product.clone() : null;
  }

  async list(): Promise<Product[]> {
    return [...this.products.values()].map((product) => product.clone());
  }
}
