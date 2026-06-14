// Validate the finder's Mongo filters return results. node --env-file=.env scripts/test-opps.mjs
import { MongoClient } from "mongodb";
const uri = process.env.MONGODB_URI;
if (!uri) { console.log("no MONGODB_URI"); process.exit(0); }
const client = new MongoClient(uri);
const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const rx = (s) => ({ $regex: esc(s), $options: "i" });
try {
  await client.connect();
  const coll = client
    .db(process.env.MONGODB_DB || "extracurriculars")
    .collection(process.env.MONGODB_COLLECTION || "programs");
  const tests = [
    ["all", {}],
    ["q=research", { $or: ["title", "organization", "description", "tags", "location"].map((f) => ({ [f]: rx("research") })) }],
    ["subject=Computer Science", { tags: rx("Computer Science") }],
    ["mode=Virtual", { mode: rx("Virtual") }],
    ["mode=In Person", { mode: rx("In Person") }],
    ["grade=11", { grade_levels: "11" }],
    ["free", { cost: rx("free") }],
    ["q=engineering + free", { $and: [{ $or: ["title", "tags", "description"].map((f) => ({ [f]: rx("engineering") })) }, { cost: rx("free") }] }],
  ];
  for (const [label, filter] of tests) {
    console.log(label, "=>", await coll.countDocuments(filter));
  }
} catch (e) {
  console.log("error:", e?.message || String(e));
} finally {
  await client.close().catch(() => {});
}
