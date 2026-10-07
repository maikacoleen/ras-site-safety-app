"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/lib/auth-client";
import { SubmissionSummaryCards } from "@/components/SubmissionSummaryCards";
import { SubmissionList } from "@/components/SubmissionList";
import { fetchSummaryMetrics, SummaryMetrics } from "@/services/submissions";
import { Loader2 } from "lucide-react";

export default function AdminDashboardPage() {
  const { data: session, isPending } = useSession();
  const router = useRouter();

  const [metrics, setMetrics] = useState<SummaryMetrics | null>(null);
  const [loadingMetrics, setLoadingMetrics] = useState<boolean>(true);
  const [activeWorkerFilter, setActiveWorkerFilter] = useState<string>("");
  const [activeSiteFilter, setActiveSiteFilter] = useState<string>("");

  const loadSummary = useCallback(async (silent = false) => {
    try {
      if (!silent) setLoadingMetrics(true);
      const data = await fetchSummaryMetrics();
      setMetrics(data);
    } catch (err) {
      console.error("Error fetching admin summary metrics:", err);
    } finally {
      if (!silent) setLoadingMetrics(false);
    }
  }, []);

  useEffect(() => {
    if (!isPending) {
      if (!session?.user) {
        router.replace("/auth/login");
      } else {
        const role = (session.user as any).role;
        if (role !== "ADMIN") {
          router.replace("/auth/unauthorized");
        } else {
          loadSummary(false);

          // Setup periodic 10-second polling for active admin sessions
          const intervalId = setInterval(() => {
            loadSummary(true);
          }, 10000);

          // Refetch metrics immediately when tab becomes visible or receives focus
          const handleFocus = () => {
            if (document.visibilityState === "visible") {
              loadSummary(true);
            }
          };

          window.addEventListener("focus", handleFocus);
          document.addEventListener("visibilitychange", handleFocus);

          return () => {
            clearInterval(intervalId);
            window.removeEventListener("focus", handleFocus);
            document.removeEventListener("visibilitychange", handleFocus);
          };
        }
      }
    }
  }, [session, isPending, router, loadSummary]);

  const handleFilterByWorker = (workerId: string) => {
    setActiveWorkerFilter(workerId);
  };

  const handleFilterBySite = (siteId: string) => {
    setActiveSiteFilter(siteId);
  };

  if (isPending || !session?.user || (session.user as any).role !== "ADMIN") {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="flex flex-col items-center gap-3 text-center">
          <Loader2 className="w-8 h-8 animate-spin text-[#045339]" />
          <p className="text-sm text-gray-500 font-medium">Verifying admin permissions...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Header Banner */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-gray-200/80">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#2a2829] tracking-tight">
              Admin Safety Management Console
            </h1>
            <p className="text-sm text-gray-600 mt-1">
              Welcome back, <span className="font-semibold text-gray-900">{session.user.name || session.user.email}</span>. Monitor site safety submissions, review daily reports, and audit compliance across job sites.
            </p>
          </div>
        </div>
      </div>

      {/* Summary Section: SubmissionSummaryCards */}
      <SubmissionSummaryCards
        metrics={metrics}
        loading={loadingMetrics}
        onFilterByWorker={handleFilterByWorker}
        onFilterBySite={handleFilterBySite}
      />

      {/* Admin Dashboard Submissions List with Searchable Comboboxes */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-extrabold text-[#2a2829] tracking-tight">
            All Site Safety Submissions
          </h2>
        </div>

        <SubmissionList
          isAdmin={true}
          initialWorkerId={activeWorkerFilter}
          initialSiteId={activeSiteFilter}
          onRefreshSummary={loadSummary}
        />
      </div>
    </div>
  );
}
