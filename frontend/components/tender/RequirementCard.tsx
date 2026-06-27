import { clsx } from "clsx";
import { FileText, BookOpen, CheckCircle, AlertCircle } from "lucide-react";
import type { TenderRequirement } from "@/lib/supabase/types";
import { RequirementCategoryBadge } from "@/components/ui/Badge";

interface RequirementCardProps {
  requirement: TenderRequirement;
  index?: number;
}

export function RequirementCard({ requirement, index }: RequirementCardProps) {
  return (
    <div
      className={clsx(
        "bg-white rounded-lg border p-4 space-y-3 transition-all duration-150",
        requirement.is_mandatory
          ? "border-gray-200 hover:border-primary/30"
          : "border-dashed border-gray-200 hover:border-gray-300"
      )}
    >
      {/* Header row */}
      <div className="flex items-start gap-3 flex-wrap">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          {requirement.requirement_id && (
            <span className="flex-shrink-0 text-xs font-mono font-bold text-primary-400 bg-primary-50 px-2 py-0.5 rounded">
              {requirement.requirement_id}
            </span>
          )}
          <RequirementCategoryBadge category={requirement.category} />
        </div>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          {requirement.is_mandatory ? (
            <span className="flex items-center gap-1 text-xs text-red-600 bg-red-50 px-2 py-0.5 rounded-full border border-red-100">
              <AlertCircle className="h-3 w-3" />
              E detyrueshme
            </span>
          ) : (
            <span className="flex items-center gap-1 text-xs text-gray-500 bg-gray-50 px-2 py-0.5 rounded-full border border-gray-100">
              <CheckCircle className="h-3 w-3" />
              Opsionale
            </span>
          )}
          {requirement.evaluation_weight != null && (
            <span className="text-xs font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-100">
              {requirement.evaluation_weight}%
            </span>
          )}
        </div>
      </div>

      {/* Requirement text */}
      <p className="text-sm text-gray-800 leading-relaxed">
        {requirement.requirement_text}
      </p>

      {/* Evidence needed */}
      {requirement.evidence_needed && (
        <div className="flex items-start gap-2 bg-blue-50 rounded-lg p-3 border border-blue-100">
          <FileText className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-xs font-semibold text-blue-700 mb-0.5">
              Dokumenti i nevojshëm
            </p>
            <p className="text-xs text-blue-800">{requirement.evidence_needed}</p>
          </div>
        </div>
      )}

      {/* Source info */}
      {(requirement.source_page != null || requirement.source_section) && (
        <div className="flex items-center gap-1.5 text-xs text-gray-400">
          <BookOpen className="h-3 w-3" />
          {requirement.source_section && (
            <span>{requirement.source_section}</span>
          )}
          {requirement.source_page != null && (
            <span>Faqja {requirement.source_page}</span>
          )}
        </div>
      )}
    </div>
  );
}
