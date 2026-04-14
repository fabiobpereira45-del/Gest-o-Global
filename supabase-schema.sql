-- ============================================================
-- IBAD — Schema Completo do Banco de Dados
-- Projeto Supabase: rvsfcrtvogbeayrmobbb
-- Gerado em: 2026-03-29
-- Execute no SQL Editor do Supabase
-- ============================================================

-- ── 1. Extensões ──────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ── 2. Turmas (classes) ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.classes (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name        TEXT NOT NULL,
  shift       TEXT NOT NULL CHECK (shift IN ('morning','afternoon','evening','ead')),
  day_of_week TEXT,
  max_students INTEGER NOT NULL DEFAULT 30,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── 3. Alunos (students) ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.students (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  auth_user_id      UUID UNIQUE,
  name              TEXT NOT NULL,
  cpf               TEXT UNIQUE,
  email             TEXT NOT NULL UNIQUE,
  enrollment_number TEXT UNIQUE,
  phone             TEXT,
  address           TEXT,
  church            TEXT,
  pastor_name       TEXT,
  class_id          UUID REFERENCES public.classes(id) ON DELETE SET NULL,
  payment_status    TEXT DEFAULT 'pending',
  avatar_url        TEXT,
  bio               TEXT,
  status            TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','active','inactive')),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── 4. Semestres (semesters) ──────────────────────────────────
CREATE TABLE IF NOT EXISTS public.semesters (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name       TEXT NOT NULL,
  "order"    INTEGER NOT NULL DEFAULT 0,
  shift      TEXT,
  is_completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── 5. Disciplinas (disciplines) ─────────────────────────────
CREATE TABLE IF NOT EXISTS public.disciplines (
  id             TEXT PRIMARY KEY,
  name           TEXT NOT NULL,
  description    TEXT,
  semester_id    UUID REFERENCES public.semesters(id) ON DELETE SET NULL,
  professor_name TEXT,
  day_of_week    TEXT,
  shift          TEXT,
  "order"        INTEGER NOT NULL DEFAULT 0,
  is_realized     BOOLEAN DEFAULT FALSE,
  execution_date DATE,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── 6. Professores (professor_accounts) ──────────────────────
CREATE TABLE IF NOT EXISTS public.professor_accounts (
  id            TEXT PRIMARY KEY,
  name          TEXT NOT NULL,
  email         TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role          TEXT NOT NULL DEFAULT 'professor' CHECK (role IN ('master','professor')),
  avatar_url    TEXT,
  bio           TEXT,
  active        BOOLEAN NOT NULL DEFAULT TRUE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── 7. Vínculo Professor-Disciplina ───────────────────────────
CREATE TABLE IF NOT EXISTS public.professor_disciplines (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  professor_id   TEXT NOT NULL REFERENCES public.professor_accounts(id) ON DELETE CASCADE,
  discipline_id  TEXT NOT NULL REFERENCES public.disciplines(id) ON DELETE CASCADE,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(professor_id, discipline_id)
);

-- ── 8. Materiais de Estudo (study_materials) ──────────────────
CREATE TABLE IF NOT EXISTS public.study_materials (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  discipline_id TEXT NOT NULL REFERENCES public.disciplines(id) ON DELETE CASCADE,
  title         TEXT NOT NULL,
  description   TEXT,
  file_url      TEXT NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── 9. Questões (questions) ───────────────────────────────────
CREATE TABLE IF NOT EXISTS public.questions (
  id            TEXT PRIMARY KEY,
  discipline_id TEXT NOT NULL REFERENCES public.disciplines(id) ON DELETE CASCADE,
  type          TEXT NOT NULL,
  text          TEXT NOT NULL,
  choices       JSONB NOT NULL DEFAULT '[]',
  correct_answer TEXT NOT NULL,
  points        NUMERIC NOT NULL DEFAULT 1,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── 10. Provas/Avaliações (assessments) ──────────────────────
CREATE TABLE IF NOT EXISTS public.assessments (
  id                  TEXT PRIMARY KEY,
  title               TEXT NOT NULL,
  discipline_id       TEXT REFERENCES public.disciplines(id) ON DELETE SET NULL,
  professor           TEXT NOT NULL,
  institution         TEXT NOT NULL,
  question_ids        TEXT[] NOT NULL DEFAULT '{}',
  points_per_question NUMERIC NOT NULL DEFAULT 1,
  total_points        NUMERIC NOT NULL DEFAULT 0,
  open_at             TIMESTAMPTZ,
  close_at            TIMESTAMPTZ,
  is_published        BOOLEAN NOT NULL DEFAULT FALSE,
  shuffle_variants    BOOLEAN NOT NULL DEFAULT FALSE,
  time_limit_minutes  INTEGER,
  logo_base64         TEXT,
  rules               TEXT,
  release_results     BOOLEAN NOT NULL DEFAULT FALSE,
  modality            TEXT NOT NULL DEFAULT 'public',
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── 11. Respostas dos Alunos (student_submissions) ────────────
CREATE TABLE IF NOT EXISTS public.student_submissions (
  id                   TEXT PRIMARY KEY,
  assessment_id        TEXT NOT NULL REFERENCES public.assessments(id) ON DELETE CASCADE,
  student_name         TEXT NOT NULL,
  student_email        TEXT NOT NULL,
  answers              JSONB NOT NULL DEFAULT '[]',
  score                NUMERIC NOT NULL DEFAULT 0,
  total_points         NUMERIC NOT NULL DEFAULT 0,
  percentage           NUMERIC NOT NULL DEFAULT 0,
  submitted_at         TIMESTAMPTZ,
  time_elapsed_seconds INTEGER NOT NULL DEFAULT 0,
  focus_lost_count     INTEGER NOT NULL DEFAULT 0,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── 12. Configurações Financeiras (financial_settings) ────────
CREATE TABLE IF NOT EXISTS public.financial_settings (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  enrollment_fee  NUMERIC NOT NULL DEFAULT 120,
  monthly_fee     NUMERIC NOT NULL DEFAULT 60,
  second_call_fee NUMERIC NOT NULL DEFAULT 30,
  final_exam_fee  NUMERIC NOT NULL DEFAULT 50,
  total_months    INTEGER NOT NULL DEFAULT 12,
  credit_card_url TEXT,
  pix_key         TEXT,
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── 13. Cobranças Financeiras (financial_charges) ─────────────
CREATE TABLE IF NOT EXISTS public.financial_charges (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id    UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  type          TEXT NOT NULL CHECK (type IN ('enrollment','monthly','second_call','final_exam','other')),
  description   TEXT NOT NULL,
  amount        NUMERIC NOT NULL,
  due_date      DATE NOT NULL,
  status        TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','paid','cancelled','late','bolsa100','bolsa50')),
  payment_date  TIMESTAMPTZ,
  pix_qrcode    TEXT,
  pix_copy_paste TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── 14. Notas dos Alunos (student_grades) ─────────────────────
CREATE TABLE IF NOT EXISTS public.student_grades (
  id                 UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_identifier TEXT NOT NULL,
  student_name       TEXT NOT NULL,
  discipline_id      TEXT REFERENCES public.disciplines(id) ON DELETE SET NULL,
  is_public          BOOLEAN NOT NULL DEFAULT FALSE,
  exam_grade         NUMERIC NOT NULL DEFAULT 0,
  works_grade        NUMERIC NOT NULL DEFAULT 0,
  seminar_grade      NUMERIC NOT NULL DEFAULT 0,
  participation_bonus NUMERIC NOT NULL DEFAULT 0,
  attendance_score   NUMERIC NOT NULL DEFAULT 0,
  custom_divisor     NUMERIC NOT NULL DEFAULT 4,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(student_identifier, discipline_id)
);

-- ── 15. Frequência (attendance) ───────────────────────────────
CREATE TABLE IF NOT EXISTS public.attendance (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id    UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  discipline_id TEXT NOT NULL REFERENCES public.disciplines(id) ON DELETE CASCADE,
  date          DATE NOT NULL,
  is_present    BOOLEAN NOT NULL DEFAULT TRUE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(student_id, discipline_id, date)
);

-- ── 16. Mensagens do Chat (chat_messages) ─────────────────────
CREATE TABLE IF NOT EXISTS public.chat_messages (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id      UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  discipline_id   TEXT NOT NULL REFERENCES public.disciplines(id) ON DELETE CASCADE,
  message         TEXT NOT NULL,
  is_from_student BOOLEAN NOT NULL DEFAULT TRUE,
  read            BOOLEAN NOT NULL DEFAULT FALSE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── 17. Grade de Horários (class_schedules) ───────────────────
CREATE TABLE IF NOT EXISTS public.class_schedules (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  class_id      UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  discipline_id TEXT NOT NULL REFERENCES public.disciplines(id) ON DELETE CASCADE,
  professor_name TEXT NOT NULL,
  day_of_week   TEXT NOT NULL,
  time_start    TEXT NOT NULL,
  time_end      TEXT NOT NULL,
  lessons_count INTEGER NOT NULL DEFAULT 1,
  workload      NUMERIC NOT NULL DEFAULT 0,
  start_date    DATE,
  end_date      DATE,
  online_class_date TIMESTAMPTZ,
  video_lesson_date TIMESTAMPTZ,
  exam_date     TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── 18. Membros da Diretoria (board_members) ──────────────────
CREATE TABLE IF NOT EXISTS public.board_members (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name       TEXT NOT NULL,
  role       TEXT NOT NULL,
  category   TEXT NOT NULL,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── 19. Configuração inicial: Financial Settings ──────────────
INSERT INTO public.financial_settings (enrollment_fee, monthly_fee, second_call_fee, final_exam_fee, total_months)
VALUES (120, 60, 30, 50, 12)
ON CONFLICT DO NOTHING;

-- ============================================================
-- POLÍTICAS DE SEGURANÇA (Row Level Security)
-- ============================================================

-- Habilita RLS em todas as tabelas
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.semesters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.disciplines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.professor_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.professor_disciplines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.study_materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financial_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financial_charges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_grades ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.class_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.board_members ENABLE ROW LEVEL SECURITY;

-- Políticas: leitura pública para dados não-sensíveis
CREATE POLICY "public_read_classes"       ON public.classes           FOR SELECT USING (true);
CREATE POLICY "public_read_semesters"     ON public.semesters         FOR SELECT USING (true);
CREATE POLICY "public_read_disciplines"   ON public.disciplines        FOR SELECT USING (true);
CREATE POLICY "public_read_assessments"   ON public.assessments        FOR SELECT USING (true);
CREATE POLICY "public_read_questions"     ON public.questions          FOR SELECT USING (true);
CREATE POLICY "public_read_submissions"   ON public.student_submissions FOR SELECT USING (true);
CREATE POLICY "public_read_materials"     ON public.study_materials    FOR SELECT USING (true);
CREATE POLICY "public_read_board"         ON public.board_members      FOR SELECT USING (true);
CREATE POLICY "public_read_schedules"     ON public.class_schedules    FOR SELECT USING (true);
CREATE POLICY "public_read_fin_settings"  ON public.financial_settings FOR SELECT USING (true);
CREATE POLICY "public_read_grades"        ON public.student_grades     FOR SELECT USING (true);
CREATE POLICY "public_read_professors"    ON public.professor_accounts FOR SELECT USING (true);

-- Políticas: escrita total para anon (necessário pois usamos anon key no cliente)
CREATE POLICY "anon_all_classes"         ON public.classes              FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "anon_all_students"        ON public.students             FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "anon_all_semesters"       ON public.semesters            FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "anon_all_disciplines"     ON public.disciplines          FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "anon_all_professors"      ON public.professor_accounts   FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "anon_all_prof_disc"       ON public.professor_disciplines FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "anon_all_materials"       ON public.study_materials      FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "anon_all_questions"       ON public.questions            FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "anon_all_assessments"     ON public.assessments          FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "anon_all_submissions"     ON public.student_submissions  FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "anon_all_fin_settings"    ON public.financial_settings   FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "anon_all_charges"         ON public.financial_charges    FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "anon_all_grades"          ON public.student_grades       FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "anon_all_attendance"      ON public.attendance           FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "anon_all_chat"            ON public.chat_messages        FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "anon_all_schedules"       ON public.class_schedules      FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "anon_all_board"           ON public.board_members        FOR ALL USING (true) WITH CHECK (true);
