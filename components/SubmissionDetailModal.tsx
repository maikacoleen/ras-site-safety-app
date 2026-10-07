"use client";

import React, { useState } from "react";
import { SubmissionItem } from "@/services/submissions";
import { getPrivatePhotoSrc } from "@/lib/blob";
import {
  CheckCircle2,
  Clock,
  X,
  Check,
  Eye,
  Loader2,
} from "lucide-react";

interface SubmissionDetailModalProps {
  submission: SubmissionItem;
  onClose: () => void;
  isAdmin?: boolean;
  onToggleReview?: (id: string, currentStatus: boolean, e?: React.MouseEvent) => void;
  updatingReviewId?: string | null;
}

export function SubmissionDetailModal({
  submission,
  onClose,
  isAdmin = false,
  onToggleReview,
  updatingReviewId,
}: SubmissionDetailModalProps) {
  const [activePhotoPreview, setActivePhotoPreview] = useState<string | null>(null);

  const formattedDate = new Date(submission.date).toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const formattedTime = new Date(submission.createdAt || submission.date).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });

  const checklistItems = [
    { label: "Hard Hat Worn & Intact", checked: submission.ppeHardHat },
    { label: "High-Vis Vest / Jacket", checked: submission.ppeVest },
    { label: "Steel-Toe Work Boots", checked: submission.ppeBoots },
    { label: "Safety Glasses / Eye Protection", checked: submission.ppeEyeProtection },
    { label: "Fall Protection & Guardrails Secure", checked: submission.fallProtectionInPlace },
    { label: "Ladders & Scaffolding Inspected", checked: submission.laddersInspected },
    { label: "Tools in Good Condition", checked: submission.toolsInGoodCondition },
    { label: "Site Hazards Assessed", checked: submission.hazardsIdentified },
  ];

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in-50">
        <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-gray-200 p-6 space-y-5 animate-in zoom-in-95">
          {/* Modal Header */}
          <div className="flex items-start justify-between border-b border-gray-100 pb-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span
                  className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                    submission.reviewed
                      ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                      : "bg-amber-50 border-amber-200 text-amber-800"
                  }`}
                >
                  {submission.reviewed ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  ) : (
                    <Clock className="w-3.5 h-3.5 text-amber-600" />
                  )}
                  {submission.reviewed ? "Reviewed" : "Pending Review"}
                </span>
                <span className="text-xs text-gray-400">
                  ID: {submission.id.slice(-8)}
                </span>
              </div>
              <h3 className="text-xl font-extrabold text-[#2a2829] tracking-tight">
                {submission.site.name}
              </h3>
              {submission.site.address && (
                <p className="text-xs text-gray-500 mt-0.5">
                  {submission.site.address}
                </p>
              )}
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Meta Info */}
          <div className="grid grid-cols-2 gap-3 bg-gray-50 p-3.5 rounded-2xl border border-gray-100 text-xs">
            <div>
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                Submitted By
              </span>
              <span className="font-semibold text-gray-900 block mt-0.5">
                {submission.worker?.name || "Unknown"}
              </span>
              <span className="text-[10px] text-gray-500 block">
                {submission.worker?.email}
              </span>
            </div>

            <div>
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                Submission Date & Time
              </span>
              <span className="font-semibold text-gray-900 block mt-0.5">
                {formattedDate}
              </span>
              <span className="text-[11px] text-gray-500 font-medium block">
                at {formattedTime}
              </span>
            </div>
          </div>

          {/* Checklist items breakdown */}
          <div className="space-y-2">
            <h4 className="text-xs font-extrabold uppercase tracking-wider text-gray-600">
              Safety Checklist Status
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              {checklistItems.map((item, idx) => (
                <div
                  key={idx}
                  className={`flex items-center gap-2 p-2 rounded-xl border text-xs font-medium ${
                    item.checked
                      ? "bg-emerald-50/60 border-emerald-200 text-emerald-900"
                      : "bg-gray-50 border-gray-200 text-gray-400"
                  }`}
                >
                  <div
                    className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 ${
                      item.checked ? "bg-emerald-600 text-white" : "bg-gray-200 text-gray-400"
                    }`}
                  >
                    <Check className="w-2.5 h-2.5 stroke-[3]" />
                  </div>
                  <span className="truncate">{item.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-1.5">
            <h4 className="text-xs font-extrabold uppercase tracking-wider text-gray-600">
              Notes & Field Observations
            </h4>
            <div className="p-3.5 bg-gray-50 rounded-2xl border border-gray-200 text-xs text-gray-800 leading-relaxed whitespace-pre-wrap">
              {submission.notes || "No additional notes provided for this submission."}
            </div>
          </div>

          {/* Photos */}
          {submission.photos.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-xs font-extrabold uppercase tracking-wider text-gray-600">
                Attached Site Photos ({submission.photos.length})
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {submission.photos.map((photo) => {
                  const photoSrc = getPrivatePhotoSrc(photo.url);
                  return (
                    <div
                      key={photo.id}
                      onClick={() => setActivePhotoPreview(photoSrc)}
                      className="relative rounded-2xl overflow-hidden border border-gray-200 aspect-video bg-gray-100 group cursor-pointer"
                    >
                      <img
                        src={photoSrc}
                        alt="Site submission photo"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                      <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-bold">
                        <Eye className="w-5 h-5 mr-1" /> View Full
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Modal Actions */}
          <div className="flex items-center justify-between pt-4 border-t border-gray-100">
            {isAdmin && onToggleReview ? (
              <button
                type="button"
                onClick={(e) => onToggleReview(submission.id, submission.reviewed, e)}
                disabled={updatingReviewId === submission.id}
                className={`px-5 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 shadow-sm transition-all active:scale-95 ${
                  submission.reviewed
                    ? "bg-amber-100 text-amber-900 hover:bg-amber-200"
                    : "bg-[#045339] text-white hover:bg-[#033d2a]"
                }`}
              >
                {updatingReviewId === submission.id ? (
                  <Loader2 className="w-4 h-4 animate-spin text-current" />
                ) : submission.reviewed ? (
                  <>
                    <Clock className="w-4 h-4" /> Mark as Pending
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-emerald-300" /> Mark as Reviewed
                  </>
                )}
              </button>
            ) : (
              <div />
            )}

            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl border border-gray-300 bg-white hover:bg-gray-100 text-gray-700 font-bold text-xs transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>

      {/* High-res Image Lightbox Modal */}
      {activePhotoPreview && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in-50">
          <button
            type="button"
            onClick={() => setActivePhotoPreview(null)}
            className="absolute top-4 right-4 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
          <img
            src={activePhotoPreview}
            alt="Enlarged site safety view"
            className="max-w-full max-h-[90vh] object-contain rounded-xl shadow-2xl"
          />
        </div>
      )}
    </>
  );
}
