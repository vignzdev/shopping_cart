import type { APIRoute } from "astro";
import { deleteProduct } from "@product/application/deleteProduct";
import { getProduct } from "@product/application/getProduct";
import { readProductWriteRequest } from "@product/application/readProductWriteRequest";
import { serializeProduct } from "@product/application/serializeProduct";
import { updateProduct } from "@product/application/updateProduct";
import {
  getProductImageStorage,
  getProductRepository,
} from "@shared/infrastructure/compose";
import { json, toErrorResponse } from "@shared/utils/http";
import { ValidationError } from "@shared/domain/errors";

export const GET: APIRoute = async ({ params }) => {
  try {
    const product = await getProduct(getProductRepository(), requireId(params.id));
    return json(serializeProduct(product));
  } catch (error) {
    return toErrorResponse(error);
  }
};

export const PUT: APIRoute = async ({ params, request }) => {
  try {
    const payload = await readProductWriteRequest(request);
    const product = await updateProduct(
      getProductRepository(),
      requireId(params.id),
      payload.fields,
      payload.image,
      payload.image ? getProductImageStorage() : undefined,
    );
    return json(serializeProduct(product));
  } catch (error) {
    return toErrorResponse(error);
  }
};

export const DELETE: APIRoute = async ({ params }) => {
  try {
    await deleteProduct(
      getProductRepository(),
      requireId(params.id),
      getProductImageStorage(),
    );
    return new Response(null, { status: 204 });
  } catch (error) {
    return toErrorResponse(error);
  }
};

function requireId(id: string | undefined): string {
  if (!id) {
    throw new ValidationError("Product id is required");
  }

  return id;
}
