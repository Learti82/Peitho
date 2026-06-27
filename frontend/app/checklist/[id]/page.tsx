import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Navbar } from "@/components/layout/Navbar";
import { ChecklistClientView } from "./ChecklistClientView";
import type { ChecklistItemWithRequirement } from "@/lib/supabase/types";
import { ArrowLeft } from "lucide-react";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function ChecklistPage({ params }: PageProps) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: org } = await supabase
    .from("organizations")
    .select("name")
    .eq("id", user.id)
    .single();

  const { data: tender, error: tenderError } = await supabase
    .from("tenders")
    .select("id, title, contracting_authority, submission_deadline, completion_percentage, organization_id")
    .eq("id", id)
    .eq("organization_id", user.id)
    .single();

  if (tenderError || !tender) notFound();

  const { data: items } = await supabase
    .from("checklist_items")
    .select(
      `
      *,
      tender_requirements (*)
    `
    )
    .eq("tender_id", id)
    .order("updated_at", { ascending: true });

  return (
    <div className="min-h-screen bg-background">
      <Navbar userEmail={user.email} orgName={org?.name} />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back */}
        <Link
          href={`/tender/${id}`}
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-primary mb-6 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Kthehu te Tenderi
        </Link>

        <ChecklistClientView
          tender={tender as any}
          initialItems={(items ?? []) as ChecklistItemWithRequirement[]}
          tenderId={id}
        />
      </main>
    </div>
  );
}
