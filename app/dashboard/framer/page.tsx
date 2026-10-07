"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "@/lib/auth-client";
import { SubmissionList } from "@/components/SubmissionList";
import { Loader2, Plus } from "lucide-react";

export default function FramerDashboardPage() {
  const { data: session, isPending } = useSession();
  const router = useRouter();

  if (isPending || !session?.user) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="flex flex-col items-center gap-3 text-center">
          <Loader2 className="w-8 h-8 animate-spin text-[#045339]" />
          <p className="text-sm text-gray-500 font-medium">Verifying framer session...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Welcome Banner */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-gray-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-4xl font-extrabold text-[#2a2829] tracking-tight">
            Hello, {session.user.name || session.user.email}
          </h1>
          <p className="text-xs sm:text-sm text-gray-600 mt-1">
            Submit daily safety checklists, document job site hazards, and review your past submission history.
          </p>
        </div>

        <Link
          href="/dashboard/framer/submissions"
          className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl bg-[#045339] hover:bg-[#033d2a] text-white shadow-md hover:shadow-lg transition-all active:scale-[0.98] font-bold text-sm shrink-0"
        >
          <Plus className="w-5 h-5 stroke-[2.5]" />
          <span>New Safety Submission</span>
        </Link>
      </div>

      {/* Framer Submissions List */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-extrabold text-[#2a2829] tracking-tight flex items-center gap-2">
            Your Safety Submissions History
          </h2>
        </div>

        <SubmissionList isAdmin={false} />
      </div>
    </div>
  );
}