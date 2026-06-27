"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { clsx } from "clsx";
import { LayoutDashboard, Settings, LogOut } from "lucide-react";
import { useClerk } from "@clerk/nextjs";

interface NavbarProps {
  userEmail?: string;
  orgName?: string;
}

const NAV_LINKS = [
  {
    href: "/dashboard",
    label: "Paneli Kryesor",
    icon: LayoutDashboard,
  },
  {
    href: "/settings",
    label: "Cilësimet",
    icon: Settings,
  },
];

export function Navbar({ userEmail, orgName }: NavbarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { signOut } = useClerk();

  async function handleLogout() {
    await signOut(() => router.push("/login"));
  }

  return (
    <header className="bg-primary shadow-md sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/dashboard" className="flex items-center gap-2.5 group">
            <div className="flex items-center justify-center bg-white rounded-lg p-1">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/logo.svg" alt="Peitho" className="h-8 w-8 object-contain" />
            </div>
            <div>
              <span className="text-xl font-bold text-gold tracking-wide">
                Peitho
              </span>
              {orgName && (
                <span className="hidden sm:block text-xs text-primary-200 leading-none">
                  {orgName}
                </span>
              )}
            </div>
          </Link>

          {/* Navigation */}
          <nav className="hidden md:flex items-center gap-1">
            {NAV_LINKS.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className={clsx(
                  "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-150",
                  pathname.startsWith(href)
                    ? "bg-white/15 text-white"
                    : "text-primary-200 hover:bg-white/10 hover:text-white"
                )}
              >
                <Icon className="h-4 w-4" />
                {label}
              </Link>
            ))}
          </nav>

          {/* User section */}
          <div className="flex items-center gap-3">
            {userEmail && (
              <span className="hidden lg:block text-sm text-primary-200 max-w-[200px] truncate">
                {userEmail}
              </span>
            )}
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-primary-200 hover:bg-white/10 hover:text-white transition-all duration-150"
              title="Dil"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Dil</span>
            </button>
          </div>
        </div>

        {/* Mobile nav */}
        <div className="flex md:hidden items-center gap-1 pb-2 overflow-x-auto">
          {NAV_LINKS.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={clsx(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all",
                pathname.startsWith(href)
                  ? "bg-white/15 text-white"
                  : "text-primary-200 hover:bg-white/10 hover:text-white"
              )}
            >
              <Icon className="h-3.5 w-3.5" />
              {label}
            </Link>
          ))}
        </div>
      </div>
    </header>
  );
}
