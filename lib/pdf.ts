import type { 
  Assessment, Question, StudentSubmission, 
  Semester, Discipline, ProfessorAccount, ProfessorDiscipline, 
  StudentProfile, StudentGrade, Attendance,
  FinancialTransaction, StudentTuition
} from "./store"

const IBAD_LOGO = "/ibad-logo.png"

// ——— Helpers ——————————————————————————————————————————————————————————————————————

function formatDate(iso: string | null): string {
  if (!iso) return "—"
  return new Date(iso).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric"
  })
}

function formatCurrency(value: number): string {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

// ——— Modern Template Wrapper ——————————————————————————————————————————————————————

function getModernTemplate(content: string, title: string, hubName?: string): string {
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8"/>
    <title>${title}</title>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&family=Playfair+Display:wght@700&display=swap');
        
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
            font-family: 'Inter', -apple-system, sans-serif; 
            color: #1a202c; 
            background: #fff; 
            line-height: 1.5;
            padding: 40px;
        }
        
        @media print {
            body { padding: 20px; }
            .no-print { display: none; }
        }

        /* Header */
        .header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            border-bottom: 4px solid #1e3a5f;
            padding-bottom: 20px;
            margin-bottom: 30px;
        }
        .header-logo { height: 70px; width: auto; }
        .header-info { text-align: right; }
        .institution-name { 
            font-family: 'Playfair Display', serif;
            color: #1e3a5f; 
            font-size: 22px; 
            font-weight: 700;
            margin-bottom: 4px;
        }
        .hub-name {
            color: #f97316;
            font-weight: 700;
            font-size: 14px;
            text-transform: uppercase;
            letter-spacing: 1px;
        }

        /* Typography */
        h1 { font-size: 24px; color: #1e3a5f; margin-bottom: 20px; border-left: 5px solid #f97316; padding-left: 15px; }
        h2 { font-size: 18px; color: #2d3748; margin-top: 25px; margin-bottom: 12px; font-weight: 700; text-transform: uppercase; border-bottom: 1px solid #e2e8f0; padding-bottom: 8px; }

        /* Tables */
        table { width: 100%; border-collapse: collapse; margin-bottom: 25px; font-size: 12px; }
        th { 
            background-color: #f8fafc; 
            color: #1e3a5f; 
            font-weight: 800; 
            text-align: left; 
            padding: 12px 15px; 
            border-bottom: 2px solid #e2e8f0;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        td { padding: 10px 15px; border-bottom: 1px solid #edf2f7; color: #4a5568; }
        tr:nth-child(even) { background-color: #fcfcfc; }
        .row-accent { font-weight: 600; color: #1e3a5f; }

        /* Status Badges */
        .badge {
            padding: 4px 10px;
            border-radius: 12px;
            font-size: 10px;
            font-weight: 700;
            text-transform: uppercase;
        }
        .badge-success { background: #dcfce7; color: #166534; }
        .badge-warning { background: #fef9c3; color: #854d0e; }
        .badge-danger { background: #fee2e2; color: #991b1b; }

        /* Footer */
        .footer {
            margin-top: 50px;
            padding-top: 20px;
            border-top: 1px solid #e2e8f0;
            font-size: 10px;
            color: #718096;
            display: flex;
            justify-content: space-between;
        }
    </style>
</head>
<body>
    <div class="header">
        <img src="${IBAD_LOGO}" class="header-logo" alt="IBAD Logo" />
        <div class="header-info">
            <div class="institution-name">IBAD - Instituto Bíblico das Assembléias de Deus</div>
            <div class="hub-name">${hubName || "Núcleo Central"}</div>
        </div>
    </div>
    
    <h1>${title}</h1>
    
    <div class="content">
        ${content}
    </div>

    <div class="footer">
        <div>Relatório gerado em ${new Date().toLocaleString('pt-BR')}</div>
        <div>&copy; 2026 Teologia Global - Escola de Teologia</div>
    </div>
</body>
</html>`
}

// ——— Individual Report Functions ——————————————————————————————————————————————————

export function printStudentListPDF(students: StudentProfile[], classes: any[], hubName?: string): void {
  const rows = students.map((s, i) => {
    const cls = classes.find(c => c.id === s.class_id)
    return `<tr>
        <td>${i + 1}</td>
        <td class="row-accent">${s.name}</td>
        <td>${s.enrollment_number || "—"}</td>
        <td>${cls?.name || hubName || "—"}</td>
        <td>${s.phone || "—"}</td>
    </tr>`
  }).join('')

  const content = `
    <table>
        <thead>
            <tr>
                <th width="40">#</th>
                <th>Nome</th>
                <th>Matrícula</th>
                <th>Turma</th>
                <th>Telefone</th>
            </tr>
        </thead>
        <tbody>${rows}</tbody>
    </table>
  `
  
  const html = getModernTemplate(content, "Relatório Geral de Alunos", hubName)
  const win = window.open("", "_blank")
  if (win) { win.document.write(html); win.document.close(); win.onload = () => win.print() }
}

export function printGradesReportPDF(grades: StudentGrade[], disciplineName: string, hubName?: string): void {
  const rows = grades.map(g => {
    const final = (g.examGrade + g.worksGrade + g.seminarGrade + (g.participationBonus || 0)) / (g.customDivisor || 3)
    const status = final >= 7 ? 'APROVADO' : 'REPROVADO'
    const statusClass = final >= 7 ? 'badge-success' : 'badge-danger'
    
    return `<tr>
        <td class="row-accent">${g.studentName}</td>
        <td>${g.examGrade.toFixed(1)}</td>
        <td>${g.worksGrade.toFixed(1)}</td>
        <td>${g.seminarGrade.toFixed(1)}</td>
        <td class="row-accent">${final.toFixed(1)}</td>
        <td><span class="badge ${statusClass}">${status}</span></td>
    </tr>`
  }).join('')

  const content = `
    <h2>Disciplina: ${disciplineName}</h2>
    <table>
        <thead>
            <tr>
                <th>Nome do Aluno</th>
                <th>Prova</th>
                <th>Trabalho</th>
                <th>Seminário</th>
                <th>Média</th>
                <th>Situação</th>
            </tr>
        </thead>
        <tbody>${rows}</tbody>
    </table>
  `

  const html = getModernTemplate(content, "Diário de Notas", hubName)
  const win = window.open("", "_blank")
  if (win) { win.document.write(html); win.document.close(); win.onload = () => win.print() }
}

export function printReceiptPDF(tuition: StudentTuition, student: StudentProfile, discipline: Discipline, hubName?: string): void {
    const content = `
        <div style="border: 2px solid #1e3a5f; padding: 30px; border-radius: 12px; background: #fff; position: relative; overflow: hidden;">
            <div style="position: absolute; top: -20px; right: -20px; font-size: 100px; color: #f8fafc; font-weight: 900; z-index: 0;">RECIBO</div>
            
            <div style="position: relative; z-index: 1;">
                <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 40px;">
                    <div>
                        <p style="font-size: 12px; color: #64748b; text-transform: uppercase; font-weight: 700; margin-bottom: 4px;">Recibo de Pagamento</p>
                        <h2 style="margin: 0; border: none; padding: 0;">Nº ${tuition.id.slice(0, 8).toUpperCase()}</h2>
                    </div>
                    <div style="text-align: right;">
                        <p style="font-size: 11px; color: #64748b;">Data do Pagamento</p>
                        <p class="row-accent">${formatDate(tuition.paidAt || null)}</p>
                    </div>
                </div>

                <div style="margin-bottom: 30px;">
                    <p style="font-size: 14px; margin-bottom: 20px;">Recebemos de <strong>${student.name}</strong>, CPF <strong>${student.cpf || "—"}</strong>, a quantia de:</p>
                    <div style="font-size: 32px; font-weight: 800; color: #1e3a5f; margin-bottom: 10px;">${formatCurrency(tuition.amount)}</div>
                    <p style="font-size: 12px; color: #64748b; font-style: italic;">Referente ao investimento da disciplina: <strong>${discipline.name}</strong></p>
                </div>

                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 40px; margin-top: 80px;">
                    <div style="text-align: center; border-top: 1px solid #e2e8f0; padding-top: 15px;">
                        <p style="font-size: 11px; color: #64748b;">Assinatura Institucional</p>
                        <p style="font-weight: 700; color: #1e3a5f; margin-top: 5px;">${hubName || "Administração IBAD"}</p>
                    </div>
                    <div style="text-align: center; border-top: 1px solid #e2e8f0; padding-top: 15px;">
                        <p style="font-size: 11px; color: #64748b;">Assinatura do Aluno</p>
                        <p style="font-weight: 700; color: #1e3a5f; margin-top: 5px;">${student.name}</p>
                    </div>
                </div>
            </div>
        </div>
    `
    const html = getModernTemplate(content, "Recibo de Pagamento", hubName)
    const win = window.open("", "_blank")
    if (win) { win.document.write(html); win.document.close(); win.onload = () => win.print() }
}

export function printFinancialDRE_PDF(transactions: FinancialTransaction[], competencia: string, hubName?: string): void {
    const incomes = transactions.filter(t => t.type === 'income' && t.status === 'realized')
    const expenses = transactions.filter(t => t.type === 'expense' && t.status === 'realized')
    const totalIncome = incomes.reduce((acc, t) => acc + t.amount, 0)
    const totalExpense = expenses.reduce((acc, t) => acc + t.amount, 0)
    const result = totalIncome - totalExpense

    const categorySummary = expenses.reduce((acc: any, t) => {
        acc[t.category] = (acc[t.category] || 0) + t.amount
        return acc
    }, {})

    const expenseRows = Object.entries(categorySummary).map(([cat, amt]: any) => `
        <tr><td>${cat}</td><td style="text-align:right;">${formatCurrency(amt)}</td></tr>
    `).join('')

    const content = `
        <div style="background: #f8fafc; padding: 25px; border-radius: 12px; margin-bottom: 30px;">
            <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px;">
                <div style="text-align: center;">
                    <p style="font-size: 10px; color: #64748b; text-transform: uppercase;">Receita Total</p>
                    <p style="font-size: 18px; font-weight: 800; color: #16a34a;">${formatCurrency(totalIncome)}</p>
                </div>
                <div style="text-align: center;">
                    <p style="font-size: 10px; color: #64748b; text-transform: uppercase;">Despesa Total</p>
                    <p style="font-size: 18px; font-weight: 800; color: #dc2626;">${formatCurrency(totalExpense)}</p>
                </div>
                <div style="text-align: center;">
                    <p style="font-size: 10px; color: #64748b; text-transform: uppercase;">Resultado Líquido</p>
                    <p style="font-size: 18px; font-weight: 800; color: #1e3a5f;">${formatCurrency(result)}</p>
                </div>
            </div>
        </div>

        <h2>Detalhamento de Saídas</h2>
        <table>
            <thead>
                <tr><th>Categoria</th><th style="text-align:right;">Total Gasto</th></tr>
            </thead>
            <tbody>${expenseRows}</tbody>
        </table>
    `
    const html = getModernTemplate(content, `DRE - Competência ${competencia}`, hubName)
    const win = window.open("", "_blank")
    if (win) { win.document.write(html); win.document.close(); win.onload = () => win.print() }
}

export function printTuitionReportPDF(tuitions: StudentTuition[], students: StudentProfile[], hubName?: string): void {
    const rows = tuitions.map(t => {
        const student = students.find(s => s.id === t.studentId)
        const statusClass = t.status === 'paid' ? 'badge-success' : (t.status === 'overdue' ? 'badge-danger' : 'badge-warning')
        const statusLabel = t.status === 'paid' ? 'PAGO' : (t.status === 'overdue' ? 'ATRASADO' : 'PENDENTE')
        
        return `<tr>
            <td class="row-accent">${student?.name || '—'}</td>
            <td>${formatDate(t.dueDate)}</td>
            <td class="row-accent">${formatCurrency(t.amount)}</td>
            <td><span class="badge ${statusClass}">${statusLabel}</span></td>
        </tr>`
    }).join('')

    const content = `
        <table>
            <thead>
                <tr><th>Aluno</th><th>Vencimento</th><th>Valor</th><th>Status</th></tr>
            </thead>
            <tbody>${rows}</tbody>
        </table>
    `
    const html = getModernTemplate(content, "Relatório de Recebíveis", hubName)
    const win = window.open("", "_blank")
    if (win) { win.document.write(html); win.document.close(); win.onload = () => win.print() }
}

export function printAttendanceReportPDF(attendances: Attendance[], students: StudentProfile[], disciplineName: string, hubName?: string): void {
  const logs = students.map(s => {
    const sAtt = attendances.filter(a => a.studentId === s.id)
    const presents = sAtt.filter(a => a.isPresent).length
    const total = sAtt.length
    const pct = total > 0 ? (presents/total)*100 : 0
    return { name: s.name, presents, total, pct }
  })
  
  const rows = logs.map(l => `<tr>
    <td class="row-accent">${l.name}</td>
    <td style="text-align:center;">${l.presents} / ${l.total}</td>
    <td style="text-align:right; font-weight:700;">${l.pct.toFixed(0)}%</td>
  </tr>`).join('')

  const content = `
    <h2>Frequência: ${disciplineName}</h2>
    <table>
        <thead>
            <tr>
                <th>Nome do Aluno</th>
                <th style="text-align:center;">Aulas Presentes</th>
                <th style="text-align:right;">% Presença</th>
            </tr>
        </thead>
        <tbody>${rows}</tbody>
    </table>
  `
  const html = getModernTemplate(content, "Relatório de Frequência", hubName)
  const win = window.open("", "_blank"); if (win) { win.document.write(html); win.document.close(); win.onload = () => win.print() }
}

export function printCurriculumPDF(semesters: Semester[], disciplines: Discipline[], hubName?: string): void {
  const semestersHtml = semesters.sort((a,b) => a.order - b.order).map(s => {
    const sDisciplines = disciplines.filter(d => d.semesterId === s.id).sort((a,b) => a.order - b.order)
    const rows = sDisciplines.map(d => `<tr><td class="row-accent">${d.name}</td><td>${d.professorName || 'Mestre a definir'}</td></tr>`).join('')
    return `
      <h2>${s.name}</h2>
      <table>
        <thead><tr><th>Disciplina</th><th>Mestre Responsável</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>`
  }).join('')

  const html = getModernTemplate(semestersHtml, "Grade Curricular do Curso", hubName)
  const win = window.open("", "_blank"); if (win) { win.document.write(html); win.document.close(); win.onload = () => win.print() }
}
