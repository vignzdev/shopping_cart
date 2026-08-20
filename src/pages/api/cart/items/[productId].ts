import type { APIRoute } from "astro";
import { removeCartItem } from "@cart/application/removeCartItem";
import { serializeCart } from "@cart/application/serializeCart";
import { updateCartItemQuantity } from "@cart/application/updateCartItemQuantity";
import {
  getCartRepository,
  getProductRepository,
} from "@shared/infrastructure/compose";
import { CART_COOKIE } from "@shared/utils/cartCookie";
import { json, readJson, toErrorResponse } from "@shared/utils/http";
import { ValidationError } from "@shared/domain/errors";

export const PATCH: APIRoute = async ({ params, request, cookies }) => {
  try {
    const body = await readJson(request);
    const cart = await updateCartItemQuantity(
      getCartRepository(),
      getProductRepository(),
      cookies.get(CART_COOKIE)?.value,
      requireProductId(params.productId),
      body,
    );
    return json(serializeCart(cart));
  } catch (error) {
    return toErrorResponse(error);
  }
};

export const DELETE: APIRoute = async ({ params, cookies }) => {
  try {
    const cart = await removeCartItem(
      getCartRepository(),
      cookies.get(CART_COOKIE)?.value,
      requireProductId(params.productId),
    );
    return json(serializeCart(cart));
  } catch (error) {
    return toErrorResponse(error);
  }
};

function requireProductId(productId: string | undefined): string {
  if (!productId) {
    throw new ValidationError("Product id is required");
  }

  return productId;
}
