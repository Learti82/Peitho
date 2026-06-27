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

export interface OrganizationRow {
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
}

export interface TenderRow {
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
}

export interface TenderRequirementRow {
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
}

export interface ChecklistItemRow {
  id: string;
  tender_id: string;
  requirement_id: string | null;
  status: ChecklistStatus;
  notes: string | null;
  assigned_to: string | null;
  updated_at: string;
}

export interface Database {
  public: {
    Tables: {
      organizations: {
        Row: OrganizationRow;
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
        Update: {
          name?: string;
          business_number?: string | null;
          tax_number?: string | null;
          city?: string | null;
          category?: string | null;
          contact_email?: string | null;
          contact_phone?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      tenders: {
        Row: TenderRow;
        Insert: {
          id?: string;
          organization_id: string;
          title?: string | null;
          contracting_authority?: string | null;
          category?: TenderCategory | null;
          estimated_value_amount?: number | null;
          estimated_value_currency?: string;
          submission_deadline?: string | null;
          language?: TenderLanguage | null;
          evaluation_method?: EvaluationMethod | null;
          evaluation_weight_technical?: number | null;
          evaluation_weight_financial?: number | null;
          submission_format?: SubmissionFormat | null;
          documents_required?: string[] | null;
          lots?: number | null;
          parsing_confidence?: number | null;
          parsing_warnings?: string[] | null;
          pdf_storage_path: string;
          status?: TenderStatus;
          completion_percentage?: number;
        };
        Update: {
          title?: string | null;
          contracting_authority?: string | null;
          category?: TenderCategory | null;
          estimated_value_amount?: number | null;
          estimated_value_currency?: string;
          submission_deadline?: string | null;
          language?: TenderLanguage | null;
          evaluation_method?: EvaluationMethod | null;
          evaluation_weight_technical?: number | null;
          evaluation_weight_financial?: number | null;
          submission_format?: SubmissionFormat | null;
          documents_required?: string[] | null;
          lots?: number | null;
          parsing_confidence?: number | null;
          parsing_warnings?: string[] | null;
          pdf_storage_path?: string;
          status?: TenderStatus;
          completion_percentage?: number;
        };
        Relationships: [];
      };
      tender_requirements: {
        Row: TenderRequirementRow;
        Insert: {
          id?: string;
          tender_id: string;
          requirement_id?: string | null;
          category: RequirementCategory;
          requirement_text: string;
          evidence_needed?: string | null;
          is_mandatory?: boolean;
          evaluation_weight?: number | null;
          source_page?: number | null;
          source_section?: string | null;
        };
        Update: {
          category?: RequirementCategory;
          requirement_text?: string;
          evidence_needed?: string | null;
          is_mandatory?: boolean;
          evaluation_weight?: number | null;
          source_page?: number | null;
          source_section?: string | null;
        };
        Relationships: [];
      };
      checklist_items: {
        Row: ChecklistItemRow;
        Insert: {
          id?: string;
          tender_id: string;
          requirement_id?: string | null;
          status?: ChecklistStatus;
          notes?: string | null;
          assigned_to?: string | null;
        };
        Update: {
          status?: ChecklistStatus;
          notes?: string | null;
          assigned_to?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}

export type Organization = OrganizationRow;
export type Tender = TenderRow;
export type TenderRequirement = TenderRequirementRow;
export type ChecklistItem = ChecklistItemRow;

export type ChecklistItemWithRequirement = ChecklistItem & {
  tender_requirements: TenderRequirement | null;
};
