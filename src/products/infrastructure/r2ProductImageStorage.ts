import { requireEnv } from "@shared/utils/env";
import {
  DeleteObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import {
  assertProductImage,
  productImageContentType,
  productImageExtension,
  type ProductImageFile,
} from "@product/domain/productImage";
import type {
  ProductImageStorage,
  UploadedProductImage,
} from "@product/domain/productImageStorage";

let client: S3Client | undefined;

function getR2Client(): S3Client {
  if (client) {
    return client;
  }

  const accountId = requireEnv("R2_ACCOUNT_ID");
  const accessKeyId = requireEnv("R2_ACCESS_KEY_ID");
  const secretAccessKey = requireEnv("R2_SECRET_ACCESS_KEY");

  client = new S3Client({
    region: "auto",
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId,
      secretAccessKey,
    },
  });

  return client;
}

function getBucketConfig() {
  const bucket = requireEnv("R2_BUCKET_NAME");
  const publicUrl = requireEnv("R2_PUBLIC_URL");

  return {
    bucket,
    publicUrl: publicUrl.replace(/\/$/, ""),
  };
}

export class R2ProductImageStorage implements ProductImageStorage {
  async upload(
    productId: string,
    file: ProductImageFile,
  ): Promise<UploadedProductImage> {
    const type = assertProductImage(file);
    const { bucket, publicUrl } = getBucketConfig();
    const extension = productImageExtension(type);
    const key = `products/${productId}/${crypto.randomUUID()}.${extension}`;
    const contentType = productImageContentType(type);

    await getR2Client().send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        Body: file.bytes,
        ContentType: contentType,
      }),
    );

    return {
      key,
      url: `${publicUrl}/${key}`,
    };
  }

  async delete(key: string): Promise<void> {
    const { bucket } = getBucketConfig();
    await getR2Client().send(
      new DeleteObjectCommand({
        Bucket: bucket,
        Key: key,
      }),
    );
  }
}
