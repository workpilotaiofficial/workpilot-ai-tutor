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
import { useRouter } from "next/navigation";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useRbac } from "@/hooks/use-rbac";
import { getPortalRouteByRole } from "@/lib/api/auth.service";

const navItems = [
  {
    name: "Features",
    link: "#features",
  },
  {
    name: "Pricing",
    link: "#pricing",
  },
  {
    name: "Contact",
    link: "#contact",
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
  const router = useRouter();
  const { isAuthenticated, displayName, role, isReady } = useRbac();

  const closeMobileMenu = () => setIsMobileMenuOpen(false);

  const handleAvatarClick = () => {
    const dashboardRoute = getPortalRouteByRole(role);
    router.push(dashboardRoute);
  };

  return (
    <div className={cn("relative w-full", className)}>
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
                <NavbarButton href="#contact" variant="primary">
                  Book a call
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
            {navItems.map((item, idx) => (
              <motion.a
                key={`mobile-link-${idx}`}
                href={item.link}
                onClick={closeMobileMenu}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.06, duration: 0.2 }}
                className="w-full rounded-md px-2 py-2 text-base font-medium text-neutral-600 transition-colors hover:bg-neutral-100 hover:text-neutral-900 dark:text-neutral-300 dark:hover:bg-neutral-800 dark:hover:text-white"
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
                    href="#contact"
                    onClick={closeMobileMenu}
                    variant="primary"
                    className="w-full"
                  >
                    Book a call
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


