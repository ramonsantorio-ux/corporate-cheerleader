
-- Daily attendance records (ponto diário)
CREATE TABLE public.daily_attendance (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid NOT NULL REFERENCES public.funcionarios(id) ON DELETE CASCADE,
  date date NOT NULL DEFAULT CURRENT_DATE,
  status text NOT NULL DEFAULT 'presente',
  observation text DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(employee_id, date)
);

-- Vacation control (controle de férias)
CREATE TABLE public.vacation_control (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid NOT NULL REFERENCES public.funcionarios(id) ON DELETE CASCADE,
  last_vacation_year1 text DEFAULT '',
  last_vacation_year2 text DEFAULT '',
  days_count integer DEFAULT 30,
  scheduled_month text DEFAULT '',
  start_date date,
  end_date date,
  remaining_days integer,
  observation text DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(employee_id)
);

-- Overtime control (controle de extras - máx 3)
CREATE TABLE public.overtime_control (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid NOT NULL REFERENCES public.funcionarios(id) ON DELETE CASCADE,
  period_start date NOT NULL,
  period_end date NOT NULL,
  extras_count integer NOT NULL DEFAULT 0,
  max_extras integer NOT NULL DEFAULT 3,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(employee_id, period_start, period_end)
);

-- Enable RLS
ALTER TABLE public.daily_attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vacation_control ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.overtime_control ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Authenticated users can manage daily_attendance" ON public.daily_attendance FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated users can manage vacation_control" ON public.vacation_control FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated users can manage overtime_control" ON public.overtime_control FOR ALL TO authenticated USING (true) WITH CHECK (true);
