import type { Cart } from "@cart/domain/cart";
import type { CartRepository } from "@cart/domain/cartRepository";
import { NotFoundError } from "@shared/domain/errors";

export async function removeCartItem(
  cartRepository: CartRepository,
  cartId: string | undefined,
  productId: string,
): Promise<Cart> {
  if (!cartId) {
    throw new NotFoundError("Cart not found");
  }

  const cart = await cartRepository.getById(cartId);

  if (!cart) {
    throw new NotFoundError("Cart not found");
  }

  cart.removeItem(productId);
  await cartRepository.save(cart);
  return cart;
}
