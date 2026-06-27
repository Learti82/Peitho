import { clsx } from "clsx";
import type { TenderCategory, TenderStatus, RequirementCategory, ChecklistStatus } from "@/lib/supabase/types";

interface BadgeProps {
  children: React.ReactNode;
  className?: string;
  variant?: "default" | "outline";
}

export function Badge({ children, className, variant = "default" }: BadgeProps) {
  return (
    <span
      className={clsx(
        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium",
        variant === "outline" && "border",
        className
      )}
    >
      {children}
    </span>
  );
}

// ─── Tender category badge ───────────────────────────────────

const CATEGORY_LABELS: Record<TenderCategory, string> = {
  IT_SERVICES: "Teknologji",
  CONSTRUCTION: "Ndërtim",
  CONSULTING: "Konsulencë",
  SUPPLIES: "Furnizime",
};

const CATEGORY_CLASSES: Record<TenderCategory, string> = {
  IT_SERVICES: "bg-purple-100 text-purple-700",
  CONSTRUCTION: "bg-orange-100 text-orange-700",
  CONSULTING: "bg-teal-100 text-teal-700",
  SUPPLIES: "bg-blue-100 text-blue-700",
};

export function CategoryBadge({ category }: { category: TenderCategory | null }) {
  if (!category) return <span className="text-gray-400 text-xs">—</span>;
  return (
    <Badge className={CATEGORY_CLASSES[category]}>
      {CATEGORY_LABELS[category]}
    </Badge>
  );
}

// ─── Tender status badge ──────────────────────────────────────

const STATUS_LABELS: Record<TenderStatus, string> = {
  UPLOADING: "Duke u ngarkuar",
  PARSING: "Duke u analizuar",
  PARSED: "I analizuar",
  ERROR: "Gabim",
};

const STATUS_CLASSES: Record<TenderStatus, string> = {
  UPLOADING: "bg-yellow-100 text-yellow-700",
  PARSING: "bg-blue-100 text-blue-700",
  PARSED: "bg-green-100 text-green-700",
  ERROR: "bg-red-100 text-red-700",
};

export function StatusBadge({ status }: { status: TenderStatus }) {
  return (
    <Badge className={STATUS_CLASSES[status]}>
      {status === "PARSING" && (
        <span className="mr-1 inline-block w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
      )}
      {STATUS_LABELS[status]}
    </Badge>
  );
}

// ─── Requirement category badge ───────────────────────────────

const REQ_CATEGORY_LABELS: Record<RequirementCategory, string> = {
  ADMINISTRATIVE_ELIGIBILITY: "Eligjibilitet",
  PROFESSIONAL_CAPACITY: "Kapacitet Profesional",
  TECHNICAL_CAPACITY: "Kapacitet Teknik",
  FINANCIAL_CAPACITY: "Kapacitet Financiar",
  TECHNICAL_PROPOSAL: "Propozimi Teknik",
  FINANCIAL_PROPOSAL: "Propozimi Financiar",
  EVALUATION_CRITERIA: "Kriteret e Vlerësimit",
  SUBMISSION_REQUIREMENTS: "Kërkesat e Dorëzimit",
};

const REQ_CATEGORY_CLASSES: Record<RequirementCategory, string> = {
  ADMINISTRATIVE_ELIGIBILITY: "bg-gray-100 text-gray-700",
  PROFESSIONAL_CAPACITY: "bg-indigo-100 text-indigo-700",
  TECHNICAL_CAPACITY: "bg-cyan-100 text-cyan-700",
  FINANCIAL_CAPACITY: "bg-emerald-100 text-emerald-700",
  TECHNICAL_PROPOSAL: "bg-violet-100 text-violet-700",
  FINANCIAL_PROPOSAL: "bg-green-100 text-green-700",
  EVALUATION_CRITERIA: "bg-amber-100 text-amber-700",
  SUBMISSION_REQUIREMENTS: "bg-rose-100 text-rose-700",
};

export function RequirementCategoryBadge({ category }: { category: RequirementCategory }) {
  return (
    <Badge className={REQ_CATEGORY_CLASSES[category]}>
      {REQ_CATEGORY_LABELS[category]}
    </Badge>
  );
}

export { REQ_CATEGORY_LABELS, STATUS_LABELS, CATEGORY_LABELS };

// ─── Checklist status badge ───────────────────────────────────

const CHECKLIST_STATUS_LABELS: Record<ChecklistStatus, string> = {
  NOT_STARTED: "Nuk ka filluar",
  IN_PROGRESS: "Në progres",
  READY: "Gati",
  NOT_APPLICABLE: "Nuk aplikohet",
};

const CHECKLIST_STATUS_CLASSES: Record<ChecklistStatus, string> = {
  NOT_STARTED: "bg-gray-100 text-gray-600",
  IN_PROGRESS: "bg-blue-100 text-blue-700",
  READY: "bg-green-100 text-green-700",
  NOT_APPLICABLE: "bg-gray-50 text-gray-400 border border-gray-200",
};

export function ChecklistStatusBadge({ status }: { status: ChecklistStatus }) {
  return (
    <Badge className={CHECKLIST_STATUS_CLASSES[status]}>
      {CHECKLIST_STATUS_LABELS[status]}
    </Badge>
  );
}

export { CHECKLIST_STATUS_LABELS };
