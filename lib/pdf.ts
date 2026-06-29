import fs from "fs"
import path from "path"
import {
  PDFDocument,
  StandardFonts,
  rgb,
  type PDFFont,
  type RGB,
  type PDFPage,
} from "pdf-lib"

const PAGE_W = 595.28
const PAGE_H = 841.89
const MARGIN = 65 // Increased margin for a cleaner look
const CONTENT_W = PAGE_W - MARGIN * 2

// Refined, professional color palette
const textPrimary = rgb(0.15, 0.15, 0.15)
const textSecondary = rgb(0.4, 0.4, 0.4)
const borderLight = rgb(0.85, 0.85, 0.85)
const tableHeaderBg = rgb(0.92, 0.92, 0.92)
const tableRowAltBg = rgb(0.98, 0.98, 0.98)
const white = rgb(1, 1, 1)

function wrapText(
  text: string,
  font: PDFFont,
  size: number,
  maxWidth: number,
): string[] {
  const finalLines: string[] = []

  // First, split the text by explicit newline characters
  const paragraphs = text.split("\n")

  for (const paragraph of paragraphs) {
    const words = paragraph.split(" ")
    let line = ""

    for (const word of words) {
      const test = line ? line + " " + word : word
      // Check if adding the new word exceeds the max width
      if (font.widthOfTextAtSize(test, size) > maxWidth && line) {
        finalLines.push(line)
        line = word
      } else {
        line = test
      }
    }
    // Push the last remaining line of the paragraph
    if (line) finalLines.push(line)
  }

  return finalLines
}

// Helper: Draw text with alignment and return the new Y position
function drawWrappedText(
  page: PDFPage,
  text: string,
  font: PDFFont,
  size: number,
  x: number,
  y: number,
  maxWidth: number,
  lineGap: number,
  color: RGB,
  align: "left" | "center" | "right" = "left",
): number {
  const lines = wrapText(text, font, size, maxWidth)
  let cy = y
  for (const line of lines) {
    let cx = x
    if (align === "center") {
      cx = x + (maxWidth - font.widthOfTextAtSize(line, size)) / 2
    } else if (align === "right") {
      cx = x + maxWidth - font.widthOfTextAtSize(line, size)
    }
    page.drawText(line, { x: cx, y: cy, size, font, color })
    cy -= size + lineGap
  }
  return cy
}

export async function generateMOUPDF(
  associateName: string,
  date: string,
): Promise<Buffer> {
  const pdfDoc = await PDFDocument.create()
  const [helvetica, helveticaBold, helveticaOblique] = await Promise.all([
    pdfDoc.embedFont(StandardFonts.Helvetica),
    pdfDoc.embedFont(StandardFonts.HelveticaBold),
    pdfDoc.embedFont(StandardFonts.HelveticaOblique),
  ])

  // Load signature image safely (you can add a try/catch here if the file might be missing)
  const signPath = path.join(process.cwd(), "files", "sign.jpeg")
  let signImage: any = null
  let signW = 100
  let signH = 40

  if (fs.existsSync(signPath)) {
    const signBuffer = fs.readFileSync(signPath)
    signImage = await pdfDoc.embedJpg(signBuffer)
    signH = (signImage.height / signImage.width) * signW
  }

  let currentPage = pdfDoc.addPage([PAGE_W, PAGE_H])
  let y = PAGE_H - MARGIN - 20

  function addPage() {
    currentPage = pdfDoc.addPage([PAGE_W, PAGE_H])
    y = PAGE_H - MARGIN - 20
  }

  function drawFooter(page: PDFPage, pageNum: number) {
    const footerY = 35
    page.drawLine({
      start: { x: MARGIN, y: footerY + 15 },
      end: { x: MARGIN + CONTENT_W, y: footerY + 15 },
      thickness: 0.5,
      color: borderLight,
    })
    page.drawText("SWRK  ·  Software Development & Consulting", {
      x: MARGIN,
      y: footerY,
      size: 8,
      font: helvetica,
      color: textSecondary,
    })
    const pageStr = `Page ${pageNum} | SWRK Confidential`
    const pageStrW = helvetica.widthOfTextAtSize(pageStr, 8)
    page.drawText(pageStr, {
      x: MARGIN + CONTENT_W - pageStrW,
      y: footerY,
      size: 8,
      font: helvetica,
      color: textSecondary,
    })
  }

  function checkPageSpace(needed: number = 100) {
    if (y < MARGIN + needed) {
      drawFooter(currentPage, pdfDoc.getPageCount())
      addPage()
    }
  }

  // Consistent block formatting functions
  function sectionHeading(number: string, title: string) {
    checkPageSpace(80)
    y -= 15 // Space before heading
    currentPage.drawText(`${number}. ${title}`, {
      x: MARGIN,
      y: y,
      size: 11,
      font: helveticaBold,
      color: textPrimary,
    })
    y -= 18 // Space after heading
  }

  function bodyText(text: string) {
    checkPageSpace(60)
    y = drawWrappedText(
      currentPage,
      text,
      helvetica,
      10,
      MARGIN,
      y,
      CONTENT_W,
      6, // Generous line height
      textPrimary,
      "left", // Left-aligned for professional legal docs
    )
    y -= 10 // Paragraph spacing
  }

  function drawFooterOnAllPages() {
    const count = pdfDoc.getPageCount()
    for (let i = 0; i < count; i++) {
      drawFooter(pdfDoc.getPage(i), i + 1)
    }
  }

  // ════════════════════════════════════════
  // HEADER & TITLE
  // ════════════════════════════════════════
  y = drawWrappedText(
    currentPage,
    "REFERRAL & BUSINESS DEVELOPMENT\nASSOCIATE AGREEMENT",
    helveticaBold,
    16,
    MARGIN,
    y,
    CONTENT_W,
    8,
    textPrimary,
    "center",
  )
  y -= 25

  // Date
  currentPage.drawText(`Date: ${date}`, {
    x: MARGIN,
    y,
    size: 10,
    font: helveticaBold,
    color: textPrimary,
  })
  y -= 20

  y = drawWrappedText(
    currentPage,
    "This Referral & Business Development Associate Agreement is entered into on the date mentioned above.",
    helveticaOblique,
    10,
    MARGIN,
    y,
    CONTENT_W,
    5,
    textSecondary,
    "left",
  )
  y -= 25

  // ════════════════════════════════════════
  // PARTIES (BETWEEN)
  // ════════════════════════════════════════
  currentPage.drawText("BETWEEN", {
    x: MARGIN,
    y,
    size: 10,
    font: helveticaBold,
    color: textPrimary,
  })
  y -= 15
  currentPage.drawText("SWRK", {
    x: MARGIN + 15,
    y,
    size: 10,
    font: helveticaBold,
    color: textPrimary,
  })
  y -= 12
  currentPage.drawText('("Company")', {
    x: MARGIN + 15,
    y,
    size: 10,
    font: helveticaOblique,
    color: textSecondary,
  })

  y -= 20
  currentPage.drawText("AND", {
    x: MARGIN,
    y,
    size: 10,
    font: helveticaBold,
    color: textPrimary,
  })
  y -= 15
  currentPage.drawText(associateName, {
    x: MARGIN + 15,
    y,
    size: 10,
    font: helveticaBold,
    color: textPrimary,
  })
  y -= 12
  currentPage.drawText('("Associate")', {
    x: MARGIN + 15,
    y,
    size: 10,
    font: helveticaOblique,
    color: textSecondary,
  })
  y -= 30

  // ════════════════════════════════════════
  // RECITALS
  // ════════════════════════════════════════
  bodyText(
    "WHEREAS, SWRK is engaged in the business of software development, consulting, and related technology services; and",
  )
  bodyText(
    "WHEREAS, the Associate wishes to refer prospective clients to SWRK on a commission basis;",
  )
  bodyText(
    "NOW, THEREFORE, in consideration of the mutual covenants and promises set forth herein, the parties agree as follows:",
  )
  y -= 10

  // ════════════════════════════════════════
  // SECTIONS 1–20
  // ════════════════════════════════════════
  sectionHeading("1", "PURPOSE")
  bodyText(
    "The purpose of this Agreement is to establish a commission-based business relationship under which the Associate may identify, qualify, and refer prospective clients to SWRK for software development services.",
  )
  bodyText(
    "This Agreement establishes the rights and obligations of both parties regarding lead ownership, commission eligibility, payment, confidentiality, and business conduct.",
  )
  bodyText(
    "This Agreement does not create any employment, partnership, agency, joint venture, equity, or ownership relationship between the parties. The Associate acts solely as an independent contractor.",
  )

  sectionHeading("2", "ROLE OF THE ASSOCIATE")
  bodyText(
    "The Associate may: identify prospective clients; generate qualified business opportunities; conduct initial discovery conversations; present publicly available information about SWRK and its services; understand preliminary client requirements; and schedule meetings between qualified prospects and SWRK.",
  )
  bodyText(
    "The Associate shall not: quote pricing; offer discounts; negotiate commercial terms; negotiate contracts; commit project scope; promise timelines; accept payments; sign agreements on behalf of SWRK; or make technical commitments.",
  )
  bodyText(
    "All commercial, technical, contractual, and project delivery discussions shall be handled exclusively by SWRK.",
  )

  sectionHeading("3", "CRM & REFERRAL REGISTRATION")
  bodyText(
    "Upon execution of this Agreement, SWRK may provide the Associate with access to crm.swrk.in. All referrals must be registered through the CRM.",
  )
  bodyText(
    "The CRM shall serve as the official record for: lead ownership, referral acceptance, opportunity status, invoice status, commission eligibility, and commission payments.",
  )
  bodyText(
    "A referral shall only be considered valid after it has been accepted into the SWRK CRM.",
  )

  sectionHeading("4", "QUALIFIED REFERRAL")
  bodyText(
    "A Qualified Referral is a prospective client that: (a) was first introduced by the Associate; (b) was not already present in the SWRK CRM; (c) was not already in active discussions with SWRK; (d) has genuine software development requirements; and (e) has been accepted by SWRK as a valid opportunity. The earliest accepted CRM record shall determine referral ownership.",
  )

  sectionHeading("5", "LEAD OWNERSHIP")
  bodyText(
    "Upon acceptance of a Qualified Referral, SWRK becomes responsible for all commercial, contractual, technical, and delivery discussions. The Associate retains commission rights as defined in this Agreement. The Associate shall not claim ownership of the client relationship.",
  )
  bodyText(
    "SWRK agrees not to intentionally bypass the Associate to avoid payment of earned commissions.",
  )

  sectionHeading("6", "COMMISSION STRUCTURE")
  bodyText(
    "Commission shall be calculated on the actual amount received by SWRK, excluding applicable GST. No operational expenses, software subscriptions, salaries, contractor fees, marketing expenses, or business overheads shall be deducted before calculating commission.",
  )
  bodyText("The applicable commission structure shall be:")

  // ── Commission Table ──
  checkPageSpace(150)
  y -= 5
  const tableY = y
  const rowH = 26
  const col1X = MARGIN + 15
  const col2X = MARGIN + CONTENT_W * 0.65

  const headers = ["Project Value (Excluding GST)", "Commission"]
  const rows = [
    ["Up to Rs. 1,00,000", "20%"],
    ["Rs. 1,00,001 \u2013 Rs. 5,00,000", "15%"],
    ["Above Rs. 5,00,000", "10%"],
  ]

  // Header Row
  currentPage.drawRectangle({
    x: MARGIN,
    y: tableY - rowH,
    width: CONTENT_W,
    height: rowH,
    color: tableHeaderBg,
    borderColor: borderLight,
    borderWidth: 1,
  })
  currentPage.drawText(headers[0], {
    x: col1X,
    y: tableY - rowH + 8,
    size: 10,
    font: helveticaBold,
    color: textPrimary,
  })
  currentPage.drawText(headers[1], {
    x: col2X,
    y: tableY - rowH + 8,
    size: 10,
    font: helveticaBold,
    color: textPrimary,
  })

  // Data Rows
  let currentY = tableY - rowH * 2
  for (let i = 0; i < rows.length; i++) {
    const bg = i % 2 === 0 ? white : tableRowAltBg
    currentPage.drawRectangle({
      x: MARGIN,
      y: currentY,
      width: CONTENT_W,
      height: rowH,
      color: bg,
      borderColor: borderLight,
      borderWidth: 1,
    })
    currentPage.drawText(rows[i][0], {
      x: col1X,
      y: currentY + 8,
      size: 10,
      font: helvetica,
      color: textPrimary,
    })
    currentPage.drawText(rows[i][1], {
      x: col2X,
      y: currentY + 8,
      size: 10,
      font: helveticaBold,
      color: textPrimary,
    })
    currentY -= rowH
  }
  y = currentY - 15

  y = drawWrappedText(
    currentPage,
    "The commission percentage shall be based on the final agreed contract value.",
    helveticaOblique,
    10,
    MARGIN,
    y,
    CONTENT_W,
    5,
    textSecondary,
    "left",
  )
  y -= 15

  sectionHeading("7", "COMMISSION ELIGIBILITY")
  bodyText(
    "Commission becomes payable only when: (a) the client signs the project agreement; (b) SWRK issues the invoice; (c) the client pays the invoice; and (d) the payment has been received and cleared.",
  )
  bodyText(
    "No commission shall be payable for: leads only; discovery calls; verbal commitments; cancelled projects; unpaid invoices; or referrals rejected by SWRK.",
  )

  sectionHeading("8", "PAYMENT TRANSPARENCY")
  bodyText(
    "Within three (3) business days of receiving cleared client funds, SWRK shall update the corresponding opportunity within the CRM and notify the Associate of: Invoice Number, Amount Received, Applicable Commission Rate, Commission Amount, and Scheduled Commission Payment Date.",
  )

  sectionHeading("9", "PAYMENT OF COMMISSION")
  bodyText(
    "Earned commissions shall be paid within seven (7) business days after SWRK receives cleared client funds. The Associate shall provide an invoice if required under applicable law.",
  )

  sectionHeading("10", "REPEAT BUSINESS")
  bodyText(
    "If a referred client engages SWRK for additional projects within twelve (12) months from the date of the first signed agreement, the Associate shall remain eligible for commission on such additional projects in accordance with the applicable commission structure.",
  )
  bodyText(
    "Projects commenced after the twelve-month period shall not be eligible for additional commission unless otherwise agreed in writing.",
  )

  sectionHeading("11", "REFERRAL VALIDITY")
  bodyText(
    "A Qualified Referral shall remain attributed to the Associate for a period of twelve (12) months from the date of acceptance into the SWRK CRM.",
  )

  sectionHeading("12", "CLIENT NEGOTIATION")
  bodyText(
    "The Associate shall not negotiate pricing, discounts, commercial terms, project scope, payment schedules, delivery timelines, or contractual obligations unless expressly authorized in writing by SWRK.",
  )

  sectionHeading("13", "CONFIDENTIALITY")
  bodyText(
    "The Associate shall keep confidential all non-public information relating to clients, pricing, contracts, internal business processes, CRM data, technical information, and project documentation. This obligation survives termination of this Agreement.",
  )

  sectionHeading("14", "NON-CIRCUMVENTION")
  bodyText(
    "The Associate agrees not to: redirect referred clients to competing service providers; independently contract with referred clients for substantially similar services; or circumvent SWRK in connection with referred opportunities during the Referral Validity Period.",
  )
  bodyText(
    "Likewise, SWRK agrees not to intentionally bypass the Associate to avoid paying commissions earned under this Agreement.",
  )

  sectionHeading("15", "INTELLECTUAL PROPERTY")
  bodyText(
    "All software, source code, documentation, designs, deliverables, business processes, trademarks, branding, and intellectual property created or supplied by SWRK remain the exclusive property of SWRK unless otherwise agreed in writing with the client.",
  )
  bodyText("The Associate acquires no ownership rights under this Agreement.")

  sectionHeading("16", "MARKETING MATERIALS")
  bodyText(
    "SWRK shall provide publicly available marketing resources including its website, portfolio, service information, and company profile. The Associate may use only those materials expressly approved by SWRK for business development purposes.",
  )

  sectionHeading("17", "TERMINATION")
  bodyText(
    "Either party may terminate this Agreement by providing seven (7) days written notice.",
  )
  bodyText(
    "Termination shall not affect: commission already earned; commission payable on Qualified Referrals accepted before termination; confidentiality obligations; or non-circumvention obligations.",
  )

  sectionHeading("18", "LIMITATION OF LIABILITY")
  bodyText(
    "SWRK shall not be liable for loss of future commissions, lost business opportunities, consequential damages, or indirect damages arising from failure to close a prospective opportunity.",
  )

  sectionHeading("19", "GOVERNING LAW")
  bodyText(
    "This Agreement shall be governed by and construed in accordance with the laws of the Republic of India. Any disputes arising under this Agreement shall be subject to the exclusive jurisdiction of the courts having jurisdiction over the registered office of SWRK.",
  )

  sectionHeading("20", "ENTIRE AGREEMENT")
  bodyText(
    "This Agreement constitutes the complete understanding between the parties and supersedes all prior discussions, representations, or understandings relating to the subject matter herein. Any amendment shall be valid only if made in writing and signed by both parties.",
  )

  y -= 20

  // ════════════════════════════════════════
  // SIGNATURES
  // ════════════════════════════════════════
  checkPageSpace(220)

  // Separator Line
  currentPage.drawLine({
    start: { x: MARGIN, y },
    end: { x: MARGIN + CONTENT_W, y },
    thickness: 1,
    color: borderLight,
  })
  y -= 30

  y = drawWrappedText(
    currentPage,
    "IN WITNESS WHEREOF, the parties have executed this Agreement as of the date first written above.",
    helveticaOblique,
    10,
    MARGIN,
    y,
    CONTENT_W,
    5,
    textPrimary,
    "left",
  )
  y -= 40

  const sigY = y
  const colW = CONTENT_W * 0.45
  const rightColX = MARGIN + CONTENT_W - colW

  // ── Company ──
  currentPage.drawText("COMPANY", {
    x: MARGIN,
    y: sigY,
    size: 10,
    font: helveticaBold,
    color: textSecondary,
  })
  const nameY = sigY - 20
  currentPage.drawText("SWRK", {
    x: MARGIN,
    y: nameY,
    size: 11,
    font: helveticaBold,
    color: textPrimary,
  })
  const titleY = nameY - 16
  currentPage.drawText("Ansh Kaushal, Founder", {
    x: MARGIN,
    y: titleY,
    size: 10,
    font: helvetica,
    color: textPrimary,
  })

  const imgY = titleY - signH - 10
  if (signImage) {
    currentPage.drawImage(signImage, {
      x: MARGIN,
      y: imgY,
      width: signW,
      height: signH,
    })
  }

  const dateLineY = imgY - 20
  currentPage.drawLine({
    start: { x: MARGIN, y: dateLineY },
    end: { x: MARGIN + colW, y: dateLineY },
    thickness: 1,
    color: textPrimary,
  })
  currentPage.drawText(`Date: ${date}`, {
    x: MARGIN,
    y: dateLineY - 15,
    size: 10,
    font: helvetica,
    color: textPrimary,
  })

  // ── Associate ──
  currentPage.drawText("ASSOCIATE", {
    x: rightColX,
    y: sigY,
    size: 10,
    font: helveticaBold,
    color: textSecondary,
  })
  currentPage.drawText(associateName, {
    x: rightColX,
    y: nameY,
    size: 11,
    font: helveticaBold,
    color: textPrimary,
  })
  currentPage.drawText("Business Development Associate", {
    x: rightColX,
    y: titleY,
    size: 10,
    font: helvetica,
    color: textPrimary,
  })

  const assocLineY = dateLineY + 25 // Aligning the physical signature line
  currentPage.drawLine({
    start: { x: rightColX, y: assocLineY },
    end: { x: rightColX + colW, y: assocLineY },
    thickness: 1,
    color: textPrimary,
  })
  currentPage.drawText("Signature", {
    x: rightColX,
    y: assocLineY - 15,
    size: 9,
    font: helveticaOblique,
    color: textSecondary,
  })

  currentPage.drawLine({
    start: { x: rightColX, y: dateLineY },
    end: { x: rightColX + colW, y: dateLineY },
    thickness: 1,
    color: textPrimary,
  })
  currentPage.drawText(`Date: ${date}`, {
    x: rightColX,
    y: dateLineY - 15,
    size: 10,
    font: helvetica,
    color: textPrimary,
  })

  drawFooterOnAllPages()

  const pdfBytes = await pdfDoc.save()
  return Buffer.from(pdfBytes)
}
