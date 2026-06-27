import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Navbar } from "@/components/layout/Navbar";
import { Button } from "@/components/ui/Button";
import { Progress } from "@/components/ui/Progress";
import { CategoryBadge, StatusBadge } from "@/components/ui/Badge";
import type { Tender } from "@/lib/supabase/types";
import { Upload, FileText, Clock, AlertCircle } from "lucide-react";
import { formatDistanceToNow, format, isPast } from "date-fns";
import { sq } from "date-fns/locale";

function DeadlineCell({ deadline }: { deadline: string | null }) {
  if (!deadline) {
    return <span className="text-gray-400 text-sm">—</span>;
  }

  const date = new Date(deadline);
  const past = isPast(date);

  return (
    <div className="space-y-0.5">
      <p className={`text-sm font-medium ${past ? "text-red-600" : "text-gray-900"}`}>
        {format(date, "dd MMM yyyy")}
      </p>
      <p className={`text-xs ${past ? "text-red-400" : "text-gray-400"}`}>
        {past ? "Skaduar " : ""}
        {formatDistanceToNow(date, { addSuffix: true, locale: sq })}
      </p>
    </div>
  );
}

export default async function DashboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Fetch organization
  const { data: org } = await supabase
    .from("organizations")
    .select("name")
    .eq("id", user.id)
    .single();

  // Fetch tenders sorted by deadline
  const { data: tenders, error } = await supabase
    .from("tenders")
    .select("*")
    .eq("organization_id", user.id)
    .order("submission_deadline", { ascending: true, nullsFirst: false });

  return (
    <div className="min-h-screen bg-background">
      <Navbar userEmail={user.email} orgName={org?.name} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-primary">
              {org?.name ? `Mirëserdhët, ${org.name}` : "Paneli Kryesor"}
            </h1>
            <p className="text-gray-500 text-sm mt-1">
              Menaxhoni tenderat tuaj dhe gjurmoni progresin
            </p>
          </div>
          <Link href="/upload">
            <Button size="lg" variant="secondary" className="gap-2">
              <Upload className="h-4 w-4" />
              Ngarko Tender të Ri
            </Button>
          </Link>
        </div>

        {/* Stats */}
        {tenders && tenders.length > 0 && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <p className="text-xs text-gray-500 uppercase tracking-wider font-medium">Gjithsej</p>
              <p className="text-3xl font-bold text-primary mt-1">{tenders.length}</p>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <p className="text-xs text-gray-500 uppercase tracking-wider font-medium">Të analizuara</p>
              <p className="text-3xl font-bold text-green-600 mt-1">
                {tenders.filter((t) => t.status === "PARSED").length}
              </p>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <p className="text-xs text-gray-500 uppercase tracking-wider font-medium">Në progres</p>
              <p className="text-3xl font-bold text-blue-600 mt-1">
                {tenders.filter((t) => t.status === "PARSING").length}
              </p>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <p className="text-xs text-gray-500 uppercase tracking-wider font-medium">Gabime</p>
              <p className="text-3xl font-bold text-red-500 mt-1">
                {tenders.filter((t) => t.status === "ERROR").length}
              </p>
            </div>
          </div>
        )}

        {/* Tenders table */}
        {!tenders || tenders.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-200 p-16 text-center">
            <div className="w-20 h-20 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <FileText className="h-10 w-10 text-primary/50" />
            </div>
            <h3 className="text-lg font-semibold text-gray-700 mb-2">
              Asnjë tender ende
            </h3>
            <p className="text-gray-500 text-sm mb-6 max-w-sm mx-auto">
              Ngarkoni dokumentin PDF të tenderit dhe AI-ja jonë do të analizojë të gjitha kërkesat automatikisht.
            </p>
            <Link href="/upload">
              <Button variant="secondary" size="lg">
                <Upload className="h-4 w-4 mr-2" />
                Ngarko Tenderin e Parë
              </Button>
            </Link>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50">
                    <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Titulli
                    </th>
                    <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider hidden md:table-cell">
                      Autoriteti Kontraktues
                    </th>
                    <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider hidden lg:table-cell">
                      Afati
                    </th>
                    <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider hidden sm:table-cell">
                      Kategoria
                    </th>
                    <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Përfundimi
                    </th>
                    <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Statusi
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {tenders.map((tender) => (
                    <tr
                      key={tender.id}
                      className="hover:bg-gray-50/80 transition-colors"
                    >
                      <td className="px-5 py-4">
                        {tender.status === "PARSED" ? (
                          <Link
                            href={`/tender/${tender.id}`}
                            className="font-medium text-primary hover:text-primary-600 hover:underline"
                          >
                            {tender.title || "Pa titull"}
                          </Link>
                        ) : (
                          <span className="font-medium text-gray-700">
                            {tender.title || "Duke u analizuar..."}
                          </span>
                        )}
                        {tender.parsing_warnings && tender.parsing_warnings.length > 0 && (
                          <AlertCircle className="inline h-3.5 w-3.5 text-yellow-500 ml-1.5" />
                        )}
                      </td>
                      <td className="px-5 py-4 hidden md:table-cell">
                        <span className="text-sm text-gray-600">
                          {tender.contracting_authority || "—"}
                        </span>
                      </td>
                      <td className="px-5 py-4 hidden lg:table-cell">
                        <DeadlineCell deadline={tender.submission_deadline} />
                      </td>
                      <td className="px-5 py-4 hidden sm:table-cell">
                        <CategoryBadge category={tender.category} />
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          <Progress
                            value={tender.completion_percentage || 0}
                            size="sm"
                            color={
                              (tender.completion_percentage || 0) === 100
                                ? "green"
                                : "primary"
                            }
                            className="w-20"
                          />
                          <span className="text-xs text-gray-500 whitespace-nowrap">
                            {tender.completion_percentage || 0}%
                          </span>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <StatusBadge status={tender.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {error && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            Gabim gjatë ngarkimit të tenderëve: {error.message}
          </div>
        )}
      </main>
    </div>
  );
}
