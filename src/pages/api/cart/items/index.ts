import type { APIRoute } from "astro";
import { addCartItem } from "@cart/application/addCartItem";
import { serializeCart } from "@cart/application/serializeCart";
import {
  getCartRepository,
  getProductRepository,
} from "@shared/infrastructure/compose";
import { CART_COOKIE, cartCookieOptions } from "@shared/utils/cartCookie";
import { json, readJson, toErrorResponse } from "@shared/utils/http";

export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    const body = await readJson(request);
    const cart = await addCartItem(
      getCartRepository(),
      getProductRepository(),
      cookies.get(CART_COOKIE)?.value,
      body,
    );

    cookies.set(CART_COOKIE, cart.id, cartCookieOptions);
    return json(serializeCart(cart), 201);
  } catch (error) {
    return toErrorResponse(error);
  }
};
