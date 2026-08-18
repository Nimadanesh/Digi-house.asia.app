import { createHash, createHmac } from "node:crypto";

export type S3SignerConfig = {
  accountId: string;
  accessKeyId: string;
  secretAccessKey: string;
  bucket: string;
  publicBaseUrl: string;
};

export type SignedPutUrlResult = {
  signedUrl: string;
  publicUrl: string;
};

export class S3Signer {
  private config: S3SignerConfig;

  constructor(config: S3SignerConfig) {
    this.config = config;
  }

  getSignedPutUrl(
    key: string,
    _contentType: string,
    ttlMs = 3600,
  ): SignedPutUrlResult {
    const { accountId, accessKeyId, secretAccessKey, bucket, publicBaseUrl } =
      this.config;
    const region = "auto";
    const service = "s3";
    const algorithm = "AWS4-HMAC-SHA256";
    const now = new Date();
    const amzDate = now
      .toISOString()
      .replace(/[:-]/g, "")
      .replace(/\.\d{3}/, "");
    const dateStamp = amzDate.slice(0, 8);
    const host = `${bucket}.${accountId}.r2.cloudflarestorage.com`;

    const canonicalUri = `/${key}`;
    const canonicalQuerystring = [
      `X-Amz-Algorithm=${algorithm}`,
      `X-Amz-Credential=${encodeURIComponent(`${accessKeyId}/${dateStamp}/${region}/${service}/aws4_request`)}`,
      `X-Amz-Date=${amzDate}`,
      `X-Amz-Expires=${ttlMs}`,
      "X-Amz-SignedHeaders=host",
    ].join("&");

    const canonicalHeaders = `host:${host}\n`;
    const signedHeaders = "host";
    const payloadHash = "UNSIGNED-PAYLOAD";

    const canonicalRequest = [
      "PUT",
      canonicalUri,
      canonicalQuerystring,
      canonicalHeaders,
      signedHeaders,
      payloadHash,
    ].join("\n");

    const credentialScope = `${dateStamp}/${region}/${service}/aws4_request`;
    const stringToSign = [
      algorithm,
      amzDate,
      credentialScope,
      sha256Hex(canonicalRequest),
    ].join("\n");

    const signingKey = getSignatureKey(
      secretAccessKey,
      dateStamp,
      region,
      service,
    );
    const signature = hmacHex(signingKey, stringToSign);

    const signedUrl = `https://${host}${canonicalUri}?${canonicalQuerystring}&X-Amz-Signature=${signature}`;
    const publicUrl = `${publicBaseUrl.replace(/\/+$/, "")}/${key}`;

    return { signedUrl, publicUrl };
  }

  getSignedGetUrl(
    key: string,
    ttlMs = 900,
  ): SignedPutUrlResult {
    const { accountId, accessKeyId, secretAccessKey, bucket, publicBaseUrl } =
      this.config;
    const region = "auto";
    const service = "s3";
    const algorithm = "AWS4-HMAC-SHA256";
    const now = new Date();
    const amzDate = now
      .toISOString()
      .replace(/[:-]/g, "")
      .replace(/\.\d{3}/, "");
    const dateStamp = amzDate.slice(0, 8);
    const host = `${bucket}.${accountId}.r2.cloudflarestorage.com`;

    const canonicalUri = `/${key}`;
    const canonicalQuerystring = [
      `X-Amz-Algorithm=${algorithm}`,
      `X-Amz-Credential=${encodeURIComponent(`${accessKeyId}/${dateStamp}/${region}/${service}/aws4_request`)}`,
      `X-Amz-Date=${amzDate}`,
      `X-Amz-Expires=${ttlMs}`,
      "X-Amz-SignedHeaders=host",
    ].join("&");

    const canonicalHeaders = `host:${host}\n`;
    const signedHeaders = "host";
    const payloadHash = "UNSIGNED-PAYLOAD";

    const canonicalRequest = [
      "GET",
      canonicalUri,
      canonicalQuerystring,
      canonicalHeaders,
      signedHeaders,
      payloadHash,
    ].join("\n");

    const credentialScope = `${dateStamp}/${region}/${service}/aws4_request`;
    const stringToSign = [
      algorithm,
      amzDate,
      credentialScope,
      sha256Hex(canonicalRequest),
    ].join("\n");

    const signingKey = getSignatureKey(
      secretAccessKey,
      dateStamp,
      region,
      service,
    );
    const signature = hmacHex(signingKey, stringToSign);

    const signedUrl = `https://${host}${canonicalUri}?${canonicalQuerystring}&X-Amz-Signature=${signature}`;
    const publicUrl = `${publicBaseUrl.replace(/\/+$/, "")}/${key}`;

    return { signedUrl, publicUrl };
  }
}

function sha256Hex(s: string): string {
  return createHash("sha256").update(s).digest("hex");
}

function hmacHex(key: Buffer, s: string): string {
  return createHmac("sha256", key).update(s).digest("hex");
}

function getSignatureKey(
  key: string,
  dateStamp: string,
  region: string,
  service: string,
): Buffer {
  const kDate = createHmac("sha256", `AWS4${key}`).update(dateStamp).digest();
  const kRegion = createHmac("sha256", kDate).update(region).digest();
  const kService = createHmac("sha256", kRegion).update(service).digest();
  return createHmac("sha256", kService).update("aws4_request").digest();
}
