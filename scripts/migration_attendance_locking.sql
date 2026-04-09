-- Migration: Attendance Locking Mechanism
CREATE TABLE IF NOT EXISTS public.attendance_finalizations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    discipline_id UUID REFERENCES public.disciplines(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    finalized_by UUID REFERENCES public.professor_accounts(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(discipline_id, date)
);

-- Enable RLS
ALTER TABLE public.attendance_finalizations ENABLE ROW LEVEL SECURITY;

-- Policy: Allow all for authenticated users
CREATE POLICY "Allow all for authenticated" ON public.attendance_finalizations FOR ALL USING (auth.role() = 'authenticated');
