-- 💰 MIGRAÇÃO: Tabela financial_settings
-- Execute este script no SQL Editor do Supabase para criar a tabela de configurações financeiras.

-- 1. Criar tabela de configurações financeiras
CREATE TABLE IF NOT EXISTS public.financial_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tuition_rate DECIMAL(12, 2) NOT NULL DEFAULT 300.00,
    pro_labore_rate DECIMAL(12, 2) NOT NULL DEFAULT 300.00,
    pix_key TEXT,
    pix_qrcode TEXT,
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Inserir registro padrão (se não existir)
INSERT INTO public.financial_settings (tuition_rate, pro_labore_rate)
SELECT 300.00, 300.00
WHERE NOT EXISTS (SELECT 1 FROM public.financial_settings);

-- 3. Habilitar RLS
ALTER TABLE public.financial_settings ENABLE ROW LEVEL SECURITY;

-- 4. Política de acesso total (anon + authenticated) para o sistema admin funcionar
DROP POLICY IF EXISTS "Allow all financial_settings" ON public.financial_settings;
CREATE POLICY "Allow all financial_settings" ON public.financial_settings 
    FOR ALL USING (true) WITH CHECK (true);
