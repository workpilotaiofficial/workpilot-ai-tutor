import Image from "next/image";
import {
  IconBrandFacebook,
  IconBrandInstagram,
  IconBrandLinkedin,
  IconBrandX,
} from "@tabler/icons-react";

type FooterLink = { name: string; href: string };

const pages: FooterLink[] = [
  { name: "Features", href: "/#features" },
  { name: "Pricing", href: "/#pricing" },
  { name: "Contact Us", href: "/contact" },
];

const legal: FooterLink[] = [
  { name: "Privacy Policy", href: "/privacy-policy" },
  { name: "Terms of Service", href: "/terms-of-service" },
  { name: "Refund Policy", href: "/refund-policy" },
];

const register: FooterLink[] = [
  { name: "Login", href: "/login" },
  { name: "Get Support", href: "/contact" },
];

const socials = [
  { name: "Facebook", href: "#", icon: IconBrandFacebook },
  { name: "Instagram", href: "#", icon: IconBrandInstagram },
  { name: "Twitter", href: "#", icon: IconBrandX },
  { name: "LinkedIn", href: "#", icon: IconBrandLinkedin },
];

export default function Footer() {
  return (
    <footer className="overflow-hidden rounded-xl border border-neutral-200 bg-neutral-100 p-4 dark:border-neutral-800 dark:bg-neutral-900">
      <div className="overflow-hidden rounded-lg bg-white shadow-sm dark:bg-neutral-950">
        <div className="relative w-full overflow-hidden border-t border-neutral-100 bg-white px-6 pt-16 sm:px-10 dark:border-white/10 dark:bg-neutral-950">
          <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-12 text-sm text-neutral-500 sm:flex-row">
            {/* Brand */}
            <div className="max-w-xs">
              <a
                href="/"
                className="relative z-20 flex items-center space-x-2 text-sm font-normal text-black dark:text-white"
              >
                <Image src="/icon.png" alt="WorkPilot" width={30} height={30} />
                <span className="text-lg font-semibold">WorkPilot</span>
              </a>
              <p className="mt-4 leading-relaxed text-neutral-500 dark:text-neutral-400">
                AI-powered study tools for turning your learning materials into notes, quizzes, flashcards, and actionable feedback.
              </p>

              <div className="mt-6 flex items-center gap-3">
                {socials.map(({ name, href, icon: Icon }) => (
                  <a
                    key={name}
                    href={href}
                    aria-label={name}
                    className="flex h-9 w-9 items-center justify-center rounded-full border border-neutral-200 text-neutral-500 transition-colors hover:border-neutral-300 hover:bg-neutral-100 hover:text-neutral-900 dark:border-neutral-800 dark:hover:bg-neutral-800 dark:hover:text-white"
                  >
                    <Icon className="h-4 w-4" />
                  </a>
                ))}
              </div>
            </div>

            {/* Link columns */}
            <div className="grid grid-cols-2 items-start gap-10 sm:gap-16 lg:grid-cols-3">
              <FooterColumn title="Pages" items={pages} />
              <FooterColumn title="Legal" items={legal} />
              <FooterColumn title="Account" items={register} />
            </div>
          </div>

          <div className="mx-auto mt-12 max-w-7xl border-t border-neutral-100 py-6 dark:border-white/10">
            <p className="text-neutral-500 dark:text-neutral-400">
              © {new Date().getFullYear()} WorkPilot. All rights reserved.
            </p>
          </div>

          <p className="select-none bg-linear-to-b from-neutral-100 to-neutral-200/70 bg-clip-text text-center text-5xl font-bold text-transparent md:text-9xl lg:text-[12rem] xl:text-[13rem] dark:from-neutral-900 dark:to-neutral-950">
            WorkPilot
          </p>
        </div>
      </div>
    </footer>
  );
}

function FooterColumn({ title, items }: { title: string; items: FooterLink[] }) {
  return (
    <div className="flex w-full flex-col space-y-4">
      <p className="font-semibold text-neutral-800 dark:text-neutral-100">{title}</p>
      <ul className="space-y-3">
        {items.map((item) => (
          <li key={item.name}>
            <a
              href={item.href}
              className="text-neutral-600 transition-colors hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100"
            >
              {item.name}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
