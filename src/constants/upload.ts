export const IMAGE_UPLOAD = {
  MAX_SIZE: 5 * 1024 * 1024, // 5 MB

  ALLOWED_TYPES: ["image/jpeg", "image/png", "image/webp"],

  MAX_IMAGES: 5,
} as const;

export type AllowedImageMimeType = (typeof IMAGE_UPLOAD.ALLOWED_TYPES)[number];
