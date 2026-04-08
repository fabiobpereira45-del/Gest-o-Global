-- 🏛️ SCRIPT DE CONFIGURAÇÃO TOTAL - IBAD (NOVA BASE)
-- Execute este script no SQL Editor do seu novo projeto Supabase.

-- 1. EXTENSÕES
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. TABELAS ACADÊMICAS
CREATE TABLE IF NOT EXISTS public.semesters (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    shift TEXT,
    is_completed BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.disciplines (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT,
    semester_id UUID REFERENCES public.semesters(id) ON DELETE SET NULL,
    professor_name TEXT,
    day_of_week TEXT,
    shift TEXT,
    "order" INTEGER DEFAULT 0,
    is_realized BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.classes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    shift TEXT NOT NULL,
    day_of_week TEXT,
    max_students INTEGER DEFAULT 30,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.students (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    auth_user_id UUID UNIQUE, -- Link para auth.users
    name TEXT NOT NULL,
    cpf TEXT,
    email TEXT,
    enrollment_number TEXT UNIQUE,
    phone TEXT,
    church TEXT,
    pastor_name TEXT,
    class_id UUID REFERENCES public.classes(id) ON DELETE SET NULL,
    avatar_url TEXT,
    bio TEXT,
    status TEXT DEFAULT 'pending', -- 'pending', 'active', 'inactive'
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.grading_settings (
    id TEXT PRIMARY KEY DEFAULT 'default',
    points_per_presence DECIMAL DEFAULT 10,
    online_presence_points DECIMAL DEFAULT 10,
    interaction_points DECIMAL DEFAULT 10,
    book_activity_points DECIMAL DEFAULT 10,
    passing_average DECIMAL DEFAULT 70,
    total_divisor DECIMAL DEFAULT 4,
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.assessments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    discipline_id UUID REFERENCES public.disciplines(id) ON DELETE CASCADE,
    professor TEXT,
    institution TEXT,
    question_ids TEXT[],
    points_per_question DECIMAL,
    total_points DECIMAL,
    open_at TIMESTAMPTZ,
    close_at TIMESTAMPTZ,
    is_published BOOLEAN DEFAULT false,
    archived BOOLEAN DEFAULT false,
    shuffle_variants BOOLEAN DEFAULT false,
    time_limit_minutes INTEGER,
    logo_base64 TEXT,
    rules TEXT,
    release_results BOOLEAN DEFAULT false,
    modality TEXT DEFAULT 'public',
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.questions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    discipline_id UUID REFERENCES public.disciplines(id) ON DELETE CASCADE,
    type TEXT NOT NULL,
    text TEXT NOT NULL,
    choices JSONB,
    correct_answer TEXT,
    points DECIMAL DEFAULT 1,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.student_submissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    assessment_id UUID REFERENCES public.assessments(id) ON DELETE CASCADE,
    student_name TEXT,
    student_email TEXT,
    answers JSONB,
    score DECIMAL,
    total_points DECIMAL,
    percentage DECIMAL,
    submitted_at TIMESTAMPTZ DEFAULT now(),
    time_elapsed_seconds INTEGER,
    focus_lost_count INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS public.student_grades (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_identifier TEXT NOT NULL, -- CPF ou Email
    student_name TEXT,
    discipline_id UUID REFERENCES public.disciplines(id) ON DELETE CASCADE,
    is_public BOOLEAN DEFAULT true,
    exam_grade DECIMAL DEFAULT 0,
    works_grade DECIMAL DEFAULT 0,
    seminar_grade DECIMAL DEFAULT 0,
    participation_bonus DECIMAL DEFAULT 0,
    attendance_score DECIMAL DEFAULT 0,
    custom_divisor DECIMAL DEFAULT 4,
    is_released BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.professor_accounts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT,
    role TEXT DEFAULT 'professor', -- 'master' | 'professor'
    avatar_url TEXT,
    bio TEXT,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.attendance (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID REFERENCES public.students(id) ON DELETE CASCADE,
    discipline_id UUID REFERENCES public.disciplines(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    is_present BOOLEAN DEFAULT true,
    type TEXT DEFAULT 'presencial',
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.chat_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID NOT NULL,
    discipline_id UUID NOT NULL,
    message TEXT NOT NULL,
    is_from_student BOOLEAN DEFAULT true,
    read BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.study_materials (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    discipline_id UUID REFERENCES public.disciplines(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    file_url TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. TABELAS FINANCEIRAS 2.0
CREATE TABLE IF NOT EXISTS public.financial_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
    description TEXT,
    amount DECIMAL(12, 2) NOT NULL DEFAULT 0,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    status TEXT NOT NULL CHECK (status IN ('planned', 'realized')),
    competencia TEXT NOT NULL,
    discipline_id UUID REFERENCES public.disciplines(id) ON DELETE SET NULL,
    student_id UUID REFERENCES public.students(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.student_tuition (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    discipline_id UUID NOT NULL REFERENCES public.disciplines(id) ON DELETE CASCADE,
    amount DECIMAL(12, 2) NOT NULL DEFAULT 300.00,
    due_date DATE,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'overdue')),
    paid_at TIMESTAMPTZ,
    transaction_id UUID REFERENCES public.financial_transactions(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(student_id, discipline_id)
);

-- 4. DADOS INICIAIS (DISCIPLINAS OFICIAIS)
INSERT INTO public.grading_settings (id) VALUES ('default') ON CONFLICT DO NOTHING;

INSERT INTO public.disciplines (name, "order") VALUES 
('Hermenêutica', 1), ('Introdução Bíblica', 2), ('Teologia Sistemática', 3), ('Pentateuco', 4),
('Livros Históricos', 5), ('Livros Poéticos', 6), ('Profetas', 7), ('História da Igreja', 8),
('Maneiras e Costumes', 9), ('Cristologia', 10), ('Geografia Bíblica', 11), ('Introdução ao Novo Testament', 12),
('Evangelhos e Atos', 13), ('Epístolas Paulíneas', 14), ('Hebreus e Epístolas Gerais', 15), ('Escatologia', 16),
('Religiões Comparadas', 17), ('Missiologia', 18), ('Evangelismo', 19), ('Fundamentos da Psicologia e do Aconselhamento', 20),
('Teologia Pastoral', 21), ('Homilética', 22), ('Escola Bíblica Dominical', 23), ('Evidência Cristã', 24), ('Português', 25)
ON CONFLICT DO NOTHING;

-- 5. SEGURANÇA (RLS)
ALTER TABLE public.semesters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.disciplines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financial_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_tuition ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all for authenticated" ON public.semesters FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow all for authenticated" ON public.disciplines FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow all for authenticated" ON public.classes FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow all for authenticated" ON public.students FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow all for authenticated" ON public.assessments FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow all for authenticated" ON public.questions FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow all for authenticated" ON public.financial_transactions FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow all for authenticated" ON public.student_tuition FOR ALL USING (auth.role() = 'authenticated');
