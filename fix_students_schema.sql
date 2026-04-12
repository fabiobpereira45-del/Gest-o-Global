-- 🛠️ SCRIPT DE CORREÇÃO: ADICIONAR COLUNA 'ADDRESS' - IBAD
-- Execute este script no SQL Editor do Supabase (https://supabase.com/dashboard/project/vevivqcluyutlatwsnjh/sql)

-- 1. Adiciona a coluna 'address' caso ela não exista
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'students' AND COLUMN_NAME = 'address') THEN
        ALTER TABLE public.students ADD COLUMN address TEXT;
    END IF;
END $$;

-- 2. (Opcional) Se você quiser que o endereço antigo (rua, número, etc) seja migrado para a nova coluna:
-- UPDATE public.students 
-- SET address = street || ', ' || number || ' - ' || neighborhood || ', ' || city || '/' || state
-- WHERE address IS NULL AND street IS NOT NULL;

-- 3. Recarregar o cache do PostgREST (Necessário para o Supabase reconhecer a nova coluna imediatamente)
NOTIFY pgrst, 'reload schema';
