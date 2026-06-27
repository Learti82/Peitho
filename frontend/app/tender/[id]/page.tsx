import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { auth, currentUser } from "@clerk/nextjs/server";
import { createClient } from "@/lib/supabase/server";
import { Navbar } from "@/components/layout/Navbar";
import { RequirementGroup } from "@/components/tender/RequirementGroup";
import { CategoryBadge, StatusBadge } from "@/components/ui/Badge";
import { Progress } from "@/components/ui/Progress";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import type { RequirementCategory, TenderRequirement } from "@/lib/supabase/types";
import {
  Calendar,
  Building2,
  DollarSign,
  FileText,
  ClipboardCheck,
  AlertTriangle,
  CheckCircle,
  ExternalLink,
} from "lucide-react";
import { format } from "date-fns";
import { sq } from "date-fns/locale";

// Group requirements by category preserving order
function groupByCategory(
  requirements: TenderRequirement[]
): Map<RequirementCategory, TenderRequirement[]> {
  const map = new Map<RequirementCategory, TenderRequirement[]>();
  for (const req of requirements) {
    const existing = map.get(req.category) ?? [];
    map.set(req.category, [...existing, req]);
  }
  return map;
}

// Category display order
const CATEGORY_ORDER: RequirementCategory[] = [
  "ADMINISTRATIVE_ELIGIBILITY",
  "PROFESSIONAL_CAPACITY",
  "TECHNICAL_CAPACITY",
  "FINANCIAL_CAPACITY",
  "TECHNICAL_PROPOSAL",
  "FINANCIAL_PROPOSAL",
  "EVALUATION_CRITERIA",
  "SUBMISSION_REQUIREMENTS",
];

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function TenderPage({ params }: PageProps) {
  const { id } = await params;
  const { userId } = await auth();
  if (!userId) redirect("/login");

  const user = await currentUser();
  const userEmail = user?.primaryEmailAddress?.emailAddress;

  const supabase = await createClient();

  const { data: org } = await supabase
    .from("organizations")
    .select("name")
    .eq("id", userId)
    .maybeSingle();

  const { data: tender, error: tenderError } = await supabase
    .from("tenders")
    .select("*")
    .eq("id", id)
    .eq("organization_id", userId)
    .single();

  if (tenderError || !tender) notFound();

  const { data: requirements } = await supabase
    .from("tender_requirements")
    .select("*")
    .eq("tender_id", id)
    .order("requirement_id", { ascending: true });

  const grouped = groupByCategory(requirements ?? []);

  // Generate a short-lived signed URL for the private PDF
  const { data: pdfUrlData } = await supabase.storage
    .from("tender-pdfs")
    .createSignedUrl(tender.pdf_storage_path, 3600);
  const pdfUrl = { publicUrl: pdfUrlData?.signedUrl ?? "" };

  return (
    <div className="min-h-screen bg-background">
      <Navbar userEmail={userEmail} orgName={org?.name} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-gray-400 mb-6">
          <Link href="/dashboard" className="hover:text-primary transition-colors">
            Paneli Kryesor
          </Link>
          <span>/</span>
          <span className="text-gray-700 font-medium truncate max-w-xs">
            {tender.title || "Tender"}
          </span>
        </nav>

        {/* Header */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-6 shadow-sm">
          <div className="flex flex-col lg:flex-row lg:items-start gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 flex-wrap mb-3">
                <StatusBadge status={tender.status} />
                <CategoryBadge category={tender.category} />
                {tender.parsing_confidence != null && (
                  <span
                    className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${
                      tender.parsing_confidence >= 0.8
                        ? "bg-green-100 text-green-700"
                        : tender.parsing_confidence >= 0.6
                        ? "bg-yellow-100 text-yellow-700"
                        : "bg-red-100 text-red-700"
                    }`}
                  >
                    Saktësi: {Math.round(tender.parsing_confidence * 100)}%
                  </span>
                )}
              </div>

              <h1 className="text-xl font-bold text-primary mb-1">
                {tender.title || "Tender pa titull"}
              </h1>
              {tender.contracting_authority && (
                <p className="text-gray-500 flex items-center gap-1.5 text-sm">
                  <Building2 className="h-4 w-4" />
                  {tender.contracting_authority}
                </p>
              )}
            </div>

            <div className="flex-shrink-0">
              <Link href={`/checklist/${tender.id}`}>
                <Button variant="secondary" size="md">
                  <ClipboardCheck className="h-4 w-4 mr-2" />
                  Shiko Listën e Kontrollit
                </Button>
              </Link>
            </div>
          </div>

          {/* Metadata grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-5 pt-5 border-t border-gray-100">
            <div className="space-y-1">
              <p className="text-xs text-gray-400 uppercase tracking-wider font-medium">Afati</p>
              <div className="flex items-center gap-1.5">
                <Calendar className="h-4 w-4 text-primary/60" />
                <span className="text-sm font-medium text-gray-800">
                  {tender.submission_deadline
                    ? format(new Date(tender.submission_deadline), "dd MMM yyyy", { locale: sq })
                    : "—"}
                </span>
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-gray-400 uppercase tracking-wider font-medium">Vlera</p>
              <div className="flex items-center gap-1.5">
                <DollarSign className="h-4 w-4 text-primary/60" />
                <span className="text-sm font-medium text-gray-800">
                  {tender.estimated_value_amount
                    ? `${tender.estimated_value_amount.toLocaleString()} ${tender.estimated_value_currency}`
                    : "—"}
                </span>
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-gray-400 uppercase tracking-wider font-medium">Kërkesat</p>
              <p className="text-sm font-medium text-gray-800">
                {requirements?.length ?? 0} kërkesa
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-gray-400 uppercase tracking-wider font-medium">Përfundimi</p>
              <div className="flex items-center gap-2">
                <Progress
                  value={tender.completion_percentage ?? 0}
                  size="sm"
                  color="primary"
                  className="flex-1"
                />
                <span className="text-sm font-medium text-gray-700">
                  {tender.completion_percentage ?? 0}%
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Warnings */}
        {tender.parsing_warnings && tender.parsing_warnings.length > 0 && (
          <Alert variant="warning" title="Paralajmërime nga analizimi" className="mb-6">
            <ul className="list-disc list-inside space-y-1 mt-1">
              {tender.parsing_warnings.map((w: string, i: number) => (
                <li key={i} className="text-sm">
                  {w}
                </li>
              ))}
            </ul>
          </Alert>
        )}

        {/* Split layout: PDF + Requirements */}
        <div className="grid lg:grid-cols-5 gap-6">
          {/* PDF Viewer */}
          <div className="lg:col-span-2">
            <Card padding="none" className="sticky top-20">
              <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium text-gray-700">
                    Dokumenti PDF
                  </span>
                </div>
                {pdfUrl?.publicUrl && (
                  <a
                    href={pdfUrl.publicUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-primary hover:underline flex items-center gap-1"
                  >
                    Hap <ExternalLink className="h-3 w-3" />
                  </a>
                )}
              </div>
              {pdfUrl?.publicUrl ? (
                <iframe
                  src={pdfUrl.publicUrl}
                  className="w-full rounded-b-xl"
                  style={{ height: "calc(100vh - 260px)", minHeight: "500px" }}
                  title="Tender PDF"
                />
              ) : (
                <div className="flex items-center justify-center h-64 bg-gray-50 rounded-b-xl">
                  <div className="text-center text-gray-400">
                    <FileText className="h-10 w-10 mx-auto mb-2" />
                    <p className="text-sm">PDF nuk është i disponueshëm</p>
                  </div>
                </div>
              )}
            </Card>
          </div>

          {/* Requirements */}
          <div className="lg:col-span-3 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-primary">
                Kërkesat e Tenderit
              </h2>
              <span className="text-sm text-gray-500">
                {requirements?.length ?? 0} gjithsej
              </span>
            </div>

            {(!requirements || requirements.length === 0) ? (
              <Card className="text-center py-10 text-gray-400">
                <p>Asnjë kërkesë e analizuar.</p>
              </Card>
            ) : (
              <div className="space-y-3">
                {CATEGORY_ORDER.map((cat) => {
                  const reqs = grouped.get(cat);
                  if (!reqs || reqs.length === 0) return null;
                  return (
                    <RequirementGroup
                      key={cat}
                      category={cat}
                      requirements={reqs}
                      defaultOpen={
                        cat === "ADMINISTRATIVE_ELIGIBILITY" || cat === "TECHNICAL_CAPACITY"
                      }
                    />
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
