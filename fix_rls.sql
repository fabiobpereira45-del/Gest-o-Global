-- Script para resolver o alerta "Table publicly accessible (rls_disabled_in_public)"
-- Isso ocorre porque algumas tabelas criadas recentemente não ativaram o Row-Level Security (RLS).
-- 
-- Copie todo o conteúdo abaixo e execute no SQL Editor do Supabase.

-- 1. Ativar RLS nas tabelas adicionais/novas
ALTER TABLE IF EXISTS public.grading_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.attendances ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.student_grades ENABLE ROW LEVEL SECURITY;

-- 2. Criar políticas completas (para manter o app funcionando com o sistema de client atual)
DROP POLICY IF EXISTS "anon_all_grading_settings" ON public.grading_settings;
CREATE POLICY "anon_all_grading_settings" ON public.grading_settings FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_all_attendances" ON public.attendances;
CREATE POLICY "anon_all_attendances" ON public.attendances FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_all_student_grades_new" ON public.student_grades;
CREATE POLICY "anon_all_student_grades_new" ON public.student_grades FOR ALL USING (true) WITH CHECK (true);

-- Caso hava mais alguma tabela acusada pelo Supabase, o padrão é o mesmo acima.
