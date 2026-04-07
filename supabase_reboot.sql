-- SCRIPT DE MIGRAÇÃO: Novo Modelo Financeiro Baseado em Disciplinas
-- Execute este script integralmente no SQL Editor do Supabase e clique em "RUN".
-- Este script é IDEMPOTENTE (pode ser rodado múltiplas vezes sem erros).

-- ===========================================================================
-- PARTE 1: NOVAS COLUNAS ESTRUTURAIS
-- ===========================================================================

-- Coluna de Mês/Ano de execução da disciplina (chave para o modelo financeiro)
ALTER TABLE public.disciplines ADD COLUMN IF NOT EXISTS execution_date TEXT; -- formato: YYYY-MM

-- Colunas de configurações financeiras (manter retrocompatibilidade)
ALTER TABLE public.financial_settings ADD COLUMN IF NOT EXISTS installment_dates JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.financial_settings ADD COLUMN IF NOT EXISTS whatsapp_number TEXT;

-- ===========================================================================
-- PARTE 2: TABELA DE CONFIGURAÇÕES DE NOTAS (GRADING)
-- ===========================================================================
CREATE TABLE IF NOT EXISTS public.grading_settings (
  id TEXT PRIMARY KEY DEFAULT 'default',
  points_per_presence NUMERIC DEFAULT 10,
  online_presence_points NUMERIC DEFAULT 10,
  interaction_points NUMERIC DEFAULT 10,
  book_activity_points NUMERIC DEFAULT 10,
  passing_average NUMERIC DEFAULT 70,
  total_divisor NUMERIC DEFAULT 4,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

INSERT INTO public.grading_settings (id) VALUES ('default') ON CONFLICT (id) DO NOTHING;

-- ===========================================================================
-- PARTE 3: TABELAS DE FREQUÊNCIA E NOTAS
-- ===========================================================================
CREATE TABLE IF NOT EXISTS public.attendances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL,
  discipline_id TEXT NOT NULL,
  date TEXT NOT NULL,
  is_present BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.student_grades (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_identifier TEXT NOT NULL,
  student_name TEXT NOT NULL,
  discipline_id TEXT,
  is_public BOOLEAN DEFAULT false,
  is_released BOOLEAN DEFAULT false,
  custom_divisor NUMERIC DEFAULT 4,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.attendances ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'presencial';
ALTER TABLE public.student_grades ADD COLUMN IF NOT EXISTS exam_grade NUMERIC DEFAULT 0;
ALTER TABLE public.student_grades ADD COLUMN IF NOT EXISTS works_grade NUMERIC DEFAULT 0;
ALTER TABLE public.student_grades ADD COLUMN IF NOT EXISTS seminar_grade NUMERIC DEFAULT 0;
ALTER TABLE public.student_grades ADD COLUMN IF NOT EXISTS participation_bonus NUMERIC DEFAULT 0;
ALTER TABLE public.student_grades ADD COLUMN IF NOT EXISTS attendance_score NUMERIC DEFAULT 0;
ALTER TABLE public.student_grades ADD COLUMN IF NOT EXISTS is_released BOOLEAN DEFAULT false;

-- ===========================================================================
-- PARTE 4: LIMPEZA DO MODELO ANTIGO DE MENSALIDADES
-- Remove todas as cobranças do tipo "monthly" que seguiam o padrão antigo
-- "Mensalidade 1/25", "Mensalidade 02/25", etc.
-- As cobranças novas serão geradas pelo sistema com o nome da disciplina.
-- ===========================================================================
DELETE FROM public.financial_charges
WHERE type = 'monthly' AND description ILIKE 'Mensalidade%';

-- ===========================================================================
-- PARTE 5: ÍNDICE DE UNICIDADE (previne duplicatas futuras por disciplina+aluno)
-- ===========================================================================
DROP INDEX IF EXISTS idx_no_duplicate_installments;
CREATE UNIQUE INDEX IF NOT EXISTS idx_no_duplicate_curriculum_charges
ON public.financial_charges (student_id, description)
WHERE type = 'monthly';

-- ===========================================================================
-- PARTE 6: REMOVER RPCs LEGADAS (opcional, mas recomendado para evitar confusão)
-- As funções abaixo não são mais chamadas pelo sistema TypeScript.
-- ===========================================================================
DROP FUNCTION IF EXISTS public.reset_all_active_students_financials(INT, NUMERIC, JSONB);
DROP FUNCTION IF EXISTS public.reset_single_student_financials(UUID, INT, NUMERIC, JSONB);

-- ===========================================================================
-- FIM DO SCRIPT
-- Após executar:
-- 1. Vá para a Grade Curricular e adicione o Mês/Ano em cada disciplina.
-- 2. No Financeiro, clique em "Resetar e Aplicar Currículo (Lote)" para
--    regenerar as carteiras de TODOS os alunos baseado nas disciplinas.
-- ===========================================================================
