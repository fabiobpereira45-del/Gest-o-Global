-- SCRIPT DE PURGA TOTAL: Remoção do Módulo Financeiro
-- Execute este script no SQL Editor do Supabase para limpar os dados residuais.

-- 1. Remover tabelas financeiras
DROP TABLE IF EXISTS public.financial_charges CASCADE;
DROP TABLE IF EXISTS public.financial_settings CASCADE;

-- 2. Remover colunas financeiras da tabela de disciplinas
ALTER TABLE public.disciplines DROP COLUMN IF EXISTS execution_date;

-- 3. Limpar status de matrícula legado (opcional, manter apenas active/inactive)
UPDATE public.students SET status = 'active' WHERE status = 'pending';

-- 4. Remover funções RPC legadas relacionadas a finanças
DROP FUNCTION IF EXISTS public.reset_all_active_students_financials(INT, NUMERIC, JSONB);
DROP FUNCTION IF EXISTS public.reset_single_student_financials(UUID, INT, NUMERIC, JSONB);

-- FIM DO SCRIPT
-- Após executar este script, o banco de dados estará livre de qualquer referência financeira.
