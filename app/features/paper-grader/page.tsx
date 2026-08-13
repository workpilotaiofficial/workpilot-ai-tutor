import type { Metadata } from "next";
import { BarChart3, ClipboardCheck, FileCheck2, MessageSquareText, Target } from "lucide-react";
import FeatureDetailPage, { type FeatureDetailConfig } from "@/components/features/feature-detail-page";

export const metadata: Metadata = {
  title: "AI Paper Grader | Neurova",
  description: "Upload an assignment and its rubric to receive criterion-level scores, strengths, improvement areas, and structured feedback.",
};

const config: FeatureDetailConfig = {
  preview: "grader",
  eyebrow: "AI Paper Grader",
  title: "Feedback that follows the",
  highlightedTitle: "actual marking rubric.",
  description: "Submit your work with its rubric and get a transparent, criterion-by-criterion review with clear strengths and practical improvement areas.",
  icon: ClipboardCheck,
  dashboardHref: "/dashboard/paper-grader",
  primaryCta: "Grade a paper",
  stats: [
    { value: "Rubric-led", label: "Feedback grounded in the criteria you provide" },
    { value: "Per criterion", label: "See score and feedback for each requirement" },
    { value: "Saved history", label: "Return to completed grading results later" },
  ],
  steps: [
    { title: "Upload your work", description: "Add the paper you want reviewed so Neurova can evaluate the full submission." },
    { title: "Include the rubric", description: "Provide the relevant marking criteria to keep the review tied to the assignment expectations." },
    { title: "Use the feedback", description: "Review the overall score, each criterion, your strengths, and the clearest next improvements." },
  ],
  capabilities: [
    { icon: BarChart3, title: "Transparent scoring", description: "See the overall result and the contribution from each rubric criterion." },
    { icon: MessageSquareText, title: "Specific feedback", description: "Read feedback attached to individual criteria instead of a vague summary." },
    { icon: FileCheck2, title: "Strengths identified", description: "Understand what is already working well and should be preserved in revision." },
    { icon: Target, title: "Clear improvements", description: "Turn the review into focused, practical changes for your next draft." },
  ],
  detail: {
    eyebrow: "More useful than a number",
    title: "See the reasoning behind the result.",
    description: "A single score does not tell you how to improve. Neurova separates the review into rubric criteria, strengths, improvement areas, and overall feedback so the result is easier to act on.",
    points: ["Compare earned points with the maximum for each criterion", "Read feedback alongside the exact area it refers to", "Separate proven strengths from the most valuable improvements", "Keep completed submissions available for later review"],
  },
};

export default function PaperGraderFeaturePage() {
  return <FeatureDetailPage config={config} />;
}
