import { put } from "@vercel/blob";

const MAX_BYTES = 4 * 1024 * 1024;
const ALLOWED = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);

export async function saveUpload(file: File | null, prefix: string) {
  if (!file || file.size === 0) return null;
  if (file.size > MAX_BYTES) {
    throw new Error("Photos must be 4MB or smaller.");
  }
  const type = file.type || "application/octet-stream";
  if (!ALLOWED.has(type)) {
    throw new Error("Upload a JPEG, PNG, WebP, or GIF photo.");
  }
  const token = process.env.BLOB_READ_WRITE_TOKEN;
  if (!token) {
    throw new Error("Photo storage is not configured (BLOB_READ_WRITE_TOKEN).");
  }
  const ext = type === "image/png" ? "png" : type === "image/webp" ? "webp" : type === "image/gif" ? "gif" : "jpg";
  const blob = await put(`${prefix}-${Date.now()}.${ext}`, file, {
    access: "public",
    token,
  });
  return blob.url;
}

export async function trySaveUpload(file: File | null, prefix: string) {
  try {
    return { url: await saveUpload(file, prefix) };
  } catch (error) {
    return { url: null as string | null, error: error instanceof Error ? error.message : "Upload failed." };
  }
}
