-- Create assessment_results table
CREATE TABLE IF NOT EXISTS public.assessment_results (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('disc', 'mbti', 'bigfive', 'gallup', 'lpi')),
    result_data JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.assessment_results ENABLE ROW LEVEL SECURITY;

-- Policies for assessment_results
CREATE POLICY "Users can view their own assessment results" 
    ON public.assessment_results FOR SELECT 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own assessment results" 
    ON public.assessment_results FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all assessment results" 
    ON public.assessment_results FOR SELECT 
    USING (
        EXISTS (
            SELECT 1 FROM user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin'
        )
    );

CREATE POLICY "Admins can insert all assessment results" 
    ON public.assessment_results FOR INSERT 
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin'
        )
    );

CREATE POLICY "Admins can update all assessment results" 
    ON public.assessment_results FOR UPDATE 
    USING (
        EXISTS (
            SELECT 1 FROM user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin'
        )
    );

CREATE POLICY "Admins can delete all assessment results" 
    ON public.assessment_results FOR DELETE 
    USING (
        EXISTS (
            SELECT 1 FROM user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin'
        )
    );

-- Create feedback_360_cycles table
CREATE TABLE IF NOT EXISTS public.feedback_360_cycles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('draft', 'active', 'completed')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.feedback_360_cycles ENABLE ROW LEVEL SECURITY;

-- Policies for feedback_360_cycles
CREATE POLICY "Anyone can view active and completed cycles" 
    ON public.feedback_360_cycles FOR SELECT 
    USING (status IN ('active', 'completed'));

CREATE POLICY "Admins have full access to feedback_360_cycles" 
    ON public.feedback_360_cycles FOR ALL 
    USING (
        EXISTS (
            SELECT 1 FROM user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin'
        )
    );

-- Create feedback_360_participants table
CREATE TABLE IF NOT EXISTS public.feedback_360_participants (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    cycle_id UUID NOT NULL REFERENCES public.feedback_360_cycles(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE, -- The leader being evaluated
    evaluator_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE, -- The person evaluating
    relationship TEXT NOT NULL CHECK (relationship IN ('self', 'manager', 'peer', 'subordinate')),
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.feedback_360_participants ENABLE ROW LEVEL SECURITY;

-- Policies for feedback_360_participants
CREATE POLICY "Evaluators can view their pending/completed evaluations" 
    ON public.feedback_360_participants FOR SELECT 
    USING (auth.uid() = evaluator_id);

CREATE POLICY "Evaluators can update their own evaluation status" 
    ON public.feedback_360_participants FOR UPDATE 
    USING (auth.uid() = evaluator_id);

CREATE POLICY "Users can view their own feedback participants if cycle is completed" 
    ON public.feedback_360_participants FOR SELECT 
    USING (
        auth.uid() = user_id AND 
        EXISTS (
            SELECT 1 FROM feedback_360_cycles WHERE feedback_360_cycles.id = cycle_id AND feedback_360_cycles.status = 'completed'
        )
    );

CREATE POLICY "Admins have full access to feedback_360_participants" 
    ON public.feedback_360_participants FOR ALL 
    USING (
        EXISTS (
            SELECT 1 FROM user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin'
        )
    );

-- Create feedback_360_responses table
CREATE TABLE IF NOT EXISTS public.feedback_360_responses (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    participant_id UUID NOT NULL REFERENCES public.feedback_360_participants(id) ON DELETE CASCADE,
    category TEXT NOT NULL,
    question TEXT NOT NULL,
    score INTEGER NOT NULL CHECK (score >= 1 AND score <= 10),
    comment TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.feedback_360_responses ENABLE ROW LEVEL SECURITY;

-- Policies for feedback_360_responses
CREATE POLICY "Evaluators can view and insert their own responses" 
    ON public.feedback_360_responses FOR ALL 
    USING (
        EXISTS (
            SELECT 1 FROM feedback_360_participants WHERE feedback_360_participants.id = participant_id AND feedback_360_participants.evaluator_id = auth.uid()
        )
    );

CREATE POLICY "Users can view responses about them if cycle is completed (anonymous)" 
    ON public.feedback_360_responses FOR SELECT 
    USING (
        EXISTS (
            SELECT 1 FROM feedback_360_participants p
            JOIN feedback_360_cycles c ON c.id = p.cycle_id
            WHERE p.id = participant_id AND p.user_id = auth.uid() AND c.status = 'completed'
        )
    );

CREATE POLICY "Admins have full access to feedback_360_responses" 
    ON public.feedback_360_responses FOR ALL 
    USING (
        EXISTS (
            SELECT 1 FROM user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin'
        )
    );
