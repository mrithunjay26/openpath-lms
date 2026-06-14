export type Resource = {
  id: string;
  title: string;
  category: string;
  audience: "teacher" | "student" | "admin";
  skills: string[];
  url: string;
  summary: string;
};

export const COMMUNITY_RESOURCES: Resource[] = [
  {
    id: "grant-impact-template",
    title: "Grant-ready impact narrative",
    category: "Reporting",
    audience: "admin",
    skills: ["impact", "evaluation"],
    url: "/self-host#reporting",
    summary: "A lightweight structure for explaining reach, growth, and outcomes.",
  },
  {
    id: "project-portfolio-guide",
    title: "Student portfolio artifact guide",
    category: "Portfolio",
    audience: "student",
    skills: ["reflection", "portfolio"],
    url: "/self-host#student-data",
    summary: "Prompts that help students turn assignments into evidence of growth.",
  },
  {
    id: "club-program-playbook",
    title: "Program launch playbook",
    category: "Programs",
    audience: "teacher",
    skills: ["program design", "facilitation"],
    url: "/self-host#operations",
    summary: "A practical checklist for launching a cohort-based learning program.",
  },
  {
    id: "safety-moderation-checklist",
    title: "Discussion and messaging moderation checklist",
    category: "Safety",
    audience: "teacher",
    skills: ["moderation", "community"],
    url: "/terms",
    summary: "Norms and escalation steps for safer classroom communication.",
  },
];
