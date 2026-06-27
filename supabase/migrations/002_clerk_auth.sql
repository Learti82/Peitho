-- Peitho Platform - Migration to Clerk authentication
-- Run this in your Supabase SQL editor AFTER configuring Clerk as a
-- Third-Party Auth provider (Authentication > Sign In / Up > Third Party Auth).
--
-- This migration switches identity from Supabase Auth (auth.uid(), a uuid)
-- to Clerk (auth.jwt()->>'sub', a text id like "user_2abc..."). Because the
-- id type changes from uuid to text, the user-owned tables are rebuilt.
--
-- WARNING: this drops existing tender data. Safe for a fresh project.

-- ============================================================
-- DROP OLD USER TABLES (enums, triggers, function are reused)
-- ============================================================

DROP TABLE IF EXISTS checklist_items CASCADE;
DROP TABLE IF EXISTS tender_requirements CASCADE;
DROP TABLE IF EXISTS tenders CASCADE;
DROP TABLE IF EXISTS organizations CASCADE;

-- ============================================================
-- HELPER: current Clerk user id from the JWT
-- ============================================================

CREATE OR REPLACE FUNCTION requesting_user_id()
RETURNS text AS $$
  SELECT NULLIF(current_setting('request.jwt.claims', true)::json->>'sub', '')::text;
$$ LANGUAGE sql STABLE;

-- ============================================================
-- TABLES (Clerk user id = text)
-- ============================================================

-- One organization per Clerk user; id holds the Clerk user id (the JWT "sub").
CREATE TABLE organizations (
  id text PRIMARY KEY,
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

CREATE TABLE tenders (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id text NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
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
-- UPDATED_AT TRIGGERS (function created in 001)
-- ============================================================

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
-- ROW LEVEL SECURITY (Clerk: requesting_user_id())
-- ============================================================

ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenders ENABLE ROW LEVEL SECURITY;
ALTER TABLE tender_requirements ENABLE ROW LEVEL SECURITY;
ALTER TABLE checklist_items ENABLE ROW LEVEL SECURITY;

-- Organizations
CREATE POLICY "org_select" ON organizations FOR SELECT
  USING (id = requesting_user_id());
CREATE POLICY "org_insert" ON organizations FOR INSERT
  WITH CHECK (id = requesting_user_id());
CREATE POLICY "org_update" ON organizations FOR UPDATE
  USING (id = requesting_user_id()) WITH CHECK (id = requesting_user_id());
CREATE POLICY "org_delete" ON organizations FOR DELETE
  USING (id = requesting_user_id());

-- Tenders
CREATE POLICY "tenders_select" ON tenders FOR SELECT
  USING (organization_id = requesting_user_id());
CREATE POLICY "tenders_insert" ON tenders FOR INSERT
  WITH CHECK (organization_id = requesting_user_id());
CREATE POLICY "tenders_update" ON tenders FOR UPDATE
  USING (organization_id = requesting_user_id())
  WITH CHECK (organization_id = requesting_user_id());
CREATE POLICY "tenders_delete" ON tenders FOR DELETE
  USING (organization_id = requesting_user_id());

-- Tender requirements (via tender -> organization chain)
CREATE POLICY "req_select" ON tender_requirements FOR SELECT
  USING (EXISTS (SELECT 1 FROM tenders t WHERE t.id = tender_requirements.tender_id AND t.organization_id = requesting_user_id()));
CREATE POLICY "req_insert" ON tender_requirements FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM tenders t WHERE t.id = tender_requirements.tender_id AND t.organization_id = requesting_user_id()));
CREATE POLICY "req_update" ON tender_requirements FOR UPDATE
  USING (EXISTS (SELECT 1 FROM tenders t WHERE t.id = tender_requirements.tender_id AND t.organization_id = requesting_user_id()));
CREATE POLICY "req_delete" ON tender_requirements FOR DELETE
  USING (EXISTS (SELECT 1 FROM tenders t WHERE t.id = tender_requirements.tender_id AND t.organization_id = requesting_user_id()));

-- Checklist items (via tender -> organization chain)
CREATE POLICY "chk_select" ON checklist_items FOR SELECT
  USING (EXISTS (SELECT 1 FROM tenders t WHERE t.id = checklist_items.tender_id AND t.organization_id = requesting_user_id()));
CREATE POLICY "chk_insert" ON checklist_items FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM tenders t WHERE t.id = checklist_items.tender_id AND t.organization_id = requesting_user_id()));
CREATE POLICY "chk_update" ON checklist_items FOR UPDATE
  USING (EXISTS (SELECT 1 FROM tenders t WHERE t.id = checklist_items.tender_id AND t.organization_id = requesting_user_id()));
CREATE POLICY "chk_delete" ON checklist_items FOR DELETE
  USING (EXISTS (SELECT 1 FROM tenders t WHERE t.id = checklist_items.tender_id AND t.organization_id = requesting_user_id()));

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

-- ============================================================
-- STORAGE: update policy for Clerk (bucket "tender-pdfs")
-- The first path segment is the Clerk user id (organization_id).
-- Run after creating the bucket. The parsing-service uses the
-- SERVICE_ROLE_KEY and bypasses these policies.
-- ============================================================

DROP POLICY IF EXISTS "Users manage own files" ON storage.objects;
CREATE POLICY "Users manage own files" ON storage.objects
  FOR ALL
  USING (bucket_id = 'tender-pdfs' AND (storage.foldername(name))[1] = requesting_user_id())
  WITH CHECK (bucket_id = 'tender-pdfs' AND (storage.foldername(name))[1] = requesting_user_id());
