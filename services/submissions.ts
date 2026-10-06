export async function fetchSites() {
  const res = await fetch("/api/submissions?type=sites");
  if (!res.ok) throw new Error("Failed to fetch job sites.");
  return res.json();
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