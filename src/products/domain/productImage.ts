import { ValidationError } from "@shared/domain/errors";

export const MAX_PRODUCT_IMAGE_BYTES = 10 * 1024 * 1024;

export type ProductImageFile = {
  bytes: Uint8Array;
  mimeType: string;
  fileName: string;
};

export type ProductImageType = "png" | "jpeg";

const PNG_SIGNATURE = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];

export function detectProductImageType(bytes: Uint8Array): ProductImageType | null {
  if (bytes.length >= 8 && PNG_SIGNATURE.every((value, index) => bytes[index] === value)) {
    return "png";
  }

  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return "jpeg";
  }

  return null;
}

export function assertProductImage(file: ProductImageFile): ProductImageType {
  if (file.bytes.byteLength === 0) {
    throw new ValidationError("Image file is empty");
  }

  if (file.bytes.byteLength > MAX_PRODUCT_IMAGE_BYTES) {
    throw new ValidationError("Image must be 10 MB or smaller");
  }

  const extension = file.fileName.split(".").pop()?.toLowerCase() ?? "";
  if (!["png", "jpg", "jpeg"].includes(extension)) {
    throw new ValidationError("Image must be a PNG, JPEG, or JPG file");
  }

  const mimeType = file.mimeType.toLowerCase();
  if (mimeType !== "image/png" && mimeType !== "image/jpeg") {
    throw new ValidationError("Image must be a PNG, JPEG, or JPG file");
  }

  const detected = detectProductImageType(file.bytes);
  if (!detected) {
    throw new ValidationError("Image must be a PNG, JPEG, or JPG file");
  }

  if (detected === "png" && (extension !== "png" || mimeType !== "image/png")) {
    throw new ValidationError("Image must be a PNG, JPEG, or JPG file");
  }

  if (detected === "jpeg" && (extension === "png" || mimeType !== "image/jpeg")) {
    throw new ValidationError("Image must be a PNG, JPEG, or JPG file");
  }

  return detected;
}
