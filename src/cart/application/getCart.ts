import type { Cart } from "@cart/domain/cart";
import type { CartRepository } from "@cart/domain/cartRepository";

export async function getCart(
  cartRepository: CartRepository,
  cartId: string | undefined,
): Promise<Cart | null> {
  if (!cartId) {
    return null;
  }

  return cartRepository.getById(cartId);
}
