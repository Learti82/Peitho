/**
 * Supabase database types for Peitho.
 * These mirror the schema in supabase/migrations/001_initial.sql
 */

export type TenderCategory = "IT_SERVICES" | "CONSTRUCTION" | "CONSULTING" | "SUPPLIES";
export type TenderLanguage = "sq" | "en" | "sq_en";
export type EvaluationMethod = "LOWEST_PRICE" | "BEST_VALUE" | "QUALITY_ONLY";
export type SubmissionFormat = "ELECTRONIC" | "PHYSICAL" | "BOTH";
export type TenderStatus = "UPLOADING" | "PARSING" | "PARSED" | "ERROR";
export type RequirementCategory =
  | "ADMINISTRATIVE_ELIGIBILITY"
  | "PROFESSIONAL_CAPACITY"
  | "TECHNICAL_CAPACITY"
  | "FINANCIAL_CAPACITY"
  | "TECHNICAL_PROPOSAL"
  | "FINANCIAL_PROPOSAL"
  | "EVALUATION_CRITERIA"
  | "SUBMISSION_REQUIREMENTS";
export type ChecklistStatus = "NOT_STARTED" | "IN_PROGRESS" | "READY" | "NOT_APPLICABLE";

export interface Database {
  public: {
    Tables: {
      organizations: {
        Row: {
          id: string;
          name: string;
          business_number: string | null;
          tax_number: string | null;
          city: string | null;
          category: string | null;
          contact_email: string | null;
          contact_phone: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          name: string;
          business_number?: string | null;
          tax_number?: string | null;
          city?: string | null;
          category?: string | null;
          contact_email?: string | null;
          contact_phone?: string | null;
        };
        Update: Partial<{
          name: string;
          business_number: string | null;
          tax_number: string | null;
          city: string | null;
          category: string | null;
          contact_email: string | null;
          contact_phone: string | null;
        }>;
      };
      tenders: {
        Row: {
          id: string;
          organization_id: string;
          title: string | null;
          contracting_authority: string | null;
          category: TenderCategory | null;
          estimated_value_amount: number | null;
          estimated_value_currency: string;
          submission_deadline: string | null;
          language: TenderLanguage | null;
          evaluation_method: EvaluationMethod | null;
          evaluation_weight_technical: number | null;
          evaluation_weight_financial: number | null;
          submission_format: SubmissionFormat | null;
          documents_required: string[] | null;
          lots: number | null;
          parsing_confidence: number | null;
          parsing_warnings: string[] | null;
          pdf_storage_path: string;
          status: TenderStatus;
          completion_percentage: number;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["tenders"]["Row"], "created_at" | "updated_at">;
        Update: Partial<Database["public"]["Tables"]["tenders"]["Row"]>;
      };
      tender_requirements: {
        Row: {
          id: string;
          tender_id: string;
          requirement_id: string | null;
          category: RequirementCategory;
          requirement_text: string;
          evidence_needed: string | null;
          is_mandatory: boolean;
          evaluation_weight: number | null;
          source_page: number | null;
          source_section: string | null;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["tender_requirements"]["Row"], "id" | "created_at">;
        Update: Partial<Database["public"]["Tables"]["tender_requirements"]["Row"]>;
      };
      checklist_items: {
        Row: {
          id: string;
          tender_id: string;
          requirement_id: string | null;
          status: ChecklistStatus;
          notes: string | null;
          assigned_to: string | null;
          updated_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["checklist_items"]["Row"], "id" | "updated_at">;
        Update: Partial<Database["public"]["Tables"]["checklist_items"]["Row"]>;
      };
    };
  };
}

// Joined types used across the app
export type Tender = Database["public"]["Tables"]["tenders"]["Row"];
export type Organization = Database["public"]["Tables"]["organizations"]["Row"];
export type TenderRequirement = Database["public"]["Tables"]["tender_requirements"]["Row"];
export type ChecklistItem = Database["public"]["Tables"]["checklist_items"]["Row"];

export type ChecklistItemWithRequirement = ChecklistItem & {
  tender_requirements: TenderRequirement | null;
};
