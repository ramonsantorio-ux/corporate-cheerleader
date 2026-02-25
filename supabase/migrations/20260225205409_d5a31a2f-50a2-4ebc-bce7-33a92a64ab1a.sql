-- Add pos-graduação fields to funcionarios
ALTER TABLE public.funcionarios ADD COLUMN pos_graduacao boolean DEFAULT false NOT NULL;
ALTER TABLE public.funcionarios ADD COLUMN pos_graduacao_tipo text DEFAULT '' NOT NULL;

-- Create employee_documents table for file uploads (CNH, certificates, etc.)
CREATE TABLE public.employee_documents (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id uuid NOT NULL REFERENCES public.funcionarios(id) ON DELETE CASCADE,
  file_url text NOT NULL,
  file_name text NOT NULL DEFAULT '',
  document_type text NOT NULL DEFAULT 'geral',
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.employee_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can manage employee_documents" ON public.employee_documents
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Create storage bucket for employee documents
INSERT INTO storage.buckets (id, name, public) VALUES ('documentos', 'documentos', true);

-- Storage policies for documentos bucket
CREATE POLICY "Authenticated users can upload documents" ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (bucket_id = 'documentos');

CREATE POLICY "Authenticated users can view documents" ON storage.objects
  FOR SELECT TO authenticated USING (bucket_id = 'documentos');

CREATE POLICY "Authenticated users can delete documents" ON storage.objects
  FOR DELETE TO authenticated USING (bucket_id = 'documentos');
