"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { clsx } from "clsx";
import type { TenderRequirement, RequirementCategory } from "@/lib/supabase/types";
import { RequirementCard } from "./RequirementCard";
import { REQ_CATEGORY_LABELS } from "@/components/ui/Badge";

interface RequirementGroupProps {
  category: RequirementCategory;
  requirements: TenderRequirement[];
  defaultOpen?: boolean;
}

export function RequirementGroup({
  category,
  requirements,
  defaultOpen = true,
}: RequirementGroupProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const mandatoryCount = requirements.filter((r) => r.is_mandatory).length;

  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={clsx(
          "w-full flex items-center justify-between px-5 py-4 text-left transition-colors duration-150",
          isOpen ? "bg-primary text-white" : "bg-gray-50 text-primary hover:bg-gray-100"
        )}
        aria-expanded={isOpen}
      >
        <div className="flex items-center gap-3">
          {isOpen ? (
            <ChevronDown className="h-4 w-4 flex-shrink-0" />
          ) : (
            <ChevronRight className="h-4 w-4 flex-shrink-0" />
          )}
          <span className="font-semibold text-sm">
            {REQ_CATEGORY_LABELS[category]}
          </span>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <span
            className={clsx(
              "px-2 py-0.5 rounded-full font-medium",
              isOpen ? "bg-white/20 text-white" : "bg-primary/10 text-primary"
            )}
          >
            {requirements.length} kërkesa
          </span>
          {mandatoryCount > 0 && (
            <span
              className={clsx(
                "px-2 py-0.5 rounded-full font-medium",
                isOpen ? "bg-red-400/30 text-red-100" : "bg-red-50 text-red-600"
              )}
            >
              {mandatoryCount} të detyrueshme
            </span>
          )}
        </div>
      </button>

      {isOpen && (
        <div className="p-4 space-y-3 bg-gray-50/50">
          {requirements.map((req) => (
            <RequirementCard key={req.id} requirement={req} />
          ))}
        </div>
      )}
    </div>
  );
}
