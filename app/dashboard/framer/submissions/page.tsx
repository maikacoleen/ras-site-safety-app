"use client";

import { useEffect, useState, ChangeEvent, FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useSession } from "@/lib/auth-client";
import { uploadPhotoToBlob } from "@/lib/blob";
import { fetchSites, createSubmission } from "@/services/submissions";
import {
  ArrowLeft,
  Calendar,
  Loader2,
  Upload,
  X,
  AlertCircle,
  CheckCircle2,
  Trash2,
} from "lucide-react";

interface Site {
  id: string;
  name: string;
  address: string | null;
  active: boolean;
}

interface SelectedPhoto {
  id: string;
  file: File;
  previewUrl: string;
}

interface ToastMessage {
  id: string;
  type: "error" | "success" | "warning";
  title: string;
  description: string;
}

const CHECKLIST_ITEMS = [
  { id: "ppeHardHat", label: "Hard Hat Worn & Intact", category: "PPE" },
  { id: "ppeVest", label: "High-Visibility Vest / Jacket", category: "PPE" },
  { id: "ppeBoots", label: "Steel-Toe Work Boots", category: "PPE" },
  { id: "ppeEyeProtection", label: "Safety Glasses / Eye Protection", category: "PPE" },
  { id: "fallProtectionInPlace", label: "Fall Protection & Guardrails Secure", category: "Site Safety" },
  { id: "laddersInspected", label: "Ladders & Scaffolding Inspected", category: "Equipment" },
  { id: "toolsInGoodCondition", label: "Hand & Power Tools in Good Condition", category: "Equipment" },
  { id: "hazardsIdentified", label: "Site Hazards Assessed & Mitigated", category: "Site Safety" },
] as const;

type ChecklistKey = typeof CHECKLIST_ITEMS[number]["id"];

let heic2anyPromise: Promise<any> | null = null;

export default function SubmissionFormPage() {
  const { data: session, isPending } = useSession();
  const router = useRouter();


  const [sites, setSites] = useState<Site[]>([]);
  const [loadingSites, setLoadingSites] = useState<boolean>(true);
  const [selectedSiteId, setSelectedSiteId] = useState<string>("");
  const [submissionDate, setSubmissionDate] = useState<string>("");
  const [checklist, setChecklist] = useState<Record<ChecklistKey, boolean>>({
    ppeHardHat: false,
    ppeVest: false,
    ppeBoots: false,
    ppeEyeProtection: false,
    fallProtectionInPlace: false,
    laddersInspected: false,
    toolsInGoodCondition: false,
    hazardsIdentified: false,
  });
  const [notes, setNotes] = useState<string>("");
  const [photos, setPhotos] = useState<SelectedPhoto[]>([]);

  
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [uploadProgressText, setUploadProgressText] = useState<string>("");
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Preload heic2any as soon as the component mounts in the browser
  useEffect(() => {
    if (typeof window !== "undefined") {
      heic2anyPromise = import("heic2any").then((m) => m.default);
    }
  }, []);

  // Verify authentication & fetch sites
  useEffect(() => {
    if (!isPending) {
      if (!session?.user) {
        router.replace("/auth/login");
      } else {
        fetchSites();
        setTodayDate();
      }
    }
  }, [session, isPending, router]);

  const showToast = (type: "error" | "success" | "warning", title: string, description: string) => {
    const id = Math.random().toString(36).substring(2, 9);
    const newToast: ToastMessage = { id, type, title, description };
    setToasts((prev) => [...prev, newToast]);

    // Auto dismiss toast after 5 seconds
    setTimeout(() => {
      removeToast(id);
    }, 5000);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const fetchSites = async () => {
    try {
      setLoadingSites(true);
      const res = await fetch("/api/submissions?type=sites");
      if (!res.ok) {
        throw new Error("Failed to fetch job sites");
      }
      const data: Site[] = await res.json();
      setSites(data);
    } catch (err: any) {
      showToast("error", "Error loading sites", err.message || "Failed to load job sites.");
    } finally {
      setLoadingSites(false);
    }
  };

  const getTodayLocalDateString = (d: Date = new Date()) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const setTodayDate = () => {
    setSubmissionDate(getTodayLocalDateString());
  };

  const handleChecklistToggle = (key: ChecklistKey) => {
    setChecklist((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handlePhotoSelect = async (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const newPhotos: SelectedPhoto[] = [];
    let rejectedCount = 0;

    for (let file of Array.from(files)) {
      const allowedTypes = [
        "image/jpeg",
        "image/png",
        "image/jpg",
        "image/heic",
        "image/heif",
      ];

      const isHeicExtension = file.name.toLowerCase().endsWith(".heic") || file.name.toLowerCase().endsWith(".heif");
      const isHeicType = file.type === "image/heic" || file.type === "image/heif";

      if (!allowedTypes.includes(file.type.toLowerCase()) && !isHeicExtension) {
        rejectedCount++;
        continue;
      }

      // Convert HEIC/HEIF files to JPEG for browser preview & upload compatibility
      if (isHeicType || isHeicExtension) {
        try {
          const heic2any = await (heic2anyPromise || import("heic2any").then((m) => m.default));
          
          // Pass the raw underlying Blob slice to prevent metadata header conflicts in libheif
          const rawBlob = file.slice(0, file.size, "image/heic");

          const convertedBlob = await heic2any({
            blob: rawBlob,
            toType: "image/jpeg",
            quality: 0.8,
          });

          const singleBlob = Array.isArray(convertedBlob) ? convertedBlob[0] : convertedBlob;

          file = new File(
            [singleBlob],
            file.name.replace(/\.(heic|heif)$/i, ".jpg"),
            { type: "image/jpeg" }
          );
        } catch (error) {
          console.error("Error converting HEIC image:", error);
          rejectedCount++;
          continue;
        }
      }

      const previewUrl = URL.createObjectURL(file);
      newPhotos.push({
        id: crypto.randomUUID(),
        file,
        previewUrl,
      });
    }

    if (rejectedCount > 0) {
      showToast(
        "error",
        "Invalid or Unprocessable File",
        `Only standard image files (PNG, JPEG, WEBP, HEIC) are supported. ${rejectedCount} file(s) were excluded.`
      );
    }

    if (newPhotos.length > 0) {
      setPhotos((prev) => [...prev, ...newPhotos]);
    }

    // Reset input value so re-selecting the same file triggers onChange
    e.target.value = "";
  };

  const handleRemovePhoto = (id: string) => {
    setPhotos((prev) => {
      const filtered = prev.filter((p) => p.id !== id);
      const target = prev.find((p) => p.id === id);
      if (target?.previewUrl) {
        URL.revokeObjectURL(target.previewUrl);
      }
      return filtered;
    });
  };

  const validateForm = (): boolean => {
    if (!selectedSiteId) {
      showToast("error", "Missing required field", "Please select a job site from the dropdown.");
      return false;
    }
    if (!submissionDate) {
      showToast("error", "Missing required field", "Please select a date for this safety submission.");
      return false;
    }
    const todayStr = getTodayLocalDateString();
    if (submissionDate > todayStr) {
      showToast(
        "error",
        "Invalid Date",
        "Submission date cannot be in the future. Please select today's date or a past date."
      );
      return false;
    }

    // Checklist validation (at least 1 item checked)
    const hasCheckedItem = Object.values(checklist).some((val) => val === true);
    if (!hasCheckedItem) {
      showToast("error", "Missing required field", "Checklist requires at least one safety item to be checked.");
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 25000);

    try {
      setSubmitting(true);
      setUploadProgressText("Preparing submission...");

      // Upload photos to Vercel Blob
      const photoUrls: string[] = [];

      if (photos.length > 0) {
        for (let i = 0; i < photos.length; i++) {
          setUploadProgressText(`Uploading photo ${i + 1} of ${photos.length}...`);
          const uploadResult = await uploadPhotoToBlob(photos[i].file, { timeoutMs: 15000 });
          photoUrls.push(uploadResult.url);
        }
      }

      setUploadProgressText("Saving safety submission...");

      // Submit to backend API
      const res = await createSubmission(
        {
          siteId: selectedSiteId,
          date: submissionDate,
          notes: notes.trim(),
          ...checklist,
          photos: photoUrls,
        },
        controller.signal
      );

      clearTimeout(timeoutId);

      showToast("success", "Submission Successful!", "Your site safety form has been submitted successfully.");

      photos.forEach((p) => URL.revokeObjectURL(p.previewUrl));

      // Redirect back to dashboard after brief pause
      setTimeout(() => {
        router.push("/dashboard/framer");
      }, 1500);
    } catch (err: any) {
      clearTimeout(timeoutId);
      console.error("Submission error:", err);
      if (err.name === "AbortError") {
        showToast(
          "error",
          "Submission Timed Out",
          "There was a problem submitting your form due to a connection timeout. Please try again."
        );
      } else {
        showToast(
          "error",
          "Submission Failed",
          err.message || "There was a problem submitting your safety form. Please try again."
        );
      }
    } finally {
      setSubmitting(false);
      setUploadProgressText("");
    }
  };

  if (isPending || !session?.user) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="flex flex-col items-center gap-3 text-center">
          <Loader2 className="w-8 h-8 animate-spin text-[#045339]" />
          <p className="text-sm text-gray-500 font-medium">Verifying session...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 max-w-4xl w-full mx-auto p-4 sm:p-6 lg:p-8">
      {/* Toast Notification Container */}
      <div className="fixed top-20 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-start gap-3 p-4 rounded-xl shadow-lg border backdrop-blur-md transition-all duration-300 animate-in slide-in-from-top-2 ${
              toast.type === "error"
                ? "bg-red-900/90 border-red-700 text-white"
                : toast.type === "success"
                ? "bg-[#045339]/95 border-emerald-600 text-white"
                : "bg-amber-900/90 border-amber-700 text-white"
            }`}
          >
            {toast.type === "error" ? (
              <AlertCircle className="w-5 h-5 text-red-300 shrink-0 mt-0.5" />
            ) : toast.type === "success" ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-300 shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-5 h-5 text-amber-300 shrink-0 mt-0.5" />
            )}
            <div className="flex-1 min-w-0">
              <h4 className="text-xs font-bold uppercase tracking-wider">{toast.title}</h4>
              <p className="text-xs mt-0.5 leading-snug opacity-90">{toast.description}</p>
            </div>
            <button
              onClick={() => removeToast(toast.id)}
              className="text-white/70 hover:text-white transition-colors p-0.5 rounded-md"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>

      {/* Navigation Header */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Link
            href="/dashboard/framer"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#045339] hover:underline mb-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Link>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#2a2829] tracking-tight flex items-center gap-2">
            Site Safety Submission
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            Complete the daily safety checklist, record site hazards, and attach required photos.
          </p>
        </div>
      </div>

      {/* Main Form Card */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Site & Date */}
        <div className="bg-white rounded-2xl border border-gray-200/80 shadow-sm p-5 sm:p-6 space-y-5">
          <h2 className="text-base font-bold text-[#2a2829] flex items-center gap-2 border-b border-gray-100 pb-3">
            Site & Submission Info
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {/* Site Picker */}
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                Job Site <span className="text-red-500">*</span>
              </label>
              {loadingSites ? (
                <div className="flex items-center gap-2 h-11 px-3 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-500">
                  <Loader2 className="w-4 h-4 animate-spin text-[#045339]" />
                  Loading sites...
                </div>
              ) : (
                <select
                  value={selectedSiteId}
                  onChange={(e) => setSelectedSiteId(e.target.value)}
                  className="w-full h-11 px-3.5 rounded-xl border border-gray-300 bg-white text-sm font-medium text-[#2a2829] focus:outline-none focus:ring-2 focus:ring-[#045339] focus:border-transparent transition-all"
                >
                  <option value="">-- Select a Job Site --</option>
                  {sites.map((site) => (
                    <option key={site.id} value={site.id}>
                      {site.name} {site.address ? `(${site.address})` : ""}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Date Picker */}
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                Date <span className="text-red-500">*</span>
              </label>
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <input
                    type="date"
                    max={getTodayLocalDateString()}
                    value={submissionDate}
                    onChange={(e) => setSubmissionDate(e.target.value)}
                    className="w-full h-11 px-3.5 rounded-xl border border-gray-300 bg-white text-sm font-medium text-[#2a2829] focus:outline-none focus:ring-2 focus:ring-[#045339] focus:border-transparent transition-all"
                  />
                </div>
                <button
                  type="button"
                  onClick={setTodayDate}
                  className="h-11 px-4 rounded-xl bg-emerald-50 text-[#045339] hover:bg-emerald-100 border border-emerald-200 text-xs font-bold flex items-center gap-1.5 transition-colors shrink-0 active:scale-95"
                >
                  <Calendar className="w-3.5 h-3.5" />
                  Today
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Safety Checklist */}
        <div className="bg-white rounded-2xl border border-gray-200/80 shadow-sm p-5 sm:p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-gray-100 pb-3">
            <h2 className="text-base font-bold text-[#2a2829] flex items-center gap-2">
              Safety Checklist <span className="text-xs font-normal text-red-500">(Check at least 1) *</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            {CHECKLIST_ITEMS.map((item) => {
              const isChecked = checklist[item.id];
              return (
                <label
                  key={item.id}
                  className={`flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer select-none transition-all ${
                    isChecked
                      ? "bg-emerald-50/60 border-emerald-500/80 shadow-sm"
                      : "bg-gray-50/50 border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <div className="pt-0.5">
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => handleChecklistToggle(item.id)}
                      className="w-4 h-4 rounded text-[#045339] focus:ring-[#045339] border-gray-300 cursor-pointer"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-xs font-semibold text-[#2a2829] block">
                      {item.label}
                    </span>
                    <span className="text-[10px] font-bold tracking-wide uppercase text-gray-400">
                      {item.category}
                    </span>
                  </div>
                </label>
              );
            })}
          </div>
        </div>

        {/* Site Notes */}
        <div className="bg-white rounded-2xl border border-gray-200/80 shadow-sm p-5 sm:p-6 space-y-4">
          <h2 className="text-base font-bold text-[#2a2829] flex items-center gap-2 border-b border-gray-100 pb-3">
            Site Notes & Observations
          </h2>
          <div>
            <textarea
              rows={4}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Detail any site hazards, missing equipment, weather impact, structural issues, or general safety observations..."
              className="w-full p-3.5 rounded-xl border border-gray-300 bg-white text-sm text-[#2a2829] focus:outline-none focus:ring-2 focus:ring-[#045339] focus:border-transparent transition-all placeholder:text-gray-400"
            />
          </div>
        </div>

        {/* Photo Attachments */}
        <div className="bg-white rounded-2xl border border-gray-200/80 shadow-sm p-5 sm:p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-gray-100 pb-3">
            <div>
              <h2 className="text-base font-bold text-[#2a2829] flex items-center gap-2">
                Site Photos
              </h2>
              <p className="text-xs text-gray-500 mt-0.5">
                Upload photos of site conditions, PPE compliance, or identified hazards.
              </p>
            </div>
          </div>

          {/* Upload Dropzone */}
          <div className="relative border-2 border-dashed border-gray-300 hover:border-[#045339] bg-gray-50/50 hover:bg-emerald-50/20 rounded-2xl p-6 text-center transition-all cursor-pointer group">
            <input
              type="file"
              multiple
              accept="image/png,image/jpeg,image/jpg,image/webp,.heic,.heif,image/HEIC,image/heif"
              onChange={handlePhotoSelect}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
            />
            <div className="flex flex-col items-center gap-2">
              <div className="w-12 h-12 rounded-full bg-white shadow-sm border border-gray-200 flex items-center justify-center text-[#045339] group-hover:scale-110 transition-transform">
                <Upload className="w-6 h-6" />
              </div>
              <p className="text-sm font-semibold text-[#2a2829]">
                Click or drag & drop photos here
              </p>
              <p className="text-xs text-gray-400">
                Supports PNG, JPEG, HEIC, HEIF images (Videos not allowed)
              </p>
            </div>
          </div>

          {/* Photo Previews */}
          {photos.length > 0 && (
            <div className="space-y-3 pt-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500">
                Selected Photos ({photos.length})
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {photos.map((item) => (
                  <div
                    key={item.id}
                    className="relative group rounded-xl overflow-hidden border border-gray-200 bg-gray-100 aspect-square"
                  >
                    <img
                      src={item.previewUrl}
                      alt="Selected site photo preview"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <button
                        type="button"
                        onClick={() => handleRemovePhoto(item.id)}
                        className="p-2 rounded-full bg-red-600 text-white shadow-lg hover:bg-red-700 transition-transform active:scale-95"
                        title="Remove photo"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="absolute bottom-1 left-1 right-1 px-1.5 py-0.5 rounded bg-black/60 text-white text-[10px] truncate">
                      {item.file.name}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Submit Button & Progress */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
          <Link
            href="/dashboard/framer"
            className="w-full sm:w-auto px-6 py-3 rounded-xl border border-gray-300 text-gray-700 font-semibold text-sm hover:bg-gray-100 text-center transition-colors"
          >
            Cancel
          </Link>

          <button
            type="submit"
            disabled={submitting}
            className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-[#045339] hover:bg-[#033d2a] text-white font-bold text-sm shadow-md hover:shadow-lg transition-all active:scale-[0.98] disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-white" />
                <span>{uploadProgressText || "Processing..."}</span>
              </>
            ) : (
              <>
                <span>Submit</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
