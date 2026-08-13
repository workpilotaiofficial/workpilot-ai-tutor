import type { Metadata } from "next";
import { BookOpenCheck, BrainCircuit, FileText, Layers3, Target } from "lucide-react";
import FeatureDetailPage, { type FeatureDetailConfig } from "@/components/features/feature-detail-page";

export const metadata: Metadata = {
  title: "AI Study Sets | Neurova",
  description: "Turn documents, pasted notes, or YouTube material into organized notes, flashcards, quizzes, written practice, and tutor lessons.",
};

const config: FeatureDetailConfig = {
  preview: "study-sets",
  eyebrow: "AI Study Sets",
  title: "One source becomes your",
  highlightedTitle: "complete study system.",
  description: "Upload your material once and turn it into focused notes, flashcards, quizzes, written practice, and guided tutor lessons—all kept together in one workspace.",
  icon: BrainCircuit,
  dashboardHref: "/dashboard/study-sets",
  primaryCta: "Create a study set",
  stats: [
    { value: "3 ways", label: "Upload a file, paste text, or add YouTube" },
    { value: "6 formats", label: "Choose only the study modes you need" },
    { value: "1 workspace", label: "Keep every generated item together" },
  ],
  steps: [
    { title: "Add your source", description: "Upload course material, paste your notes, or bring in a YouTube lesson as the source for your set." },
    { title: "Choose your formats", description: "Select notes, multiple choice, flashcards, tutor lessons, written tests, or fill-in-the-blank practice." },
    { title: "Learn and improve", description: "Move between formats, revisit generated work, and track material as it becomes familiar and mastered." },
  ],
  capabilities: [
    { icon: FileText, title: "Structured notes", description: "Turn dense material into a clearer, organized reference for review." },
    { icon: Layers3, title: "Active recall", description: "Use flashcards and targeted questions to practise retrieval, not just rereading." },
    { icon: BookOpenCheck, title: "Written practice", description: "Test deeper understanding with written answers and fill-in-the-blank activities." },
    { icon: Target, title: "Mastery tracking", description: "See what is new, learning, familiar, and mastered across your study set." },
  ],
  detail: {
    eyebrow: "Built for continuity",
    title: "Your learning stays connected.",
    description: "A study set is more than a one-off AI response. Every output belongs to the same source, so you can switch from understanding to recall to practice without rebuilding context.",
    points: ["Open every generated format from one overview", "Regenerate an individual output when you need a fresh version", "Return to previous study sets and continue where you left off", "See progress across unfamiliar, learning, familiar, and mastered material"],
  },
};

export default function StudySetsFeaturePage() {
  return <FeatureDetailPage config={config} />;
}
