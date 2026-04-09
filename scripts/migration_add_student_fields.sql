-- 🚀 MIGRATION: Adicionar novos campos de cadastro de alunos
-- Execute este script no SQL Editor do Supabase

ALTER TABLE public.students 
ADD COLUMN IF NOT EXISTS birth_date TEXT,
ADD COLUMN IF NOT EXISTS street TEXT,
ADD COLUMN IF NOT EXISTS number TEXT,
ADD COLUMN IF NOT EXISTS neighborhood TEXT,
ADD COLUMN IF NOT EXISTS city TEXT,
ADD COLUMN IF NOT EXISTS state TEXT;

-- Garantir que o núcleo Cosme de Farias exista
INSERT INTO public.classes (name, shift, max_students)
VALUES ('Cosme de Farias', 'ead', 100)
ON CONFLICT DO NOTHING;
