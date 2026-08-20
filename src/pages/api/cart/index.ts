import type { APIRoute } from "astro";
import { getCart } from "@cart/application/getCart";
import { serializeCart } from "@cart/application/serializeCart";
import { getCartRepository } from "@shared/infrastructure/compose";
import { CART_COOKIE } from "@shared/utils/cartCookie";
import { json, toErrorResponse } from "@shared/utils/http";

export const GET: APIRoute = async ({ cookies }) => {
  try {
    const cart = await getCart(getCartRepository(), cookies.get(CART_COOKIE)?.value);
    return json(serializeCart(cart));
  } catch (error) {
    return toErrorResponse(error);
  }
};
