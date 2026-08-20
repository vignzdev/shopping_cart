import { beforeEach, describe, expect, it } from "vitest";
import type { APIContext } from "astro";
import { GET as GET_CART } from "../../../pages/api/cart/index";
import { DELETE, PATCH } from "../../../pages/api/cart/items/[productId]";
import { POST as ADD_ITEM } from "../../../pages/api/cart/items/index";
import { POST as ADD_PRODUCT } from "../../../pages/api/products/index";
import { InMemoryCartRepository } from "@cart/infrastructure/inMemoryCartRepository";
import { InMemoryProductRepository } from "@product/infrastructure/inMemoryProductRepository";
import {
  setCartRepository,
  setProductRepository,
} from "@shared/infrastructure/compose";
import { CART_COOKIE } from "@shared/utils/cartCookie";

type CookieJar = Map<string, string>;

function createContext(
  request: Request,
  params: Record<string, string> = {},
  cookies: CookieJar = new Map(),
): APIContext {
  return {
    request,
    params,
    cookies: {
      get(name: string) {
        const value = cookies.get(name);
        return value === undefined ? undefined : { value };
      },
      set(name: string, value: string) {
        cookies.set(name, value);
      },
    },
  } as unknown as APIContext;
}

async function parse(response: Response) {
  const text = await response.text();
  return {
    status: response.status,
    body: text ? (JSON.parse(text) as Record<string, unknown>) : null,
  };
}

describe("cart API", () => {
  const cookies: CookieJar = new Map();

  beforeEach(() => {
    cookies.clear();
    setProductRepository(new InMemoryProductRepository());
    setCartRepository(new InMemoryCartRepository());
  });

  async function createProduct(stock = 10) {
    const result = await parse(
      await ADD_PRODUCT(
        createContext(
          new Request("http://localhost/api/products", {
            method: "POST",
            body: JSON.stringify({ name: "Mug", price: 12, stock }),
          }),
        ),
      ),
    );
    return result.body as { id: string };
  }

  it("returns an empty cart when no cookie is set", async () => {
    const result = await parse(
      await GET_CART(createContext(new Request("http://localhost/api/cart"))),
    );
    expect(result.status).toBe(200);
    expect(result.body).toEqual({ id: null, items: [], subtotal: 0 });
  });

  it("adds an item and sets the cart cookie", async () => {
    const product = await createProduct();
    const result = await parse(
      await ADD_ITEM(
        createContext(
          new Request("http://localhost/api/cart/items", {
            method: "POST",
            body: JSON.stringify({ productId: product.id, quantity: 2 }),
          }),
          {},
          cookies,
        ),
      ),
    );

    expect(result.status).toBe(201);
    expect(result.body).toMatchObject({ subtotal: 24 });
    expect(cookies.has(CART_COOKIE)).toBe(true);

    const viewed = await parse(
      await GET_CART(
        createContext(new Request("http://localhost/api/cart"), {}, cookies),
      ),
    );
    expect((viewed.body?.items as unknown[]).length).toBe(1);
  });

  it("merges quantities for the same product", async () => {
    const product = await createProduct();
    await ADD_ITEM(
      createContext(
        new Request("http://localhost/api/cart/items", {
          method: "POST",
          body: JSON.stringify({ productId: product.id, quantity: 1 }),
        }),
        {},
        cookies,
      ),
    );
    const result = await parse(
      await ADD_ITEM(
        createContext(
          new Request("http://localhost/api/cart/items", {
            method: "POST",
            body: JSON.stringify({ productId: product.id, quantity: 2 }),
          }),
          {},
          cookies,
        ),
      ),
    );

    const items = result.body?.items as Array<{ quantity: number }>;
    expect(items[0]?.quantity).toBe(3);
  });

  it("returns 409 when stock is insufficient", async () => {
    const product = await createProduct(1);
    const result = await parse(
      await ADD_ITEM(
        createContext(
          new Request("http://localhost/api/cart/items", {
            method: "POST",
            body: JSON.stringify({ productId: product.id, quantity: 5 }),
          }),
          {},
          cookies,
        ),
      ),
    );
    expect(result.status).toBe(409);
  });

  it("updates quantity and removes at zero", async () => {
    const product = await createProduct();
    await ADD_ITEM(
      createContext(
        new Request("http://localhost/api/cart/items", {
          method: "POST",
          body: JSON.stringify({ productId: product.id, quantity: 2 }),
        }),
        {},
        cookies,
      ),
    );

    const updated = await parse(
      await PATCH(
        createContext(
          new Request(`http://localhost/api/cart/items/${product.id}`, {
            method: "PATCH",
            body: JSON.stringify({ quantity: 0 }),
          }),
          { productId: product.id },
          cookies,
        ),
      ),
    );
    expect(updated.status).toBe(200);
    expect(updated.body).toMatchObject({ items: [], subtotal: 0 });
  });

  it("removes an item", async () => {
    const product = await createProduct();
    await ADD_ITEM(
      createContext(
        new Request("http://localhost/api/cart/items", {
          method: "POST",
          body: JSON.stringify({ productId: product.id, quantity: 1 }),
        }),
        {},
        cookies,
      ),
    );

    const result = await parse(
      await DELETE(
        createContext(
          new Request(`http://localhost/api/cart/items/${product.id}`),
          { productId: product.id },
          cookies,
        ),
      ),
    );
    expect(result.status).toBe(200);
    expect(result.body).toMatchObject({ items: [] });
  });

  it("returns 404 when updating a cart without a cookie", async () => {
    const result = await parse(
      await PATCH(
        createContext(
          new Request("http://localhost/api/cart/items/abc", {
            method: "PATCH",
            body: JSON.stringify({ quantity: 1 }),
          }),
          { productId: crypto.randomUUID() },
        ),
      ),
    );
    expect(result.status).toBe(404);
  });
});
