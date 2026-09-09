/**
 * Drop the old unique index on alertRecipient.phone so email-only recipients
 * (and recipients without a phone) can be added.
 *   node scripts/migrate-alert-recipients.mjs
 * Safe to run more than once.
 */
import fs from "node:fs";
import path from "node:path";
import mongoose from "mongoose";

const envPath = path.resolve(process.cwd(), ".env");
for (const line of fs.readFileSync(envPath, "utf8").split("\n")) {
  const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/i);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
}
if (!process.env.MONGO_URI) {
  console.error("MONGO_URI not set");
  process.exit(1);
}

const main = async () => {
  await mongoose.connect(process.env.MONGO_URI);
  const coll = mongoose.connection.collection("alertrecipients");
  const indexes = await coll.indexes();
  console.log(
    "current indexes:",
    indexes.map((i) => i.name)
  );
  for (const idx of indexes) {
    if (idx.key && idx.key.phone === 1 && idx.unique) {
      await coll.dropIndex(idx.name);
      console.log("dropped", idx.name);
    }
  }
  // backfill the email field on existing docs
  const r = await coll.updateMany({ email: { $exists: false } }, { $set: { email: "" } });
  console.log("backfilled email on", r.modifiedCount, "docs");
  await mongoose.disconnect();
  console.log("done");
};

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
