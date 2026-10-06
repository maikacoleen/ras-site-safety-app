"use client";

import { useState, useEffect, Suspense } from "react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn, getSession, useSession } from "@/lib/auth-client";
import {
  ShieldAlert,
  Lock,
  User,
  AlertCircle,
  Loader2,
  ArrowRight,
  Info,
} from "lucide-react";

function LoginFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, isPending: isSessionPending } = useSession();

  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [sessionExpiredNotice, setSessionExpiredNotice] = useState<string | null>(null);

  // Check URL query parameters ONLY for actual session expiration notices
  useEffect(() => {
    const isExpired = searchParams.get("expired") === "true";
    const reason = searchParams.get("reason");

    if (isExpired || reason === "session_expired") {
      setSessionExpiredNotice("Your session has expired. Please log in again.");
    } else if (reason === "unauthorized") {
      setSessionExpiredNotice("Please log in with an authorized account to access that page.");
    } else {
      setSessionExpiredNotice(null);
    }
  }, [searchParams]);

  // If user is already authenticated, redirect to appropriate dashboard
  useEffect(() => {
    if (!isSessionPending && session?.user) {
      const role = (session.user as any).role;
      if (role === "ADMIN") {
        router.replace("/dashboard/admin");
      } else {
        router.replace("/dashboard/framer");
      }
    }
  }, [session, isSessionPending, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!identifier.trim()) {
      setError("Please enter your name or email address.");
      return;
    }
    if (!password) {
      setError("Please enter your password.");
      return;
    }

    setIsLoading(true);

    try {
      // 1. Resolve identifier (name or email) to email via API endpoint
      const resolveRes = await fetch("/api/auth/resolve-identifier", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier: identifier.trim() }),
      });

      let targetEmail = identifier.trim();
      if (resolveRes.ok) {
        const resolveData = await resolveRes.json();
        if (resolveData.email) {
          targetEmail = resolveData.email;
        }
      }

      // 2. Perform sign in with BetterAuth
      const { data, error: signInError } = await signIn.email({
        email: targetEmail,
        password: password,
      });

      if (signInError) {
        setError(signInError.message || "Invalid credentials. Please check your email/name and password.");
        setIsLoading(false);
        return;
      }

      // 3. Fetch latest session to ensure we have role details
      const currentSession = await getSession();
      const userRole = (currentSession?.data?.user as any)?.role || (data as any)?.user?.role;

      if (userRole === "ADMIN") {
        router.push("/dashboard/admin");
      } else {
        router.push("/dashboard/framer");
      }
    } catch (err: any) {
      console.error("Login submission error:", err);
      setError("An unexpected error occurred. Please try again.");
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
        <div className="p-6 sm:p-8">
          <div className="flex justify-center mb-6 pt-1">
            <Image
              src="/logo/ras-logo.png"
              alt="Ron Anderson & Sons Logo"
              width={220}
              height={75}
              className="h-16 sm:h-20 w-auto object-contain"
              priority
            />
          </div>

          {/* Session Expired Alert Banner */}
          {sessionExpiredNotice && (
            <div className="mb-6 p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-sm flex items-start gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
              <ShieldAlert className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-semibold text-amber-900">Session Notice</p>
                <p className="text-xs text-amber-700 mt-0.5">{sessionExpiredNotice}</p>
              </div>
            </div>
          )}

          {/* Form Level Error Alert */}
          {error && (
            <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-800 text-sm flex items-start gap-3 animate-in fade-in duration-200">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-semibold text-red-900">Login Failed</p>
                <p className="text-xs text-red-700 mt-0.5">{error}</p>
              </div>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email or Name Input */}
            <div>
              <label
                htmlFor="identifier"
                className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2"
              >
                Name or Email Address
              </label>
              <div className="relative rounded-xl shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                  <User className="w-5 h-5" />
                </div>
                <input
                  id="identifier"
                  type="text"
                  required
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="e.g. John Doe or admin@ras.com"
                  className="block w-full pl-11 pr-4 py-3 text-sm text-[#2a2829] bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#045339] focus:border-transparent transition-all placeholder:text-gray-400"
                />
              </div>
            </div>

            {/* Password Input */}
            <div>
              <label
                htmlFor="password"
                className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2"
              >
                Password
              </label>
              <div className="relative rounded-xl shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                  <Lock className="w-5 h-5" />
                </div>
                <input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="block w-full pl-11 pr-4 py-3 text-sm text-[#2a2829] bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#045339] focus:border-transparent transition-all placeholder:text-gray-400"
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 px-4 bg-[#045339] hover:bg-[#033d2a] active:bg-[#022a1d] text-white font-semibold text-sm rounded-xl shadow-md transition-all duration-150 flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-[#045339] focus:ring-offset-2 disabled:opacity-75 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Authenticating...</span>
                </>
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8 my-auto">
      <Suspense
        fallback={
          <div className="w-full max-w-md mx-auto p-8 bg-white rounded-2xl shadow-xl text-center">
            <Loader2 className="w-8 h-8 animate-spin text-[#045339] mx-auto mb-3" />
            <p className="text-sm text-gray-500 font-medium">Loading login portal...</p>
          </div>
        }
      >
        <LoginFormContent />
      </Suspense>
    </div>
  );
}
