"use client";

import { useState, useMemo, useCallback } from "react";
import { clsx } from "clsx";
import { Progress } from "@/components/ui/Progress";
import { ChecklistItem } from "@/components/tender/ChecklistItem";
import { Select } from "@/components/ui/Select";
import { createClient } from "@/lib/supabase/client";
import type {
  ChecklistItemWithRequirement,
  ChecklistStatus,
  RequirementCategory,
} from "@/lib/supabase/types";
import { REQ_CATEGORY_LABELS } from "@/components/ui/Badge";
import { CheckCircle2, Clock, List, AlertCircle } from "lucide-react";

interface TenderSummary {
  id: string;
  title: string | null;
  contracting_authority: string | null;
  submission_deadline: string | null;
  completion_percentage: number;
}

interface ChecklistClientViewProps {
  tender: TenderSummary;
  initialItems: ChecklistItemWithRequirement[];
  tenderId: string;
}

const STATUS_FILTER_OPTIONS = [
  { value: "ALL", label: "Të gjitha statuset" },
  { value: "NOT_STARTED", label: "Nuk ka filluar" },
  { value: "IN_PROGRESS", label: "Në progres" },
  { value: "READY", label: "Gati" },
  { value: "NOT_APPLICABLE", label: "Nuk aplikohet" },
];

const CATEGORY_FILTER_OPTIONS = [
  { value: "ALL", label: "Të gjitha kategoritë" },
  ...Object.entries(REQ_CATEGORY_LABELS).map(([value, label]) => ({
    value,
    label,
  })),
];

export function ChecklistClientView({
  tender,
  initialItems,
  tenderId,
}: ChecklistClientViewProps) {
  const [items, setItems] = useState<ChecklistItemWithRequirement[]>(initialItems);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [categoryFilter, setCategoryFilter] = useState("ALL");

  // Stats
  const stats = useMemo(() => {
    const applicable = items.filter((i) => i.status !== "NOT_APPLICABLE");
    const ready = items.filter((i) => i.status === "READY");
    const inProgress = items.filter((i) => i.status === "IN_PROGRESS");
    const notStarted = items.filter((i) => i.status === "NOT_STARTED");
    const completionPct =
      applicable.length > 0
        ? Math.round((ready.length / applicable.length) * 100)
        : 0;
    return {
      total: items.length,
      ready: ready.length,
      inProgress: inProgress.length,
      notStarted: notStarted.length,
      applicable: applicable.length,
      completionPct,
    };
  }, [items]);

  // Update completion percentage in DB when items change
  const updateCompletion = useCallback(
    async (updatedItems: ChecklistItemWithRequirement[]) => {
      const applicable = updatedItems.filter((i) => i.status !== "NOT_APPLICABLE");
      const ready = updatedItems.filter((i) => i.status === "READY");
      const pct =
        applicable.length > 0
          ? Math.round((ready.length / applicable.length) * 100)
          : 0;
      const supabase = createClient();
      await supabase
        .from("tenders")
        .update({ completion_percentage: pct })
        .eq("id", tenderId);
    },
    [tenderId]
  );

  async function handleItemUpdated() {
    // Re-fetch items to get latest state
    const supabase = createClient();
    const { data } = await supabase
      .from("checklist_items")
      .select("*, tender_requirements(*)")
      .eq("tender_id", tenderId)
      .order("updated_at", { ascending: true });

    if (data) {
      const typedData = data as ChecklistItemWithRequirement[];
      setItems(typedData);
      await updateCompletion(typedData);
    }
  }

  // Filtered items
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const statusMatch =
        statusFilter === "ALL" || item.status === statusFilter;
      const categoryMatch =
        categoryFilter === "ALL" ||
        item.tender_requirements?.category === categoryFilter;
      return statusMatch && categoryMatch;
    });
  }, [items, statusFilter, categoryFilter]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-primary">Lista e Kontrollit</h1>
        <p className="text-gray-500 text-sm mt-1">
          {tender.title || "Tender"} —{" "}
          {tender.contracting_authority || "Autoriteti Kontraktues"}
        </p>
      </div>

      {/* Progress card */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
          <div>
            <h2 className="text-base font-semibold text-gray-800">
              Progresi i Përgjithshëm
            </h2>
            <p className="text-sm text-gray-500 mt-0.5">
              {stats.ready}/{stats.applicable} kërkesa gati ({stats.completionPct}%)
            </p>
          </div>
          <div className="text-3xl font-bold text-primary">
            {stats.completionPct}%
          </div>
        </div>

        <Progress
          value={stats.completionPct}
          size="lg"
          color={stats.completionPct === 100 ? "green" : "primary"}
          showLabel={false}
        />

        {/* Mini stats */}
        <div className="grid grid-cols-3 gap-4 mt-5 pt-5 border-t border-gray-100">
          <div className="text-center">
            <div className="flex items-center justify-center gap-1.5 mb-1">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              <span className="text-xl font-bold text-green-600">{stats.ready}</span>
            </div>
            <p className="text-xs text-gray-400">Gati</p>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-1.5 mb-1">
              <Clock className="h-4 w-4 text-blue-500" />
              <span className="text-xl font-bold text-blue-600">{stats.inProgress}</span>
            </div>
            <p className="text-xs text-gray-400">Në progres</p>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-1.5 mb-1">
              <AlertCircle className="h-4 w-4 text-gray-400" />
              <span className="text-xl font-bold text-gray-600">{stats.notStarted}</span>
            </div>
            <p className="text-xs text-gray-400">Pa filluar</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Select
          options={STATUS_FILTER_OPTIONS}
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="sm:max-w-[200px]"
          aria-label="Filtroni sipas statusit"
        />
        <Select
          options={CATEGORY_FILTER_OPTIONS}
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="sm:max-w-[280px]"
          aria-label="Filtroni sipas kategorisë"
        />
        {(statusFilter !== "ALL" || categoryFilter !== "ALL") && (
          <button
            onClick={() => {
              setStatusFilter("ALL");
              setCategoryFilter("ALL");
            }}
            className="text-sm text-gray-500 hover:text-primary underline self-center"
          >
            Hiq filtrat
          </button>
        )}
      </div>

      {/* Result count */}
      {(statusFilter !== "ALL" || categoryFilter !== "ALL") && (
        <p className="text-sm text-gray-500">
          Duke shfaqur {filteredItems.length} nga {items.length} kërkesa
        </p>
      )}

      {/* List */}
      <div className="space-y-3">
        {filteredItems.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-10 text-center">
            <List className="h-8 w-8 text-gray-300 mx-auto mb-2" />
            <p className="text-gray-400 text-sm">
              Asnjë kërkesë nuk i përputhet filtrave të zgjedhura
            </p>
          </div>
        ) : (
          filteredItems.map((item) => (
            <ChecklistItem
              key={item.id}
              item={item}
              onUpdated={handleItemUpdated}
            />
          ))
        )}
      </div>
    </div>
  );
}
