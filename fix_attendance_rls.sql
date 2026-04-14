-- Script para corrigir a restrição de permissão no trancamento de chamada
-- Execute este script no SQL Editor do Supabase

-- 1. Remover a política antiga restritiva
DROP POLICY IF EXISTS "Allow all for authenticated" ON public.attendance_finalizations;

-- 2. Criar a nova política permitindo acesso total (padrão do projeto atual)
CREATE POLICY "anon_all_attendance_finalizations" ON public.attendance_finalizations 
FOR ALL USING (true) WITH CHECK (true);

-- 3. Garantir que o RLS está ativado
ALTER TABLE public.attendance_finalizations ENABLE ROW LEVEL SECURITY;
