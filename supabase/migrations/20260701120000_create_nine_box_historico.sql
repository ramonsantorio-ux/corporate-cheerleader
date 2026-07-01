CREATE TABLE IF NOT EXISTS public.nine_box_historico (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    employee_id UUID REFERENCES public.funcionarios(id) ON DELETE CASCADE,
    desempenho TEXT NOT NULL,
    potencial TEXT NOT NULL,
    cycle TEXT NOT NULL,
    observacao TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- RLS policies
ALTER TABLE public.nine_box_historico ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read access for all users" ON public.nine_box_historico
    FOR SELECT USING (true);

CREATE POLICY "Enable insert for all users" ON public.nine_box_historico
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable update for all users" ON public.nine_box_historico
    FOR UPDATE USING (true);

CREATE POLICY "Enable delete for all users" ON public.nine_box_historico
    FOR DELETE USING (true);
