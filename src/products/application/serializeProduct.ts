import type { Product } from "@product/domain/product";

export type ProductDto = {
  id: string;
  name: string;
  description: string | null;
  price: number;
  stock: number;
  imageUrl: string | null;
};

export function serializeProduct(product: Product): ProductDto {
  return {
    id: product.id,
    name: product.name,
    description: product.description ?? null,
    price: product.price.amount,
    stock: product.stock,
    imageUrl: product.imageUrl ?? null,
  };
}
