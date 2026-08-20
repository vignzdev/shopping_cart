import { assertImageCount, type ProductImageFile } from "@product/domain/productImage";
import { ValidationError } from "@shared/domain/errors";
import { readJson } from "@shared/utils/http";

export type ProductWritePayload = {
  fields: Record<string, unknown>;
  image?: ProductImageFile;
};

export async function readProductWriteRequest(
  request: Request,
): Promise<ProductWritePayload> {
  const contentType = request.headers.get("content-type") ?? "";

  if (contentType.includes("multipart/form-data")) {
    return readMultipart(request);
  }

  return { fields: (await readJson(request)) as Record<string, unknown> };
}

async function readMultipart(request: Request): Promise<ProductWritePayload> {
  const form = await request.formData();
  const fields: Record<string, unknown> = {};

  const name = stringValue(form.get("name"));
  const description = stringValue(form.get("description"));
  const price = numberValue(form.get("price"));
  const stock = numberValue(form.get("stock"));

  if (name !== undefined) fields.name = name;
  if (description !== undefined) fields.description = description;
  if (price !== undefined) fields.price = price;
  if (stock !== undefined) fields.stock = stock;

  const imageFiles = form
    .getAll("image")
    .filter((entry): entry is File => entry instanceof File && entry.size > 0);

  assertImageCount(imageFiles.length);

  const imageEntry = imageFiles[0];
  if (!imageEntry) {
    return { fields };
  }

  return {
    fields,
    image: {
      bytes: new Uint8Array(await imageEntry.arrayBuffer()),
      mimeType: imageEntry.type,
      fileName: imageEntry.name,
    },
  };
}

function stringValue(value: FormDataEntryValue | null): string | undefined {
  if (typeof value !== "string") {
    return undefined;
  }

  const trimmed = value.trim();
  return trimmed === "" ? undefined : trimmed;
}

function numberValue(value: FormDataEntryValue | null): number | undefined {
  if (typeof value !== "string" || value.trim() === "") {
    return undefined;
  }

  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    throw new ValidationError("Numeric fields must be valid numbers");
  }

  return parsed;
}
