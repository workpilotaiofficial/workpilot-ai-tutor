"use client";

import React, { useEffect, useMemo, useState } from "react";
import { motion, type Variants } from "framer-motion";
import { Check, LoaderCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useRbac } from "@/hooks/use-rbac";
import {
    createSubscriptionCheckout,
    fetchCurrentSubscription,
    fetchSubscriptionPlans,
    type CurrentSubscription,
    type SubscriptionPlan,
} from "@/lib/api/billing.service";
import { getApiClientErrorMessage } from "@/lib/api/client";

const fallbackApiPlans: SubscriptionPlan[] = [
    {
        id: "b5ccb5dd-5be8-4f5c-b708-93ccc087d3c3",
        code: "free",
        name: "Trial",
        monthlyCreditAllotment: 0,
        priceMonthly: 0,
        billingIntervals: [],
    },
    {
        id: "d891150d-7472-4a13-9b23-bdd7d7379f0e",
        code: "starter",
        name: "Starter",
        monthlyCreditAllotment: 1000,
        priceMonthly: 9.99,
        billingIntervals: ["monthly"],
    },
    {
        id: "55a43632-eaf1-4c79-a48c-79e17c5c177e",
        code: "premium",
        name: "Premium",
        monthlyCreditAllotment: 3000,
        priceMonthly: 24.99,
        billingIntervals: ["monthly"],
    },
    {
        id: "c03de521-9cdb-4b40-9f95-626009d46be3",
        code: "power",
        name: "Power",
        monthlyCreditAllotment: 7000,
        priceMonthly: 49.99,
        billingIntervals: ["monthly"],
    },
];

const planDescriptions: Record<string, string> = {
    free: "Explore Neurova before upgrading",
    starter: "Perfect for getting started",
    premium: "The most popular choice",
    power: "Built for power users",
};

function formatMonthlyPrice(value: number | null) {
    if (value === null) return "Custom";

    return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        minimumFractionDigits: value % 1 === 0 ? 0 : 2,
        maximumFractionDigits: 2,
    }).format(value);
}

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
    id: string;
    code: string;
    name: string;
    description: string;
    price: string;
    period: string | null;
    supportsMonthly: boolean;
    featured: boolean;
    features: string[];
};

function toPlanCard(apiPlan: SubscriptionPlan): Plan {
    const supportsMonthly = apiPlan.billingIntervals.includes("monthly");
    const monthlyCredits = apiPlan.monthlyCreditAllotment;
    const creditDescription = monthlyCredits === null
        ? "Monthly credits not specified"
        : `${monthlyCredits.toLocaleString("en-US")} AI credits / month`;

    return {
        id: apiPlan.id,
        code: apiPlan.code,
        name: apiPlan.name,
        description: planDescriptions[apiPlan.code.toLowerCase()] ?? "A plan that fits your learning journey",
        price: formatMonthlyPrice(apiPlan.priceMonthly),
        period: supportsMonthly ? "/mo" : null,
        supportsMonthly,
        featured: apiPlan.code.toLowerCase() === "premium",
        features: [
            creditDescription,
            supportsMonthly ? "Flexible monthly billing" : "No recurring billing",
        ],
    };
}

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

function PlanCard({
    plan,
    isCheckingOut,
    isDisabled,
    ctaLabel,
    onGetStarted,
}: {
    plan: Plan;
    isCheckingOut: boolean;
    isDisabled: boolean;
    ctaLabel: string;
    onGetStarted: (plan: Plan) => void;
}) {
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
                            {plan.period && (
                                <span
                                    className={`text-sm ${
                                        isHighlighted ? "text-white/70" : "text-slate-500"
                                    }`}
                                >
                                    {plan.period}
                                </span>
                            )}
                        </div>
                    </div>

                    <motion.button
                        type="button"
                        onClick={() => onGetStarted(plan)}
                        disabled={isDisabled}
                        aria-busy={isCheckingOut}
                        className={`w-full mb-8 px-6 py-3 rounded-full font-semibold transition-all duration-300 ${
                            isHighlighted
                                ? "bg-white text-thirdary hover:bg-white/90 shadow-lg"
                                : "bg-slate-900 text-white hover:bg-slate-800"
                        } disabled:cursor-not-allowed disabled:opacity-60`}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                    >
                        {isCheckingOut ? (
                            <span className="flex items-center justify-center gap-2">
                                <LoaderCircle className="h-4 w-4 animate-spin" />
                                Redirecting...
                            </span>
                        ) : (
                            ctaLabel
                        )}
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
    const [apiPlans, setApiPlans] = useState<SubscriptionPlan[]>([]);
    const [currentSubscription, setCurrentSubscription] = useState<CurrentSubscription | null>(null);
    const [hasResolvedSubscription, setHasResolvedSubscription] = useState(false);
    const [checkoutPlanId, setCheckoutPlanId] = useState<string | null>(null);
    const { isAuthenticated, isReady } = useRbac();
    const { toast } = useToast();

    useEffect(() => {
        const abortController = new AbortController();

        fetchSubscriptionPlans(abortController.signal)
            .then(setApiPlans)
            .catch((error: unknown) => {
                if (error instanceof DOMException && error.name === "AbortError") return;
                // Keep the supplied API values as a resilient public-page fallback.
            });

        return () => abortController.abort();
    }, []);

    useEffect(() => {
        if (!isReady) return;

        if (!isAuthenticated) {
            setCurrentSubscription(null);
            setHasResolvedSubscription(false);
            return;
        }

        let isCancelled = false;
        setHasResolvedSubscription(false);

        fetchCurrentSubscription()
            .then((subscription) => {
                if (!isCancelled) setCurrentSubscription(subscription);
            })
            .catch((error: unknown) => {
                if (isCancelled) return;

                setCurrentSubscription(null);
                toast({
                    title: "Unable to load your subscription",
                    description: getApiClientErrorMessage(
                        error,
                        "Your available upgrades could not be determined.",
                    ),
                    variant: "destructive",
                });
            })
            .finally(() => {
                if (!isCancelled) setHasResolvedSubscription(true);
            });

        return () => {
            isCancelled = true;
        };
    }, [isAuthenticated, isReady, toast]);

    const displayPlans = useMemo(
        () =>
            [...(apiPlans.length > 0 ? apiPlans : fallbackApiPlans)]
                .sort(
                    (firstPlan, secondPlan) =>
                        (firstPlan.priceMonthly ?? Number.POSITIVE_INFINITY) -
                        (secondPlan.priceMonthly ?? Number.POSITIVE_INFINITY),
                )
                .map(toPlanCard),
        [apiPlans],
    );

    const currentPlanIndex = useMemo(() => {
        if (!currentSubscription) return -1;

        const currentId = currentSubscription.planId?.trim().toLowerCase();
        const currentCode = currentSubscription.planCode.trim().toLowerCase();
        const currentName = currentSubscription.planName.trim().toLowerCase();

        return displayPlans.findIndex(
            (plan) =>
                (Boolean(currentId) && plan.id.trim().toLowerCase() === currentId) ||
                plan.code.trim().toLowerCase() === currentCode ||
                plan.name.trim().toLowerCase() === currentName,
        );
    }, [currentSubscription, displayPlans]);

    const handleGetStarted = async (plan: Plan, isPlanLocked: boolean) => {
        if (!isReady || checkoutPlanId) return;
        if (isPlanLocked) return;

        if (!plan.supportsMonthly || plan.code.toLowerCase() === "free") {
            const dashboardDestination = "/dashboard";
            window.location.assign(
                isAuthenticated
                    ? dashboardDestination
                    : `/login?next=${encodeURIComponent(dashboardDestination)}`,
            );
            return;
        }

        if (!isAuthenticated) {
            const checkoutDestination = `/dashboard?billing=checkout&checkout_plan=${encodeURIComponent(plan.id)}`;
            window.location.assign(`/login?next=${encodeURIComponent(checkoutDestination)}`);
            return;
        }

        setCheckoutPlanId(plan.id);

        try {
            const checkoutSession = await createSubscriptionCheckout({
                planId: plan.id,
                billingInterval: "monthly",
            });

            window.location.assign(checkoutSession.checkoutUrl);
        } catch (error) {
            toast({
                title: "Checkout failed",
                description: getApiClientErrorMessage(error, "Unable to start Stripe checkout."),
                variant: "destructive",
            });
            setCheckoutPlanId(null);
        }
    };

    return (
        <section id="pricing" className="relative scroll-mt-20 overflow-hidden bg-background px-4 py-16 sm:px-6 sm:py-24 lg:px-8 lg:py-28">
            <div className="absolute left-[-5rem] top-32 h-72 w-72 rounded-full bg-thirdary/10 blur-3xl" />
            <div className="absolute right-[-4rem] bottom-24 h-80 w-80 rounded-full bg-primary/10 blur-3xl" />

            <div className="relative max-w-7xl mx-auto">
                <motion.div
                    className="mx-auto mb-12 max-w-2xl text-center sm:mb-16"
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
                    className="mb-12 grid grid-cols-1 items-stretch gap-6 sm:mb-16 sm:gap-8 md:grid-cols-2 lg:grid-cols-4"
                    variants={containerVariants}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, amount: 0.1 }}
                >
                    {displayPlans.map((plan, planIndex) => {
                        const isCurrentPlan =
                            isAuthenticated && currentPlanIndex === planIndex;
                        const isPlanLocked =
                            isAuthenticated &&
                            currentPlanIndex >= 0 &&
                            planIndex <= currentPlanIndex;
                        const isSubscriptionPending =
                            isAuthenticated && !hasResolvedSubscription;

                        return (
                            <PlanCard
                                key={plan.id}
                                plan={plan}
                                isCheckingOut={checkoutPlanId === plan.id}
                                isDisabled={
                                    !isReady ||
                                    isSubscriptionPending ||
                                    checkoutPlanId !== null ||
                                    isPlanLocked
                                }
                                ctaLabel={
                                    !isAuthenticated
                                        ? "Get Started"
                                        : isCurrentPlan
                                          ? "Current Plan"
                                          : "Upgrade"
                                }
                                onGetStarted={(selectedPlan) =>
                                    void handleGetStarted(selectedPlan, isPlanLocked)
                                }
                            />
                        );
                    })}
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6 }}
                    className="relative"
                >
                    <div className="overflow-hidden rounded-2xl border border-slate-200/70 bg-white p-6 shadow-[0_10px_35px_rgba(15,23,42,0.05)] sm:rounded-3xl sm:p-12">
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
