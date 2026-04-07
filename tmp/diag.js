const { createClient } = require('@supabase/supabase-js');
const url = 'https://rvsfcrtvogbeayrmobbb.supabase.co';
const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ2c2ZjcnR2b2diZWF5cm1vYmJiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDgxMTM4OSwiZXhwIjoyMDkwMzg3Mzg5fQ.9MfMAx7RMJs4naaB28pGP0F4mdVZhbRY5ug7pjOXC8g';

const supabase = createClient(url, key);

async function diag() {
  console.log('--- DISCIPLINAS NO BANCO ---');
  const { data: disciplines, error: dErr } = await supabase
    .from('disciplines')
    .select('name, order, execution_date')
    .order('order', { ascending: true });

  if (dErr) {
    console.error('Erro ao buscar disciplinas:', dErr);
    return;
  }

  console.table(disciplines);

  console.log('\n--- 5 ÚLTIMOS LANÇAMENTOS FINANCEIROS (MENSALIDADES) ---');
  const { data: charges, error: cErr } = await supabase
    .from('financial_charges')
    .select('description, due_date, status, student_id')
    .eq('type', 'monthly')
    .order('due_date', { ascending: true })
    .limit(20);

  if (cErr) {
    console.error('Erro ao buscar cobranças:', cErr);
    return;
  }

  console.table(charges);
}

diag();
