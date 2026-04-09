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
  return new Date(iso).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
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
  const choice = question.choices.find((c) => c.id === answer)
  return choice ? choice.text : "—"
}

function getCorrectLabel(question: Question): string {
  if (question.type === "true-false") return question.correctAnswer === "true" ? "Verdadeiro" : "Falso"
  if (question.type === "discursive") return "Questão discursiva — correção manual"
  const choice = question.choices.find((c) => c.id === question.correctAnswer)
  return choice ? choice.text : "—"
}

function typeLabel(type: Question["type"]): string {
  if (type === "multiple-choice") return "Múltipla Escolha"
  if (type === "true-false") return "Verdadeiro ou Falso"
  return "Discursiva"
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
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&display=swap');
        
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
            font-family: 'Inter', -apple-system, sans-serif; 
            color: #1a202c; 
            background: #fff; 
            line-height: 1.5;
            padding: 20px;
        }
        
        @page {
            size: A4;
            margin: 15mm;
        }

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
    </style>
</head>
<body onload="setTimeout(() => window.print(), 500)">
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
</body>
</html>`
}

// ——— Individual Report Functions ——————————————————————————————————————————————————

export function printStudentListPDF(students: StudentProfile[], classes: any[], hubName?: string, existingWin?: Window | null): void {
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
  const win = existingWin || window.open("", "_blank")
  if (win) { win.document.write(html); win.document.close(); }
}

export function printGradesReportPDF(grades: StudentGrade[], disciplineName: string, hubName?: string, existingWin?: Window | null): void {
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
  const win = existingWin || window.open("", "_blank")
  if (win) { win.document.write(html); win.document.close(); }
}

export function printReceiptPDF(tuition: StudentTuition, student: StudentProfile, discipline: Discipline, hubName?: string, existingWin?: Window | null): void {
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
    const win = existingWin || window.open("", "_blank")
    if (win) { win.document.write(html); win.document.close(); }
}

export function printFinancialDRE_PDF(transactions: FinancialTransaction[], competencia: string, hubName?: string, existingWin?: Window | null): void {
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
    const win = existingWin || window.open("", "_blank")
    if (win) { win.document.write(html); win.document.close(); }
}

export function printTuitionReportPDF(tuitions: StudentTuition[], students: StudentProfile[], hubName?: string, existingWin?: Window | null): void {
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
    const win = existingWin || window.open("", "_blank")
    if (win) { win.document.write(html); win.document.close(); }
}

export function printAttendanceReportPDF(attendances: Attendance[], students: StudentProfile[], disciplineName: string, hubName?: string, existingWin?: Window | null): void {
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
  const win = existingWin || window.open("", "_blank")
  if (win) { win.document.write(html); win.document.close(); }
}

export function printCurriculumPDF(semesters: Semester[], disciplines: Discipline[], hubName?: string, existingWin?: Window | null): void {
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
  const win = existingWin || window.open("", "_blank")
  if (win) { win.document.write(html); win.document.close(); }
}

export function printStudentPDF({ submission, assessment, questions }: { submission: StudentSubmission, assessment: Assessment, questions: Question[] }, hubName?: string, existingWin?: Window | null): void {
  const orderedQuestions = assessment.questionIds
    .map((id) => questions.find((q) => q.id === id))
    .filter(Boolean) as Question[]

  const rows = orderedQuestions
    .map((q, i) => {
      const studentAns = submission.answers.find((a) => a.questionId === q.id)
      const studentLabel = studentAns ? getAnswerLabel(studentAns.answer, q) : "—"
      const correctLabel = getCorrectLabel(q)
      const isDiscursive = q.type === "discursive"
      const isCorrect = !isDiscursive && studentAns?.answer === q.correctAnswer
      const statusClass = isDiscursive ? 'badge-warning' : isCorrect ? 'badge-success' : 'badge-danger'
      const statusText = isDiscursive ? "Discursiva" : isCorrect ? "Correta" : "Incorreta"

      const choicesHTML =
        q.type === "multiple-choice"
          ? `<ul style="margin:8px 0;padding:0;list-style:none;font-size:12px;">
              ${q.choices
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
            <p style="font-size:16px;font-weight:800;color:#1e3a5f;">${submission.studentName}</p>
            <p style="font-size:12px;color:#64748b;">${submission.studentEmail}</p>
        </div>
        <div style="text-align:center;padding:0 20px;border-left:1px solid #e2e8f0;border-right:1px solid #e2e8f0;">
            <p style="font-size:11px;color:#64748b;text-transform:uppercase;font-weight:700;">Nota Final</p>
            <p style="font-size:24px;font-weight:800;color:#1e3a5f;">${submission.score.toFixed(1)} <span style="font-size:14px;color:#64748b;font-weight:400;">/ ${submission.totalPoints.toFixed(1)}</span></p>
        </div>
        <div style="text-align:right;">
            <p style="font-size:11px;color:#64748b;text-transform:uppercase;font-weight:700;">Desempenho</p>
            <p style="font-size:24px;font-weight:800;color:#f97316;">${submission.percentage}%</p>
        </div>
    </div>
    <div style="font-size:11px;color:#64748b;margin-bottom:20px;">
        Entrega: ${formatDate(submission.submittedAt)} • Tempo: ${formatTime(submission.timeElapsedSeconds)}
    </div>
    <h2>Revisão das Questões</h2>
    ${rows}
  `

  const html = getModernTemplate(statsHTML, `Revisão de Prova - ${submission.studentName}`, hubName)
  const win = existingWin || window.open("", "_blank")
  if (win) { win.document.write(html); win.document.close(); }
}

export function printAnswerKeyPDF({ assessment, questions }: { assessment: Assessment, questions: Question[] }, hubName?: string, existingWin?: Window | null): void {
  const orderedQuestions = assessment.questionIds.map((id) => questions.find((q) => q.id === id)).filter(Boolean) as Question[]
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
        <p style="font-size:18px;font-weight:800;color:#1e3a5f;">${assessment.title}</p>
    </div>
    <h2>Chave de Respostas</h2>
    ${rows}
  `
  
  const html = getModernTemplate(content, `Gabarito - ${assessment.title}`, hubName)
  const win = existingWin || window.open("", "_blank")
  if (win) { win.document.write(html); win.document.close(); }
}

export function printProfessorsPDF(professors: ProfessorAccount[], assignments: ProfessorDiscipline[], disciplines: Discipline[], hubName?: string, existingWin?: Window | null): void {
  const rows = professors.map(p => {
    const pDisciplines = assignments.filter(a => a.professorId === p.id).map(a => disciplines.find(d => d.id === a.disciplineId)?.name).filter(Boolean).join(', ')
    return `<tr>
        <td class="row-accent">${p.name}</td>
        <td>${p.email}</td>
        <td><span class="badge ${p.active ? 'badge-success' : 'badge-danger'}">${p.active ? 'Ativo' : 'Inativo'}</span></td>
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
        <tbody>${rows}</tbody>
    </table>
  `
  
  const html = getModernTemplate(content, "Corpo Docente e Mestres", hubName)
  const win = existingWin || window.open("", "_blank")
  if (win) { win.document.write(html); win.document.close(); }
}

export function printBlankAssessmentPDF({ assessment, questions }: { assessment: Assessment, questions: Question[] }, hubName?: string, existingWin?: Window | null): void {
    const orderedQuestions = assessment.questionIds.map(id => questions.find(q => q.id === id)).filter(Boolean) as Question[]
    const rows = orderedQuestions.map((q, i) => {
        const optionsHtml = q.type === "multiple-choice" ? 
          q.choices.map((c, ci) => `<div style="margin:8px 0;display:flex;gap:10px;"><div style="width:20px;height:20px;border:1.5px solid #cbd5e1;border-radius:4px;flex-shrink:0;"></div> <span style="font-size:13px;">(${String.fromCharCode(65 + ci)}) ${c.text}</span></div>`).join('') :
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
                <span>NOTA: _________ / ${assessment.totalPoints}</span>
            </div>
          </div>
      </div>
      <h2>Avaliação Acadêmica</h2>
      ${rows}
    `
    
    const html = getModernTemplate(headerHtml, assessment.title, hubName)
    const win = existingWin || window.open("", "_blank")
    if (win) { win.document.write(html); win.document.close(); }
}

export function printOverviewPDF({ assessments, submissions, questions }: { assessments: Assessment[], submissions: StudentSubmission[], questions: Question[] }, hubName?: string, existingWin?: Window | null): void {
    const avgScore = submissions.length > 0 ? (submissions.reduce((acc, s) => acc + (s?.score || 0), 0) / submissions.length) : 0
    
    const rows = (submissions || []).map((s, i) => `
        <tr>
            <td width="40">${i+1}</td>
            <td class="row-accent">${s.studentName}</td>
            <td style="font-weight:700; color:#1e3a5f;">${s.score.toFixed(1)}</td>
            <td style="text-align:right;"><span class="badge ${s.percentage >= 70 ? 'badge-success' : 'badge-danger'}">${s.percentage}%</span></td>
        </tr>
    `).join('')

    const assessmentsList = assessments.map(a => `<div style="padding:10px;border:1px solid #e2e8f0;border-radius:8px;font-size:12px;background:#fcfcfc;"><strong>${a.title}</strong><br/>${a.questionIds.length} questões • ${a.totalPoints} pts</div>`).join('')

    const content = `
      <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; margin-bottom: 30px;">
          <div style="background: #f8fafc; padding: 20px; border-radius: 12px; border: 1px solid #e2e8f0; text-align: center;">
            <p style="font-size: 10px; color: #64748b; text-transform: uppercase; font-weight: 700;">Participações</p>
            <p style="font-size: 22px; font-weight: 800; color: #1e3a5f;">${submissions.length}</p>
          </div>
          <div style="background: #f8fafc; padding: 20px; border-radius: 12px; border: 1px solid #e2e8f0; text-align: center;">
            <p style="font-size: 10px; color: #64748b; text-transform: uppercase; font-weight: 700;">Questões Totais</p>
            <p style="font-size: 22px; font-weight: 800; color: #16a34a;">${questions.length}</p>
          </div>
          <div style="background: #f8fafc; padding: 20px; border-radius: 12px; border: 1px solid #e2e8f0; text-align: center;">
            <p style="font-size: 10px; color: #64748b; text-transform: uppercase; font-weight: 700;">Média Global</p>
            <p style="font-size: 22px; font-weight: 800; color: #f97316;">${avgScore.toFixed(1)}</p>
          </div>
      </div>

      <h2>Relação de Provas</h2>
      <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px; margin-bottom:30px;">
          ${assessmentsList}
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
        <tbody>${rows}</tbody>
      </table>
    `
    const html = getModernTemplate(content, "Relatório Geral de Avaliações", hubName)
    const win = existingWin || window.open("", "_blank")
    if (win) { win.document.write(html); win.document.close(); }
}
