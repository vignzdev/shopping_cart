import type { CartRepository } from "@cart/domain/cartRepository";
import { SupabaseCartRepository } from "@/cart/infrastructure/cartRepository";
import type { ProductImageStorage } from "@product/domain/productImageStorage";
import type { ProductRepository } from "@product/domain/productRepository";
import { R2ProductImageStorage } from "@product/infrastructure/r2ProductImageStorage";
import { SupabaseProductRepository } from "@product/infrastructure/supabaseProductRepository";

let productRepository: ProductRepository | undefined;
let cartRepository: CartRepository | undefined;
let productImageStorage: ProductImageStorage | undefined;

export function getProductRepository(): ProductRepository {
  if (!productRepository) {
    productRepository = new SupabaseProductRepository();
  }

  return productRepository;
}

export function getCartRepository(): CartRepository {
  if (!cartRepository) {
    cartRepository = new SupabaseCartRepository();
  }

  return cartRepository;
}

export function setProductRepository(repository: ProductRepository): void {
  productRepository = repository;
}

export function setCartRepository(repository: CartRepository): void {
  cartRepository = repository;
}

export function getProductImageStorage(): ProductImageStorage {
  if (!productImageStorage) {
    productImageStorage = new R2ProductImageStorage();
  }

  return productImageStorage;
}

export function setProductImageStorage(storage: ProductImageStorage): void {
  productImageStorage = storage;
}

export function resetRepositories(): void {
  productRepository = undefined;
  cartRepository = undefined;
  productImageStorage = undefined;
}
