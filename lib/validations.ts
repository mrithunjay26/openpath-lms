import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const registerSchema = z.object({
  name: z.string().min(1, "Please enter your name").max(80),
  email: z.string().email("Enter a valid email address"),
  password: z.string().min(8, "Use at least 8 characters").max(200),
});

export const createTenantSchema = z.object({
  name: z.string().min(2, "Workspace name is too short").max(60),
  slug: z
    .string()
    .min(2, "Slug is too short")
    .max(48)
    .regex(/^[a-z0-9-]+$/, "Use lowercase letters, numbers, and dashes only"),
});

export const firebaseConnectSchema = z.object({
  serviceAccount: z.string().min(10, "Paste your service account JSON"),
  storageBucket: z.string().trim().optional(),
  clientConfig: z.string().trim().optional(),
});

const hexColor = z.string().regex(/^#([0-9a-fA-F]{6})$/, "Use a hex color like #5B6CFF");

export const brandingSchema = z.object({
  name: z.string().min(2).max(60),
  primary: hexColor,
  accent: hexColor,
  accent2: hexColor,
  logoUrl: z.string().url().optional().or(z.literal("")),
  headingFont: z.enum([
  "Sora",
  "Inter",
  "Manrope",
  "Space Grotesk",
  "Plus Jakarta Sans",
  ]),
  cornerStyle: z.enum(["sharp", "rounded", "pill"]),
  shapeIntensity: z.enum(["off", "low", "medium", "high"]),
  density: z.enum(["compact", "balanced", "comfortable"]),
  shellWidth: z.enum(["standard", "wide", "ultra"]),
});

export const courseSchema = z.object({
  name: z.string().min(2, "Course name is too short").max(100),
  description: z.string().max(2000).optional().or(z.literal("")),
  term: z.string().max(60).optional().or(z.literal("")),
  meetingLink: z.string().url("Enter a valid URL").optional().or(z.literal("")),
  skills: z.string().max(300).optional().or(z.literal("")),
});

export const assignmentSchema = z.object({
  title: z.string().min(2, "Title is too short").max(160),
  details: z.string().max(8000).optional().or(z.literal("")),
  points: z.coerce.number().int().min(0).max(10000).optional(),
  dueAt: z.string().optional().or(z.literal("")),
});

export const announcementSchema = z.object({
  title: z.string().min(2).max(160),
  body: z.string().min(1).max(8000),
});

// Slugs that must never become a workspace (they collide with app routes).
export const RESERVED_SLUGS = new Set([
  "app",
  "onboarding",
  "login",
  "signup",
  "logout",
  "privacy",
  "terms",
  "api",
  "admin",
  "_next",
  "static",
  "assets",
  "public",
  "help",
  "support",
  "about",
  "settings",
  "dashboard",
  "account",
  "billing",
  "openpath",
  "stuimpact",
  "new",
  "join",
  "invite",
]);
