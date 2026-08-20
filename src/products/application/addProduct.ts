import { PRODUCT_DESCRIPTION, PRODUCT_TITLE } from "@/constants/validation";
import { z } from "zod";
import { Product } from "@product/domain/product";
import {
  assertProductImage,
  type ProductImageFile,
} from "@product/domain/productImage";
import type { ProductImageStorage } from "@product/domain/productImageStorage";
import type { ProductRepository } from "@product/domain/productRepository";
import { ValidationError } from "@shared/domain/errors";

export const AddProductSchema = z.object({
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
    ),
  description: z
    .string()
    .max(
      PRODUCT_DESCRIPTION.MAX_LENGTH,
      `Description must be ${PRODUCT_DESCRIPTION.MAX_LENGTH} characters or fewer`,
    )
    .optional(),
  price: z.number().positive("Price must be positive"),
  stock: z.number().int().nonnegative("Stock cannot be negative"),
});

export type AddProductInput = z.infer<typeof AddProductSchema>;

export async function addProduct(
  repository: ProductRepository,
  raw: unknown,
  image?: ProductImageFile,
  imageStorage?: ProductImageStorage,
): Promise<Product> {
  const input = AddProductSchema.parse(raw);
  const id = crypto.randomUUID();

  let imageUrl: string | undefined;
  let imageKey: string | undefined;

  if (image) {
    if (!imageStorage) {
      throw new ValidationError("Image storage is not configured");
    }

    assertProductImage(image);
    const uploaded = await imageStorage.upload(id, image);
    imageUrl = uploaded.url;
    imageKey = uploaded.key;
  }

  const product = Product.create({
    id,
    name: input.name,
    description: input.description,
    price: input.price,
    stock: input.stock,
    imageUrl,
    imageKey,
  });

  return repository.add(product);
}
