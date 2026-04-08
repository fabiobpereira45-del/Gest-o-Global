-- 🏦 SISTEMA FINANCEIRO 2.0 - IBAD
-- Este script cria as tabelas necessárias para o novo módulo financeiro robusto.

-- 1. Tabela de Transações Financeiras (Fluxo de Caixa)
CREATE TABLE IF NOT EXISTS public.financial_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category TEXT NOT NULL, -- 'Alimento', 'Limpeza', 'Professores', 'Material de Escritório', 'Transporte', 'Pessoal', 'Mensalidade', etc.
    type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
    description TEXT,
    amount DECIMAL(12, 2) NOT NULL DEFAULT 0,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    status TEXT NOT NULL CHECK (status IN ('planned', 'realized')),
    competencia TEXT NOT NULL, -- Formato: YYYY-MM
    discipline_id UUID REFERENCES public.disciplines(id) ON DELETE SET NULL,
    student_id UUID REFERENCES public.students(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexação para busca rápida por competência e status
CREATE INDEX IF NOT EXISTS idx_fin_comp ON public.financial_transactions (competencia);
CREATE INDEX IF NOT EXISTS idx_fin_status ON public.financial_transactions (status);

-- 2. Tabela de Mensalidades de Alunos (25 parcelas p/ currículo)
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
    UNIQUE(student_id, discipline_id) -- Cada aluno tem apenas uma cobrança por disciplina
);

CREATE INDEX IF NOT EXISTS idx_tuition_student ON public.student_tuition (student_id);
CREATE INDEX IF NOT EXISTS idx_tuition_status ON public.student_tuition (status);

-- Habilitar RLS (Row Level Security)
ALTER TABLE public.financial_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_tuition ENABLE ROW LEVEL SECURITY;

-- Políticas de acesso simples para administradores
-- (Assumindo que o sistema é gerido por professores/master)
CREATE POLICY "Full access for authenticated users" ON public.financial_transactions FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Full access for authenticated users" ON public.student_tuition FOR ALL USING (auth.role() = 'authenticated');
