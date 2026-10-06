"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "@/lib/auth-client";
import { Loader2, HardHat, FileText, Calendar, MapPin, Plus } from "lucide-react";

interface Photo {
  id: string;
  url: string;
}

interface Site {
  name: string;
  address: string | null;
}

interface Submission {
  id: string;
  date: string;
  notes: string | null;
  ppeHardHat: boolean;
  ppeVest: boolean;
  ppeBoots: boolean;
  ppeEyeProtection: boolean;
  site: Site;
  photos: Photo[];
  createdAt: string;
}

export default function FramerDashboardPage() {
  const { data: session, isPending } = useSession();
  const router = useRouter();

  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loadingSubmissions, setLoadingSubmissions] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isPending) {
      if (!session?.user) {
        router.replace("/auth/login");
      } else {
        fetchSubmissions();
      }
    }
  }, [session, isPending, router]);

  const fetchSubmissions = async () => {
    try {
      setLoadingSubmissions(true);
      const res = await fetch("/api/submissions");

      if (!res.ok) {
        throw new Error("Failed to load submissions");
      }

      const data: Submission[] = await res.json();
      setSubmissions(data);
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred");
    } finally {
      setLoadingSubmissions(false);
    }
  };

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
    <div className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-[#2a2829] tracking-tight">
            Hello, {session.user.name}
          </h1>
        </div>
        <Link
          href="/framer/submissions/new"
          className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-full bg-white text-[#2a2829] border border-gray-200 shadow-md hover:shadow-lg hover:border-gray-300 transition-all active:scale-[0.98] font-medium text-sm w-fit"
        >
          <div className="w-6 h-6 rounded-full bg-emerald-50 flex items-center justify-center text-[#045339]">
            <Plus className="w-4 h-4 stroke-[2.5]" />
          </div>
          <span>New Submission</span>
        </Link>
      </div>

      {/* Submissions Section */}
      <div className="bg-white p-6 rounded-2xl border border-gray-200/80 shadow-sm">
        <h2 className="text-lg font-bold text-[#2a2829] mb-4 flex items-center gap-2">
          <FileText className="w-5 h-5 text-[#045339]" />
          Your Safety Submissions
        </h2>

        {loadingSubmissions ? (
          <div className="flex items-center justify-center py-12 text-gray-500 gap-2">
            <Loader2 className="w-5 h-5 animate-spin text-[#045339]" />
            <span className="text-sm font-medium">Loading submissions...</span>
          </div>
        ) : error ? (
          <div className="p-4 bg-red-50 text-red-700 rounded-xl text-sm border border-red-200">
            {error}
          </div>
        ) : submissions.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <p className="text-sm">No submissions found.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {submissions.map((item) => (
              <div
                key={item.id}
                className="p-4 rounded-xl border border-gray-200 hover:border-emerald-500/50 transition-colors bg-gray-50/50"
              >
                <div className="flex items-start justify-between mb-2">
                  <span className="font-semibold text-[#2a2829] flex items-center gap-1.5 text-sm">
                    <MapPin className="w-4 h-4 text-[#045339]" />
                    {item.site.name}
                  </span>
                  <span className="text-xs text-gray-500 flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" />
                    {new Date(item.date).toLocaleDateString()}
                  </span>
                </div>

                {item.notes && (
                  <p className="text-xs text-gray-600 line-clamp-2 mt-2 bg-white p-2 rounded border border-gray-100">
                    {item.notes}
                  </p>
                )}

                <div className="mt-3 pt-3 border-t border-gray-200/60 flex justify-between items-center text-xs text-gray-500">
                  <span>Photos: {item.photos.length}</span>
                  <span className="text-[#045339] font-medium">
                    PPE Verified
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}