"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { parseTender } from "@/lib/api/parsing";
import { Navbar } from "@/components/layout/Navbar";
import { UploadDropzone } from "@/components/tender/UploadDropzone";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { Card } from "@/components/ui/Card";
import { Progress } from "@/components/ui/Progress";
import { clsx } from "clsx";
import { CheckCircle2, AlertCircle, Loader2 } from "lucide-react";

const PARSING_STAGES = [
  "Duke ngarkuar dokumentin...",
  "Duke nxjerrë tekstin...",
  "Duke analizuar kërkesat...",
  "Duke ndërtuar listën...",
  "Duke ruajtur të dhënat...",
];

export default function UploadPage() {
  const router = useRouter();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isParsing, setIsParsing] = useState(false);
  const [currentStage, setCurrentStage] = useState("");
  const [stageIndex, setStageIndex] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string>();

  useEffect(() => {
    // Listen for dropzone clear event
    const handler = () => setSelectedFile(null);
    window.addEventListener("dropzone:clear", handler);
    return () => window.removeEventListener("dropzone:clear", handler);
  }, []);

  useEffect(() => {
    // Get user email for navbar
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      setUserEmail(data.user?.email);
    });
  }, []);

  // Animate through stages while parsing
  useEffect(() => {
    if (!isParsing) return;
    const interval = setInterval(() => {
      setStageIndex((prev) =>
        prev < PARSING_STAGES.length - 1 ? prev + 1 : prev
      );
    }, 8000);
    return () => clearInterval(interval);
  }, [isParsing]);

  useEffect(() => {
    setCurrentStage(PARSING_STAGES[stageIndex]);
  }, [stageIndex]);

  async function handleStartParsing() {
    if (!selectedFile) return;
    setError(null);
    setIsParsing(true);
    setStageIndex(0);

    try {
      const supabase = createClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        router.push("/login");
        return;
      }

      const result = await parseTender({
        file: selectedFile,
        organizationId: session.user.id,
        supabaseJwt: session.access_token,
        onProgress: (stage) => setCurrentStage(stage),
      });

      // Navigate to tender view on success
      router.push(`/tender/${result.tender_id}`);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Ndodhi një gabim gjatë analizimit. Provoni sërish."
      );
      setIsParsing(false);
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar userEmail={userEmail} />

      <main className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-primary">
            Ngarko Tender të Ri
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Ngarkoni dokumentin PDF të tenderit dhe AI-ja do të analizojë
            automatikisht të gjitha kërkesat
          </p>
        </div>

        {error && (
          <Alert
            variant="error"
            title="Gabim gjatë analizimit"
            className="mb-6"
            onDismiss={() => setError(null)}
          >
            {error}
          </Alert>
        )}

        {isParsing ? (
          <Card className="text-center py-12 space-y-6">
            <div className="flex items-center justify-center">
              <div className="relative">
                <div className="w-20 h-20 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <Loader2 className="h-8 w-8 text-primary animate-spin" />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <h3 className="text-lg font-semibold text-primary">
                Duke analizuar tenderin...
              </h3>
              <p className="text-sm text-gray-500 min-h-[20px] transition-all duration-500">
                {currentStage}
              </p>
            </div>

            {/* Stage indicators */}
            <div className="flex items-center justify-center gap-2">
              {PARSING_STAGES.map((stage, i) => (
                <div
                  key={stage}
                  className={clsx(
                    "rounded-full transition-all duration-300",
                    i < stageIndex
                      ? "w-2 h-2 bg-green-500"
                      : i === stageIndex
                      ? "w-3 h-3 bg-primary"
                      : "w-2 h-2 bg-gray-200"
                  )}
                />
              ))}
            </div>

            <p className="text-xs text-gray-400">
              Ky proces mund të zgjasë deri në 60 sekonda
            </p>
          </Card>
        ) : (
          <div className="space-y-6">
            <Card>
              <h2 className="text-base font-semibold text-gray-800 mb-4">
                Zgjidhni dokumentin PDF
              </h2>
              <UploadDropzone
                onFileSelected={setSelectedFile}
                selectedFile={selectedFile}
                disabled={isParsing}
              />
            </Card>

            {selectedFile && (
              <div className="space-y-3">
                <Card padding="sm" className="bg-blue-50 border-blue-200">
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <div className="text-sm text-blue-800">
                      <p className="font-semibold">Skedari është gati</p>
                      <p className="text-blue-600 mt-0.5">
                        AI-ja do të analizojë dokumentin dhe do të identifikojë
                        automatikisht të gjitha kërkesat e tenderit.
                      </p>
                    </div>
                  </div>
                </Card>

                <Button
                  onClick={handleStartParsing}
                  fullWidth
                  size="lg"
                  variant="secondary"
                  disabled={isParsing}
                >
                  Fillo Analizimin
                </Button>
              </div>
            )}

            <Card padding="sm" className="bg-gray-50 border-gray-100">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-4 w-4 text-gray-400 flex-shrink-0 mt-0.5" />
                <div className="text-xs text-gray-500 space-y-1">
                  <p className="font-medium text-gray-600">Informacion:</p>
                  <ul className="list-disc list-inside space-y-0.5">
                    <li>Pranohen vetëm skedarë PDF (maksimumi 50MB)</li>
                    <li>Dokumenti duhet të jetë i lexueshëm (jo i skanuar pa OCR)</li>
                    <li>Analizimi mund të zgjasë deri në 60-120 sekonda</li>
                    <li>Mbështeten dokumentet shqip dhe anglisht</li>
                  </ul>
                </div>
              </div>
            </Card>
          </div>
        )}
      </main>
    </div>
  );
}
