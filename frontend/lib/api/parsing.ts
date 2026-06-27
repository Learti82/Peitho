"use client";

export interface ParseTenderOptions {
  file: File;
  organizationId: string;
  supabaseJwt: string;
  onProgress?: (stage: string) => void;
}

export interface ParseTenderResult {
  tender_id: string;
  organization_id: string;
  title: string | null;
  contracting_authority: string | null;
  status: string;
  parsing_confidence: number;
  parsing_warnings: string[];
  requirements_count: number;
  checklist_items_count: number;
  pdf_storage_path: string;
  created_at: string;
}

const PARSING_SERVICE_URL =
  process.env.NEXT_PUBLIC_PARSING_SERVICE_URL || "http://localhost:8000";

export async function parseTender(
  options: ParseTenderOptions
): Promise<ParseTenderResult> {
  const { file, organizationId, supabaseJwt, onProgress } = options;

  onProgress?.("Duke ngarkuar dokumentin...");

  const formData = new FormData();
  formData.append("file", file);
  formData.append("organization_id", organizationId);
  formData.append("supabase_jwt", supabaseJwt);

  onProgress?.("Duke nxjerrë tekstin...");

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 120_000); // 120s timeout

  try {
    const response = await fetch(`${PARSING_SERVICE_URL}/parse-tender`, {
      method: "POST",
      body: formData,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      let errorDetail = `HTTP ${response.status}`;
      try {
        const errorJson = await response.json();
        errorDetail = errorJson.detail || errorDetail;
      } catch {
        // ignore JSON parse error
      }
      throw new Error(errorDetail);
    }

    onProgress?.("Duke analizuar kërkesat...");

    const result: ParseTenderResult = await response.json();

    onProgress?.("Duke ndërtuar listën...");

    return result;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error instanceof Error && error.name === "AbortError") {
      throw new Error("Kërkesa ka skaduar (timeout 120s). Provoni sërish.");
    }
    throw error;
  }
}
