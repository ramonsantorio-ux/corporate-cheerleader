
-- Add meeting_type column to meetings table
ALTER TABLE public.meetings ADD COLUMN IF NOT EXISTS meeting_type text NOT NULL DEFAULT '1:1';

-- Add material_url column for PowerPoint/presentation uploads
ALTER TABLE public.meetings ADD COLUMN IF NOT EXISTS material_url text DEFAULT '';

-- Add title column for meeting title
ALTER TABLE public.meetings ADD COLUMN IF NOT EXISTS title text DEFAULT '';

-- Create meeting_attendees table for attendance tracking
CREATE TABLE public.meeting_attendees (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  meeting_id uuid REFERENCES public.meetings(id) ON DELETE CASCADE NOT NULL,
  employee_id uuid REFERENCES public.funcionarios(id) ON DELETE CASCADE NOT NULL,
  present boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(meeting_id, employee_id)
);

ALTER TABLE public.meeting_attendees ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can manage meeting_attendees"
  ON public.meeting_attendees FOR ALL TO authenticated
  USING (true) WITH CHECK (true);

-- Create meeting_action_items table (5W2H structured)
CREATE TABLE public.meeting_action_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  meeting_id uuid REFERENCES public.meetings(id) ON DELETE CASCADE NOT NULL,
  what text NOT NULL DEFAULT '',
  why text DEFAULT '',
  who text NOT NULL DEFAULT '',
  "when" date DEFAULT NULL,
  where_location text DEFAULT '',
  how text DEFAULT '',
  how_much text DEFAULT '',
  status text NOT NULL DEFAULT 'pendente',
  completed_at timestamptz DEFAULT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.meeting_action_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can manage meeting_action_items"
  ON public.meeting_action_items FOR ALL TO authenticated
  USING (true) WITH CHECK (true);

-- Create meeting_documents table for attendance list uploads and materials
CREATE TABLE public.meeting_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  meeting_id uuid REFERENCES public.meetings(id) ON DELETE CASCADE NOT NULL,
  document_type text NOT NULL DEFAULT 'material',
  file_name text NOT NULL DEFAULT '',
  file_url text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.meeting_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can manage meeting_documents"
  ON public.meeting_documents FOR ALL TO authenticated
  USING (true) WITH CHECK (true);
