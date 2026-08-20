import { z } from "zod";
import type { Cart } from "@cart/domain/cart";
import type { CartRepository } from "@cart/domain/cartRepository";
import type { ProductRepository } from "@product/domain/productRepository";
import { NotFoundError } from "@shared/domain/errors";

export const AddCartItemSchema = z.object({
  productId: z.string().uuid("Product id must be a valid UUID"),
  quantity: z.number().int().positive("Quantity must be a positive integer"),
});

export type AddCartItemInput = z.infer<typeof AddCartItemSchema>;

export async function addCartItem(
  cartRepository: CartRepository,
  productRepository: ProductRepository,
  cartId: string | undefined,
  raw: unknown,
): Promise<Cart> {
  const input = AddCartItemSchema.parse(raw);
  const product = await productRepository.getById(input.productId);

  if (!product) {
    throw new NotFoundError("Product not found");
  }

  const cart = cartId
    ? ((await cartRepository.getById(cartId)) ?? (await cartRepository.create()))
    : await cartRepository.create();

  cart.addItem(product, input.quantity);
  await cartRepository.save(cart);
  return cart;
}
