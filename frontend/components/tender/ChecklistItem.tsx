"use client";

import { useState, useTransition } from "react";
import { clsx } from "clsx";
import { ChevronDown, FileText, AlertCircle } from "lucide-react";
import type { ChecklistItemWithRequirement, ChecklistStatus } from "@/lib/supabase/types";
import { createClient } from "@/lib/supabase/client";
import { Textarea } from "@/components/ui/Textarea";
import { ChecklistStatusBadge, CHECKLIST_STATUS_LABELS } from "@/components/ui/Badge";

interface ChecklistItemProps {
  item: ChecklistItemWithRequirement;
  onUpdated?: () => void;
}

const STATUS_OPTIONS: ChecklistStatus[] = [
  "NOT_STARTED",
  "IN_PROGRESS",
  "READY",
  "NOT_APPLICABLE",
];

const STATUS_COLORS: Record<ChecklistStatus, string> = {
  NOT_STARTED: "border-l-gray-300",
  IN_PROGRESS: "border-l-blue-400",
  READY: "border-l-green-500",
  NOT_APPLICABLE: "border-l-gray-200",
};

export function ChecklistItem({ item, onUpdated }: ChecklistItemProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [status, setStatus] = useState<ChecklistStatus>(item.status);
  const [notes, setNotes] = useState(item.notes ?? "");
  const [isPending, startTransition] = useTransition();
  const req = item.tender_requirements;

  async function handleStatusChange(newStatus: ChecklistStatus) {
    setStatus(newStatus);
    startTransition(async () => {
      const supabase = createClient();
      await supabase
        .from("checklist_items")
        .update({ status: newStatus })
        .eq("id", item.id);
      onUpdated?.();
    });
  }

  async function handleNotesSave() {
    startTransition(async () => {
      const supabase = createClient();
      await supabase
        .from("checklist_items")
        .update({ notes })
        .eq("id", item.id);
      onUpdated?.();
    });
  }

  return (
    <div
      className={clsx(
        "bg-white rounded-lg border border-gray-200 border-l-4 transition-all duration-150",
        STATUS_COLORS[status],
        status === "NOT_APPLICABLE" && "opacity-60"
      )}
    >
      {/* Main row */}
      <div className="flex items-start gap-4 p-4">
        {/* Status dropdown */}
        <div className="flex-shrink-0 relative">
          <select
            value={status}
            onChange={(e) => handleStatusChange(e.target.value as ChecklistStatus)}
            disabled={isPending}
            className={clsx(
              "text-xs font-medium px-2 py-1 rounded-lg border cursor-pointer",
              "focus:outline-none focus:ring-2 focus:ring-gold/50",
              "disabled:opacity-50 disabled:cursor-not-allowed",
              "appearance-none pr-6 bg-white",
              status === "NOT_STARTED" && "border-gray-300 text-gray-600",
              status === "IN_PROGRESS" && "border-blue-300 text-blue-700 bg-blue-50",
              status === "READY" && "border-green-300 text-green-700 bg-green-50",
              status === "NOT_APPLICABLE" && "border-gray-200 text-gray-400"
            )}
          >
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {CHECKLIST_STATUS_LABELS[s]}
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-1.5 top-1/2 -translate-y-1/2 h-3 w-3 text-gray-400 pointer-events-none" />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {req?.requirement_id && (
            <span className="text-xs font-mono text-primary-400 bg-primary-50 px-1.5 py-0.5 rounded mr-2">
              {req.requirement_id}
            </span>
          )}
          <p className="text-sm text-gray-800 leading-relaxed inline">
            {req?.requirement_text ?? "Kërkesë e fshirë"}
          </p>
          {req?.is_mandatory && (
            <AlertCircle className="inline h-3.5 w-3.5 text-red-400 ml-1.5" />
          )}
        </div>

        {/* Expand toggle */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex-shrink-0 p-1 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-colors"
          aria-label={isExpanded ? "Mbyll" : "Shpjego"}
        >
          <ChevronDown
            className={clsx(
              "h-4 w-4 transition-transform duration-200",
              isExpanded && "rotate-180"
            )}
          />
        </button>
      </div>

      {/* Expanded section */}
      {isExpanded && (
        <div className="border-t border-gray-100 px-4 pb-4 pt-3 space-y-3">
          {req?.evidence_needed && (
            <div className="flex gap-2 bg-blue-50 rounded-lg p-3 border border-blue-100">
              <FileText className="h-4 w-4 text-blue-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-semibold text-blue-700 mb-0.5">
                  Dokumenti i nevojshëm
                </p>
                <p className="text-xs text-blue-800">{req.evidence_needed}</p>
              </div>
            </div>
          )}
          <div>
            <Textarea
              label="Shënime"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              onBlur={handleNotesSave}
              rows={3}
              placeholder="Shënime rreth kësaj kërkese..."
              disabled={isPending}
            />
          </div>
        </div>
      )}
    </div>
  );
}
