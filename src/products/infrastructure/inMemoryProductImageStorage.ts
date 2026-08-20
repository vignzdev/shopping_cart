import {
  assertProductImage,
  productImageExtension,
  type ProductImageFile,
} from "@product/domain/productImage";
import type {
  ProductImageStorage,
  UploadedProductImage,
} from "@product/domain/productImageStorage";

export class InMemoryProductImageStorage implements ProductImageStorage {
  readonly files = new Map<string, Uint8Array>();
  readonly deletedKeys: string[] = [];

  async upload(
    productId: string,
    file: ProductImageFile,
  ): Promise<UploadedProductImage> {
    const type = assertProductImage(file);
    const extension = productImageExtension(type);
    const key = `products/${productId}/${crypto.randomUUID()}.${extension}`;
    this.files.set(key, file.bytes);
    return {
      key,
      url: `https://cdn.test/${key}`,
    };
  }

  async delete(key: string): Promise<void> {
    this.files.delete(key);
    this.deletedKeys.push(key);
  }
}
