"use client";

import React from "react";
import { motion, type Variants } from "framer-motion";
import { Check, Sparkles } from "lucide-react";

const plans = [
    {
        name: "Starter",
        description: "Perfect for getting started",
        price: "$19",
        period: "Per month",
        featured: false,
        gradient: "from-blue-500 to-cyan-500",
        features: [
            "3M AI Credits",
            "20 Hours of platform credits",
            "10 Projects",
            "Community support",
            "Basic dashboard",
        ],
    },
    {
        name: "Premium",
        description: "Most popular choice",
        price: "$49",
        period: "Per month",
        featured: true,
        gradient: "from-purple-500 to-pink-500",
        features: [
            "8M AI Credits",
            "50 Hours of Platform Credits",
            "20 Projects",
            "Priority support",
            "Advanced analytics",
            "Custom integrations",
        ],
    },
    {
        name: "Business",
        description: "For power users",
        price: "$99",
        period: "Per month",
        featured: false,
        gradient: "from-orange-500 to-red-500",
        features: [
            "20M AI Credits",
            "75 Hours of Platform Credits",
            "Unlimited Projects",
            "Dedicated support",
            "Custom features",
            "API access",
        ],
    },
];

const enterpriseFeatures = [
    "Unlimited projects",
    "No capping on tokens",
    "Dedicated account manager",
    "24/7 Premium support",
    "Custom integrations",
    "Advanced security features",
    "SLA guarantees",
    "Custom training",
];

const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.1,
            delayChildren: 0.2,
        },
    },
};

const itemVariants: Variants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
        opacity: 1,
        y: 0,
        transition: {
            duration: 0.6,
            ease: "easeOut",
        },
    },
};

type Plan = {
    name: string;
    description: string;
    price: string;
    period: string;
    featured: boolean;
    gradient: string;
    features: string[];
};

function FeatureItem({
    children,
    dark = false,
}: {
    children: React.ReactNode;
    dark?: boolean;
}) {
    return (
        <div className="my-3 flex items-start justify-start gap-3">
            <div
                className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${
                    dark ? "bg-white/20" : "bg-thirdary/10"
                }`}
            >
                <Check
                    className={`h-3 w-3 stroke-[3px] ${dark ? "text-white" : "text-thirdary"}`}
                />
            </div>
            <div
                className={`text-sm font-medium ${dark ? "text-white/85" : "text-slate-600"}`}
            >
                {children}
            </div>
        </div>
    );
}

function PlanCard({ plan }: { plan: Plan }) {
    const isHighlighted = plan.featured;

    return (
        <motion.div
            variants={itemVariants}
            whileHover={{ y: -8 }}
            transition={{ type: "spring", stiffness: 300, damping: 22 }}
            className={`group h-full ${isHighlighted ? "lg:-mt-4 lg:mb-4" : ""}`}
        >
            <div
                className={`relative h-full rounded-3xl overflow-hidden transition-all duration-300 ${
                    isHighlighted
                        ? "bg-gradient-to-br from-button via-thirdary to-primary text-white shadow-[0_25px_60px_rgba(81,0,167,0.30)]"
                        : "bg-white border border-slate-200/70 shadow-[0_10px_35px_rgba(15,23,42,0.05)] group-hover:border-slate-300 group-hover:shadow-[0_25px_60px_rgba(15,23,42,0.10)]"
                }`}
            >
                {isHighlighted && (
                    <>
                        <div className="absolute inset-0 opacity-[0.12] mix-blend-overlay bg-[radial-gradient(circle,white_1px,transparent_1px)] bg-[length:20px_20px]" />
                        <div className="absolute -top-16 -right-16 h-48 w-48 rounded-full bg-white/10 blur-3xl" />
                    </>
                )}

                <div className="relative z-10 p-6 sm:p-8 flex flex-col h-full">
                    <div className="mb-6 flex items-start justify-between gap-3">
                        <div>
                            <h3
                                className={`text-xl sm:text-2xl font-semibold mb-1.5 tracking-tight ${
                                    isHighlighted ? "text-white" : "text-slate-900"
                                }`}
                            >
                                {plan.name}
                            </h3>
                            <p
                                className={`text-sm ${
                                    isHighlighted ? "text-white/70" : "text-slate-500"
                                }`}
                            >
                                {plan.description}
                            </p>
                        </div>
                        {isHighlighted && (
                            <span className="shrink-0 rounded-full bg-white/20 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-white">
                                Popular
                            </span>
                        )}
                    </div>

                    <div className="mb-8">
                        <div className="flex items-baseline gap-1">
                            <span
                                className={`text-4xl sm:text-5xl font-semibold tracking-tight ${
                                    isHighlighted ? "text-white" : "text-slate-900"
                                }`}
                            >
                                {plan.price}
                            </span>
                            <span
                                className={`text-sm ${
                                    isHighlighted ? "text-white/70" : "text-slate-500"
                                }`}
                            >
                                /mo
                            </span>
                        </div>
                    </div>

                    <motion.button
                        className={`w-full mb-8 px-6 py-3 rounded-full font-semibold transition-all duration-300 ${
                            isHighlighted
                                ? "bg-white text-thirdary hover:bg-white/90 shadow-lg"
                                : "bg-slate-900 text-white hover:bg-slate-800"
                        }`}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                    >
                        Get Started
                    </motion.button>

                    <div className="space-y-0 flex-grow">
                        {plan.features.map((feature) => (
                            <FeatureItem key={feature} dark={isHighlighted}>
                                {feature}
                            </FeatureItem>
                        ))}
                    </div>
                </div>
            </div>
        </motion.div>
    );
}

export default function PricingSection() {
    return (
        <section id="pricing" className="relative py-20 sm:py-28 px-4 sm:px-6 lg:px-8 bg-background overflow-hidden">
            <div className="absolute left-[-5rem] top-32 h-72 w-72 rounded-full bg-thirdary/10 blur-3xl" />
            <div className="absolute right-[-4rem] bottom-24 h-80 w-80 rounded-full bg-primary/10 blur-3xl" />

            <div className="relative max-w-7xl mx-auto">
                <motion.div
                    className="text-center mb-14 sm:mb-16 max-w-2xl mx-auto"
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6 }}
                >
                    <motion.span
                        className="inline-flex items-center gap-2 rounded-full border border-thirdary/15 bg-white/85 px-4 py-1.5 text-xs sm:text-sm font-medium text-thirdary shadow-[0_10px_35px_rgba(15,23,42,0.06)] backdrop-blur mb-6"
                        initial={{ opacity: 0, scale: 0.9 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5, delay: 0.1 }}
                    >
                       
                        Flexible Pricing
                    </motion.span>
                    <motion.h2
                        className="text-3xl sm:text-4xl md:text-5xl font-semibold mb-5 text-slate-950 tracking-[-0.03em] leading-[1.1]"
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6, delay: 0.2 }}
                    >
                        Simple, transparent{" "}
                        <span className="bg-gradient-to-r from-button via-thirdary to-primary bg-clip-text text-transparent">
                            pricing
                        </span>
                    </motion.h2>
                    <motion.p
                        className="text-slate-600 text-base sm:text-lg leading-relaxed"
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6, delay: 0.3 }}
                    >
                        Choose the perfect plan for your learning journey. No hidden fees, cancel anytime.
                    </motion.p>
                </motion.div>

                <motion.div
                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 mb-16 items-stretch"
                    variants={containerVariants}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, amount: 0.1 }}
                >
                    {plans.map((plan) => (
                        <PlanCard key={plan.name} plan={plan} />
                    ))}
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6 }}
                    className="relative"
                >
                    <div className="rounded-3xl border border-slate-200/70 bg-white shadow-[0_10px_35px_rgba(15,23,42,0.05)] overflow-hidden p-8 sm:p-12">
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 lg:gap-12">
                            <div className="lg:col-span-1">
                                <h3 className="text-2xl sm:text-3xl font-semibold text-slate-900 mb-3 tracking-tight">
                                    Enterprise Plan
                                </h3>
                                <p className="text-slate-600 mb-6 text-sm leading-relaxed">
                                    Unlock unlimited possibilities with our custom enterprise solution. Get dedicated support and features tailored to your needs.
                                </p>
                                <motion.button
                                    className="w-full sm:w-auto px-8 py-3 rounded-full bg-gradient-to-r from-button to-thirdary text-white font-semibold shadow-lg hover:-translate-y-0.5 transition-transform duration-300"
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                >
                                    Contact Sales
                                </motion.button>
                            </div>

                            <div className="lg:col-span-2">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6">
                                    {enterpriseFeatures.map((feature) => (
                                        <FeatureItem key={feature}>{feature}</FeatureItem>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </motion.div>
            </div>
        </section>
    );
}
