/**
 * Seed the Embassy catalogue + a demo rep account.
 *   node scripts/seed.mjs
 * Reads MONGO_URI from .env (no dotenv dependency needed).
 */
import fs from "node:fs";
import path from "node:path";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";

// --- load .env manually ---
const envPath = path.resolve(process.cwd(), ".env");
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, "utf8").split("\n")) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/i);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
}

const MONGO_URI = process.env.MONGO_URI;
if (!MONGO_URI) {
  console.error("MONGO_URI not set");
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
  },
  { timestamps: true }
);
const staffSchema = new mongoose.Schema(
  {
    name: String,
    staffId: { type: String, unique: true, lowercase: true },
    passwordHash: String,
    role: { type: String, default: "rep" },
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);
const counterSchema = new mongoose.Schema({ _id: String, seq: { type: Number, default: 0 } });

const Product = mongoose.model("product", productSchema);
const Staff = mongoose.model("staff", staffSchema);
const Counter = mongoose.model("counter", counterSchema);

const PRODUCTS = [
  { name: "Vitalis-C Effervescent", category: "bottle", boxesPerCarton: 24, price: 2850, stock: 540, lowStockThreshold: 100, backorder: false },
  { name: "ClearGlow Antiseptic Soap", category: "jar", boxesPerCarton: 48, price: 950, stock: 120, lowStockThreshold: 150, backorder: false },
  { name: "FeverEase Pediatric Syrup", category: "syrup", boxesPerCarton: 36, price: 2600, stock: 0, lowStockThreshold: 80, backorder: true },
  { name: "Embassy Menthol Rub", category: "jar", boxesPerCarton: 60, price: 980, stock: 900, lowStockThreshold: 200, backorder: false },
  { name: "PureShield Sanitizer Gel", category: "pump", boxesPerCarton: 30, price: 1350, stock: 60, lowStockThreshold: 90, backorder: false },
  { name: "NightCalm Cough Syrup", category: "dropper", boxesPerCarton: 36, price: 2150, stock: 0, lowStockThreshold: 70, backorder: true },
  { name: "FlexJoint Pain Cream", category: "tube", boxesPerCarton: 40, price: 1550, stock: 480, lowStockThreshold: 120, backorder: false },
  { name: "VitaBoost Multivitamin", category: "bottle", boxesPerCarton: 50, price: 1700, stock: 750, lowStockThreshold: 150, backorder: false },
];

async function main() {
  await mongoose.connect(MONGO_URI);
  console.log("connected");

  for (const p of PRODUCTS) {
    await Product.updateOne({ name: p.name }, { $set: p }, { upsert: true });
  }
  console.log(`seeded ${PRODUCTS.length} products`);

  await Counter.updateOne({ _id: "order" }, { $setOnInsert: { seq: 0 } }, { upsert: true });

  const passwordHash = bcrypt.hashSync("rep123", 5);
  await Staff.updateOne(
    { staffId: "rep" },
    { $set: { name: "Demo Rep", staffId: "rep", passwordHash, role: "admin", active: true } },
    { upsert: true }
  );
  console.log("seeded staff: rep / rep123");

  await mongoose.disconnect();
  console.log("done");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
