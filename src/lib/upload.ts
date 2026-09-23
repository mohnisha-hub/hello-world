import { put } from "@vercel/blob";
import { takeUserLimit } from "@/lib/rate-limit";

const MAX_BYTES = 3 * 1024 * 1024;
const ALLOWED = new Set(["image/jpeg", "image/png", "image/webp"]);

function detectedImageType(bytes: Uint8Array) {
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return "image/jpeg";
  if (bytes.length >= 8 && bytes.slice(0, 8).every((value, index) => value === [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a][index])) return "image/png";
  if (bytes.length >= 12 && String.fromCharCode(...bytes.slice(0, 4)) === "RIFF" && String.fromCharCode(...bytes.slice(8, 12)) === "WEBP") return "image/webp";
  return null;
}

async function scanForMalware(file: File) {
  const endpoint = process.env.MALWARE_SCAN_URL;
  if (!endpoint) {
    if (process.env.NODE_ENV === "production") throw new Error("Custom image uploads are temporarily unavailable while malware scanning is configured.");
    return;
  }
  let url: URL;
  try {
    url = new URL(endpoint);
  } catch {
    throw new Error("Image scanning is not configured correctly.");
  }
  if (url.protocol !== "https:") throw new Error("Image scanning must use a secure endpoint.");

  const form = new FormData();
  form.set("file", file, "upload");
  const response = await fetch(url, {
    method: "POST",
    headers: process.env.MALWARE_SCAN_TOKEN ? { Authorization: `Bearer ${process.env.MALWARE_SCAN_TOKEN}` } : undefined,
    body: form,
    signal: AbortSignal.timeout(15_000),
  });
  const result = await response.json().catch(() => null) as { clean?: unknown } | null;
  if (!response.ok || result?.clean !== true) throw new Error("This image could not pass the security scan. Please choose a different image.");
}

export async function saveUpload(file: File | null, prefix: string, userId: string) {
  if (!file || file.size === 0) return null;
  if (file.size > MAX_BYTES) {
    throw new Error("Photos must be 3MB or smaller.");
  }
  const type = file.type || "application/octet-stream";
  if (!ALLOWED.has(type)) {
    throw new Error("Upload a JPEG, PNG, or WebP photo.");
  }
  const bytes = new Uint8Array(await file.slice(0, 16).arrayBuffer());
  if (detectedImageType(bytes) !== type) throw new Error("The image file type could not be verified.");
  if (!(await takeUserLimit("image-upload", userId, 30, 24 * 60 * 60_000))) {
    throw new Error("You have reached today’s image-upload limit. Please try again tomorrow.");
  }
  await scanForMalware(file);
  const token = process.env.BLOB_READ_WRITE_TOKEN;
  if (!token) {
    throw new Error("Photo storage is not configured (BLOB_READ_WRITE_TOKEN).");
  }
  const ext = type === "image/png" ? "png" : type === "image/webp" ? "webp" : "jpg";
  const blob = await put(`${prefix}-${Date.now()}.${ext}`, file, {
    access: "public",
    token,
  });
  return blob.url;
}

export async function trySaveUpload(file: File | null, prefix: string, userId: string) {
  try {
    return { url: await saveUpload(file, prefix, userId) };
  } catch (error) {
    return { url: null as string | null, error: error instanceof Error ? error.message : "Upload failed." };
  }
}
