/**
 * Load ~100 test products to exercise the console's infinite scroll.
 *   node scripts/load-test-products.mjs          # add 100 test products
 *   node scripts/load-test-products.mjs --clear  # remove them again
 *
 * Test products are tagged with `test: true` so --clear only removes these.
 */
import fs from "node:fs";
import path from "node:path";
import mongoose from "mongoose";

const envPath = path.resolve(process.cwd(), ".env");
for (const line of fs.readFileSync(envPath, "utf8").split("\n")) {
  const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/i);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
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
    test: { type: Boolean, default: false },
  },
  { timestamps: true }
);
const Product = mongoose.model("product", productSchema);

const CATEGORIES = ["bottle", "syrup", "jar", "pump", "tube", "dropper"];
const BPC = [12, 20, 24, 30, 36, 40, 48, 50, 60];
const MOLECULES = [
  "Paracetamol", "Ibuprofen", "Amoxicillin", "Metronidazole", "Ciprofloxacin",
  "Artemether-Lumefantrine", "Chloroquine", "Vitamin C", "Multivitamin", "Zinc",
  "Loratadine", "Cetirizine", "Diclofenac", "Omeprazole", "Ranitidine",
  "Ascorbic Acid", "Folic Acid", "Ferrous Sulphate", "Calcium", "Magnesium",
  "Cough Linctus", "ORS", "Antacid", "Menthol Rub", "Antiseptic",
  "Hydrocortisone", "Clotrimazole", "Metformin", "Amlodipine", "Lisinopril",
];
const FORMS = ["Tablets", "Caplets", "Syrup", "Suspension", "Cream", "Gel", "Drops", "Capsules", "Sachet"];
const STRENGTHS = ["100mg", "200mg", "250mg", "500mg", "5ml", "10ml", "60ml", "1%", "2%", ""];

async function main() {
  await mongoose.connect(process.env.MONGO_URI);

  if (process.argv.includes("--clear")) {
    const r = await Product.deleteMany({ test: true });
    console.log(`removed ${r.deletedCount} test products`);
    await mongoose.disconnect();
    return;
  }

  const existing = new Set((await Product.find({}).select("name").lean()).map((p) => p.name.toLowerCase()));
  const docs = [];
  let n = 0;
  for (let i = 0; i < MOLECULES.length && docs.length < 100; i++) {
    for (let j = 0; j < FORMS.length && docs.length < 100; j++) {
      const s = STRENGTHS[(i + j) % STRENGTHS.length];
      const name = `${MOLECULES[i]} ${s ? s + " " : ""}${FORMS[j]}`.replace(/\s+/g, " ").trim();
      if (existing.has(name.toLowerCase())) continue;
      const boxesPerCarton = BPC[(i * 3 + j) % BPC.length];
      const stock = [0, 40, 90, 150, 300, 480, 720, 1100][(i + j) % 8];
      docs.push({
        name,
        category: CATEGORIES[(i + j) % CATEGORIES.length],
        boxesPerCarton,
        price: 300 + ((i * 137 + j * 53) % 40) * 75,
        stock,
        lowStockThreshold: Math.max(20, Math.round(stock * 0.15)) || 60,
        backorder: (i + j) % 7 === 0,
        test: true,
      });
      n++;
    }
  }

  if (docs.length === 0) {
    console.log("nothing to add (all names already exist)");
  } else {
    await Product.insertMany(docs, { ordered: false });
    console.log(`added ${docs.length} test products`);
  }
  const total = await Product.countDocuments({ archived: { $ne: true } });
  console.log(`catalogue now has ${total} active products`);
  await mongoose.disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
