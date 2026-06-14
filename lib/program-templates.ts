import "server-only";

export type ProgramTemplate = {
  id: string;
  name: string;
  description: string;
  term: string;
  skills: string[];
  modules: Array<{
    title: string;
    lessons: Array<{ title: string; content: string }>;
  }>;
  assignments: Array<{
    title: string;
    details: string;
    points: number;
  }>;
};

export const PROGRAM_TEMPLATES: ProgramTemplate[] = [
  {
    id: "career-launch",
    name: "Career Launch Sprint",
    term: "6-week cohort",
    skills: ["career readiness", "communication", "portfolio"],
    description:
      "A cohort program that helps students translate learning into opportunity.",
    modules: [
      {
        title: "Identity and goals",
        lessons: [
          {
            title: "Opportunity map",
            content:
              "Students identify interests, constraints, strengths, and near-term opportunities.",
          },
          {
            title: "Portfolio baseline",
            content:
              "Students select one artifact and write a reflection on what it demonstrates.",
          },
        ],
      },
      {
        title: "Application readiness",
        lessons: [
          {
            title: "Resume story lab",
            content:
              "Students turn project work into resume bullets with action, context, and result.",
          },
        ],
      },
    ],
    assignments: [
      {
        title: "Personal opportunity map",
        details:
          "Submit a one-page map of three opportunities you could pursue and the skills each requires.",
        points: 20,
      },
      {
        title: "Portfolio reflection",
        details:
          "Choose one artifact, explain the skill it demonstrates, and name your next improvement.",
        points: 30,
      },
    ],
  },
  {
    id: "project-incubator",
    name: "Student Project Incubator",
    term: "8-week cohort",
    skills: ["research", "design", "collaboration", "presentation"],
    description:
      "A project-based program for clubs, tutoring cohorts, and student teams.",
    modules: [
      {
        title: "Problem discovery",
        lessons: [
          {
            title: "Interview plan",
            content:
              "Students plan three stakeholder interviews and identify assumptions to test.",
          },
        ],
      },
      {
        title: "Build and share",
        lessons: [
          {
            title: "Prototype checkpoint",
            content:
              "Students document what they built, what changed, and what evidence they used.",
          },
        ],
      },
    ],
    assignments: [
      {
        title: "Problem brief",
        details:
          "Define the problem, audience, evidence, and why it matters.",
        points: 25,
      },
      {
        title: "Final showcase",
        details:
          "Submit a presentation or demo link with a short reflection on growth.",
        points: 50,
      },
    ],
  },
];

export function getProgramTemplate(id: string) {
  return PROGRAM_TEMPLATES.find((t) => t.id === id) ?? null;
}
