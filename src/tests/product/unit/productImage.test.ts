import { describe, expect, it } from "vitest";
import { IMAGE_UPLOAD } from "@/constants/upload";
import {
  assertProductImage,
} from "@product/domain/productImage";
import { ValidationError } from "@shared/domain/errors";
import { GIF_BYTES, JPEG_BYTES, PNG_BYTES, WEBP_BYTES } from "./imageFixtures";

describe("product image rules", () => {
  it("accepts PNG files", () => {
    expect(
      assertProductImage({
        bytes: PNG_BYTES,
        mimeType: "image/png",
        fileName: "tea.png",
      }),
    ).toBe("png");
  });

  it("accepts JPEG and JPG files", () => {
    expect(
      assertProductImage({
        bytes: JPEG_BYTES,
        mimeType: "image/jpeg",
        fileName: "tea.jpeg",
      }),
    ).toBe("jpeg");

    expect(
      assertProductImage({
        bytes: JPEG_BYTES,
        mimeType: "image/jpeg",
        fileName: "tea.jpg",
      }),
    ).toBe("jpeg");
  });

  it("accepts WebP files", () => {
    expect(
      assertProductImage({
        bytes: WEBP_BYTES,
        mimeType: "image/webp",
        fileName: "tea.webp",
      }),
    ).toBe("webp");
  });

  it("rejects GIF and other types", () => {
    expect(() =>
      assertProductImage({
        bytes: GIF_BYTES,
        mimeType: "image/gif",
        fileName: "tea.gif",
      }),
    ).toThrow(ValidationError);
  });

  it("rejects files larger than the upload limit", () => {
    const bytes = new Uint8Array(IMAGE_UPLOAD.MAX_SIZE + 1);
    bytes.set(PNG_BYTES, 0);

    expect(() =>
      assertProductImage({
        bytes,
        mimeType: "image/png",
        fileName: "huge.png",
      }),
    ).toThrow(/5 MB/);
  });

  it("rejects a PNG header saved as JPG", () => {
    expect(() =>
      assertProductImage({
        bytes: PNG_BYTES,
        mimeType: "image/jpeg",
        fileName: "tea.jpg",
      }),
    ).toThrow(ValidationError);
  });
});
