import type { Product } from "@product/domain/product";

export interface ProductRepository {
  add(product: Product): Promise<Product>;
  update(product: Product): Promise<Product>;
  delete(id: string): Promise<boolean>;
  getById(id: string): Promise<Product | null>;
  list(): Promise<Product[]>;
}
