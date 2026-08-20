import type { ProductImageFile } from "@product/domain/productImage";

export type UploadedProductImage = {
  key: string;
  url: string;
};

export interface ProductImageStorage {
  upload(productId: string, file: ProductImageFile): Promise<UploadedProductImage>;
  delete(key: string): Promise<void>;
}
