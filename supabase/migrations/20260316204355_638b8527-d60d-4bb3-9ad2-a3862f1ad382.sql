
CREATE TABLE public.events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_date DATE NOT NULL,
  event_time TEXT DEFAULT '',
  day_of_week TEXT DEFAULT '',
  description TEXT NOT NULL DEFAULT '',
  location TEXT DEFAULT '',
  contract TEXT DEFAULT 'PORTO',
  equipment TEXT DEFAULT '',
  plate_tag TEXT DEFAULT '',
  shift TEXT DEFAULT '',
  supervisor TEXT DEFAULT '',
  involved_name TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can manage events"
  ON public.events
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);
