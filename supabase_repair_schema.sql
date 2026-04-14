-- 🛠️ SCRIPT DE REPARO E COMPLEMENTO (CHAT E FINANCEIRO) - IBAD
-- Execute este script no SQL Editor do Supabase para corrigir tabelas faltantes e políticas.

-- 1. Tabela de Chat (MENSAGENS)
CREATE TABLE IF NOT EXISTS public.chats (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    discipline_id UUID NOT NULL REFERENCES public.disciplines(id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    is_from_student BOOLEAN DEFAULT TRUE,
    read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Tabela de Transações Financeiras
CREATE TABLE IF NOT EXISTS public.financial_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    category TEXT NOT NULL,
    type TEXT CHECK (type IN ('income', 'expense')),
    description TEXT,
    amount NUMERIC(10,2) NOT NULL DEFAULT 0,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    status TEXT CHECK (status IN ('planned', 'realized')),
    competencia TEXT,
    discipline_id UUID REFERENCES public.disciplines(id) ON DELETE SET NULL,
    student_id UUID REFERENCES public.students(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Tabela de Mensalidades (CARNÊS)
CREATE TABLE IF NOT EXISTS public.student_tuition (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    discipline_id UUID REFERENCES public.disciplines(id) ON DELETE SET NULL,
    amount NUMERIC(10,2) NOT NULL DEFAULT 300,
    due_date DATE,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'late', 'cancelled')),
    paid_at TIMESTAMPTZ,
    transaction_id UUID REFERENCES public.financial_transactions(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Reparo de tabelas anteriores (Vínculos e Membros)
CREATE TABLE IF NOT EXISTS public.professor_disciplines (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    professor_id UUID NOT NULL REFERENCES public.professor_accounts(id) ON DELETE CASCADE,
    discipline_id UUID NOT NULL REFERENCES public.disciplines(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(professor_id, discipline_id)
);

CREATE TABLE IF NOT EXISTS public.board_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    role TEXT,
    category TEXT,
    avatar_url TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 5. Habilitar RLS e Criar Políticas
ALTER TABLE public.chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financial_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_tuition ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.professor_disciplines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.board_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.professor_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance_finalizations ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
    -- Política para Chats
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow all for chats' AND tablename = 'chats') THEN
        CREATE POLICY "Allow all for chats" ON public.chats FOR ALL USING (true) WITH CHECK (true);
    END IF;

    -- Política para transações
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow all for financial' AND tablename = 'financial_transactions') THEN
        CREATE POLICY "Allow all for financial" ON public.financial_transactions FOR ALL USING (true) WITH CHECK (true);
    END IF;

    -- Política para mensalidades
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow all for tuition' AND tablename = 'student_tuition') THEN
        CREATE POLICY "Allow all for tuition" ON public.student_tuition FOR ALL USING (true) WITH CHECK (true);
    END IF;

    -- Política para vínculos
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow all for prof_disc' AND tablename = 'professor_disciplines') THEN
        CREATE POLICY "Allow all for prof_disc" ON public.professor_disciplines FOR ALL USING (true) WITH CHECK (true);
    END IF;

    -- Política para diretoria
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow all for board' AND tablename = 'board_members') THEN
        CREATE POLICY "Allow all for board" ON public.board_members FOR ALL USING (true) WITH CHECK (true);
    END IF;

    -- Política para professores
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow all for prof_accounts' AND tablename = 'professor_accounts') THEN
        CREATE POLICY "Allow all for prof_accounts" ON public.professor_accounts FOR ALL USING (true) WITH CHECK (true);
    END IF;

    -- Política para trancamento de chamada
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'anon_all_attendance_finalizations' AND tablename = 'attendance_finalizations') THEN
        CREATE POLICY "anon_all_attendance_finalizations" ON public.attendance_finalizations FOR ALL USING (true) WITH CHECK (true);
    END IF;
END $$;
