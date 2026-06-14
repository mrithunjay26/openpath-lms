// Read-only inspection of the opportunities Mongo collection to learn its shape.
// Run: node --env-file=.env scripts/inspect-opps.mjs
import { MongoClient } from "mongodb";

const uri = process.env.MONGODB_URI;
if (!uri) {
  console.log("No MONGODB_URI in env — set it in .env to inspect.");
  process.exit(0);
}
const dbName = process.env.MONGODB_DB || "extracurriculars";
const collName = process.env.MONGODB_COLLECTION || "programs";

const client = new MongoClient(uri);
try {
  await client.connect();
  const coll = client.db(dbName).collection(collName);
  const count = await coll.estimatedDocumentCount();
  console.log("collection:", dbName + "." + collName, "count:", count);

  const sample = await coll.find({}).limit(3).toArray();
  const keys = [...new Set(sample.flatMap((d) => Object.keys(d)))];
  console.log("keys:", keys.join(", "));
  for (const d of sample) {
    const trimmed = {};
    for (const k of Object.keys(d)) {
      const v = d[k];
      trimmed[k] = typeof v === "string" ? v.slice(0, 70) : Array.isArray(v) ? v.slice(0, 6) : v;
    }
    console.log(JSON.stringify(trimmed));
  }
  for (const f of ["type", "category", "mode", "audiences", "audience", "featured", "source", "location"]) {
    try {
      const vals = await coll.distinct(f);
      console.log(`distinct ${f} (${vals.length}):`, vals.slice(0, 12));
    } catch {
      console.log(`distinct ${f}: error`);
    }
  }
} catch (e) {
  console.log("Mongo error:", e?.message || String(e));
} finally {
  await client.close().catch(() => {});
}
