import type { Metadata } from "next";
import { CalendarRange, Clock3, Flame, Layers3, Route } from "lucide-react";
import FeatureDetailPage, { type FeatureDetailConfig } from "@/components/features/feature-detail-page";

export const metadata: Metadata = {
  title: "Syllabus Intelligence | Neurova",
  description: "Turn an uploaded or pasted syllabus into modules, learning objectives, priority topics, and a semester timeline.",
};

const config: FeatureDetailConfig = {
  preview: "syllabus",
  eyebrow: "Syllabus Intelligence",
  title: "Turn a long syllabus into a",
  highlightedTitle: "plan you can follow.",
  description: "Neurova reads your course syllabus and turns it into a structured overview with modules, learning objectives, priorities, and a practical semester timeline.",
  icon: Route,
  dashboardHref: "/dashboard/syllabus-intelligence",
  primaryCta: "Analyze a syllabus",
  stats: [
    { value: "2 inputs", label: "Upload a PDF or paste syllabus text" },
    { value: "4 views", label: "Overview, modules, timeline, and priorities" },
    { value: "1 plan", label: "Connect course structure to weekly action" },
  ],
  steps: [
    { title: "Add your syllabus", description: "Upload the PDF supplied by your course or paste the syllabus text directly into Neurova." },
    { title: "Let AI structure it", description: "The course is organized into learning objectives, modules, priority topics, deliverables, and weeks." },
    { title: "Follow the plan", description: "Review the timeline, focus on the highest-priority material, and mark modules complete as you progress." },
  ],
  capabilities: [
    { icon: Layers3, title: "Module breakdown", description: "See course topics grouped into digestible modules with descriptions and deliverables." },
    { icon: CalendarRange, title: "Semester timeline", description: "Understand what belongs in each week and where important milestones sit." },
    { icon: Flame, title: "Priority topics", description: "Surface high-, medium-, and low-priority areas so your effort has a clear order." },
    { icon: Clock3, title: "Progress visibility", description: "Track completed modules and return to past analyses whenever you need them." },
  ],
  detail: {
    eyebrow: "Focus with confidence",
    title: "Know what deserves attention first.",
    description: "Instead of treating every line of the syllabus equally, Neurova highlights priorities and connects them back to the course structure and timeline.",
    points: ["Review overall learning objectives before diving into topics", "Expand modules to see their topics and deliverables", "Use priority levels and exam-frequency signals to focus review", "Reopen previous syllabus analyses from your history"],
  },
};

export default function SyllabusIntelligenceFeaturePage() {
  return <FeatureDetailPage config={config} />;
}
