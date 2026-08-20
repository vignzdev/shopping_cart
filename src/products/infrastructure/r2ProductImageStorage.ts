import {
  DeleteObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import {
  assertProductImage,
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

  const accountId = process.env.R2_ACCOUNT_ID;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;

  if (!accountId || !accessKeyId || !secretAccessKey) {
    throw new Error("Missing Cloudflare R2 environment variables");
  }

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
  const bucket = process.env.R2_BUCKET_NAME;
  const publicUrl = process.env.R2_PUBLIC_URL;

  if (!bucket || !publicUrl) {
    throw new Error("Missing Cloudflare R2 bucket configuration");
  }

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
    const extension = type === "png" ? "png" : "jpg";
    const key = `products/${productId}/${crypto.randomUUID()}.${extension}`;
    const contentType = type === "png" ? "image/png" : "image/jpeg";

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
