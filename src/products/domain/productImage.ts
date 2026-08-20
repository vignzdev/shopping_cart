import { IMAGE_UPLOAD } from "@/constants/upload";
import { ValidationError } from "@shared/domain/errors";

export const MAX_PRODUCT_IMAGE_BYTES = IMAGE_UPLOAD.MAX_SIZE;

export type ProductImageFile = {
  bytes: Uint8Array;
  mimeType: string;
  fileName: string;
};

export type ProductImageType = "png" | "jpeg" | "webp";

const PNG_SIGNATURE = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
const MAX_SIZE_MB = IMAGE_UPLOAD.MAX_SIZE / (1024 * 1024);

const TYPE_BY_MIME: Record<string, ProductImageType> = {
  "image/png": "png",
  "image/jpeg": "jpeg",
  "image/webp": "webp",
};

const EXTENSIONS_BY_TYPE: Record<ProductImageType, readonly string[]> = {
  png: ["png"],
  jpeg: ["jpg", "jpeg"],
  webp: ["webp"],
};

export function detectProductImageType(
  bytes: Uint8Array,
): ProductImageType | null {
  if (
    bytes.length >= 8 &&
    PNG_SIGNATURE.every((value, index) => bytes[index] === value)
  ) {
    return "png";
  }

  if (
    bytes.length >= 3 &&
    bytes[0] === 0xff &&
    bytes[1] === 0xd8 &&
    bytes[2] === 0xff
  ) {
    return "jpeg";
  }

  if (
    bytes.length >= 12 &&
    bytes[0] === 0x52 &&
    bytes[1] === 0x49 &&
    bytes[2] === 0x46 &&
    bytes[3] === 0x46 &&
    bytes[8] === 0x57 &&
    bytes[9] === 0x45 &&
    bytes[10] === 0x42 &&
    bytes[11] === 0x50
  ) {
    return "webp";
  }

  return null;
}

export function productImageExtension(type: ProductImageType): string {
  return type === "jpeg" ? "jpg" : type;
}

export function productImageContentType(type: ProductImageType): string {
  if (type === "png") return "image/png";
  if (type === "webp") return "image/webp";
  return "image/jpeg";
}

export function assertImageCount(count: number): void {
  if (count > IMAGE_UPLOAD.MAX_IMAGES) {
    throw new ValidationError(
      `You can upload at most ${IMAGE_UPLOAD.MAX_IMAGES} images`,
    );
  }
}

export function assertProductImage(file: ProductImageFile): ProductImageType {
  if (file.bytes.byteLength === 0) {
    throw new ValidationError("Image file is empty");
  }

  if (file.bytes.byteLength > IMAGE_UPLOAD.MAX_SIZE) {
    throw new ValidationError(`Image must be ${MAX_SIZE_MB} MB or smaller`);
  }

  const mimeType = file.mimeType.toLowerCase();
  if (!(IMAGE_UPLOAD.ALLOWED_TYPES as readonly string[]).includes(mimeType)) {
    throw new ValidationError("Image must be a JPEG, PNG, or WebP file");
  }

  const expectedType = TYPE_BY_MIME[mimeType];
  const extension = file.fileName.split(".").pop()?.toLowerCase() ?? "";
  if (!expectedType || !EXTENSIONS_BY_TYPE[expectedType].includes(extension)) {
    throw new ValidationError("Image must be a JPEG, PNG, or WebP file");
  }

  const detected = detectProductImageType(file.bytes);
  if (!detected || detected !== expectedType) {
    throw new ValidationError("Image must be a JPEG, PNG, or WebP file");
  }

  return detected;
}
