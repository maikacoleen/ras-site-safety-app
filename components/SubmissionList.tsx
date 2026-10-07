"use client";

import { useState, useEffect, useCallback } from "react";
import {
  SubmissionItem,
  PaginationMeta,
  Site,
  WorkerUser,
  fetchSubmissions,
  fetchSites,
  fetchWorkers,
  toggleSubmissionReview,
} from "@/services/submissions";
import { SearchableCombobox } from "@/components/SearchableCombobox";
import { DatePicker } from "@/components/DatePicker";
import { SubmissionDetailModal } from "@/components/SubmissionDetailModal";
import {
  CheckCircle2,
  Clock,
  Filter,
  Loader2,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  FileText,
  RotateCcw,
} from "lucide-react";

interface SubmissionListProps {
  isAdmin?: boolean;
  initialWorkerId?: string;
  initialSiteId?: string;
  onRefreshSummary?: () => void;
  autoRefreshInterval?: number;
}

export function SubmissionList({
  isAdmin = false,
  initialWorkerId = "",
  initialSiteId = "",
  onRefreshSummary,
  autoRefreshInterval,
}: SubmissionListProps) {
  // Data state
  const [submissions, setSubmissions] = useState<SubmissionItem[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta>({
    total: 0,
    page: 1,
    limit: 20,
    totalPages: 1,
  });

  // Filter options lists
  const [sites, setSites] = useState<Site[]>([]);
  const [workers, setWorkers] = useState<WorkerUser[]>([]);

  // Filter state
  const [siteIdFilter, setSiteIdFilter] = useState<string>(initialSiteId);
  const [workerIdFilter, setWorkerIdFilter] = useState<string>(initialWorkerId);
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");

  // Sort state
  const [sortBy, setSortBy] = useState<"date" | "site" | "reviewed">("date");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  // Page state
  const [currentPage, setCurrentPage] = useState<number>(1);

  // Loading & Action states
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingReviewId, setUpdatingReviewId] = useState<string | null>(null);

  // Detail Modal state
  const [selectedSubmission, setSelectedSubmission] = useState<SubmissionItem | null>(null);

  // Current date ISO format (YYYY-MM-DD) for max date picker constraint
  const maxToday = new Date().toISOString().split("T")[0];

  // Sync external filter triggers
  useEffect(() => {
    if (initialSiteId !== undefined) {
      setSiteIdFilter(initialSiteId);
    }
  }, [initialSiteId]);

  useEffect(() => {
    if (initialWorkerId !== undefined) {
      setWorkerIdFilter(initialWorkerId);
    }
  }, [initialWorkerId]);

  // Load sites & workers dropdown options once
  useEffect(() => {
    fetchSites()
      .then((data) => setSites(data))
      .catch((err) => console.error("Error fetching sites filter options:", err));

    if (isAdmin) {
      fetchWorkers()
        .then((data) => setWorkers(data))
        .catch((err) => console.error("Error fetching workers filter options:", err));
    }
  }, [isAdmin]);

  // Main fetch submissions handler
  const loadSubmissions = useCallback(async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      setError(null);

      const response = await fetchSubmissions({
        page: currentPage,
        limit: 20,
        sortBy,
        order: sortOrder,
        siteId: siteIdFilter || undefined,
        workerId: isAdmin ? (workerIdFilter || undefined) : undefined,
        startDate: isAdmin ? (startDate || undefined) : undefined,
        endDate: isAdmin ? (endDate || undefined) : undefined,
      });

      setSubmissions(response.submissions);
      setPagination(response.pagination);
    } catch (err: any) {
      if (!silent) setError(err.message || "Failed to load submissions list.");
    } finally {
      if (!silent) setLoading(false);
    }
  }, [currentPage, sortBy, sortOrder, siteIdFilter, workerIdFilter, startDate, endDate, isAdmin]);

  useEffect(() => {
    loadSubmissions(false);
  }, [loadSubmissions]);

  // Setup periodic polling & window focus refetching for live cross-user updates
  useEffect(() => {
    const pollTime = autoRefreshInterval ?? (isAdmin ? 10000 : 0);
    if (!pollTime || pollTime <= 0) return;

    const intervalId = setInterval(() => {
      loadSubmissions(true);
    }, pollTime);

    const handleFocus = () => {
      if (document.visibilityState === "visible") {
        loadSubmissions(true);
      }
    };

    window.addEventListener("focus", handleFocus);
    document.addEventListener("visibilitychange", handleFocus);

    return () => {
      clearInterval(intervalId);
      window.removeEventListener("focus", handleFocus);
      document.removeEventListener("visibilitychange", handleFocus);
    };
  }, [isAdmin, autoRefreshInterval, loadSubmissions]);

  // Handle Review Status Toggle
  const handleToggleReview = async (id: string, currentStatus: boolean, e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (updatingReviewId) return;

    try {
      setUpdatingReviewId(id);
      // Optimistic update
      setSubmissions((prev) =>
        prev.map((sub) =>
          sub.id === id ? { ...sub, reviewed: !currentStatus } : sub
        )
      );

      const updated = await toggleSubmissionReview(id, !currentStatus);

      // Replace with actual server payload
      setSubmissions((prev) =>
        prev.map((sub) => (sub.id === id ? updated : sub))
      );

      // If viewing in detail modal, sync status
      if (selectedSubmission && selectedSubmission.id === id) {
        setSelectedSubmission(updated);
      }

      onRefreshSummary?.();
    } catch (err: any) {
      // Rollback optimistic update
      setSubmissions((prev) =>
        prev.map((sub) =>
          sub.id === id ? { ...sub, reviewed: currentStatus } : sub
        )
      );
      alert(`Error updating review status: ${err.message}`);
    } finally {
      setUpdatingReviewId(null);
    }
  };

  const handleResetFilters = () => {
    setSiteIdFilter("");
    setWorkerIdFilter("");
    setStartDate("");
    setEndDate("");
    setSortBy("date");
    setSortOrder("desc");
    setCurrentPage(1);
  };

  const hasActiveFilters =
    Boolean(siteIdFilter) ||
    Boolean(workerIdFilter) ||
    Boolean(startDate) ||
    Boolean(endDate);

  const siteOptions = sites.map((s) => ({
    id: s.id,
    label: s.name,
    sublabel: s.address || undefined,
  }));

  const workerOptions = workers.map((w) => ({
    id: w.id,
    label: w.name,
    sublabel: w.email,
  }));

  // Toggle date sort direction on table column header click
  const handleToggleDateSort = () => {
    if (sortBy === "date") {
      setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortBy("date");
      setSortOrder("desc");
    }
    setCurrentPage(1);
  };

  // Toggle review status sort direction on table column header click (Admin view)
  const handleToggleReviewSort = () => {
    if (sortBy === "reviewed") {
      setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortBy("reviewed");
      setSortOrder("asc");
    }
    setCurrentPage(1);
  };

  return (
    <div className="space-y-4">
      {/* Top Filter Bar */}
      <div className="bg-white rounded-2xl border border-gray-200/80 shadow-sm p-4 sm:p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 pb-3">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-[#045339]" />
            <h3 className="text-sm font-extrabold text-[#2a2829] tracking-tight">
              Filters
            </h3>
          </div>

          <div className="flex items-center gap-2">
            {hasActiveFilters && (
              <button
                type="button"
                onClick={handleResetFilters}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-gray-200 bg-gray-50 text-gray-700 hover:bg-gray-100 text-xs font-bold transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Clear Filters
              </button>
            )}
          </div>
        </div>

        {/* Filter Controls Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Site Filter Combobox */}
          <div>
            <label className="block text-[11px] font-bold text-gray-600 uppercase tracking-wider mb-1">
              Job Site
            </label>
            <SearchableCombobox
              options={siteOptions}
              value={siteIdFilter}
              onChange={(val) => {
                setSiteIdFilter(val);
                setCurrentPage(1);
              }}
              placeholder="All Job Sites..."
              searchPlaceholder="Type site name..."
              allLabel="All Job Sites"
            />
          </div>

          {/* Worker Filter Combobox (Admin only) */}
          {isAdmin && (
            <div>
              <label className="block text-[11px] font-bold text-gray-600 uppercase tracking-wider mb-1">
                Framer / Submitter
              </label>
              <SearchableCombobox
                options={workerOptions}
                value={workerIdFilter}
                onChange={(val) => {
                  setWorkerIdFilter(val);
                  setCurrentPage(1);
                }}
                placeholder="All Framers..."
                searchPlaceholder="Type worker name..."
                allLabel="All Framers"
              />
            </div>
          )}

          {/* Date Range: Start Date & End Date using reusable DatePicker Component (Admin only) */}
          {isAdmin && (
            <>
              <DatePicker
                label="From Date"
                value={startDate}
                max={endDate || maxToday}
                disableFuture
                onChange={(val) => {
                  setStartDate(val);
                  setCurrentPage(1);
                }}
              />

              <DatePicker
                label="To Date"
                value={endDate}
                min={startDate}
                disableFuture
                onChange={(val) => {
                  setEndDate(val);
                  setCurrentPage(1);
                }}
              />
            </>
          )}
        </div>
      </div>

      {/* Main Table Container */}
      <div className="bg-white rounded-2xl border border-gray-200/80 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-500 gap-3">
            <Loader2 className="w-7 h-7 animate-spin text-[#045339]" />
            <p className="text-xs font-medium">Fetching safety submissions...</p>
          </div>
        ) : error ? (
          <div className="p-8 text-center text-red-600 space-y-3">
            <p className="text-sm font-semibold">{error}</p>
            <button
              type="button"
              onClick={() => loadSubmissions()}
              className="px-4 py-2 rounded-xl bg-red-100 text-red-800 text-xs font-bold hover:bg-red-200 transition-colors"
            >
              Try Again
            </button>
          </div>
        ) : submissions.length === 0 ? (
          <div className="text-center py-16 px-4">
            <div className="w-12 h-12 rounded-2xl bg-gray-100 text-gray-400 flex items-center justify-center mx-auto mb-3">
              <FileText className="w-6 h-6" />
            </div>
            <h4 className="text-base font-bold text-[#2a2829]">No Safety Submissions Found</h4>
            <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
              No submission records match your active search filters or date range parameters.
            </p>
            {hasActiveFilters && (
              <button
                type="button"
                onClick={handleResetFilters}
                className="mt-4 px-4 py-2 rounded-xl bg-[#045339] text-white text-xs font-bold hover:bg-[#033d2a] transition-colors"
              >
                Clear All Filters
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/80 border-b border-gray-200/80 text-[11px] font-extrabold uppercase tracking-wider text-gray-500">
                  <th className="py-3.5 px-4 sm:px-6">Job Site</th>
                  {isAdmin && <th className="py-3.5 px-4">Submitter</th>}
                  <th className="py-3.5 px-4">
                    <button
                      type="button"
                      onClick={handleToggleDateSort}
                      className="inline-flex items-center gap-1.5 hover:text-[#045339] transition-colors font-extrabold uppercase"
                    >
                      <span>Date</span>
                      <ArrowUpDown
                        className={`w-3.5 h-3.5 ${
                          sortBy === "date"
                            ? sortOrder === "asc"
                              ? "rotate-180 text-[#045339] transition-transform"
                              : "text-[#045339]"
                            : "text-gray-400"
                        }`}
                      />
                    </button>
                  </th>
                  <th className="hidden sm:table-cell py-3.5 px-4">Notes</th>
                  <th className="hidden sm:table-cell py-3.5 px-4 text-center">Photos</th>
                  {isAdmin && (
                    <th className="py-3.5 px-4 text-center">
                      <button
                        type="button"
                        onClick={handleToggleReviewSort}
                        className="inline-flex items-center justify-center gap-1.5 hover:text-[#045339] transition-colors font-extrabold uppercase"
                      >
                        <span>Status</span>
                        <ArrowUpDown
                          className={`w-3.5 h-3.5 ${
                            sortBy === "reviewed"
                              ? sortOrder === "asc"
                                ? "rotate-180 text-[#045339] transition-transform"
                                : "text-[#045339]"
                              : "text-gray-400"
                          }`}
                        />
                      </button>
                    </th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-xs">
                {submissions.map((item) => (
                  <tr
                    key={item.id}
                    onClick={() => setSelectedSubmission(item)}
                    className="hover:bg-emerald-50/20 cursor-pointer transition-colors group"
                  >
                    {/* Site Name */}
                    <td className="py-4 px-4 sm:px-6 font-semibold text-gray-900">
                      <div className="flex items-start gap-2">
                        <div>
                          <span className="font-bold text-[#2a2829] group-hover:text-[#045339] transition-colors">
                            {item.site.name}
                          </span>
                          {item.site.address && (
                            <div className="text-[10px] text-gray-400 font-normal truncate max-w-[180px]">
                              {item.site.address}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Submitter (Admin only) */}
                    {isAdmin && (
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-emerald-100 text-[#045339] flex items-center justify-center font-bold text-xs shrink-0">
                            {item.worker?.name ? item.worker.name.charAt(0) : "W"}
                          </div>
                          <div className="truncate">
                            <span className="font-semibold text-gray-900 block truncate">
                              {item.worker?.name || "Unknown Worker"}
                            </span>
                            <span className="text-[10px] text-gray-400 block truncate">
                              {item.worker?.email}
                            </span>
                          </div>
                        </div>
                      </td>
                    )}

                    {/* Submission Date & Time */}
                    <td className="py-4 px-4 whitespace-nowrap text-gray-600 font-medium">
                      <div className="flex flex-col">
                        <span className="font-semibold text-gray-900">
                          {new Date(item.date).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </span>
                        <span className="text-[11px] text-gray-400 font-normal">
                          {new Date(item.createdAt || item.date).toLocaleTimeString("en-US", {
                            hour: "numeric",
                            minute: "2-digit",
                            hour12: true,
                          })}
                        </span>
                      </div>
                    </td>

                    {/* Truncated Notes (Hidden on mobile sm and below) */}
                    <td className="hidden sm:table-cell py-4 px-4 max-w-xs sm:max-w-md">
                      {item.notes ? (
                        <p className="text-gray-600 truncate font-normal" title={item.notes}>
                          {item.notes}
                        </p>
                      ) : (
                        <span className="text-gray-300 italic font-normal">No notes added</span>
                      )}
                    </td>

                    {/* Photos Count (Hidden on mobile sm and below) */}
                    <td className="hidden sm:table-cell py-4 px-4 text-center whitespace-nowrap">
                      {item.photos.length > 0 ? (
                        <span className="text-gray-600 text-[11px] font-normal">
                          {item.photos.length}
                        </span>
                      ) : (
                        <span className="text-gray-400 text-[11px] font-normal">0</span>
                      )}
                    </td>

                    {/* Review Status (Admin only) */}
                    {isAdmin && (
                      <td className="py-4 px-4 text-center whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold border ${
                            item.reviewed
                              ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                              : "bg-amber-50 border-amber-200 text-amber-800"
                          }`}
                        >
                          {item.reviewed ? (
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          ) : (
                            <Clock className="w-3.5 h-3.5 text-amber-600" />
                          )}
                          <span>{item.reviewed ? "Reviewed" : "Pending"}</span>
                        </span>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Footer */}
        {!loading && pagination.totalPages > 1 && (
          <div className="px-4 sm:px-6 py-4 bg-gray-50/80 border-t border-gray-200/80 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="text-xs text-gray-600 font-medium">
              Page <span className="font-bold text-gray-900">{pagination.page}</span> of{" "}
              <span className="font-bold text-gray-900">{pagination.totalPages}</span> ({pagination.total} total items)
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={pagination.page <= 1}
                onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                className="px-3.5 py-1.5 rounded-xl border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed font-semibold text-xs flex items-center gap-1 transition-all"
              >
                <ChevronLeft className="w-4 h-4" />
                Previous
              </button>

              {/* Numeric Page Buttons */}
              <div className="hidden sm:flex items-center gap-1">
                {Array.from({ length: pagination.totalPages }, (_, i) => i + 1)
                  .filter(
                    (p) =>
                      p === 1 ||
                      p === pagination.totalPages ||
                      Math.abs(p - pagination.page) <= 1
                  )
                  .map((p, idx, arr) => {
                    const prevP = arr[idx - 1];
                    const showEllipsis = prevP && p - prevP > 1;

                    return (
                      <div key={p} className="flex items-center gap-1">
                        {showEllipsis && <span className="text-gray-400 text-xs px-1">...</span>}
                        <button
                          type="button"
                          onClick={() => setCurrentPage(p)}
                          className={`w-8 h-8 rounded-xl text-xs font-bold transition-all ${
                            p === pagination.page
                              ? "bg-[#045339] text-white shadow-sm"
                              : "bg-white border border-gray-200 text-gray-700 hover:bg-gray-100"
                          }`}
                        >
                          {p}
                        </button>
                      </div>
                    );
                  })}
              </div>

              <button
                type="button"
                disabled={pagination.page >= pagination.totalPages}
                onClick={() =>
                  setCurrentPage((prev) => Math.min(pagination.totalPages, prev + 1))
                }
                className="px-3.5 py-1.5 rounded-xl border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed font-semibold text-xs flex items-center gap-1 transition-all"
              >
                Next
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Extracted Submission Detail Modal Component */}
      {selectedSubmission && (
        <SubmissionDetailModal
          submission={selectedSubmission}
          onClose={() => setSelectedSubmission(null)}
          isAdmin={isAdmin}
          onToggleReview={handleToggleReview}
          updatingReviewId={updatingReviewId}
        />
      )}
    </div>
  );
}