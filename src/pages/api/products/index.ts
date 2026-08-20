import type { APIRoute } from "astro";
import { addProduct } from "@product/application/addProduct";
import { listProducts } from "@product/application/listProducts";
import { readProductWriteRequest } from "@product/application/readProductWriteRequest";
import { serializeProduct } from "@product/application/serializeProduct";
import {
  getProductImageStorage,
  getProductRepository,
} from "@shared/infrastructure/compose";
import { json, toErrorResponse } from "@shared/utils/http";

export const GET: APIRoute = async () => {
  try {
    const products = await listProducts(getProductRepository());
    return json(products.map(serializeProduct));
  } catch (error) {
    return toErrorResponse(error);
  }
};

export const POST: APIRoute = async ({ request }) => {
  try {
    const payload = await readProductWriteRequest(request);
    const product = await addProduct(
      getProductRepository(),
      payload.fields,
      payload.image,
      payload.image ? getProductImageStorage() : undefined,
    );
    return json(serializeProduct(product), 201);
  } catch (error) {
    return toErrorResponse(error);
  }
};
