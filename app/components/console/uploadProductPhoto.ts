import { Product } from "../../types";

/** POST a product photo as multipart/form-data. Returns the updated product. */
export async function uploadProductPhoto(productId: string, file: File): Promise<Product> {
  const body = new FormData();
  body.append("file", file);
  const res = await fetch(`/api/admin/products/${productId}/image`, {
    method: "POST",
    body,
    credentials: "same-origin",
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.error || `Upload failed (${res.status})`);
  return data as Product;
}

export async function removeProductPhoto(productId: string): Promise<Product> {
  const res = await fetch(`/api/admin/products/${productId}/image`, {
    method: "DELETE",
    credentials: "same-origin",
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.error || `Remove failed (${res.status})`);
  return data as Product;
}

export const IMAGE_ACCEPT = "image/jpeg,image/png,image/webp";
export const MAX_IMAGE_BYTES = 6 * 1024 * 1024;
