-- 🛠️ SCRIPT DE REPARO E COMPLEMENTO - IBAD
-- Execute este script no SQL Editor do Supabase para corrigir tabelas faltantes e políticas.

-- 1. Tabela de Vínculo Professor-Disciplina (MUITO IMPORTANTE)
CREATE TABLE IF NOT EXISTS public.professor_disciplines (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    professor_id UUID NOT NULL REFERENCES public.professor_accounts(id) ON DELETE CASCADE,
    discipline_id UUID NOT NULL REFERENCES public.disciplines(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(professor_id, discipline_id)
);

-- 2. Tabela de Membros da Diretoria
CREATE TABLE IF NOT EXISTS public.board_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    role TEXT,
    category TEXT,
    avatar_url TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Grade de Horários
CREATE TABLE IF NOT EXISTS public.class_schedules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
    discipline_id UUID NOT NULL REFERENCES public.disciplines(id) ON DELETE CASCADE,
    professor_name TEXT,
    day_of_week TEXT,
    time_start TEXT,
    time_end TEXT,
    lessons_count INTEGER DEFAULT 1,
    workload INTEGER DEFAULT 0,
    start_date DATE,
    end_date DATE,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Habilitar RLS e Criar Políticas (Garante que a App consiga ler os dados)
ALTER TABLE public.professor_disciplines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.board_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.class_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.professor_accounts ENABLE ROW LEVEL SECURITY;

-- Políticas Unificadas (Permitindo acesso para anon/authenticated conforme seu padrão)
DO $$ 
BEGIN
    -- professor_disciplines
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow all for authenticated' AND tablename = 'professor_disciplines') THEN
        CREATE POLICY "Allow all for authenticated" ON public.professor_disciplines FOR ALL USING (true) WITH CHECK (true);
    END IF;

    -- board_members
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow all for authenticated' AND tablename = 'board_members') THEN
        CREATE POLICY "Allow all for authenticated" ON public.board_members FOR ALL USING (true) WITH CHECK (true);
    END IF;

    -- class_schedules
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow all for authenticated' AND tablename = 'class_schedules') THEN
        CREATE POLICY "Allow all for authenticated" ON public.class_schedules FOR ALL USING (true) WITH CHECK (true);
    END IF;

    -- professor_accounts (Garantir que seja legível)
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow all for authenticated' AND tablename = 'professor_accounts') THEN
        CREATE POLICY "Allow all for authenticated" ON public.professor_accounts FOR ALL USING (true) WITH CHECK (true);
    END IF;
END $$;
