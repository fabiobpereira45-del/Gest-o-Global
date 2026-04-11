
-- 📦 CONFIGURAÇÃO DE STORAGE (BUCKETS)
-- Execute este script no SQL Editor do Supabase para habilitar o upload de arquivos.

-- 1. Criar buckets se não existirem
INSERT INTO storage.buckets (id, name, public)
VALUES ('materials', 'materials', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Habilitar RLS no Storage (geralmente habilitado por padrão)
-- ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- 3. Políticas para o Bucket 'materials' (Biblioteca)

-- Permitir acesso público de leitura
CREATE POLICY "Public Read Materials"
ON storage.objects FOR SELECT
USING ( bucket_id = 'materials' );

-- Permitir upload apenas para usuários autenticados
CREATE POLICY "Auth Upload Materials"
ON storage.objects FOR INSERT
WITH CHECK ( bucket_id = 'materials' AND auth.role() = 'authenticated' );

-- Permitir exclusão apenas para usuários autenticados
CREATE POLICY "Auth Delete Materials"
ON storage.objects FOR DELETE
USING ( bucket_id = 'materials' AND auth.role() = 'authenticated' );


-- 4. Políticas para o Bucket 'avatars' (Fotos de Perfil)

-- Permitir acesso público de leitura
CREATE POLICY "Public Read Avatars"
ON storage.objects FOR SELECT
USING ( bucket_id = 'avatars' );

-- Permitir upload para usuários autenticados
CREATE POLICY "Auth Upload Avatars"
ON storage.objects FOR INSERT
WITH CHECK ( bucket_id = 'avatars' AND auth.role() = 'authenticated' );

-- Permitir que o próprio usuário atualize seu avatar (opcional, aqui simplificado para todos autenticados)
CREATE POLICY "Auth Update Avatars"
ON storage.objects FOR UPDATE
USING ( bucket_id = 'avatars' AND auth.role() = 'authenticated' );
