export interface Site {
  id: string;
  name: string;
  address?: string | null;
  active?: boolean;
}

export interface WorkerUser {
  id: string;
  name: string;
  email: string;
}

export interface Photo {
  id: string;
  url: string;
}

export interface SubmissionItem {
  id: string;
  date: string;
  notes: string | null;
  reviewed: boolean;
  ppeHardHat: boolean;
  ppeVest: boolean;
  ppeBoots: boolean;
  ppeEyeProtection: boolean;
  fallProtectionInPlace: boolean;
  laddersInspected: boolean;
  toolsInGoodCondition: boolean;
  hazardsIdentified: boolean;
  workerId: string;
  siteId: string;
  createdAt: string;
  updatedAt: string;
  worker?: WorkerUser;
  site: Site;
  photos: Photo[];
}

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface SubmissionsResponse {
  submissions: SubmissionItem[];
  pagination: PaginationMeta;
}

export interface SiteBreakdownItem {
  siteId: string;
  siteName: string;
  siteAddress: string | null;
  totalSubmissions: number;
  todaySubmissions: number;
}

export interface SummaryMetrics {
  submissionsTodayCount: number;
  totalActiveWorkersCount: number;
  submittedWorkersCount: number;
  unsubmittedWorkers: WorkerUser[];
  siteBreakdown: SiteBreakdownItem[];
  totalSubmissionsCount: number;
  pendingReviewCount: number;
}

export interface FetchSubmissionsParams {
  page?: number;
  limit?: number;
  sortBy?: "date" | "site" | "reviewed";
  order?: "asc" | "desc";
  siteId?: string;
  workerId?: string;
  startDate?: string;
  endDate?: string;
}

export async function fetchSites(): Promise<Site[]> {
  const res = await fetch("/api/submissions?type=sites");
  if (!res.ok) throw new Error("Failed to fetch job sites.");
  return res.json();
}

export async function fetchWorkers(): Promise<WorkerUser[]> {
  const res = await fetch("/api/submissions?type=workers");
  if (!res.ok) throw new Error("Failed to fetch workers.");
  return res.json();
}

export async function fetchSummaryMetrics(): Promise<SummaryMetrics> {
  const res = await fetch("/api/submissions?type=summary");
  if (!res.ok) throw new Error("Failed to fetch summary metrics.");
  return res.json();
}

export async function fetchSubmissions(
  params: FetchSubmissionsParams = {}
): Promise<SubmissionsResponse> {
  const queryParams = new URLSearchParams();

  if (params.page) queryParams.set("page", params.page.toString());
  if (params.limit) queryParams.set("limit", params.limit.toString());
  if (params.sortBy) queryParams.set("sortBy", params.sortBy);
  if (params.order) queryParams.set("order", params.order);
  if (params.siteId) queryParams.set("siteId", params.siteId);
  if (params.workerId) queryParams.set("workerId", params.workerId);
  if (params.startDate) queryParams.set("startDate", params.startDate);
  if (params.endDate) queryParams.set("endDate", params.endDate);

  const queryString = queryParams.toString();
  const url = `/api/submissions${queryString ? `?${queryString}` : ""}`;

  const res = await fetch(url);
  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.error || "Failed to fetch submissions.");
  }
  return res.json();
}

export async function toggleSubmissionReview(
  id: string,
  reviewed?: boolean
): Promise<SubmissionItem> {
  const res = await fetch(`/api/submissions/${id}/review`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(reviewed !== undefined ? { reviewed } : {}),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || "Failed to update review status.");
  }
  return data;
}

export interface SubmissionPayload {
  siteId: string;
  date: string;
  notes: string;
  photos: string[];
  [key: string]: any;
}

export async function createSubmission(payload: SubmissionPayload, signal?: AbortSignal) {
  const res = await fetch("/api/submissions", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
    signal,
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || "Failed to save safety submission.");
  }
  return data;
}