"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "@/lib/auth-client";
import { LogOut, ShieldCheck } from "lucide-react";

export function Navbar() {
  const { data: session, isPending } = useSession();
  const pathname = usePathname();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (!pathname.startsWith("/dashboard")) {
    return null;
  }

  const userRole = (session?.user as any)?.role?.toUpperCase() || "FRAMER";
  const isAdmin = userRole === "ADMIN";


  const userInitial = (
    session?.user?.name?.[0] ||
    session?.user?.email?.[0] ||
    "U"
  ).toUpperCase();

  const handleSignOut = async () => {
    setDropdownOpen(false);
    await signOut({
      fetchOptions: {
        onSuccess: () => {
          window.location.href = "/auth/login";
        },
      },
    });
  };

  return (
    <header className="sticky top-0 z-50 w-full bg-[#2a2829] border-b border-[#045339]/30 shadow-md">
      <div className="w-full px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link
            href={isAdmin ? "/dashboard/admin" : "/dashboard/framer"}
            className="flex items-center gap-3 group focus:outline-none rounded-lg py-1 transition-opacity hover:opacity-90"
          >
            <div className="p-1.5 rounded-lg flex items-center justify-center shadow-sm">
              <Image
                src="/logo/ras-transparent-logo.png"
                alt="Ron Anderson & Sons"
                width={180}
                height={45}
                className="h-8 sm:h-9 w-auto object-contain"
                priority
              />
            </div>
            <div className="flex flex-col hidden sm:flex">
              <span className="font-bold text-sm tracking-tight text-white leading-tight group-hover:text-emerald-400 transition-colors">
                Ron Anderson & Sons
              </span>
              <span className="text-[11px] text-gray-400 font-medium leading-none mt-0.5">
                Site Safety Portal
              </span>
            </div>
          </Link>

          <div className="flex items-center gap-3">
            {isPending ? (
              <div className="h-9 w-9 bg-white/10 animate-pulse rounded-full"></div>
            ) : session?.user ? (
              <div className="flex items-center gap-3">
                {/* Admin Badge */}
                {isAdmin && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold tracking-wider rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    <ShieldCheck className="w-3 h-3 text-amber-400" />
                    ADMIN
                  </span>
                )}

                {/* Profile Avatar Dropdown */}
                <div className="relative" ref={dropdownRef}>
                  <button
                    onClick={() => setDropdownOpen(!dropdownOpen)}
                    className="flex items-center justify-center w-9 h-9 rounded-full bg-[#045339] text-white font-bold text-sm shadow-md ring-2 ring-[#045339]/50 hover:bg-[#033d2a] transition-all focus:outline-none focus:ring-4 focus:ring-emerald-500/40 active:scale-95"
                    aria-label="User menu"
                  >
                    {userInitial}
                  </button>

                  {/* Dropdown Menu */}
                  {dropdownOpen && (
                    <div className="absolute right-0 mt-2 w-56 rounded-xl bg-[#2a2829] border border-white/10 shadow-xl py-1 z-50 animate-in fade-in zoom-in-95 duration-100 text-white">
                      <div className="px-4 py-3 border-b border-white/10">
                        <p className="text-xs text-gray-400 font-medium">Signed in as</p>
                        <p className="text-sm font-semibold text-white truncate mt-0.5">
                          {session.user.name || session.user.email}
                        </p>
                      </div>

                      <button
                        onClick={handleSignOut}
                        className="w-full text-left px-4 py-2.5 text-xs font-medium text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 transition-colors flex items-center gap-2"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        Log out
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ) : null}
          </div>

        </div>
      </div>
    </header>
  );
}