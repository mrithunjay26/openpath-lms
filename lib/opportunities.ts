import "server-only";
import { unstable_cache } from "next/cache";
import { getMongoCollection } from "@/lib/mongodb";

/**
 * Opportunities are stored in MongoDB (collection of ~1k scraped/curated
 * programs). The real documents only have these usable facets:
 *   title, description, url, organization, location, tags (subjects),
 *   grade_levels, eligibility, cost, salary, mode, source, deadline.
 * There is NO type/category/audience/featured field — so filtering must use the
 * fields that actually exist (search, subject/tags, mode, grade, cost). All
 * filtering + search is pushed into Mongo with a lean projection (we never pull
 * the giant source_payload/sources blobs) and a limit, so it stays fast.
 */

export type OpportunityType =
  | "internship"
  | "mentorship"
  | "hackathon"
  | "volunteer"
  | "program"
  | "scholarship";

export type Opportunity = {
  id: string;
  title: string;
  org: string;
  type: OpportunityType;
  category: string;
  skills: string[];
  subjects: string[];
  gradeLevels: string[];
  eligibility: string[];
  tags: string[];
  location: string;
  cost: string;
  salary: string;
  mode: string;
  url: string;
  deadline: string | null;
  description: string;
  featured: boolean;
  source: string;
};

type MongoDoc = Record<string, unknown>;

const MONGO_SOURCE = {
  uri: process.env.MONGODB_URI ?? "",
  db: process.env.MONGODB_DB ?? "extracurriculars",
  collection: process.env.MONGODB_COLLECTION ?? "programs",
};

const PROJECTION = {
  title: 1,
  description: 1,
  url: 1,
  organization: 1,
  location: 1,
  tags: 1,
  grade_levels: 1,
  eligibility: 1,
  cost: 1,
  salary: 1,
  deadline: 1,
  mode: 1,
  source: 1,
} as const;

const TYPE_LABELS: Record<OpportunityType, string> = {
  internship: "Internship",
  mentorship: "Mentorship",
  hackathon: "Hackathon",
  volunteer: "Volunteer",
  program: "Program",
  scholarship: "Scholarship",
};
export const OPP_TYPE_LABEL = TYPE_LABELS;

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function asText(value: unknown): string {
  if (value == null) return "";
  if (value instanceof Date) return value.toISOString();
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (typeof value === "number") return Number.isFinite(value) ? String(value) : "";
  return String(value).trim();
}

function asArray(value: unknown): string[] {
  if (Array.isArray(value)) return value.map(asText).filter(Boolean);
  const text = asText(value);
  if (!text) return [];
  return text.includes(",") ? text.split(",").map((t) => t.trim()).filter(Boolean) : [text];
}

function dedupe(values: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const v of values) {
    const t = asText(v);
    if (!t) continue;
    const key = t.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(t);
  }
  return out;
}

// Mode values in the data are messy: "Virtual", "In Person ", "['Hybrid', 'Remote']".
function cleanMode(value: unknown): string {
  let text = asText(value);
  if (!text) return "";
  if (text.startsWith("[")) {
    const tokens = [...text.matchAll(/['"]([^'"]+)['"]/g)].map((m) => m[1].trim());
    text = dedupe(tokens).join(", ");
  }
  return text.replace(/\s+/g, " ").trim();
}

function inferType(title: string, tags: string[], description: string): OpportunityType {
  const hay = `${title} ${tags.join(" ")} ${description}`.toLowerCase();
  if (hay.includes("scholarship")) return "scholarship";
  if (hay.includes("internship") || hay.includes("intern")) return "internship";
  if (hay.includes("hackathon")) return "hackathon";
  if (hay.includes("mentor")) return "mentorship";
  if (hay.includes("volunteer") || hay.includes("service")) return "volunteer";
  return "program";
}

function inferDeadline(value: unknown): string | null {
  if (!value) return null;
  if (value instanceof Date) return value.toISOString();
  const text = asText(value);
  if (!text) return null;
  const parsed = Date.parse(text);
  return Number.isNaN(parsed) ? text : new Date(parsed).toISOString();
}

function toOpportunity(raw: MongoDoc): Opportunity {
  const title = asText(raw.title ?? raw.name) || "Opportunity";
  const org = asText(raw.organization ?? raw.org) || title;
  const tags = dedupe(asArray(raw.tags));
  const description = asText(raw.description);
  const gradeLevels = dedupe(asArray(raw.grade_levels ?? raw.gradeLevels));
  const skills = dedupe([...tags, ...title.toLowerCase().split(/[^a-z0-9]+/).filter((t) => t.length > 3)]);
  return {
    id: asText(raw._id ?? raw.id) || asText(raw.canonical_key) || title,
    title,
    org,
    type: inferType(title, tags, description),
    category: tags[0] || "General",
    skills,
    subjects: tags,
    gradeLevels,
    eligibility: dedupe(asArray(raw.eligibility)),
    tags,
    location: asText(raw.location),
    cost: asText(raw.cost),
    salary: asText(raw.salary),
    mode: cleanMode(raw.mode),
    url: asText(raw.url ?? raw.link ?? raw.website ?? raw.source_url),
    deadline: inferDeadline(raw.deadline ?? raw.application_deadline),
    description,
    featured: Boolean(raw.featured),
    source: asText(raw.source) || "mongo",
  };
}

export type OpportunityQuery = {
  q?: string;
  subject?: string;
  mode?: string;
  grade?: string;
  free?: boolean;
  limit?: number;
  offset?: number;
};

/** Filter + search entirely in MongoDB (lean projection + limit = fast). */
export async function listOpportunities(
  query: OpportunityQuery = {},
): Promise<Opportunity[]> {
  if (!MONGO_SOURCE.uri) return [];

  const filter: Record<string, unknown> = {};
  const q = query.q?.trim();
  if (q) {
    const rx = { $regex: escapeRegex(q), $options: "i" };
    filter.$or = [
      { title: rx },
      { organization: rx },
      { description: rx },
      { tags: rx },
      { location: rx },
    ];
  }
  if (query.subject) {
    filter.tags = { $regex: escapeRegex(query.subject), $options: "i" };
  }
  if (query.mode) {
    filter.mode = { $regex: escapeRegex(query.mode), $options: "i" };
  }
  if (query.grade) {
    filter.grade_levels = query.grade;
  }
  if (query.free) {
    filter.cost = { $regex: "free", $options: "i" };
  }

  const limit = Math.min(query.limit ?? 60, 200);
  const offset = query.offset ?? 0;

  try {
    const collection = await getMongoCollection(MONGO_SOURCE);
    const docs = await collection
      .find(filter, { projection: PROJECTION })
      .sort({ created_at: -1 })
      .skip(offset)
      .limit(limit)
      .toArray();
    return docs.map((doc) => toOpportunity(doc as MongoDoc));
  } catch {
    return [];
  }
}

/** Lean recent set for dashboard / mastery-path recommendations (cached). */
export async function getOpportunities(): Promise<Opportunity[]> {
  return unstable_cache(() => listOpportunities({ limit: 48 }), ["opps-recent"], {
    revalidate: 300,
    tags: ["opportunities"],
  })();
}

/** Subject (tag) facet options for the finder dropdown (cached). */
export async function getOpportunitySubjects(): Promise<string[]> {
  return unstable_cache(
    async () => {
      if (!MONGO_SOURCE.uri) return [];
      try {
        const collection = await getMongoCollection(MONGO_SOURCE);
        const tags = (await collection.distinct("tags")) as unknown[];
        return dedupe(tags.map(asText))
          .filter((t) => t.length > 1 && t.length < 32)
          .sort((a, b) => a.localeCompare(b))
          .slice(0, 48);
      } catch {
        return [];
      }
    },
    ["opps-subjects"],
    { revalidate: 3600, tags: ["opportunities"] },
  )();
}

/** Rank a set by overlap with a learner's skills (best first). */
export function matchOpportunities(
  skills: string[],
  opps: Opportunity[],
): Opportunity[] {
  if (skills.length === 0) return opps;
  const set = new Set(skills.map((s) => s.toLowerCase()));
  return [...opps]
    .map((o) => {
      let score = o.tags.filter((t) => set.has(t.toLowerCase())).length;
      if (set.has(o.category.toLowerCase())) score += 1;
      return { o, score };
    })
    .sort((a, b) => b.score - a.score)
    .map((x) => x.o);
}
