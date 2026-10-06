"use client";

import Link from "next/link";
import { ShieldAlert, ArrowLeft, LogOut } from "lucide-react";
import { signOut, useSession } from "@/lib/auth-client";
import { useRouter } from "next/navigation";

export default function UnauthorizedPage() {
  const { data: session } = useSession();
  const router = useRouter();

  const handleSignOut = async () => {
    await signOut({
      fetchOptions: {
        onSuccess: () => {
          router.push("/auth/login");
        },
      },
    });
  };

  const userRole = (session?.user as any)?.role || "FRAMER";
  const dashboardHref = userRole === "ADMIN" ? "/dashboard/admin" : "/dashboard/framer";

  return (
    <div className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8 my-auto">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden text-center p-8">
        <div className="w-16 h-16 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto mb-4">
          <ShieldAlert className="w-8 h-8" />
        </div>

        <h1 className="text-2xl font-bold text-[#2a2829] tracking-tight">
          Access Denied
        </h1>
        
        <p className="text-sm text-gray-600 mt-2">
          You do not have administrative permissions required to access the requested page.
        </p>

        {session?.user && (
          <div className="my-6 p-3 rounded-xl bg-gray-50 border border-gray-200 text-xs text-gray-600">
            Logged in as <span className="font-semibold text-gray-900">{session.user.email}</span> ({userRole})
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-3 mt-6">
          <Link
            href={dashboardHref}
            className="flex-1 py-3 px-4 bg-[#045339] hover:bg-[#033d2a] text-white font-semibold text-sm rounded-xl transition-colors flex items-center justify-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Go to My Dashboard</span>
          </Link>

          <button
            onClick={handleSignOut}
            className="py-3 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold text-sm rounded-xl transition-colors flex items-center justify-center gap-2"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>
    </div>
  );
}
