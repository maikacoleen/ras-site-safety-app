"use client";

import { useState } from "react";
import { SiteBreakdownItem } from "@/services/submissions";
import { Building2, ChevronLeft, ChevronRight } from "lucide-react";

interface SiteBreakdownListProps {
  siteBreakdown: SiteBreakdownItem[];
  onFilterBySite?: (siteId: string) => void;
}

export function SiteBreakdownList({
  siteBreakdown,
  onFilterBySite,
}: SiteBreakdownListProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const totalPages = Math.ceil(siteBreakdown.length / itemsPerPage) || 1;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedSites = siteBreakdown.slice(startIndex, startIndex + itemsPerPage);

  return (
    <div className="bg-white rounded-2xl border border-gray-200/80 shadow-sm overflow-hidden">
      {/* List Header */}
      <div className="p-4 sm:p-5 flex items-center justify-between border-b border-gray-100">
        <div className="flex items-center gap-2">
          <Building2 className="w-5 h-5 text-[#045339]" />
          <h3 className="text-sm font-extrabold text-[#2a2829] tracking-tight">
            Site Safety Activity Breakdown
          </h3>
        </div>
        <span className="text-xs text-gray-500 font-medium">
          {siteBreakdown.length} Active Job Sites Monitored
        </span>
      </div>

      {/* Table List View */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50/80 border-b border-gray-200/80 text-[11px] font-extrabold uppercase tracking-wider text-gray-500">
              <th className="py-3.5 px-4 sm:px-6">Job Site</th>
              <th className="py-3.5 px-4 sm:px-6 text-right">Submissions Today</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 text-xs">
            {paginatedSites.length === 0 ? (
              <tr>
                <td colSpan={2} className="py-8 text-center text-gray-400 font-medium">
                  No job site activity recorded.
                </td>
              </tr>
            ) : (
              paginatedSites.map((site) => (
                <tr
                  key={site.siteId}
                  onClick={() => onFilterBySite?.(site.siteId)}
                  className={`hover:bg-emerald-50/20 transition-colors group ${
                    onFilterBySite ? "cursor-pointer" : ""
                  }`}
                >
                  {/* Job Site Column */}
                  <td className="py-3.5 px-4 sm:px-6 font-semibold text-gray-900">
                    <div>
                      <span className="font-bold text-[#2a2829] group-hover:text-[#045339] transition-colors">
                        {site.siteName}
                      </span>
                      {site.siteAddress && (
                        <div className="text-[10px] text-gray-400 font-normal truncate">
                          {site.siteAddress}
                        </div>
                      )}
                    </div>
                  </td>

                  {/* Submissions Today Column */}
                  <td className="py-3.5 px-4 sm:px-6 text-right whitespace-nowrap">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-[#045339] font-extrabold text-xs border border-emerald-200/60">
                      {site.todaySubmissions} Submissions
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      {totalPages > 1 && (
        <div className="px-4 sm:px-6 py-3.5 bg-gray-50/80 border-t border-gray-200/80 flex items-center justify-between">
          <div className="text-xs text-gray-600 font-medium">
            Page <span className="font-bold text-gray-900">{currentPage}</span> of{" "}
            <span className="font-bold text-gray-900">{totalPages}</span> ({siteBreakdown.length} total sites)
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
              className="px-3 py-1.5 rounded-xl border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed font-semibold text-xs flex items-center gap-1 transition-all"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              Previous
            </button>

            {/* Numeric Page Buttons */}
            <div className="hidden sm:flex items-center gap-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setCurrentPage(p)}
                  className={`w-7 h-7 rounded-lg text-xs font-bold transition-all ${
                    p === currentPage
                      ? "bg-[#045339] text-white shadow-sm"
                      : "bg-white border border-gray-200 text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>

            <button
              type="button"
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
              className="px-3 py-1.5 rounded-xl border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed font-semibold text-xs flex items-center gap-1 transition-all"
            >
              Next
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
