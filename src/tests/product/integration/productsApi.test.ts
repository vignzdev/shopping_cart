import { beforeEach, describe, expect, it } from "vitest";
import type { APIContext } from "astro";
import { DELETE, GET as GET_ONE, PUT } from "../../../pages/api/products/[id]";
import { GET, POST } from "../../../pages/api/products/index";
import { InMemoryProductImageStorage } from "@product/infrastructure/inMemoryProductImageStorage";
import { InMemoryProductRepository } from "@product/infrastructure/inMemoryProductRepository";
import {
  setProductImageStorage,
  setProductRepository,
} from "@shared/infrastructure/compose";
import { GIF_BYTES, PNG_BYTES } from "../unit/imageFixtures";

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

describe("products API", () => {
  beforeEach(() => {
    setProductRepository(new InMemoryProductRepository());
    setProductImageStorage(new InMemoryProductImageStorage());
  });

  it("lists an empty catalog", async () => {
    const response = await GET(
      createContext(new Request("http://localhost/api/products")),
    );
    const result = await parse(response);
    expect(result.status).toBe(200);
    expect(result.body).toEqual([]);
  });

  it("creates a product", async () => {
    const response = await POST(
      createContext(
        new Request("http://localhost/api/products", {
          method: "POST",
          body: JSON.stringify({ name: "Tea", price: 4.5, stock: 8 }),
        }),
      ),
    );
    const result = await parse(response);
    expect(result.status).toBe(201);
    expect(result.body).toMatchObject({
      name: "Tea",
      price: 4.5,
      stock: 8,
      imageUrl: null,
    });
  });

  it("rejects invalid product payloads", async () => {
    const response = await POST(
      createContext(
        new Request("http://localhost/api/products", {
          method: "POST",
          body: JSON.stringify({ name: "", price: -1, stock: 1 }),
        }),
      ),
    );
    expect((await parse(response)).status).toBe(400);
  });

  it("fetches, updates, and deletes a product", async () => {
    const created = await parse(
      await POST(
        createContext(
          new Request("http://localhost/api/products", {
            method: "POST",
            body: JSON.stringify({ name: "Tea", price: 4.5, stock: 8 }),
          }),
        ),
      ),
    );
    const id = created.body?.id as string;

    const fetched = await parse(
      await GET_ONE(
        createContext(new Request(`http://localhost/api/products/${id}`), { id }),
      ),
    );
    expect(fetched.status).toBe(200);
    expect(fetched.body).toMatchObject({ name: "Tea" });

    const updated = await parse(
      await PUT(
        createContext(
          new Request(`http://localhost/api/products/${id}`, {
            method: "PUT",
            body: JSON.stringify({ name: "Coffee", price: 6 }),
          }),
          { id },
        ),
      ),
    );
    expect(updated.status).toBe(200);
    expect(updated.body).toMatchObject({ name: "Coffee", price: 6, stock: 8 });

    const deleted = await DELETE(
      createContext(new Request(`http://localhost/api/products/${id}`), { id }),
    );
    expect(deleted.status).toBe(204);

    const missing = await parse(
      await GET_ONE(
        createContext(new Request(`http://localhost/api/products/${id}`), { id }),
      ),
    );
    expect(missing.status).toBe(404);
  });

  it("returns 404 for an unknown product", async () => {
    const id = crypto.randomUUID();
    const response = await parse(
      await GET_ONE(
        createContext(new Request(`http://localhost/api/products/${id}`), { id }),
      ),
    );
    expect(response.status).toBe(404);
  });

  it("creates a product with a PNG image", async () => {
    const body = new FormData();
    body.set("name", "Tea");
    body.set("price", "4.5");
    body.set("stock", "8");
    body.set("image", new File([PNG_BYTES], "tea.png", { type: "image/png" }));

    const result = await parse(
      await POST(
        createContext(
          new Request("http://localhost/api/products", {
            method: "POST",
            body,
          }),
        ),
      ),
    );

    expect(result.status).toBe(201);
    expect(result.body).toMatchObject({ name: "Tea" });
    expect(typeof result.body?.imageUrl).toBe("string");
    expect(String(result.body?.imageUrl)).toContain("products/");
  });

  it("rejects a GIF image upload", async () => {
    const body = new FormData();
    body.set("name", "Tea");
    body.set("price", "4.5");
    body.set("stock", "8");
    body.set("image", new File([GIF_BYTES], "tea.gif", { type: "image/gif" }));

    const result = await parse(
      await POST(
        createContext(
          new Request("http://localhost/api/products", {
            method: "POST",
            body,
          }),
        ),
      ),
    );

    expect(result.status).toBe(400);
  });

  it("rejects an image larger than 10 MB", async () => {
    const tooLarge = new Uint8Array(10 * 1024 * 1024 + 1);
    tooLarge.set(PNG_BYTES, 0);
    const body = new FormData();
    body.set("name", "Tea");
    body.set("price", "4.5");
    body.set("stock", "8");
    body.set(
      "image",
      new File([tooLarge], "huge.png", { type: "image/png" }),
    );

    const result = await parse(
      await POST(
        createContext(
          new Request("http://localhost/api/products", {
            method: "POST",
            body,
          }),
        ),
      ),
    );

    expect(result.status).toBe(400);
    expect(result.body).toMatchObject({ error: "Image must be 10 MB or smaller" });
  });
});
