import crypto from "node:crypto";

/**
 * Cloudinary — one product photo per product. Signed server-side uploads, so the
 * API secret never reaches the browser. The client posts the file to our own
 * route; that route calls Cloudinary.
 *
 * Env: CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET
 * Optional: CLOUDINARY_FOLDER (default "embassy/products")
 */

export function cloudinaryConfigured(): boolean {
  return Boolean(
    process.env.CLOUDINARY_CLOUD_NAME &&
      process.env.CLOUDINARY_API_KEY &&
      process.env.CLOUDINARY_API_SECRET
  );
}

const FOLDER = process.env.CLOUDINARY_FOLDER || "embassy/products";

function sign(params: Record<string, string>): string {
  const secret = process.env.CLOUDINARY_API_SECRET as string;
  const toSign = Object.keys(params)
    .sort()
    .map((k) => `${k}=${params[k]}`)
    .join("&");
  return crypto
    .createHash("sha1")
    .update(toSign + secret)
    .digest("hex");
}

export interface UploadedImage {
  url: string;
  publicId: string;
}

/** Upload a raw image buffer. Returns the secure URL + public id. Throws on failure. */
export async function uploadProductImage(
  bytes: Buffer,
  mime: string
): Promise<UploadedImage> {
  const cloud = process.env.CLOUDINARY_CLOUD_NAME as string;
  const apiKey = process.env.CLOUDINARY_API_KEY as string;
  const timestamp = String(Math.floor(Date.now() / 1000));

  const signed = {
    folder: FOLDER,
    timestamp,
    // keep files tidy and reasonably sized without needing an upload preset
    transformation: "c_limit,w_1200,h_1200,q_auto",
  };
  const signature = sign(signed);

  const form = new FormData();
  form.append("file", new Blob([bytes], { type: mime }), "product");
  form.append("api_key", apiKey);
  form.append("timestamp", timestamp);
  form.append("folder", FOLDER);
  form.append("transformation", signed.transformation);
  form.append("signature", signature);

  const res = await fetch(`https://api.cloudinary.com/v1_1/${cloud}/image/upload`, {
    method: "POST",
    body: form,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data?.secure_url) {
    throw new Error(data?.error?.message || `Cloudinary upload failed (${res.status})`);
  }
  return { url: data.secure_url as string, publicId: data.public_id as string };
}

/** Best-effort delete of a previously uploaded image. Never throws. */
export async function deleteProductImage(publicId: string): Promise<void> {
  if (!publicId || !cloudinaryConfigured()) return;
  try {
    const cloud = process.env.CLOUDINARY_CLOUD_NAME as string;
    const apiKey = process.env.CLOUDINARY_API_KEY as string;
    const timestamp = String(Math.floor(Date.now() / 1000));
    const signature = sign({ public_id: publicId, timestamp });

    const form = new FormData();
    form.append("public_id", publicId);
    form.append("api_key", apiKey);
    form.append("timestamp", timestamp);
    form.append("signature", signature);

    await fetch(`https://api.cloudinary.com/v1_1/${cloud}/image/destroy`, {
      method: "POST",
      body: form,
    });
  } catch (err) {
    console.error("[cloudinary] delete failed", err);
  }
}

/** Insert a width transformation into a stored Cloudinary URL for thumbnails. */
export function cldThumb(url: string, width: number): string {
  if (!url || !url.includes("/upload/")) return url;
  return url.replace("/upload/", `/upload/c_fill,w_${width},h_${width},q_auto,f_auto/`);
}
