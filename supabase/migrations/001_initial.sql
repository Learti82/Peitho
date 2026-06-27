-- Peitho Platform - Initial Database Schema
-- Run this in your Supabase SQL editor

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- ENUMS
-- ============================================================

CREATE TYPE tender_category AS ENUM (
  'IT_SERVICES',
  'CONSTRUCTION',
  'CONSULTING',
  'SUPPLIES'
);

CREATE TYPE tender_language AS ENUM ('sq', 'en', 'sq_en');

CREATE TYPE evaluation_method AS ENUM (
  'LOWEST_PRICE',
  'BEST_VALUE',
  'QUALITY_ONLY'
);

CREATE TYPE submission_format AS ENUM ('ELECTRONIC', 'PHYSICAL', 'BOTH');

CREATE TYPE tender_status AS ENUM (
  'UPLOADING',
  'PARSING',
  'PARSED',
  'ERROR'
);

CREATE TYPE requirement_category AS ENUM (
  'ADMINISTRATIVE_ELIGIBILITY',
  'PROFESSIONAL_CAPACITY',
  'TECHNICAL_CAPACITY',
  'FINANCIAL_CAPACITY',
  'TECHNICAL_PROPOSAL',
  'FINANCIAL_PROPOSAL',
  'EVALUATION_CRITERIA',
  'SUBMISSION_REQUIREMENTS'
);

CREATE TYPE checklist_status AS ENUM (
  'NOT_STARTED',
  'IN_PROGRESS',
  'READY',
  'NOT_APPLICABLE'
);

-- ============================================================
-- TABLES
-- ============================================================

-- Organizations table (linked 1:1 with auth.users)
CREATE TABLE organizations (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  business_number text,
  tax_number text,
  city text,
  category text,
  contact_email text,
  contact_phone text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Tenders table
CREATE TABLE tenders (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  title text,
  contracting_authority text,
  category tender_category,
  estimated_value_amount numeric,
  estimated_value_currency text DEFAULT 'EUR',
  submission_deadline timestamptz,
  language tender_language,
  evaluation_method evaluation_method,
  evaluation_weight_technical int,
  evaluation_weight_financial int,
  submission_format submission_format,
  documents_required text[],
  lots int,
  parsing_confidence float,
  parsing_warnings text[],
  pdf_storage_path text NOT NULL,
  status tender_status NOT NULL DEFAULT 'UPLOADING',
  completion_percentage int DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Tender requirements table
CREATE TABLE tender_requirements (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  tender_id uuid NOT NULL REFERENCES tenders(id) ON DELETE CASCADE,
  requirement_id text,
  category requirement_category NOT NULL,
  requirement_text text NOT NULL,
  evidence_needed text,
  is_mandatory bool DEFAULT true,
  evaluation_weight float,
  source_page int,
  source_section text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Checklist items table
CREATE TABLE checklist_items (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  tender_id uuid NOT NULL REFERENCES tenders(id) ON DELETE CASCADE,
  requirement_id uuid REFERENCES tender_requirements(id) ON DELETE SET NULL,
  status checklist_status NOT NULL DEFAULT 'NOT_STARTED',
  notes text,
  assigned_to text,
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- UPDATED_AT TRIGGER FUNCTION
-- ============================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_organizations_updated_at
  BEFORE UPDATE ON organizations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tenders_updated_at
  BEFORE UPDATE ON tenders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_checklist_items_updated_at
  BEFORE UPDATE ON checklist_items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenders ENABLE ROW LEVEL SECURITY;
ALTER TABLE tender_requirements ENABLE ROW LEVEL SECURITY;
ALTER TABLE checklist_items ENABLE ROW LEVEL SECURITY;

-- Organizations policies
CREATE POLICY "Users can view their own organization"
  ON organizations FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can insert their own organization"
  ON organizations FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own organization"
  ON organizations FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can delete their own organization"
  ON organizations FOR DELETE
  USING (auth.uid() = id);

-- Tenders policies
CREATE POLICY "Users can view their own tenders"
  ON tenders FOR SELECT
  USING (organization_id = auth.uid());

CREATE POLICY "Users can insert their own tenders"
  ON tenders FOR INSERT
  WITH CHECK (organization_id = auth.uid());

CREATE POLICY "Users can update their own tenders"
  ON tenders FOR UPDATE
  USING (organization_id = auth.uid())
  WITH CHECK (organization_id = auth.uid());

CREATE POLICY "Users can delete their own tenders"
  ON tenders FOR DELETE
  USING (organization_id = auth.uid());

-- Tender requirements policies (via tender → organization chain)
CREATE POLICY "Users can view requirements for their tenders"
  ON tender_requirements FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM tenders
      WHERE tenders.id = tender_requirements.tender_id
        AND tenders.organization_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert requirements for their tenders"
  ON tender_requirements FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM tenders
      WHERE tenders.id = tender_requirements.tender_id
        AND tenders.organization_id = auth.uid()
    )
  );

CREATE POLICY "Users can update requirements for their tenders"
  ON tender_requirements FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM tenders
      WHERE tenders.id = tender_requirements.tender_id
        AND tenders.organization_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete requirements for their tenders"
  ON tender_requirements FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM tenders
      WHERE tenders.id = tender_requirements.tender_id
        AND tenders.organization_id = auth.uid()
    )
  );

-- Checklist items policies (via tender → organization chain)
CREATE POLICY "Users can view checklist items for their tenders"
  ON checklist_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM tenders
      WHERE tenders.id = checklist_items.tender_id
        AND tenders.organization_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert checklist items for their tenders"
  ON checklist_items FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM tenders
      WHERE tenders.id = checklist_items.tender_id
        AND tenders.organization_id = auth.uid()
    )
  );

CREATE POLICY "Users can update checklist items for their tenders"
  ON checklist_items FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM tenders
      WHERE tenders.id = checklist_items.tender_id
        AND tenders.organization_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete checklist items for their tenders"
  ON checklist_items FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM tenders
      WHERE tenders.id = checklist_items.tender_id
        AND tenders.organization_id = auth.uid()
    )
  );

-- ============================================================
-- SERVICE ROLE BYPASS (for parsing-service)
-- The parsing-service uses the SERVICE_ROLE_KEY which bypasses RLS.
-- This allows the backend to insert tenders on behalf of users.
-- ============================================================

-- ============================================================
-- STORAGE BUCKET SETUP
-- Run these in the Supabase Dashboard > Storage, or via the JS client:
--
-- 1. Create a private bucket named "tender-documents"
--    supabase.storage.createBucket('tender-documents', { public: false })
--
-- 2. Add storage policy: allow authenticated users to read their own files
--    Path pattern: {user_id}/**
--    Policy: (storage.foldername(name))[1] = auth.uid()::text
--
-- 3. The parsing-service uploads via SERVICE_ROLE_KEY (bypasses storage RLS)
--    and stores path as: {organization_id}/{tender_id}/original.pdf
-- ============================================================

-- ============================================================
-- INDEXES
-- ============================================================

CREATE INDEX idx_tenders_organization_id ON tenders(organization_id);
CREATE INDEX idx_tenders_status ON tenders(status);
CREATE INDEX idx_tenders_submission_deadline ON tenders(submission_deadline ASC);
CREATE INDEX idx_tender_requirements_tender_id ON tender_requirements(tender_id);
CREATE INDEX idx_tender_requirements_category ON tender_requirements(category);
CREATE INDEX idx_checklist_items_tender_id ON checklist_items(tender_id);
CREATE INDEX idx_checklist_items_status ON checklist_items(status);
