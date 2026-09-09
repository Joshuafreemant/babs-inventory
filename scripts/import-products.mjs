/**
 * Bulk-import products straight into MongoDB from a JSON file.
 *   node scripts/import-products.mjs path/to/products.json
 *
 * JSON: an array of objects. Each needs name, price, boxesPerCarton.
 * Optional: category, stock | (cartons + loose), lowStockThreshold, backorder, imageUrl.
 * Existing product names are skipped. Photos can be added later in the console.
 */
import fs from "node:fs";
import path from "node:path";
import mongoose from "mongoose";

const envPath = path.resolve(process.cwd(), ".env");
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, "utf8").split("\n")) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/i);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
}

const file = process.argv[2];
if (!file) {
  console.error("usage: node scripts/import-products.mjs <products.json>");
  process.exit(1);
}
if (!process.env.MONGO_URI) {
  console.error("MONGO_URI not set");
  process.exit(1);
}

const CATEGORIES = ["bottle", "syrup", "jar", "pump", "tube", "dropper"];
const suggestThreshold = (s) => Math.max(20, Math.round(s * 0.15));

const rows = JSON.parse(fs.readFileSync(path.resolve(file), "utf8"));
if (!Array.isArray(rows)) {
  console.error("file must contain a JSON array");
  process.exit(1);
}

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true },
    category: String,
    boxesPerCarton: Number,
    price: Number,
    stock: Number,
    lowStockThreshold: Number,
    forceLowStock: { type: Boolean, default: false },
    backorder: { type: Boolean, default: false },
    archived: { type: Boolean, default: false },
    imageUrl: { type: String, default: "" },
    imagePublicId: { type: String, default: "" },
  },
  { timestamps: true }
);
const Product = mongoose.model("product", productSchema);

async function main() {
  await mongoose.connect(process.env.MONGO_URI);
  const existing = new Set(
    (await Product.find({}).select("name").lean()).map((p) => p.name.toLowerCase())
  );

  let created = 0;
  const skipped = [];

  for (const [i, r] of rows.entries()) {
    const name = typeof r.name === "string" ? r.name.trim() : "";
    if (!name) { skipped.push(`row ${i + 1}: missing name`); continue; }
    if (existing.has(name.toLowerCase())) { skipped.push(`${name}: already exists`); continue; }

    const price = Math.floor(Number(r.price));
    const boxesPerCarton = Math.floor(Number(r.boxesPerCarton));
    if (!price || price <= 0) { skipped.push(`${name}: bad price`); continue; }
    if (!boxesPerCarton || boxesPerCarton <= 0) { skipped.push(`${name}: bad boxesPerCarton`); continue; }

    let stock = 0;
    if (Number.isFinite(Number(r.stock))) stock = Math.max(0, Math.floor(Number(r.stock)));
    else if (r.cartons != null || r.loose != null)
      stock = (Math.floor(Number(r.cartons) || 0)) * boxesPerCarton + Math.floor(Number(r.loose) || 0);

    const th = Number(r.lowStockThreshold);
    await Product.create({
      name,
      category: CATEGORIES.includes(r.category) ? r.category : "bottle",
      boxesPerCarton,
      price,
      stock,
      lowStockThreshold: Number.isFinite(th) && th >= 0 ? Math.floor(th) : suggestThreshold(stock),
      backorder: Boolean(r.backorder),
      imageUrl: typeof r.imageUrl === "string" && /^https?:\/\//.test(r.imageUrl) ? r.imageUrl : "",
    });
    existing.add(name.toLowerCase());
    created++;
  }

  console.log(`created ${created}, skipped ${skipped.length} of ${rows.length}`);
  skipped.forEach((s) => console.log("  - " + s));
  await mongoose.disconnect();
}

main().catch((e) => { console.error(e); process.exit(1); });
