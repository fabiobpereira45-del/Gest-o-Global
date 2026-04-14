-- 🛠️ SCRIPT DE CORREÇÃO: PERSISTÊNCIA DE NOTAS - IBAD
-- Execute este script no SQL Editor do Supabase para evitar duplicatas e fixar o salvamento.

-- 1. Limpar duplicatas (mantendo apenas o registro mais recente para cada aluno/disciplina)
DELETE FROM public.student_grades a
USING public.student_grades b
WHERE a.id < b.id 
  AND a.student_identifier = b.student_identifier 
  AND (a.discipline_id IS NOT DISTINCT FROM b.discipline_id);

-- 2. Adicionar restrição ÚNICA para garantir que o 'upsert' funcione corretamente
-- Primeiro removemos se já existir para evitar erro
ALTER TABLE public.student_grades DROP CONSTRAINT IF EXISTS student_grades_identifier_discipline_key;

ALTER TABLE public.student_grades 
ADD CONSTRAINT student_grades_identifier_discipline_key 
UNIQUE (student_identifier, discipline_id);

-- 3. Garantir que as configurações de notas tenham valores padrão compatíveis com o código
UPDATE public.grading_settings 
SET points_per_presence = 3, online_presence_points = 2 
WHERE id = 'default';
