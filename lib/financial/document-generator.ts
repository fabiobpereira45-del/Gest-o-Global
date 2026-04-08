import JsBarcode from 'jsbarcode'
import { jsPDF } from 'jspdf'
import html2canvas from 'html2canvas'

// ============================================================================
// GERADOR DE BOLETO
// ============================================================================

export interface BoletoData {
  barcodeNumber: string
  beneficiary: string
  beneficiaryCNPJ: string
  amount: number
  dueDate: string
  studentName: string
  disciplineName: string
  monthReference: string
  bankCode?: string
  bankName?: string
  ourNumber?: string
  sequenceNumber?: string
  pixKey?: string
  logoUrl?: string
}

/**
 * Gera imagem do código de barras em formato SVG
 */
export function generateBarcodeImage(barcodeNumber: string): string {
  try {
    const svgString = JsBarcode.code128(barcodeNumber, {
      format: 'CODE128',
      width: 2,
      height: 50,
      displayValue: true,
      fontSize: 12,
      margin: 10,
    })

    // JsBarcode retorna SVG como string
    return svgString
  } catch (error) {
    console.error('Erro ao gerar código de barras:', error)
    throw new Error('Erro ao gerar código de barras')
  }
}

/**
 * Gera boleto em PDF com código de barras
 */
export async function generateBoletoPDF(data: BoletoData): Promise<Blob> {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'A4',
  })

  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  const margin = 10

  let yPosition = margin

  // ========== PRIMEIRA SEÇÃO: INFORMAÇÕES PARA O BANCO ==========
  doc.setFontSize(10)
  doc.setFont('helvetica', 'bold')
  doc.text('BOLETO BANCÁRIO', margin, yPosition)

  yPosition += 10

  // Linha divisória
  doc.setDrawColor(0)
  doc.line(margin, yPosition, pageWidth - margin, yPosition)
  yPosition += 5

  // Beneficiário
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.text(`Beneficiário: ${data.beneficiary}`, margin + 2, yPosition)
  doc.text(`CNPJ: ${data.beneficiaryCNPJ}`, pageWidth / 2, yPosition)
  yPosition += 8

  // Data de vencimento
  doc.text(`Vencimento: ${formatDate(data.dueDate)}`, margin + 2, yPosition)
  doc.text(`Valor: R$ ${formatCurrency(data.amount)}`, pageWidth / 2, yPosition)
  yPosition += 8

  // Instruções
  doc.setFontSize(8)
  doc.text('INSTRUÇÕES DE PAGAMENTO:', margin + 2, yPosition)
  yPosition += 5
  doc.text(
    '• Pagar até a data de vencimento',
    margin + 5,
    yPosition
  )
  yPosition += 4
  doc.text(
    '• Após vencimento, cobrar juros de 1% ao mês',
    margin + 5,
    yPosition
  )
  yPosition += 4
  doc.text(
    `• Referência: ${data.disciplineName} - ${data.monthReference}`,
    margin + 5,
    yPosition
  )
  yPosition += 8

  // ========== CÓDIGO DE BARRAS ==========
  doc.setFontSize(10)
  doc.setFont('helvetica', 'bold')
  doc.text('CÓDIGO DE BARRAS:', margin + 2, yPosition)
  yPosition += 8

  // Gerar código de barras como canvas
  const canvas = document.createElement('canvas')
  JsBarcode(canvas, data.barcodeNumber, {
    format: 'CODE128',
    width: 2,
    height: 50,
    displayValue: true,
    fontSize: 12,
  })

  const barcodeImage = canvas.toDataURL('image/png')
  doc.addImage(barcodeImage, 'PNG', margin, yPosition, pageWidth - margin * 2, 30)
  yPosition += 35

  // Número do boleto
  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  doc.text(`Código de Barras: ${data.barcodeNumber}`, margin + 2, yPosition)
  yPosition += 8

  // ========== SEÇÃO: DADOS DO ALUNO ==========
  doc.setFontSize(10)
  doc.setFont('helvetica', 'bold')
  doc.text('DADOS DO ALUNO', margin, yPosition)

  yPosition += 8
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.text(`Aluno: ${data.studentName}`, margin + 2, yPosition)
  yPosition += 6
  doc.text(`Disciplina: ${data.disciplineName}`, margin + 2, yPosition)
  yPosition += 6
  doc.text(`Período: ${data.monthReference}`, margin + 2, yPosition)
  yPosition += 6
  doc.text(`Valor: R$ ${formatCurrency(data.amount)}`, margin + 2, yPosition)
  yPosition += 8

  // ========== SEÇÃO: MÉTODOS DE PAGAMENTO ==========
  if (data.pixKey) {
    doc.setFontSize(10)
    doc.setFont('helvetica', 'bold')
    doc.text('MÉTODO ALTERNATIVO: PIX', margin, yPosition)
    yPosition += 8

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    doc.text('Chave PIX:', margin + 2, yPosition)
    yPosition += 5
    doc.text(data.pixKey, margin + 5, yPosition, { maxWidth: pageWidth - margin * 3 })
    yPosition += 12

    doc.text('Copie a chave acima e use seu app bancário para fazer o pagamento via PIX', margin + 2, yPosition)
  }

  // Salvar PDF
  const pdfBlob = new Blob([doc.output('arraybuffer')], { type: 'application/pdf' })
  return pdfBlob
}

/**
 * Gera número de boleto sequencial
 */
export function generateBoletoNumber(): string {
  // Formato: NNNNNNNNNNNNNN (14 dígitos)
  // Começar com data + sequencial
  const now = new Date()
  const year = String(now.getFullYear()).slice(-2)
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  const random = String(Math.floor(Math.random() * 10000000)).padStart(7, '0')

  return `${year}${month}${day}${random}`.substring(0, 14)
}

// ============================================================================
// GERADOR DE PIX
// ============================================================================

export interface PixData {
  amount: number
  key: string
  description: string
  merchantName: string
}

/**
 * Gera QR Code PIX estático (sem valor)
 */
export function generatePixQRCode(pixKey: string, amount?: number): string {
  // Usar formato EMV para PIX
  // Formato simplificado: 00020126 + dados
  // Para um PIX dinâmico real, seria necessário integrar com Bacen
  // Por enquanto, usar estático com chave e valor

  const merchantName = 'IBAD Global'
  const merchantCity = 'Sao Paulo'

  // EMV fields
  let emvString = '00020126' // payload format

  // PIX key (chave do recebedor)
  const pixKeyField = generateEMVField('26', pixKey)
  emvString += pixKeyField

  // Merchant name
  const nameField = generateEMVField('59', merchantName)
  emvString += nameField

  // City
  const cityField = generateEMVField('60', merchantCity)
  emvString += cityField

  // Valor (se fornecido)
  if (amount && amount > 0) {
    const amountField = generateEMVField('54', formatCurrencyForPIX(amount))
    emvString += amountField
  }

  // Currency BRL
  const currencyField = generateEMVField('5E', '986')
  emvString += currencyField

  // CRC
  // Nota: CRC real precisa de algoritmo específico
  // Aqui usar simplificado

  return emvString
}

/**
 * Gera campo EMV formatado
 */
function generateEMVField(tag: string, value: string): string {
  const length = String(value.length).padStart(2, '0')
  return tag + length + value
}

/**
 * Formata valor para formato PIX
 */
function formatCurrencyForPIX(amount: number): string {
  return amount.toFixed(2)
}

// ============================================================================
// GERADOR DE RECIBO
// ============================================================================

export interface ReceiptData {
  receiptNumber: string
  studentName: string
  studentCPF: string
  amount: number
  paymentDate: string
  disciplineName: string
  monthReference: string
  paymentMethod: string
  logoUrl?: string
  companyName: string
  companyCNPJ: string
}

/**
 * Gera recibo de pagamento em PDF
 */
export async function generateReceiptPDF(data: ReceiptData): Promise<Blob> {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'A4',
  })

  const pageWidth = doc.internal.pageSize.getWidth()
  const margin = 15

  let yPosition = margin

  // ========== CABEÇALHO ==========
  doc.setFontSize(16)
  doc.setFont('helvetica', 'bold')
  doc.text('RECIBO DE PAGAMENTO', margin, yPosition)

  yPosition += 12

  // Linha divisória
  doc.setDrawColor(0)
  doc.line(margin, yPosition, pageWidth - margin, yPosition)
  yPosition += 5

  // ========== INFORMAÇÕES DO RECIBO ==========
  doc.setFontSize(10)
  doc.setFont('helvetica', 'bold')
  doc.text(`Nº ${data.receiptNumber}`, margin, yPosition)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.text(`Data: ${formatDate(data.paymentDate)}`, pageWidth - margin - 40, yPosition)

  yPosition += 10

  // ========== DADOS RECEBIMENTO ==========
  doc.setFontSize(11)
  doc.setFont('helvetica', 'bold')
  doc.text('RECEBEMOS DE:', margin, yPosition)

  yPosition += 8
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  doc.text(data.studentName, margin + 5, yPosition)
  yPosition += 6
  doc.text(`CPF: ${data.studentCPF}`, margin + 5, yPosition)

  yPosition += 10

  // ========== VALOR ==========
  doc.setFontSize(12)
  doc.setFont('helvetica', 'bold')
  doc.text('O VALOR DE:', margin, yPosition)

  yPosition += 8
  doc.setFontSize(14)
  doc.text(`R$ ${formatCurrency(data.amount)}`, margin + 5, yPosition)

  yPosition += 10

  // ========== DESCRIÇÃO ==========
  doc.setFontSize(11)
  doc.setFont('helvetica', 'bold')
  doc.text('REFERENTE A:', margin, yPosition)

  yPosition += 8
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  doc.text(`Disciplina: ${data.disciplineName}`, margin + 5, yPosition)
  yPosition += 6
  doc.text(`Período: ${data.monthReference}`, margin + 5, yPosition)
  yPosition += 6
  doc.text(`Forma de Pagamento: ${data.paymentMethod}`, margin + 5, yPosition)

  yPosition += 15

  // ========== DADOS DA INSTITUIÇÃO ==========
  doc.setFontSize(9)
  doc.setFont('helvetica', 'bold')
  doc.text(data.companyName, margin, yPosition)
  yPosition += 5
  doc.setFont('helvetica', 'normal')
  doc.text(`CNPJ: ${data.companyCNPJ}`, margin, yPosition)

  yPosition = pageHeight - margin - 20

  // ========== ASSINATURA ==========
  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  doc.text('_______________________________', margin, yPosition)
  doc.text('Assinado Digitalmente pelo Sistema', margin, yPosition + 5)

  yPosition -= 30

  doc.setFontSize(8)
  doc.text(
    'Este documento é um comprovante de pagamento. Válido para fins de comprovação.',
    margin,
    yPosition,
    { maxWidth: pageWidth - margin * 2, align: 'center' }
  )

  // Salvar PDF
  const pdfBlob = new Blob([doc.output('arraybuffer')], { type: 'application/pdf' })
  return pdfBlob
}

// ============================================================================
// UTILITÁRIOS
// ============================================================================

/**
 * Formata data para formato brasileiro
 */
export function formatDate(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date
  const day = String(d.getDate()).padStart(2, '0')
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const year = d.getFullYear()
  return `${day}/${month}/${year}`
}

/**
 * Formata valor monetário
 */
export function formatCurrency(value: number): string {
  return value.toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

/**
 * Gera string de PIX para cópia e cola (estática)
 */
export function generatePixCopyPaste(pixKey: string, amount?: number): string {
  // Formato EMV simplificado para PIX estático
  // Em produção, usar biblioteca brcode ou integrar com Bacen

  let pixString = '00020126'
  pixString += '36' + String(pixKey.length).padStart(2, '0') + pixKey

  if (amount && amount > 0) {
    const amountStr = formatCurrencyForPIX(amount)
    pixString += '54' + String(amountStr.length).padStart(2, '0') + amountStr
  }

  pixString += '5802BR5913IBAD Global'
  pixString += '62' + String('0123456789'.length).padStart(2, '0') + '0123456789'

  return pixString
}
