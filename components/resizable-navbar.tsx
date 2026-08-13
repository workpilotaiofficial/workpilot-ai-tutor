"use client";
import {
  Navbar,
  NavBody,
  NavItems,
  MobileNav,
  NavbarLogo,
  NavbarButton,
  MobileNavHeader,
  MobileNavToggle,
  MobileNavMenu,
} from "@/components/ui/resizable-navbar";
import { cn } from "@/lib/utils";
import { motion } from "motion/react";
import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useRbac } from "@/hooks/use-rbac";
import { getPortalRouteByRole } from "@/lib/api/auth.service";
import { ChevronDown } from "lucide-react";

type NavItem = {
  name: string;
  link: string;
  children?: {
    name: string;
    link: string;
    description: string;
  }[];
};

const navItems: NavItem[] = [
  {
    name: "Features",
    link: "/features",
    children: [
      {
        name: "Study Sets",
        link: "/features/study-sets",
        description: "Notes, flashcards, quizzes, and tutor lessons",
      },
      {
        name: "Syllabus Intelligence",
        link: "/features/syllabus-intelligence",
        description: "Modules, priorities, and semester planning",
      },
      {
        name: "Paper Grader",
        link: "/features/paper-grader",
        description: "Rubric-based scores and actionable feedback",
      },
    ],
  },
  {
    name: "Blog",
    link: "/blog",
  },

  {
    name: "Contact",
    link: "/contact",
  },
];

function getInitials(displayName: string | null): string {
  if (!displayName) return "U";
  return displayName
    .split(" ")
    .map((name) => name[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export default function Nav({
  children,
  className,
}: {
  children?: React.ReactNode;
  className?: string;
}) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobileFeaturesOpen, setIsMobileFeaturesOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated, displayName, role, isReady } = useRbac();

  const hideNav =
    pathname?.startsWith("/dashboard") ||
    pathname?.startsWith("/admin") ||
    pathname?.startsWith("/studio") ||
    pathname === "/login" ||
    pathname === "/signup";

  if (hideNav) {
    return <>{children}</>;
  }

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
    setIsMobileFeaturesOpen(false);
  };

  const handleAvatarClick = () => {
    const dashboardRoute = getPortalRouteByRole(role);
    router.push(dashboardRoute);
  };

  return (
    <div className={cn("relative min-w-0 w-full", className)}>
      <Navbar>
        {/* Desktop Navigation */}
        <NavBody>
          <NavbarLogo />
          <NavItems items={navItems} onItemClick={closeMobileMenu} />
          <div className="flex items-center gap-4 max-w-[33%] w-full justify-end ">
            {isReady && isAuthenticated ? (
              <button
                onClick={handleAvatarClick}
                className="group relative flex items-center gap-2.5 cursor-pointer transition-all bg-gray-100 duration-200 hover:scale-105 active:scale-95 px-3 py-1.5 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800/50"
                title={displayName || "User"}
              >
                <span className="hidden sm:block max-w-[120px] truncate text-sm font-semibold text-neutral-700 dark:text-neutral-200">
                  {displayName}
                </span>
                <Avatar className="h-10 w-10 border-2 border-primary/20 shadow-md">
                  <AvatarFallback className="bg-linear-to-br from-blue-500 to-purple-600 text-white font-bold text-sm flex items-center justify-center">
                    {getInitials(displayName)}
                  </AvatarFallback>
                </Avatar>
              </button>
            ) : (
              <>
                <NavbarButton href="/login" variant="secondary">
                  Login
                </NavbarButton>
                <NavbarButton href="/signup" variant="primary">
                  Start free
                </NavbarButton>
              </>
            )}
          </div>
        </NavBody>

        {/* Mobile Navigation */}
        <MobileNav>
          <MobileNavHeader>
            <NavbarLogo />
            <MobileNavToggle
              isOpen={isMobileMenuOpen}
              onClick={() => setIsMobileMenuOpen((open) => !open)}
            />
          </MobileNavHeader>

          <MobileNavMenu isOpen={isMobileMenuOpen} onClose={closeMobileMenu}>
            {navItems.map((item, idx) => item.children?.length ? (
              <motion.div
                key={`mobile-link-${idx}`}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.06, duration: 0.2 }}
                className="w-full"
              >
                <button
                  type="button"
                  aria-expanded={isMobileFeaturesOpen}
                  onClick={() => setIsMobileFeaturesOpen((open) => !open)}
                  className="flex min-h-11 w-full items-center justify-between rounded-md px-3 py-2 text-base font-medium text-neutral-600 transition-colors hover:bg-neutral-100 hover:text-neutral-900 dark:text-neutral-300 dark:hover:bg-neutral-800 dark:hover:text-white"
                >
                  {item.name}
                  <ChevronDown className={`h-4 w-4 transition-transform ${isMobileFeaturesOpen ? "rotate-180" : ""}`} />
                </button>
                <motion.div
                  initial={false}
                  animate={{ height: isMobileFeaturesOpen ? "auto" : 0, opacity: isMobileFeaturesOpen ? 1 : 0 }}
                  className="overflow-hidden"
                >
                  <div className="ml-3 space-y-1 border-l border-slate-200 py-1 pl-3 dark:border-neutral-800">
                    {item.children.map((child) => (
                      <a
                        key={child.link}
                        href={child.link}
                        onClick={closeMobileMenu}
                        className="block rounded-lg px-3 py-2.5 transition hover:bg-primary/[.06]"
                      >
                        <span className="block text-sm font-semibold text-slate-700 dark:text-slate-200">{child.name}</span>
                        <span className="mt-0.5 block text-xs leading-5 text-slate-500 dark:text-neutral-400">{child.description}</span>
                      </a>
                    ))}
                    <a href={item.link} onClick={closeMobileMenu} className="block rounded-lg px-3 py-2 text-xs font-semibold text-primary hover:bg-primary/[.06]">View all features →</a>
                  </div>
                </motion.div>
              </motion.div>
            ) : (
              <motion.a
                key={`mobile-link-${idx}`}
                href={item.link}
                onClick={closeMobileMenu}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.06, duration: 0.2 }}
                className="flex min-h-11 w-full items-center rounded-md px-3 py-2 text-base font-medium text-neutral-600 transition-colors hover:bg-neutral-100 hover:text-neutral-900 dark:text-neutral-300 dark:hover:bg-neutral-800 dark:hover:text-white"
              >
                {item.name}
              </motion.a>
            ))}
            <div className="mt-2 flex w-full flex-col gap-3">
              {isReady && isAuthenticated ? (
                <button
                  onClick={() => {
                    closeMobileMenu();
                    handleAvatarClick();
                  }}
                  className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-base font-medium text-neutral-600 transition-colors bg-neutral-100 hover:bg-neutral-200 hover:text-neutral-900 dark:text-neutral-300 dark:hover:bg-neutral-800 dark:hover:text-white active:scale-95"
                  title={displayName || "User"}
                >
                  <span className="font-semibold">{displayName || "User"}</span>
                  <Avatar className="h-10 w-10 border-2 border-primary/20 shadow-md">
                    <AvatarFallback className="bg-linear-to-br from-blue-500 to-purple-600 text-white font-bold text-sm flex items-center justify-center">
                      {getInitials(displayName)}
                    </AvatarFallback>
                  </Avatar>
                </button>
              ) : (
                <>
                  <NavbarButton
                    href="/login"
                    onClick={closeMobileMenu}
                    variant="secondary"
                    className="w-full"
                  >
                    Login
                  </NavbarButton>
                  <NavbarButton
                    href="/signup"
                    onClick={closeMobileMenu}
                    variant="primary"
                    className="w-full"
                  >
                    Start free
                  </NavbarButton>
                </>
              )}
            </div>
          </MobileNavMenu>
        </MobileNav>
      </Navbar>
      {children}
    </div>
  );
}


