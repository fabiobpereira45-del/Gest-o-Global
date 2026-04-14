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
  try {
    return new Date(iso).toLocaleString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  } catch {
    return iso
  }
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}min ${s}s`
}

function getAnswerLabel(answer: string, question: Question): string {
  if (question.type === "true-false") {
    return answer === "true" ? "Verdadeiro" : answer === "false" ? "Falso" : "—"
  }
  if (question.type === "discursive") return answer || "—"
  const choice = (question.choices || []).find((c) => c.id === answer)
  return choice ? choice.text : "—"
}

function getCorrectLabel(question: Question): string {
  if (question.type === "true-false") return question.correctAnswer === "true" ? "Verdadeiro" : "Falso"
  if (question.type === "discursive") return "Questão discursiva — correção manual"
  const choice = (question.choices || []).find((c) => c.id === question.correctAnswer)
  return choice ? choice.text : "—"
}

function typeLabel(type: Question["type"]): string {
  if (type === "multiple-choice") return "Múltipla Escolha"
  if (type === "true-false") return "Verdadeiro ou Falso"
  return "Discursiva"
}

function formatCurrency(value: number): string {
  return (value || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

// ——— Modern Template Wrapper ——————————————————————————————————————————————————————

function getModernTemplate(content: string, title: string, hubName?: string, pageSize: "A4" | "A5 landscape" | "receipt" = "A4"): string {
  const isReceipt = pageSize === "receipt";
  const bodyClass = isReceipt ? "receipt-mode" : "";
  const pageValue = isReceipt ? "A4" : pageSize;

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8"/>
    <title>${title}</title>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&display=swap');
        
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
            font-family: 'Inter', -apple-system, sans-serif; 
            color: #1a202c; 
            background: #fff; 
            line-height: 1.5;
            padding: ${isReceipt ? '15px' : '20px'};
        }
        
        @page {
            size: ${pageValue};
            margin: ${isReceipt ? '10mm' : '15mm'};
        }

        .receipt-mode {
            max-height: 48vh;
            overflow: hidden;
            display: flex;
            flex-direction: column;
            border-bottom: 1px dashed #cbd5e1;
            padding-bottom: 20px;
        }
        .receipt-mode .header { padding-bottom: 10px; margin-bottom: 15px; border-bottom-width: 1px;}
        .receipt-mode .header-logo { height: 40px; }
        .receipt-mode .header-info { margin-left: 10px; }
        .receipt-mode .institution-name { font-size: 13px; margin-bottom: 0px; }
        .receipt-mode .hub-name { font-size: 10px; }
        .receipt-mode h1 { font-size: 14px; margin-bottom: 15px; }
        .receipt-mode .content p, .receipt-mode .content span { font-size: 11px; }
        .receipt-mode .content h2, .receipt-mode .content strong { font-size: 12px; }
        .receipt-mode table { font-size: 10px; margin-bottom: 10px; }
        .receipt-mode th, .receipt-mode td { padding: 6px 8px; }
        .receipt-mode .footer { margin-top: auto; padding-top: 10px; font-size: 9px; }
        .receipt-mode .signature-box { margin-top: 25px; gap: 20px; }
        .receipt-mode .signature-line { font-size: 9px; }

        @media print {
            body { padding: 0; }
            .no-print { display: none; }
        }

        /* Header */
        .header {
            display: flex;
            align-items: center;
            gap: 20px;
            border-bottom: 2px solid #1e3a5f;
            padding-bottom: 15px;
            margin-bottom: 25px;
        }
        .header-logo { height: 60px; width: auto; }
        .header-info { flex: 1; }
        .institution-name { 
            color: #1e3a5f; 
            font-size: 18px; 
            font-weight: 800;
            margin-bottom: 2px;
            text-transform: uppercase;
        }
        .hub-name {
            color: #f97316;
            font-weight: 700;
            font-size: 12px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }

        /* Typography */
        h1 { font-size: 20px; color: #1e3a5f; margin-bottom: 15px; font-weight: 800; }
        h2 { font-size: 16px; color: #4a5568; margin-bottom: 10px; font-weight: 700; }

        /* Tables */
        table { width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 11px; }
        th { 
            background-color: #1e3a5f; 
            color: #fff; 
            font-weight: 700; 
            text-align: left; 
            padding: 8px 12px; 
            text-transform: uppercase;
        }
        td { padding: 8px 12px; border-bottom: 1px solid #e2e8f0; color: #2d3748; }
        tr:nth-child(even) { background-color: #f8fafc; }
        .row-accent { font-weight: 700; color: #1e3a5f; }

        /* Status Badges */
        .badge {
            padding: 2px 8px;
            border-radius: 4px;
            font-size: 9px;
            font-weight: 700;
            text-transform: uppercase;
        }
        .badge-success { background: #dcfce7; color: #166534; border: 1px solid #16653433; }
        .badge-danger { background: #fee2e2; color: #991b1b; border: 1px solid #991b1b33; }
        .badge-warning { background: #fef3c7; color: #92400e; border: 1px solid #92400e33; }

        /* Footer */
        .footer {
            margin-top: 30px;
            padding-top: 15px;
            border-top: 1px solid #e2e8f0;
            font-size: 9px;
            color: #718096;
            display: flex;
            justify-content: space-between;
        }
        .signature-box {
            margin-top: 40px;
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 40px;
        }
        .signature-line {
            border-top: 1px solid #cbd5e1;
            padding-top: 8px;
            text-align: center;
            font-size: 10px;
            color: #64748b;
        }
    </style>
</head>
<body class="${bodyClass}">
    <div class="header">
        <img src="${IBAD_LOGO}" class="header-logo" alt="IBAD Logo" />
        <div class="header-info">
            <div class="institution-name">IBAD - Instituto Bíblico das Assembléias de Deus</div>
            <div class="hub-name">${hubName || "Núcleo Cosme de Farias"}</div>
        </div>
    </div>
    
    <h1>${title}</h1>
    
    <div class="content">
        ${content}
    </div>

    <div class="footer">
        <div>Relatório oficial gerado em ${new Date().toLocaleString('pt-BR')}</div>
        <div>Página 1 de 1</div>
    </div>
    <script>
      if (typeof window !== 'undefined') {
        window.onload = function() {
          setTimeout(function() { 
            window.print();
          }, 500);
        };
      }
    </script>
</body>
</html>`
}

function safePrint(html: string, existingWin?: Window | null) {
    try {
        const win = existingWin || window.open("", "_blank")
        if (win) {
            win.document.open()
            win.document.write(html)
            win.document.close()
        }
    } catch (err) {
        console.error("Erro ao imprimir PDF:", err)
        throw err
    }
}

// ——— Individual Report Functions ——————————————————————————————————————————————————

export function printStudentListPDF(students: StudentProfile[], classes: any[], hubName?: string, existingWin?: Window | null): void {
  try {
    const list = Array.isArray(students) ? students : []
    const clsList = Array.isArray(classes) ? classes : []

    const rows = list.map((s, i) => {
      const cls = clsList.find(c => c.id === s.class_id)
      return `<tr>
          <td>${i + 1}</td>
          <td class="row-accent">${s?.name || '—'}</td>
          <td>${s?.enrollment_number || "—"}</td>
          <td>${cls?.name || "Sem Turma"}</td>
          <td>${s?.phone || "—"}</td>
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
          <tbody>${rows || '<tr><td colspan="5" style="text-align:center;">Nenhum aluno encontrado</td></tr>'}</tbody>
      </table>
    `
    
    safePrint(getModernTemplate(content, "Relatório Geral de Alunos", hubName), existingWin)
  } catch (err) {
    console.error("Erro em printStudentListPDF:", err)
    throw err
  }
}

export function printGradesReportPDF(grades: StudentGrade[], disciplineName: string, hubName?: string, existingWin?: Window | null): void {
  try {
    const list = Array.isArray(grades) ? grades : []
    const rows = list.map(g => {
      const final = ((g?.examGrade || 0) + (g?.worksGrade || 0) + (g?.seminarGrade || 0) + (g?.participationBonus || 0)) / (g?.customDivisor || 4)
      const status = final >= 7 ? 'APROVADO' : 'REPROVADO'
      const statusClass = final >= 7 ? 'badge-success' : 'badge-danger'
      
      return `<tr>
          <td class="row-accent">${g?.studentName || '—'}</td>
          <td>${(g?.examGrade || 0).toFixed(1)}</td>
          <td>${(g?.worksGrade || 0).toFixed(1)}</td>
          <td>${(g?.seminarGrade || 0).toFixed(1)}</td>
          <td class="row-accent">${final.toFixed(1)}</td>
          <td><span class="badge ${statusClass}">${status}</span></td>
      </tr>`
    }).join('')

    const content = `
      <h2>Disciplina: ${disciplineName || '—'}</h2>
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
          <tbody>${rows || '<tr><td colspan="6" style="text-align:center;">Nenhuma nota lançada</td></tr>'}</tbody>
      </table>
    `

    safePrint(getModernTemplate(content, "Diário de Notas", hubName), existingWin)
  } catch (err) {
    console.error("Erro em printGradesReportPDF:", err)
    throw err
  }
}

export function printReceiptPDF(tuition: StudentTuition, student: StudentProfile, discipline: Discipline, hubName?: string, existingWin?: Window | null): void {
    if (!tuition || !student || !discipline) return;
    
    const content = `
        <div style="border: 2px solid #1e3a5f; padding: 30px; border-radius: 12px; background: #fff; position: relative; overflow: hidden;">
            <div style="position: absolute; top: -20px; right: -20px; font-size: 80px; color: #f8fafc; font-weight: 900; z-index: 0; pointer-events:none;">RECIBO</div>
            
            <div style="position: relative; z-index: 1;">
                <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 40px;">
                    <div>
                        <p style="font-size: 12px; color: #64748b; text-transform: uppercase; font-weight: 700; margin-bottom: 4px;">Recibo de Pagamento</p>
                        <h2 style="margin: 0; border: none; padding: 0;">Nº ${(tuition.id || "").slice(0, 8).toUpperCase()}</h2>
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

                <div class="signature-box">
                    <div class="signature-line">
                        <p style="font-weight: 700; color: #1e3a5f;">${hubName || "Administração IBAD"}</p>
                        Assinatura Institucional
                    </div>
                    <div class="signature-line">
                        <p style="font-weight: 700; color: #1e3a5f;">${student.name}</p>
                        Assinatura do Aluno
                    </div>
                </div>
            </div>
        </div>
    `
    safePrint(getModernTemplate(content, "Recibo de Pagamento", hubName, "receipt"), existingWin)
}

export function printProfessorReceiptPDF(transaction: FinancialTransaction, professor: ProfessorAccount, discipline: Discipline, hubName?: string, existingWin?: Window | null): void {
    if (!transaction || !professor || !discipline) return;
    
    const content = `
        <div style="border: 2px solid #1e3a5f; padding: 30px; border-radius: 12px; background: #fff; position: relative; overflow: hidden; min-height: 500px;">
            <div style="position: absolute; top: -20px; right: -20px; font-size: 80px; color: #f8fafc; font-weight: 900; z-index: 0; pointer-events:none;">PAGAMENTO</div>
            
            <div style="position: relative; z-index: 1;">
                <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 40px;">
                    <div>
                        <p style="font-size: 12px; color: #64748b; text-transform: uppercase; font-weight: 700; margin-bottom: 4px;">Recibo de Pro-labore (Mestre)</p>
                        <h2 style="margin: 0; border: none; padding: 0;">Nº ${(transaction.id || "").slice(0, 8).toUpperCase()}</h2>
                    </div>
                    <div style="text-align: right;">
                        <p style="font-size: 11px; color: #64748b;">Data da Baixa</p>
                        <p class="row-accent">${formatDate(transaction.date)}</p>
                    </div>
                </div>

                <div style="margin-bottom: 30px;">
                    <p style="font-size: 14px; margin-bottom: 20px;">Efetuamos o pagamento ao Mestre <strong>${professor.name}</strong>, a quantia líquida de:</p>
                    <div style="font-size: 32px; font-weight: 800; color: #1e3a5f; margin-bottom: 10px;">${formatCurrency(transaction.amount)}</div>
                    <p style="font-size: 12px; color: #64748b; font-style: italic; margin-bottom: 20px;">Referente aos serviços educacionais prestados na disciplina: <strong>${discipline.name}</strong></p>
                    
                    <div style="background: #f8fafc; padding: 15px; border-radius: 8px; border: 1px solid #e2e8f0; margin-top: 20px;">
                        <p style="font-size: 10px; color: #64748b; text-transform: uppercase; font-weight: 700; margin-bottom: 8px;">Dados do Favorecido</p>
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; font-size: 12px;">
                            <div>
                                <p style="color: #64748b;">Chave PIX:</p>
                                <p style="font-weight: 600;">${professor.pix_key || "Não informada"}</p>
                            </div>
                            <div>
                                <p style="color: #64748b;">Dados Bancários:</p>
                                <p style="font-weight: 600;">${professor.bank_info || "Direto / Em espécie"}</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="signature-box" style="margin-top: 60px;">
                    <div class="signature-line">
                        <p style="font-weight: 700; color: #1e3a5f;">${hubName || "Administração IBAD"}</p>
                        Responsável Financeiro
                    </div>
                    <div class="signature-line">
                        <p style="font-weight: 700; color: #1e3a5f;">${professor.name}</p>
                        Assinatura do Mestre
                    </div>
                </div>
                
                <div style="margin-top: 50px; text-align: center; font-size: 10px; color: #94a3b8;">
                    Este documento é um comprovante digital de transação efetuada via sistema IBAD.
                </div>
            </div>
        </div>
    `
    safePrint(getModernTemplate(content, "Recibo de Pro-labore", hubName, "receipt"), existingWin)
}

export function printFinancialDRE_PDF(transactions: FinancialTransaction[], competencia: string, hubName?: string, existingWin?: Window | null): void {
    const list = Array.isArray(transactions) ? transactions : []
    const incomes = list.filter(t => t.type === 'income' && t.status === 'realized')
    const expenses = list.filter(t => t.type === 'expense' && t.status === 'realized')
    const totalIncome = incomes.reduce((acc, t) => acc + (t.amount || 0), 0)
    const totalExpense = expenses.reduce((acc, t) => acc + (t.amount || 0), 0)
    const result = totalIncome - totalExpense

    const categorySummary = expenses.reduce((acc: any, t) => {
        acc[t.category] = (acc[t.category] || 0) + (t.amount || 0)
        return acc
    }, {})

    const expenseRows = Object.entries(categorySummary).map(([cat, amt]: any) => `
        <tr><td>${cat}</td><td style="text-align:right;">${formatCurrency(amt)}</td></tr>
    `).join('')

    const content = `
        <div style="background: #f8fafc; padding: 25px; border-radius: 12px; margin-bottom: 30px; border:1px solid #e2e8f0;">
            <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px;">
                <div style="text-align: center;">
                    <p style="font-size: 10px; color: #64748b; text-transform: uppercase;">Receita Total</p>
                    <p style="font-size: 18px; font-weight: 800; color: #16a34a;">${formatCurrency(totalIncome)}</p>
                </div>
                <div style="text-align: center; border-left:1px solid #e2e8f0; border-right:1px solid #e2e8f0;">
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
            <tbody>${expenseRows || '<tr><td colspan="2" style="text-align:center;">Nenhuma despesa registrada</td></tr>'}</tbody>
        </table>
    `
    safePrint(getModernTemplate(content, `DRE - Competência ${competencia}`, hubName), existingWin)
}

export function printTuitionReportPDF(tuitions: StudentTuition[], students: StudentProfile[], hubName?: string, existingWin?: Window | null): void {
    const tList = Array.isArray(tuitions) ? tuitions : []
    const sList = Array.isArray(students) ? students : []

    const rows = tList.map(t => {
        const student = sList.find(s => s.id === t.studentId)
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
            <tbody>${rows || '<tr><td colspan="4" style="text-align:center;">Nenhuma mensalidade encontrada</td></tr>'}</tbody>
        </table>
    `
    safePrint(getModernTemplate(content, "Relatório de Recebíveis", hubName), existingWin)
}

export function printAttendanceReportPDF(attendances: Attendance[], students: StudentProfile[], disciplineName: string, hubName?: string, existingWin?: Window | null): void {
  const attList = Array.isArray(attendances) ? attendances : []
  const sList = Array.isArray(students) ? students : []

  const logs = sList.map(s => {
    const sAtt = attList.filter(a => a.studentId === s.id)
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
    <h2>Frequência: ${disciplineName || '—'}</h2>
    <table>
        <thead>
            <tr>
                <th>Nome do Aluno</th>
                <th style="text-align:center;">Aulas Presentes</th>
                <th style="text-align:right;">% Presença</th>
            </tr>
        </thead>
        <tbody>${rows || '<tr><td colspan="3" style="text-align:center;">Nenhum registro de frequência</td></tr>'}</tbody>
    </table>
  `
  safePrint(getModernTemplate(content, "Relatório de Frequência", hubName), existingWin)
}

export function printCurriculumPDF(semesters: Semester[], disciplines: Discipline[], hubName?: string, existingWin?: Window | null): void {
  const semList = Array.isArray(semesters) ? semesters : []
  const discList = Array.isArray(disciplines) ? disciplines : []

  const semestersHtml = semList.sort((a,b) => (a.order || 0) - (b.order || 0)).map(s => {
    const sDisciplines = discList.filter(d => d.semesterId === s.id).sort((a,b) => (a.order || 0) - (b.order || 0))
    const rows = sDisciplines.map(d => `<tr><td class="row-accent">${d.name}</td><td>${d.professorName || 'Mestre a definir'}</td></tr>`).join('')
    return `
      <h2>${s.name}</h2>
      <table>
        <thead><tr><th>Disciplina</th><th>Mestre Responsável</th></tr></thead>
        <tbody>${rows || '<tr><td colspan="2" style="text-align:center;">Nenhuma disciplina neste semestre</td></tr>'}</tbody>
      </table>`
  }).join('')

  safePrint(getModernTemplate(semestersHtml || '<p>Nenhuma grade curricular definida.</p>', "Grade Curricular do Curso", hubName), existingWin)
}

export function printStudentPDF({ submission, assessment, questions }: { submission: StudentSubmission, assessment: Assessment, questions: Question[] }, hubName?: string, existingWin?: Window | null): void {
  const qList = Array.isArray(questions) ? questions : []
  const subAnswers = Array.isArray(submission?.answers) ? submission.answers : []

  const orderedQuestions = (assessment?.questionIds || [])
    .map((id) => qList.find((q) => q.id === id))
    .filter(Boolean) as Question[]

  const rows = orderedQuestions
    .map((q, i) => {
      const studentAns = subAnswers.find((a) => a.questionId === q.id)
      const studentLabel = studentAns ? getAnswerLabel(studentAns.answer, q) : "—"
      const correctLabel = getCorrectLabel(q)
      const isDiscursive = q.type === "discursive"
      const isCorrect = !isDiscursive && studentAns?.answer === q.correctAnswer
      const statusClass = isDiscursive ? 'badge-warning' : isCorrect ? 'badge-success' : 'badge-danger'
      const statusText = isDiscursive ? "Discursiva" : isCorrect ? "Correta" : "Incorreta"

      const choicesHTML =
        q.type === "multiple-choice"
          ? `<ul style="margin:8px 0;padding:0;list-style:none;font-size:12px;">
              ${(q.choices || [])
            .map(
              (c) =>
                `<li style="margin:4px 0;padding:6px 12px;border-radius:6px;
                    background:${c.id === q.correctAnswer ? "#dcfce7" : c.id === studentAns?.answer && !isCorrect ? "#fee2e2" : "#f8fafc"};
                    color:${c.id === q.correctAnswer ? "#166534" : c.id === studentAns?.answer && !isCorrect ? "#991b1b" : "#4a5568"};
                    border: 1px solid ${c.id === q.correctAnswer ? "#16653433" : c.id === studentAns?.answer && !isCorrect ? "#991b1b33" : "#e2e8f0"};">
                    ${c.text}${c.id === q.correctAnswer ? " ✓" : ""}${c.id === studentAns?.answer && !isCorrect ? " ✗" : ""}
                    </li>`
            )
            .join("")}
             </ul>`
          : ""

      const discursiveHTML =
        q.type === "discursive"
          ? `<div style="margin-top:10px;padding:12px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;font-size:12px;color:#1a202c;min-height:50px;">
              ${studentLabel}
             </div>`
          : ""

      return `
        <div style="margin-bottom:24px;padding:20px;border:1px solid #e2e8f0;border-radius:12px;break-inside:avoid;">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;padding-bottom:10px;border-bottom:1px solid #f1f5f9;">
            <span style="font-size:11px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:1px;">
              Questão ${i + 1} • ${typeLabel(q.type)} • ${assessment.pointsPerQuestion} pts
            </span>
            <span class="badge ${statusClass}">${statusText}</span>
          </div>
          <p style="margin:0 0 12px 0;font-size:14px;color:#1a202c;font-weight:600;line-height:1.6;">${q.text}</p>
          ${choicesHTML}
          ${discursiveHTML}
          ${q.type === "true-false"
          ? `<div style="margin-top:10px;display:flex;gap:12px;">
                   <span style="padding:6px 15px;border-radius:8px;font-size:12px;background:${studentAns?.answer === "true" && !isCorrect ? "#fee2e2" : studentAns?.answer === "true" ? "#dcfce7" : "#f8fafc"};color:${studentAns?.answer === "true" && !isCorrect ? "#991b1b" : studentAns?.answer === "true" ? "#166534" : "#4a5568"};border:1px solid #e2e8f0;">Verdadeiro${q.correctAnswer === "true" ? " ✓" : ""}${studentAns?.answer === "true" && !isCorrect ? " ✗" : ""}</span>
                   <span style="padding:6px 15px;border-radius:8px;font-size:12px;background:${studentAns?.answer === "false" && !isCorrect ? "#fee2e2" : studentAns?.answer === "false" ? "#dcfce7" : "#f8fafc"};color:${studentAns?.answer === "false" && !isCorrect ? "#991b1b" : studentAns?.answer === "false" ? "#166534" : "#4a5568"};border:1px solid #e2e8f0;">Falso${q.correctAnswer === "false" ? " ✓" : ""}${studentAns?.answer === "false" && !isCorrect ? " ✗" : ""}</span>
                 </div>`
          : ""
        }
          ${!isDiscursive
          ? `<div style="margin-top:12px;font-size:12px;color:#166534;font-weight:700;padding:8px 12px;background:#f0fdf4;border-radius:6px;display:inline-block;">
                   Gabarito: ${correctLabel}
                 </div>`
          : ""
        }
        </div>`
    })
    .join("")

  const statsHTML = `
    <div style="display:flex;gap:20px;margin-bottom:30px;background:#f8fafc;padding:20px;border-radius:12px;border:1px solid #e2e8f0;">
        <div style="flex:1;">
            <p style="font-size:11px;color:#64748b;text-transform:uppercase;font-weight:700;">Aluno</p>
            <p style="font-size:16px;font-weight:800;color:#1e3a5f;">${submission?.studentName || '—'}</p>
            <p style="font-size:12px;color:#64748b;">${submission?.studentEmail || '—'}</p>
        </div>
        <div style="text-align:center;padding:0 20px;border-left:1px solid #e2e8f0;border-right:1px solid #e2e8f0;">
            <p style="font-size:11px;color:#64748b;text-transform:uppercase;font-weight:700;">Nota Final</p>
            <p style="font-size:24px;font-weight:800;color:#1e3a5f;">${((submission?.percentage || 0) / 10).toFixed(1)} <span style="font-size:14px;color:#64748b;font-weight:400;">/ 10.0</span></p>
        </div>
        <div style="text-align:right;">
            <p style="font-size:11px;color:#64748b;text-transform:uppercase;font-weight:700;">Desempenho</p>
            <p style="font-size:24px;font-weight:800;color:#f97316;">${submission?.percentage || 0}%</p>
        </div>
    </div>
    <div style="font-size:11px;color:#64748b;margin-bottom:20px;">
        Entrega: ${formatDate(submission?.submittedAt)} • Tempo: ${formatTime(submission?.timeElapsedSeconds || 0)}
    </div>
    <h2>Revisão das Questões</h2>
    ${rows || '<p>Nenhuma questão respondida.</p>'}
  `

  safePrint(getModernTemplate(statsHTML, `Revisão de Prova - ${submission?.studentName || 'Aluno'}`, hubName), existingWin)
}

export function printAnswerKeyPDF({ assessment, questions }: { assessment: Assessment, questions: Question[] }, hubName?: string, existingWin?: Window | null): void {
  const qList = Array.isArray(questions) ? questions : []
  const orderedQuestions = (assessment?.questionIds || []).map((id) => qList.find((q) => q.id === id)).filter(Boolean) as Question[]
  
  const rows = orderedQuestions.map((q, i) => {
    const correctLabel = getCorrectLabel(q)
    return `
      <div style="margin-bottom:16px;padding:15px;border:1px solid #e2e8f0;border-radius:10px;break-inside:avoid;">
        <p style="font-size:13px;font-weight:700;margin-bottom:8px;color:#1e3a5f;">QUESTÃO ${i + 1}</p>
        <p style="font-size:13px;margin-bottom:8px;line-height:1.5;">${q.text}</p>
        <div style="color: #166534; font-weight: 800; font-size:13px; background:#f0fdf4; padding:8px 12px; border-radius:6px; display:inline-block;">
            GABARITO: ${correctLabel}
        </div>
      </div>`
  }).join("")

  const content = `
    <div style="margin-bottom:25px;padding:20px;background:#f8fafc;border-radius:12px;border:1px solid #e2e8f0;">
        <p style="font-size:12px;color:#64748b;text-transform:uppercase;font-weight:700;">Prova</p>
        <p style="font-size:18px;font-weight:800;color:#1e3a5f;">${assessment?.title || '—'}</p>
    </div>
    <h2>Chave de Respostas</h2>
    ${rows || '<p>Nenhuma questão na prova.</p>'}
  `
  
  safePrint(getModernTemplate(content, `Gabarito - ${assessment?.title || 'Prova'}`, hubName), existingWin)
}

export function printProfessorsPDF(professors: ProfessorAccount[], assignments: ProfessorDiscipline[], disciplines: Discipline[], hubName?: string, existingWin?: Window | null): void {
  try {
    const safeProfessors = Array.isArray(professors) ? professors : []
    const safeAssignments = Array.isArray(assignments) ? assignments : []
    const safeDisciplines = Array.isArray(disciplines) ? disciplines : []

    const rows = safeProfessors.map(p => {
      const pDisciplines = safeAssignments
        .filter(a => a?.professorId === p?.id)
        .map(a => safeDisciplines.find(d => d?.id === a?.disciplineId)?.name)
        .filter(Boolean)
        .join(', ')
      
      return `<tr>
          <td class="row-accent">${p?.name || '—'}</td>
          <td>${p?.email || '—'}</td>
          <td><span class="badge ${p?.active ? 'badge-success' : 'badge-danger'}">${p?.active ? 'Ativo' : 'Inativo'}</span></td>
          <td>${pDisciplines || 'Sem disciplinas'}</td>
      </tr>`
    }).join('')

    const content = `
      <table>
          <thead>
              <tr>
                  <th>Nome</th>
                  <th>E-mail</th>
                  <th>Status</th>
                  <th>Disciplinas Atribuídas</th>
              </tr>
          </thead>
          <tbody>${rows || '<tr><td colspan="4" style="text-align:center;">Nenhum professor registrado</td></tr>'}</tbody>
      </table>
    `
    safePrint(getModernTemplate(content, "Corpo Docente e Mestres", hubName), existingWin)
  } catch (error) {
    console.error("Erro crítico em printProfessorsPDF:", error)
    throw error
  }
}

export function printBlankAssessmentPDF({ assessment, questions }: { assessment: Assessment, questions: Question[] }, hubName?: string, existingWin?: Window | null): void {
    const qList = Array.isArray(questions) ? questions : []
    const orderedQuestions = (assessment?.questionIds || []).map(id => qList.find(q => q.id === id)).filter(Boolean) as Question[]
    
    if (orderedQuestions.length === 0) {
        console.warn("printBlankAssessmentPDF: Nenhuma questão encontrada para a prova", assessment?.title)
    }
    
    const rows = orderedQuestions.map((q, i) => {
        const optionsHtml = q.type === "multiple-choice" ? 
          (q.choices || []).map((c, ci) => `<div style="margin:8px 0;display:flex;gap:10px;"><div style="width:20px;height:20px;border:1.5px solid #cbd5e1;border-radius:4px;flex-shrink:0;"></div> <span style="font-size:13px;">(${String.fromCharCode(65 + ci)}) ${c.text}</span></div>`).join('') :
          (q.type === "true-false" ? "<div style=\"margin:12px 0;display:flex;gap:20px;\"><div style='display:flex;gap:8px;align-items:center;'><div style='width:18px;height:18px;border:1.5px solid #cbd5e1;border-radius:50%;'></div> <span>Verdadeiro</span></div> <div style='display:flex;gap:8px;align-items:center;'><div style='width:18px;height:18px;border:1.5px solid #cbd5e1;border-radius:50%;'></div> <span>Falso</span></div></div>" : "<div style='height:150px;border:1px solid #e2e8f0;margin-top:10px;border-radius:8px;background:#fcfcfc;'></div>")
        
        return `
          <div style="margin-bottom:30px;break-inside:avoid;padding:20px;border:1px solid #e2e8f0;border-radius:12px;">
              <div style="font-weight:800;font-size:12px;color:#64748b;text-transform:uppercase;margin-bottom:8px;letter-spacing:1px;">Questão ${i+1} • ${assessment.pointsPerQuestion} pts</div>
              <div style="margin-bottom:15px;line-height:1.6;font-size:14px;color:#1e3a5f;font-weight:600;">${q.text}</div>
              ${optionsHtml}
          </div>
        `
    }).join('')
    
    const headerHtml = `
      <div style="border:2px solid #1e3a5f;padding:25px;border-radius:15px;margin-bottom:40px;background:#f8fafc;">
          <div style="display:flex;flex-direction:column;gap:15px;">
            <div style="display:flex;justify-content:space-between;border-bottom:1.5px solid #e2e8f0;padding-bottom:10px;">
                <span style="font-size:14px;font-weight:800;color:#1e3a5f;">ALUNO: ____________________________________________________________________</span>
            </div>
            <div style="display:flex;justify-content:space-between;font-size:13px;font-weight:700;color:#64748b;">
                <span>DATA: ____/____/2026</span>
                <span>DATA DA PROVA: ${new Date().toLocaleDateString('pt-BR')}</span>
                <span>NOTA: _________ / ${assessment?.totalPoints || 0}</span>
            </div>
          </div>
      </div>
      <h2>Avaliação Acadêmica</h2>
      ${rows || '<p>Nenhuma questão na avaliação.</p>'}
    `
    safePrint(getModernTemplate(headerHtml, assessment?.title || "Avaliação", hubName), existingWin)
}

export function printOverviewPDF({ assessments, submissions, questions }: { assessments: Assessment[], submissions: StudentSubmission[], questions: Question[] }, hubName?: string, existingWin?: Window | null): void {
    const subList = Array.isArray(submissions) ? submissions : []
    const qList = Array.isArray(questions) ? questions : []
    const aList = Array.isArray(assessments) ? assessments : []

    const avgPercentage = subList.length > 0 ? (subList.reduce((acc, s) => acc + (s?.percentage || 0), 0) / subList.length) : 0
    const avgScore = avgPercentage / 10
    
    const rows = subList.map((s, i) => `
        <tr>
            <td width="40">${i+1}</td>
            <td class="row-accent">${s?.studentName || '—'}</td>
            <td style="font-weight:700; color:#1e3a5f;">${((s?.percentage || 0) / 10).toFixed(1)}</td>
            <td style="text-align:right;"><span class="badge ${s?.percentage >= 70 ? 'badge-success' : 'badge-danger'}">${s?.percentage || 0}%</span></td>
        </tr>
    `).join('')

    const assessmentsList = aList.map(a => `<div style="padding:10px;border:1px solid #e2e8f0;border-radius:8px;font-size:12px;background:#fcfcfc;"><strong>${a.title}</strong><br/>${(a.questionIds || []).length} questões • ${a.totalPoints} pts</div>`).join('')

    const content = `
      <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; margin-bottom: 30px;">
          <div style="background: #f8fafc; padding: 20px; border-radius: 12px; border: 1px solid #e2e8f0; text-align: center;">
            <p style="font-size: 10px; color: #64748b; text-transform: uppercase; font-weight: 700;">Participações</p>
            <p style="font-size: 22px; font-weight: 800; color: #1e3a5f;">${subList.length}</p>
          </div>
          <div style="background: #f8fafc; padding: 20px; border-radius: 12px; border: 1px solid #e2e8f0; text-align: center;">
            <p style="font-size: 10px; color: #64748b; text-transform: uppercase; font-weight: 700;">Questões Totais</p>
            <p style="font-size: 22px; font-weight: 800; color: #16a34a;">${qList.length}</p>
          </div>
          <div style="background: #f8fafc; padding: 20px; border-radius: 12px; border: 1px solid #e2e8f0; text-align: center;">
            <p style="font-size: 10px; color: #64748b; text-transform: uppercase; font-weight: 700;">Média Global</p>
            <p style="font-size: 22px; font-weight: 800; color: #f97316;">${avgScore.toFixed(1)}</p>
          </div>
      </div>

      <h2>Relação de Provas</h2>
      <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px; margin-bottom:30px;">
          ${assessmentsList || '<p>Nenhuma prova vinculada.</p>'}
      </div>

      <h2>Desempenho por Aluno</h2>
      <table>
        <thead>
            <tr>
                <th>#</th>
                <th>Nome do Aluno</th>
                <th>Nota</th>
                <th style="text-align:right;">% Acerto</th>
            </tr>
        </thead>
        <tbody>${rows || '<tr><td colspan="4" style="text-align:center;">Nenhuma submissão encontrada</td></tr>'}</tbody>
      </table>
    `
    safePrint(getModernTemplate(content, "Relatório Geral de Avaliações", hubName), existingWin)
}
