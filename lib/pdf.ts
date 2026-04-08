import type { 
  Assessment, Question, StudentAnswer, StudentSubmission, 
  Semester, Discipline, ProfessorAccount, ProfessorDiscipline, 
  StudentProfile, StudentGrade, Attendance 
} from "./store"

const IBAD_LOGO = "/ibad-logo.png"

interface PDFData {
  submission: StudentSubmission
  assessment: Assessment
  questions: Question[]
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}min ${s}s`
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
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

export function printStudentPDF({ submission, assessment, questions }: PDFData): void {
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
      const statusColor = isDiscursive ? "#6b7280" : isCorrect ? "#16a34a" : "#dc2626"
      const statusText = isDiscursive ? "Discursiva" : isCorrect ? "Correta" : "Incorreta"

      const choicesHTML =
        q.type === "multiple-choice"
          ? `<ul style="margin:4px 0 0 0;padding:0;list-style:none;">
              ${q.choices
            .map(
              (c) =>
                `<li style="margin:2px 0;padding:3px 6px;border-radius:4px;font-size:12px;
                    background:${c.id === q.correctAnswer ? "#dcfce7" : c.id === studentAns?.answer && !isCorrect ? "#fee2e2" : "#f9fafb"};
                    color:${c.id === q.correctAnswer ? "#166534" : c.id === studentAns?.answer && !isCorrect ? "#991b1b" : "#374151"}">
                    ${c.text}${c.id === q.correctAnswer ? " ✓" : ""}${c.id === studentAns?.answer && !isCorrect ? " ✗" : ""}
                    </li>`
            )
            .join("")}
             </ul>`
          : ""

      const discursiveHTML =
        q.type === "discursive"
          ? `<div style="margin-top:6px;padding:8px;background:#f9fafb;border:1px solid #e5e7eb;border-radius:4px;font-size:12px;color:#374151;min-height:40px;">
              ${studentLabel}
             </div>`
          : ""

      return `
        <div style="margin-bottom:16px;padding:12px;border:1px solid #e5e7eb;border-radius:8px;break-inside:avoid;">
          <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:6px;">
            <span style="font-size:11px;font-weight:600;color:#6b7280;text-transform:uppercase;letter-spacing:.5px;">
              Questão ${i + 1} &nbsp;·&nbsp; ${typeLabel(q.type)} &nbsp;·&nbsp; ${assessment.pointsPerQuestion} pt${assessment.pointsPerQuestion !== 1 ? "s" : ""}
            </span>
            <span style="font-size:11px;font-weight:700;color:${statusColor};text-transform:uppercase;">${statusText}</span>
          </div>
          <p style="margin:0 0 6px 0;font-size:13px;color:#111827;line-height:1.5;">${q.text}</p>
          ${choicesHTML}
          ${discursiveHTML}
          ${q.type === "true-false"
          ? `<div style="margin-top:6px;display:flex;gap:8px;">
                  <span style="padding:3px 10px;border-radius:4px;font-size:12px;background:${studentAns?.answer === "true" && !isCorrect ? "#fee2e2" : studentAns?.answer === "true" ? "#dcfce7" : "#f3f4f6"};color:${studentAns?.answer === "true" && !isCorrect ? "#991b1b" : studentAns?.answer === "true" ? "#166534" : "#374151"}">Verdadeiro${q.correctAnswer === "true" ? " ✓" : ""}${studentAns?.answer === "true" && !isCorrect ? " ✗" : ""}</span>
                  <span style="padding:3px 10px;border-radius:4px;font-size:12px;background:${studentAns?.answer === "false" && !isCorrect ? "#fee2e2" : studentAns?.answer === "false" ? "#dcfce7" : "#f3f4f6"};color:${studentAns?.answer === "false" && !isCorrect ? "#991b1b" : studentAns?.answer === "false" ? "#166534" : "#374151"}">Falso${q.correctAnswer === "false" ? " ✓" : ""}${studentAns?.answer === "false" && !isCorrect ? " ✗" : ""}</span>
                 </div>`
          : ""
        }
          ${!isDiscursive
          ? `<div style="margin-top:8px;font-size:12px;color:#166534;font-weight:600;">
                  Gabarito: ${correctLabel}
                </div>`
          : ""
        }
        </div>`
    })
    .join("")

  const displayInstitution = (!assessment.institution || assessment.institution.includes("ENSINO TEOLÓGICO")) ? "Instituto Bíblico das Assembléias de Deus" : assessment.institution
  const displayProfessor = (!assessment.professor || assessment.professor.includes("Fábio Barreto") || assessment.professor === "Professor") ? "Corpo Docente" : assessment.professor

  const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8"/>
  <title>Prova — ${submission.studentName}</title>
  <style> body { font-family: Arial, sans-serif; color: #111827; background: #fff; padding: 24px; } @media print { body { padding: 0; } } </style>
</head>
<body>
  <div style="border-bottom:3px solid #1e3a5f;padding-bottom:16px;margin-bottom:20px;display:flex;align-items:center;gap:20px;">
    <img src="${IBAD_LOGO}" style="height:60px;width:auto;" alt="Logo IBAD" />
    <div style="flex:1;display:flex;justify-content:space-between;align-items:flex-start;">
      <div>
        <div style="font-size:11px;font-weight:700;color:#f97316;text-transform:uppercase;letter-spacing:1px;">${displayInstitution}</div>
        <h1 style="font-size:20px;font-weight:800;color:#1e3a5f;margin:4px 0;">${assessment.title}</h1>
        <div style="font-size:12px;color:#6b7280;">Professor: ${displayProfessor}</div>
      </div>
      <div style="text-align:right;">
        <div style="font-size:11px;color:#6b7280;">Entrega: ${formatDate(submission.submittedAt)}</div>
        <div style="font-size:11px;color:#6b7280;margin-top:4px;">Tempo: ${formatTime(submission.timeElapsedSeconds)}</div>
      </div>
    </div>
  </div>
  <div style="display:flex;gap:16px;margin-bottom:24px;">
    <div style="flex:1;padding:12px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;">
      <div style="font-size:16px;font-weight:700;color:#1e3a5f;">${submission.studentName}</div>
      <div style="font-size:12px;color:#6b7280;">${submission.studentEmail}</div>
    </div>
    <div style="padding:12px 24px;background:#1e3a5f;border-radius:8px;text-align:center;min-width:120px;">
      <div style="font-size:32px;font-weight:800;color:#fff;">${submission.score.toFixed(1)}</div>
      <div style="font-size:12px;color:rgba(255,255,255,.7);">de ${submission.totalPoints.toFixed(1)} pts (${submission.percentage}%)</div>
    </div>
  </div>
  <h2 style="font-size:14px;font-weight:700;color:#1e3a5f;text-transform:uppercase;margin-bottom:12px;border-bottom:1px solid #e5e7eb;padding-bottom:8px;">Respostas</h2>
  ${rows}
</body>
</html>`

  const win = window.open("", "_blank", "width=900,height=700")
  if (win) { win.document.write(html); win.document.close(); win.onload = () => win.print() }
}

export function printAnswerKeyPDF({ assessment, questions }: { assessment: Assessment, questions: Question[] }): void {
  const orderedQuestions = assessment.questionIds.map((id) => questions.find((q) => q.id === id)).filter(Boolean) as Question[]
  const rows = orderedQuestions.map((q, i) => {
    const correctLabel = getCorrectLabel(q)
    return `<div style="margin-bottom:16px;padding:12px;border:1px solid #e5e7eb;border-radius:8px;break-inside:avoid;">
      <strong>Questão ${i + 1}</strong>: ${q.text}<br/>
      <span style="color: #166534; font-weight: bold;">Gabarito: ${correctLabel}</span>
    </div>`
  }).join("")
  const html = `<!DOCTYPE html><html><head><title>Gabarito — ${assessment.title}</title></head><body><h1>${assessment.title} - Gabarito</h1>${rows}</body></html>`
  const win = window.open("", "_blank"); if (win) { win.document.write(html); win.document.close(); win.onload = () => win.print() }
}

export function printCurriculumPDF(semesters: Semester[], disciplines: Discipline[]): void {
  const semestersHtml = semesters.sort((a,b) => a.order - b.order).map(s => {
    const sDisciplines = disciplines.filter(d => d.semesterId === s.id).sort((a,b) => a.order - b.order)
    const rows = sDisciplines.map(d => `<tr><td>${d.name}</td><td>${d.professorName || 'Não atribuído'}</td></tr>`).join('')
    return `<h3>${s.name}</h3><table border="1" width="100%"><thead><tr><th>Disciplina</th><th>Professor</th></tr></thead><tbody>${rows}</tbody></table>`
  }).join('')
  const html = `<!DOCTYPE html><html><head><title>Grade Curricular</title></head><body><h1>Grade Curricular - IBAD</h1>${semestersHtml}</body></html>`
  const win = window.open("", "_blank"); if (win) { win.document.write(html); win.document.close(); win.onload = () => win.print() }
}

export function printProfessorsPDF(professors: ProfessorAccount[], assignments: ProfessorDiscipline[], disciplines: Discipline[]): void {
  const rows = professors.map(p => {
    const pDisciplines = assignments.filter(a => a.professorId === p.id).map(a => disciplines.find(d => d.id === a.disciplineId)?.name).filter(Boolean).join(', ')
    return `<tr><td>${p.name}</td><td>${p.email}</td><td>${p.active ? 'Ativo' : 'Inativo'}</td><td>${pDisciplines || 'Sem disciplinas'}</td></tr>`
  }).join('')
  const html = `<!DOCTYPE html><html><head><title>Corpo Docente</title></head><body><h1>Corpo Docente e Mestres</h1><table border="1" width="100%"><thead><tr><th>Nome</th><th>E-mail</th><th>Status</th><th>Disciplinas</th></tr></thead><tbody>${rows}</tbody></table></body></html>`
  const win = window.open("", "_blank"); if (win) { win.document.write(html); win.document.close(); win.onload = () => win.print() }
}

export function printGradesReportPDF(grades: StudentGrade[], disciplineName: string): void {
  const rows = grades.map(g => {
    const final = (g.examGrade + g.worksGrade + g.seminarGrade + (g.participationBonus || 0)) / (g.customDivisor || 3)
    const status = final >= 7 ? 'APROVADO' : 'REPROVADO'
    return `<tr><td>${g.studentName}</td><td>${g.examGrade.toFixed(1)}</td><td>${g.worksGrade.toFixed(1)}</td><td>${g.seminarGrade.toFixed(1)}</td><td>${final.toFixed(1)}</td><td>${status}</td></tr>`
  }).join('')
  const html = `<!DOCTYPE html><html><head><title>Diário de Notas</title></head><body><h1>Diário de Notas: ${disciplineName}</h1><table border="1" width="100%"><thead><tr><th>ALUNO</th><th>PROVA</th><th>TRABALHO</th><th>SEMINÁRIO</th><th>MÉDIA</th><th>SITUAÇÃO</th></tr></thead><tbody>${rows}</tbody></table></body></html>`
  const win = window.open("", "_blank"); if (win) { win.document.write(html); win.document.close(); win.onload = () => win.print() }
}

export function printAttendanceReportPDF(attendances: Attendance[], students: StudentProfile[], disciplineName: string): void {
  const logs = students.map(s => {
    const sAtt = attendances.filter(a => a.studentId === s.id)
    const presents = sAtt.filter(a => a.isPresent).length
    const total = sAtt.length
    const pct = total > 0 ? (presents/total)*100 : 0
    return { name: s.name, presents, total, pct }
  })
  const rows = logs.map(l => `<tr><td>${l.name}</td><td>${l.presents} / ${l.total}</td><td>${l.pct.toFixed(0)}%</td></tr>`).join('')
  const html = `<!DOCTYPE html><html><head><title>Relatório de Frequência</title></head><body><h1>Folha de Frequência: ${disciplineName}</h1><table border="1" width="100%"><thead><tr><th>ALUNO</th><th>PRESENÇAS</th><th>% FREQUÊNCIA</th></tr></thead><tbody>${rows}</tbody></table></body></html>`
  const win = window.open("", "_blank"); if (win) { win.document.write(html); win.document.close(); win.onload = () => win.print() }
}

export function printStudentListPDF(students: StudentProfile[], classes: any[]): void {
  const rows = students.map((s, i) => {
    const cls = classes.find(c => c.id === s.class_id)
    return `<tr><td>${i + 1}</td><td>${s.name}</td><td>${s.enrollment_number || "—"}</td><td>${cls?.name || "Sem Turma"}</td><td>${s.phone || "—"}</td></tr>`
  }).join('')
  const html = `<!DOCTYPE html><html><head><title>Relatório de Alunos</title></head><body><h1>Relatório Geral de Alunos</h1><table border="1" width="100%"><thead><tr><th>#</th><th>Nome</th><th>Matrícula</th><th>Turma</th><th>Telefone</th></tr></thead><tbody>${rows}</tbody></table></body></html>`
  const win = window.open("", "_blank"); if (win) { win.document.write(html); win.document.close(); win.onload = () => win.print() }
}
