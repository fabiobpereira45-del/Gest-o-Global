-- ⚡ OTIMIZAÇÃO DE BANCO DE DADOS - IBAD
-- Execute este script no SQL Editor do Supabase para habilitar a gravação ultra-rápida (Bulk Upsert).

-- 1. Tabela de Frequência (Attendance)
-- Permite que o sistema identifique registros duplicados e os atualize em massa.
ALTER TABLE public.attendance 
ADD CONSTRAINT attendance_student_discipline_date_unique 
UNIQUE (student_id, discipline_id, date);

-- 2. Tabela de Notas (Student Grades)
-- Permite que a sincronização de diários ocorra sem criar registros duplicados.
ALTER TABLE public.student_grades 
ADD CONSTRAINT student_grades_student_discipline_unique 
UNIQUE (student_identifier, discipline_id);

-- 3. Índices de Performance
-- Acelera a filtragem por disciplina e aluno nas telas de gestão.
CREATE INDEX IF NOT EXISTS idx_attendance_discipline_date ON public.attendance(discipline_id, date);
CREATE INDEX IF NOT EXISTS idx_student_grades_discipline ON public.student_grades(discipline_id);
CREATE INDEX IF NOT EXISTS idx_student_grades_identifier ON public.student_grades(student_identifier);
