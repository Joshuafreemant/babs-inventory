import { dbConnect } from "@/app/lib/db";
import ProductModel from "@/models/Product";
import { requireStaff } from "@/app/lib/auth";
import { writeAudit } from "@/models/AuditLog";
import { productForConsole } from "@/app/lib/serialize";
import {
  cloudinaryConfigured,
  uploadProductImage,
  deleteProductImage,
} from "@/app/lib/cloudinary";

export const dynamic = "force-dynamic";

const MAX_BYTES = 6 * 1024 * 1024; // 6 MB
const ALLOWED = ["image/jpeg", "image/png", "image/webp"];

/** Upload (or replace) the single product photo. multipart/form-data, field "file". */
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const staff = await requireStaff();

    if (!cloudinaryConfigured()) {
      return Response.json(
        { error: "Image uploads aren't set up yet — add your Cloudinary keys to .env." },
        { status: 400 }
      );
    }

    await dbConnect();
    const product = await ProductModel.findById((await params).id);
    if (!product) return Response.json({ error: "Product not found." }, { status: 404 });

    const form = await req.formData();
    const file = form.get("file");
    if (!(file instanceof File)) {
      return Response.json({ error: "No image was uploaded." }, { status: 400 });
    }
    if (!ALLOWED.includes(file.type)) {
      return Response.json({ error: "Use a JPG, PNG, or WebP image." }, { status: 415 });
    }
    if (file.size > MAX_BYTES) {
      return Response.json({ error: "Image is larger than 6 MB." }, { status: 413 });
    }

    const bytes = Buffer.from(await file.arrayBuffer());
    const uploaded = await uploadProductImage(bytes, file.type);

    const previousId = product.imagePublicId;
    product.imageUrl = uploaded.url;
    product.imagePublicId = uploaded.publicId;
    await product.save();

    if (previousId && previousId !== uploaded.publicId) {
      deleteProductImage(previousId); // fire and forget
    }

    await writeAudit({
      staffId: staff.staffId,
      staffName: staff.name,
      action: "product.image",
      target: product.name,
      detail: "photo updated",
    });

    return Response.json(productForConsole(product));
  } catch (err) {
    if (err instanceof Response) return err;
    console.error("POST /api/admin/products/[id]/image", err);
    return Response.json({ error: "Could not upload the image." }, { status: 500 });
  }
}

/** Remove the product photo. */
export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const staff = await requireStaff();
    await dbConnect();
    const product = await ProductModel.findById((await params).id);
    if (!product) return Response.json({ error: "Product not found." }, { status: 404 });

    const previousId = product.imagePublicId;
    product.imageUrl = "";
    product.imagePublicId = "";
    await product.save();
    if (previousId) deleteProductImage(previousId);

    await writeAudit({
      staffId: staff.staffId,
      staffName: staff.name,
      action: "product.image",
      target: product.name,
      detail: "photo removed",
    });

    return Response.json(productForConsole(product));
  } catch (err) {
    if (err instanceof Response) return err;
    console.error("DELETE /api/admin/products/[id]/image", err);
    return Response.json({ error: "Could not remove the image." }, { status: 500 });
  }
}
