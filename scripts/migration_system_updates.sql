-- ============================================================
-- Sistema de Notificações de Atualizações de Sistema (IBAD)
-- ============================================================

-- 1. Tabela de Atualizações
CREATE TABLE IF NOT EXISTS public.system_updates (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title       TEXT NOT NULL,
  content     TEXT NOT NULL,
  type        TEXT NOT NULL DEFAULT 'feature' CHECK (type IN ('feature', 'fix', 'announcement', 'maintenance')),
  version     TEXT,
  image_url   TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Tabela de Leitura (Rastreamento por Usuário)
CREATE TABLE IF NOT EXISTS public.system_update_reads (
  update_id   UUID NOT NULL REFERENCES public.system_updates(id) ON DELETE CASCADE,
  user_id     TEXT NOT NULL, -- Match professor_accounts.id (TEXT)
  read_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (update_id, user_id)
);

-- 3. Habilitar RLS
ALTER TABLE public.system_updates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_update_reads ENABLE ROW LEVEL SECURITY;

-- 4. Políticas RLS
-- Qualquer um pode ler as atualizações (público ou autenticado)
CREATE POLICY "public_read_system_updates" ON public.system_updates FOR SELECT USING (true);

-- Usuários podem ler seus próprios registros de leitura
CREATE POLICY "user_read_system_update_reads" ON public.system_update_reads FOR SELECT USING (true);

-- Usuários podem inserir seus próprios registros de leitura
CREATE POLICY "user_insert_system_update_reads" ON public.system_update_reads FOR INSERT WITH CHECK (true);

-- 5. Inserir uma atualização de exemplo (opcional para teste inicial)
INSERT INTO public.system_updates (title, content, type, version)
VALUES (
  '🎉 Bem-vindo ao Novo Sistema de Notificações!',
  'Agora você receberá avisos importantes sobre novas ferramentas e melhorias diretamente no seu painel Master.\n\nFique atento para as próximas novidades!',
  'announcement',
  '2.1.0'
) ON CONFLICT DO NOTHING;
