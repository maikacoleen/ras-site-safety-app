"use client";

import { SummaryMetrics } from "@/services/submissions";
import { SiteBreakdownList } from "@/components/SiteBreakdownList";
import {
  ClipboardCheck,
  AlertTriangle,
  CheckCircle2,
  Clock,
} from "lucide-react";

interface SubmissionSummaryCardsProps {
  metrics: SummaryMetrics | null;
  loading?: boolean;
  onFilterByWorker?: (workerId: string) => void;
  onFilterBySite?: (siteId: string) => void;
}

export function SubmissionSummaryCards({
  metrics,
  loading = false,
  onFilterByWorker,
  onFilterBySite,
}: SubmissionSummaryCardsProps) {
  if (loading || !metrics) {
    return (
      <div className="flex overflow-x-auto gap-4 pb-2 md:pb-0 md:grid md:grid-cols-3 md:gap-5 mb-8 animate-pulse scrollbar-thin">
        {[1, 2, 3].map((n) => (
          <div
            key={n}
            className="flex-none w-[85vw] sm:w-[320px] md:w-auto h-44 bg-gray-100 border border-gray-200/70 rounded-2xl p-6 flex flex-col justify-between"
          >
            <div className="h-4 bg-gray-200 rounded w-1/3"></div>
            <div className="h-8 bg-gray-200 rounded w-1/2"></div>
            <div className="h-3 bg-gray-200 rounded w-2/3"></div>
          </div>
        ))}
      </div>
    );
  }

  const {
    submissionsTodayCount,
    totalActiveWorkersCount,
    submittedWorkersCount,
    unsubmittedWorkers,
    siteBreakdown,
    totalSubmissionsCount,
    pendingReviewCount,
  } = metrics;

  return (
    <div className="space-y-5 mb-8">
      {/* 
        Summary Cards Layout:
        - Mobile (<768px): Horizontal scrollable row (flex overflow-x-auto gap-4)
        - Desktop (≥768px): 3-column grid layout (md:grid md:grid-cols-3 md:gap-5)
      */}
      <div className="flex overflow-x-auto gap-4 pb-2 md:pb-0 md:grid md:grid-cols-3 md:gap-5 scrollbar-thin scroll-smooth">
        {/* Submissions Today Card */}
        <div className="flex-none w-[85vw] sm:w-[320px] md:w-auto bg-gradient-to-br from-white via-white to-emerald-50/30 p-6 rounded-2xl border border-gray-200/80 shadow-sm relative overflow-hidden group hover:border-emerald-300 transition-all flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-2xl bg-[#045339] text-white flex items-center justify-center shadow-md shadow-emerald-900/10 group-hover:scale-105 transition-transform">
                <ClipboardCheck className="w-6 h-6 stroke-[2.2]" />
              </div>
            </div>

            <div className="space-y-1">
              <div className="text-3xl font-extrabold text-[#2a2829] tracking-tight flex items-baseline gap-2">
                {submittedWorkersCount}{" "}
                <span className="text-base font-semibold text-gray-400">
                  / {totalActiveWorkersCount} Workers
                </span>
              </div>
              <div className="text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Submissions Recorded Today
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-gray-100">
            <div className="flex justify-between items-center text-[11px] text-gray-500 font-medium">
              <span>{submissionsTodayCount} total today</span>
              <span>{totalActiveWorkersCount - submittedWorkersCount} pending</span>
            </div>
          </div>
        </div>

        {/* Pending Reviews & Total Volume Card */}
        <div className="flex-none w-[85vw] sm:w-[320px] md:w-auto bg-gradient-to-br from-white via-white to-amber-50/20 p-6 rounded-2xl border border-gray-200/80 shadow-sm relative overflow-hidden group hover:border-amber-300 transition-all flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-2xl bg-amber-500 text-white flex items-center justify-center shadow-md shadow-amber-900/10 group-hover:scale-105 transition-transform">
                <Clock className="w-6 h-6 stroke-[2.2]" />
              </div>
              {pendingReviewCount > 0 ? (
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-amber-100 text-amber-800 border border-amber-200 text-xs font-bold animate-pulse">
                  Needs Review
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-bold">
                  All Up to Date
                </span>
              )}
            </div>

            <div className="space-y-1">
              <div className="text-3xl font-extrabold text-[#2a2829] tracking-tight">
                {pendingReviewCount}{" "}
                <span className="text-sm font-medium text-amber-700">
                  Pending Approval
                </span>
              </div>
              <div className="text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Submissions Awaiting Admin Review
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-gray-100 flex justify-between items-center text-xs text-gray-500 font-medium">
            <span className="flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              {totalSubmissionsCount - pendingReviewCount} Reviewed
            </span>
            <span className="font-bold text-gray-900">
              {totalSubmissionsCount} Total Records
            </span>
          </div>
        </div>

        {/* Unsubmitted Alert Card */}
        <div className="flex-none w-[85vw] sm:w-[320px] md:w-auto bg-gradient-to-br from-white via-white to-red-50/20 p-6 rounded-2xl border border-gray-200/80 shadow-sm relative overflow-hidden group hover:border-red-300 transition-all flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="w-12 h-12 rounded-2xl bg-red-600 text-white flex items-center justify-center shadow-md shadow-red-900/10 group-hover:scale-105 transition-transform">
                <AlertTriangle className="w-6 h-6 stroke-[2.2]" />
              </div>
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-red-100 text-red-800 border border-red-200 text-xs font-bold">
                {unsubmittedWorkers.length} Outstanding
              </span>
            </div>

            <h3 className="text-xs font-extrabold text-gray-700 uppercase tracking-wider mb-2">
              Unsubmitted Today Alert
            </h3>

            {unsubmittedWorkers.length === 0 ? (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-bold text-emerald-800 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Great job! All active framers have submitted safety reports today.</span>
              </div>
            ) : (
              <div className="space-y-1.5 max-h-24 overflow-y-auto pr-1 scrollbar-thin">
                {unsubmittedWorkers.map((worker) => (
                  <button
                    key={worker.id}
                    type="button"
                    onClick={() => onFilterByWorker?.(worker.id)}
                    className="w-full flex items-center justify-between p-2 rounded-xl bg-red-50/60 hover:bg-red-100/70 border border-red-100 text-xs text-left transition-colors group/w"
                  >
                    <div className="flex items-center gap-2 truncate">
                      <div className="w-6 h-6 rounded-full bg-red-200 text-red-800 flex items-center justify-center text-[10px] font-bold">
                        {worker.name ? worker.name.charAt(0) : "W"}
                      </div>
                      <div className="truncate">
                        <span className="font-bold text-gray-900 block truncate">
                          {worker.name}
                        </span>
                        <span className="text-[10px] text-gray-500 block truncate">
                          {worker.email}
                        </span>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Extracted Site Breakdown List Component */}
      <SiteBreakdownList
        siteBreakdown={siteBreakdown}
        onFilterBySite={onFilterBySite}
      />
    </div>
  );
}
