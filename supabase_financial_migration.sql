-- ============================================================================
-- IBAD FINANCE PRO v2.0 - MIGRATION SCRIPT
-- Created: 2026-04-08
-- Description: Create financial management tables and schema
-- ============================================================================

-- 1. ALTER financial_settings (Adicionar novos campos)
-- ============================================================================
ALTER TABLE IF EXISTS financial_settings ADD COLUMN IF NOT EXISTS (
  discipline_price NUMERIC(10,2) DEFAULT 60.00,
  payment_due_day INTEGER DEFAULT 10,
  professor_salary_per_discipline NUMERIC(10,2) DEFAULT 500.00,
  period_start_month TEXT DEFAULT '2025-08',
  period_end_month TEXT DEFAULT '2027-10',
  updated_by UUID REFERENCES professor_accounts(id) ON DELETE SET NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. CREATE expense_categories (Lookup table)
-- ============================================================================
CREATE TABLE IF NOT EXISTS expense_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  name TEXT UNIQUE NOT NULL,
  description TEXT,
  color_hex TEXT DEFAULT '#9CA3AF',
  icon_name TEXT DEFAULT 'DollarSign',
  
  monthly_budget NUMERIC(10,2),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE expense_categories ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Allow all reads" ON expense_categories FOR SELECT USING (true);
CREATE POLICY "Allow all inserts" ON expense_categories FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow all updates" ON expense_categories FOR UPDATE USING (true);
CREATE POLICY "Allow all deletes" ON expense_categories FOR DELETE USING (true);

-- Insert default categories
INSERT INTO expense_categories (name, description, monthly_budget, color_hex, icon_name) VALUES
('Material Didático', 'Livros, apostilas, papel', 500.00, '#3B82F6', 'BookOpen'),
('Transporte', 'Combustível, frete, deslocamento', 300.00, '#F59E0B', 'Truck'),
('Material de Secretária', 'Papel, tinta, cola, etc', 200.00, '#EC4899', 'Clipboard'),
('Alimento', 'Café, lanche, refeições', 400.00, '#10B981', 'Coffee'),
('Aluguel', 'Espaço físico/sala', 1500.00, '#8B5CF6', 'Building2'),
('Utilidades', 'Luz, água, internet, telefone', 600.00, '#06B6D4', 'Zap'),
('Salários Admin', 'Funcionários não-professor', 1000.00, '#6366F1', 'Users'),
('Contingência', 'Fundo emergencial', 200.00, '#EF4444', 'AlertTriangle')
ON CONFLICT(name) DO NOTHING;

-- 3. CREATE financial_transactions
-- ============================================================================
CREATE TABLE IF NOT EXISTS financial_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Tipo e Categoria
  type TEXT NOT NULL CHECK (type IN ('income', 'expense', 'teacher_payment')),
  category TEXT NOT NULL,
  description TEXT,
  
  -- Valores
  amount NUMERIC(10,2) NOT NULL CHECK (amount > 0),
  
  -- Datas
  transaction_date DATE NOT NULL,
  due_date DATE,
  month_reference TEXT,
  
  -- Status
  status TEXT DEFAULT 'pending' CHECK (
    status IN ('pending', 'completed', 'overdue', 'cancelled')
  ),
  
  -- Relações
  related_student_id UUID REFERENCES students(id) ON DELETE SET NULL,
  related_teacher_id UUID REFERENCES professor_accounts(id) ON DELETE SET NULL,
  related_discipline_id TEXT REFERENCES disciplines(id) ON DELETE SET NULL,
  
  -- Pagamento
  payment_method TEXT CHECK (
    payment_method IN ('pix', 'boleto', 'bank_transfer', 'cash', 'other', NULL)
  ),
  payment_date TIMESTAMPTZ,
  
  -- Identificadores
  boleto_number TEXT UNIQUE,
  pix_key TEXT,
  receipt_number TEXT UNIQUE,
  qrcode_url TEXT,
  pdf_url TEXT,
  
  -- Auditoria
  created_by UUID NOT NULL REFERENCES professor_accounts(id),
  updated_by UUID REFERENCES professor_accounts(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_financial_transactions_student ON financial_transactions(related_student_id);
CREATE INDEX idx_financial_transactions_teacher ON financial_transactions(related_teacher_id);
CREATE INDEX idx_financial_transactions_discipline ON financial_transactions(related_discipline_id);
CREATE INDEX idx_financial_transactions_date ON financial_transactions(transaction_date);
CREATE INDEX idx_financial_transactions_status ON financial_transactions(status);
CREATE INDEX idx_financial_transactions_type ON financial_transactions(type);

-- Enable RLS
ALTER TABLE financial_transactions ENABLE ROW LEVEL SECURITY;

-- RLS Policies (Master only)
CREATE POLICY "Allow all reads" ON financial_transactions FOR SELECT USING (true);
CREATE POLICY "Allow inserts" ON financial_transactions FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow updates" ON financial_transactions FOR UPDATE USING (true);
CREATE POLICY "Allow deletes" ON financial_transactions FOR DELETE USING (true);

-- 4. CREATE student_payment_schedule
-- ============================================================================
CREATE TABLE IF NOT EXISTS student_payment_schedule (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Relações
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  discipline_id TEXT NOT NULL REFERENCES disciplines(id) ON DELETE CASCADE,
  
  -- Período
  payment_month INTEGER NOT NULL CHECK (payment_month BETWEEN 1 AND 26),
  month_year TEXT NOT NULL,
  
  -- Datas
  due_date DATE NOT NULL,
  payment_date TIMESTAMPTZ,
  
  -- Valores
  amount NUMERIC(10,2) NOT NULL,
  discount_percentage NUMERIC(5,2) DEFAULT 0,
  discount_reason TEXT,
  final_amount NUMERIC(10,2) GENERATED ALWAYS AS (
    amount * (1 - discount_percentage / 100)
  ) STORED,
  
  -- Status
  status TEXT DEFAULT 'pending' CHECK (
    status IN ('pending', 'paid', 'overdue', 'cancelled', 'scholarship_100', 'scholarship_50')
  ),
  
  -- Documentos
  boleto_number TEXT UNIQUE,
  boleto_pdf_url TEXT,
  pix_qrcode_url TEXT,
  pix_copy_paste TEXT,
  receipt_number TEXT UNIQUE,
  receipt_pdf_url TEXT,
  
  -- Auditoria
  created_by UUID NOT NULL REFERENCES professor_accounts(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(student_id, discipline_id, payment_month)
);

-- Índices
CREATE INDEX idx_student_payment_schedule_student ON student_payment_schedule(student_id);
CREATE INDEX idx_student_payment_schedule_due_date ON student_payment_schedule(due_date);
CREATE INDEX idx_student_payment_schedule_status ON student_payment_schedule(status);
CREATE INDEX idx_student_payment_schedule_month_year ON student_payment_schedule(month_year);

-- Enable RLS
ALTER TABLE student_payment_schedule ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Allow all reads" ON student_payment_schedule FOR SELECT USING (true);
CREATE POLICY "Allow all inserts" ON student_payment_schedule FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow all updates" ON student_payment_schedule FOR UPDATE USING (true);
CREATE POLICY "Allow all deletes" ON student_payment_schedule FOR DELETE USING (true);

-- 5. CREATE teacher_payment_schedule
-- ============================================================================
CREATE TABLE IF NOT EXISTS teacher_payment_schedule (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Relações
  teacher_id UUID NOT NULL REFERENCES professor_accounts(id) ON DELETE CASCADE,
  discipline_id TEXT NOT NULL REFERENCES disciplines(id) ON DELETE CASCADE,
  
  -- Período
  payment_month INTEGER NOT NULL CHECK (payment_month BETWEEN 1 AND 26),
  month_year TEXT NOT NULL,
  
  -- Cálculos
  student_count INTEGER NOT NULL DEFAULT 0,
  salary_amount NUMERIC(10,2) NOT NULL,
  bonus_amount NUMERIC(10,2) DEFAULT 0,
  total_amount NUMERIC(10,2) GENERATED ALWAYS AS (
    salary_amount + bonus_amount
  ) STORED,
  
  -- Status
  status TEXT DEFAULT 'pending' CHECK (
    status IN ('pending', 'paid', 'cancelled')
  ),
  
  -- Pagamento
  payment_date TIMESTAMPTZ,
  payment_method TEXT,
  notes TEXT,
  
  -- Auditoria
  created_by UUID NOT NULL REFERENCES professor_accounts(id),
  updated_by UUID REFERENCES professor_accounts(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(teacher_id, discipline_id, payment_month)
);

-- Índices
CREATE INDEX idx_teacher_payment_schedule_teacher ON teacher_payment_schedule(teacher_id);
CREATE INDEX idx_teacher_payment_schedule_month ON teacher_payment_schedule(month_year);
CREATE INDEX idx_teacher_payment_schedule_status ON teacher_payment_schedule(status);

-- Enable RLS
ALTER TABLE teacher_payment_schedule ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Allow all reads" ON teacher_payment_schedule FOR SELECT USING (true);
CREATE POLICY "Allow all inserts" ON teacher_payment_schedule FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow all updates" ON teacher_payment_schedule FOR UPDATE USING (true);
CREATE POLICY "Allow all deletes" ON teacher_payment_schedule FOR DELETE USING (true);

-- 6. CREATE financial_projections
-- ============================================================================
CREATE TABLE IF NOT EXISTS financial_projections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Período
  period_start TEXT NOT NULL,
  period_end TEXT NOT NULL,
  
  -- Projeção Otimista
  optimistic_income NUMERIC(12,2),
  optimistic_expenses NUMERIC(12,2),
  optimistic_balance NUMERIC(12,2) GENERATED ALWAYS AS (
    optimistic_income - optimistic_expenses
  ) STORED,
  
  -- Projeção Realista
  realistic_income NUMERIC(12,2),
  realistic_expenses NUMERIC(12,2),
  realistic_balance NUMERIC(12,2) GENERATED ALWAYS AS (
    realistic_income - realistic_expenses
  ) STORED,
  
  -- Projeção Pessimista
  pessimistic_income NUMERIC(12,2),
  pessimistic_expenses NUMERIC(12,2),
  pessimistic_balance NUMERIC(12,2) GENERATED ALWAYS AS (
    pessimistic_income - pessimistic_expenses
  ) STORED,
  
  -- Valores reais
  actual_income NUMERIC(12,2) DEFAULT 0,
  actual_expenses NUMERIC(12,2) DEFAULT 0,
  actual_balance NUMERIC(12,2) DEFAULT 0,
  
  -- Auditoria
  calculated_by UUID NOT NULL REFERENCES professor_accounts(id),
  calculated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(period_start, period_end)
);

-- Enable RLS
ALTER TABLE financial_projections ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Allow all reads" ON financial_projections FOR SELECT USING (true);
CREATE POLICY "Allow all inserts" ON financial_projections FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow all updates" ON financial_projections FOR UPDATE USING (true);
CREATE POLICY "Allow all deletes" ON financial_projections FOR DELETE USING (true);

-- 7. CREATE receipt_registry
-- ============================================================================
CREATE TABLE IF NOT EXISTS receipt_registry (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Identificadores
  receipt_number TEXT UNIQUE NOT NULL,
  transaction_id UUID REFERENCES financial_transactions(id) ON DELETE SET NULL,
  
  -- Quem pagou
  student_id UUID REFERENCES students(id) ON DELETE SET NULL,
  
  -- Quanto
  amount NUMERIC(10,2) NOT NULL,
  
  -- Quando
  payment_date TIMESTAMPTZ NOT NULL,
  issued_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Documentos
  pdf_url TEXT,
  
  -- Auditoria
  issued_by UUID NOT NULL REFERENCES professor_accounts(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_receipt_registry_receipt_number ON receipt_registry(receipt_number);
CREATE INDEX idx_receipt_registry_student ON receipt_registry(student_id);
CREATE INDEX idx_receipt_registry_issued_at ON receipt_registry(issued_at);

-- Enable RLS
ALTER TABLE receipt_registry ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Allow all reads" ON receipt_registry FOR SELECT USING (true);
CREATE POLICY "Allow all inserts" ON receipt_registry FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow all updates" ON receipt_registry FOR UPDATE USING (true);
CREATE POLICY "Allow all deletes" ON receipt_registry FOR DELETE USING (true);

-- ============================================================================
-- FIM DA MIGRATION
-- ============================================================================
