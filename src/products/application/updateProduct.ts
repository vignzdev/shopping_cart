import { PRODUCT_DESCRIPTION, PRODUCT_TITLE } from "@/constants/validation";
import { z } from "zod";
import {
  assertProductImage,
  type ProductImageFile,
} from "@product/domain/productImage";
import type { ProductImageStorage } from "@product/domain/productImageStorage";
import type { ProductRepository } from "@product/domain/productRepository";
import { NotFoundError, ValidationError } from "@shared/domain/errors";
import type { Product } from "../domain/product";

const UpdateProductFieldsSchema = z.object({
  name: z
    .string()
    .trim()
    .min(
      PRODUCT_TITLE.MIN_LENGTH,
      `Name must be at least ${PRODUCT_TITLE.MIN_LENGTH} characters`,
    )
    .max(
      PRODUCT_TITLE.MAX_LENGTH,
      `Name must be ${PRODUCT_TITLE.MAX_LENGTH} characters or fewer`,
    )
    .optional(),
  description: z
    .string()
    .max(
      PRODUCT_DESCRIPTION.MAX_LENGTH,
      `Description must be ${PRODUCT_DESCRIPTION.MAX_LENGTH} characters or fewer`,
    )
    .optional(),
  price: z.number().positive("Price must be positive").optional(),
  stock: z.number().int().nonnegative("Stock cannot be negative").optional(),
});

export const UpdateProductSchema = UpdateProductFieldsSchema.refine(
  (data) => Object.values(data).some((value) => value !== undefined),
  { message: "At least one field is required" },
);

export type UpdateProductInput = z.infer<typeof UpdateProductFieldsSchema>;

export async function updateProduct(
  repository: ProductRepository,
  id: string,
  raw: unknown,
  image?: ProductImageFile,
  imageStorage?: ProductImageStorage,
): Promise<Product> {
  const input = image
    ? UpdateProductFieldsSchema.parse(raw ?? {})
    : UpdateProductSchema.parse(raw);

  const product = await repository.getById(id);

  if (!product) {
    throw new NotFoundError("Product not found");
  }

  if (Object.values(input).some((value) => value !== undefined)) {
    product.updateDetails(input);
  }

  if (image) {
    if (!imageStorage) {
      throw new ValidationError("Image storage is not configured");
    }

    assertProductImage(image);

    if (product.imageKey) {
      await imageStorage.delete(product.imageKey);
    }

    const uploaded = await imageStorage.upload(product.id, image);
    product.updateDetails({
      imageUrl: uploaded.url,
      imageKey: uploaded.key,
    });
  }

  return repository.update(product);
}
