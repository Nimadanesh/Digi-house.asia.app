import { describe, expect, it } from "vitest";
import { S3Signer } from "./s3-sign.js";

const config = {
  accountId: "abc123",
  accessKeyId: "test-key",
  secretAccessKey: "test-secret",
  bucket: "test-bucket",
  publicBaseUrl: "https://media.example.com",
};

describe("S3Signer", () => {
  it("returns signedUrl and publicUrl", () => {
    const signer = new S3Signer(config);
    const result = signer.getSignedPutUrl("uploads/test.jpg", "image/jpeg");
    expect(result.publicUrl).toBe("https://media.example.com/uploads/test.jpg");
    expect(result.signedUrl).toContain("https://test-bucket.abc123.r2.cloudflarestorage.com/uploads/test.jpg");
    expect(result.signedUrl).toContain("X-Amz-Signature=");
    expect(result.signedUrl).toContain("X-Amz-Algorithm=AWS4-HMAC-SHA256");
  });

  it("accepts custom TTL", () => {
    const signer = new S3Signer(config);
    const result = signer.getSignedPutUrl("uploads/test.jpg", "image/jpeg", 7200);
    expect(result.signedUrl).toContain("X-Amz-Expires=7200");
  });

  it("generates different signatures for different keys", () => {
    const signer = new S3Signer(config);
    const a = signer.getSignedPutUrl("uploads/a.jpg", "image/jpeg");
    const b = signer.getSignedPutUrl("uploads/b.jpg", "image/jpeg");
    expect(a.signedUrl).not.toBe(b.signedUrl);
  });
});
