import { z } from "zod";
import type { Cart } from "@cart/domain/cart";
import type { CartRepository } from "@cart/domain/cartRepository";
import type { ProductRepository } from "@product/domain/productRepository";
import { NotFoundError } from "@shared/domain/errors";

export const UpdateCartItemQuantitySchema = z.object({
  quantity: z.number().int().nonnegative("Quantity cannot be negative"),
});

export async function updateCartItemQuantity(
  cartRepository: CartRepository,
  productRepository: ProductRepository,
  cartId: string | undefined,
  productId: string,
  raw: unknown,
): Promise<Cart> {
  const input = UpdateCartItemQuantitySchema.parse(raw);

  if (!cartId) {
    throw new NotFoundError("Cart not found");
  }

  const cart = await cartRepository.getById(cartId);

  if (!cart) {
    throw new NotFoundError("Cart not found");
  }

  const product = await productRepository.getById(productId);

  if (!product) {
    throw new NotFoundError("Product not found");
  }

  cart.updateQuantity(productId, input.quantity, product);
  await cartRepository.save(cart);
  return cart;
}
