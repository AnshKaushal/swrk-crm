import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { connectDB } from "@/lib/mongodb"
import { Lead } from "@/lib/models/Lead"
import * as XLSX from "xlsx"

const VALID_STAGES = [
  "new", "contacted", "qualified", "proposal", "negotiation",
  "closed_won", "closed_lost",
]

const VALID_CURRENCIES = ["USD", "INR"]

const STAGE_ALIASES: Record<string, string> = {
  "new": "new",
  "contacted": "contacted",
  "qualified": "qualified",
  "proposal": "proposal",
  "negotiation": "negotiation",
  "closed won": "closed_won",
  "closed_won": "closed_won",
  "won": "closed_won",
  "closed lost": "closed_lost",
  "closed_lost": "closed_lost",
  "lost": "closed_lost",
}

export async function POST(request: Request) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  await connectDB()

  const formData = await request.formData()
  const file = formData.get("file") as File | null
  if (!file) return NextResponse.json({ error: "No file provided" }, { status: 400 })

  const buffer = Buffer.from(await file.arrayBuffer())
  const workbook = XLSX.read(buffer, { type: "buffer" })
  const sheetName = workbook.SheetNames[0]
  if (!sheetName) return NextResponse.json({ error: "Spreadsheet is empty" }, { status: 400 })

  const rows: Record<string, string>[] = XLSX.utils.sheet_to_json(
    workbook.Sheets[sheetName],
    { defval: "" },
  )

  if (rows.length === 0) {
    return NextResponse.json({ error: "No data rows found" }, { status: 400 })
  }

  const results = { created: 0, skipped: 0, errors: [] as string[] }
  const docs: Record<string, unknown>[] = []

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i]
    const rowNum = i + 2

    const name = (row.Name || row.name || row["Lead Name"] || "").toString().trim()
    const company = (row.Company || row.company || "").toString().trim()

    if (!name || !company) {
      results.skipped++
      results.errors.push(`Row ${rowNum}: missing Name or Company`)
      continue
    }

    const rawStage = (row.Stage || row.stage || "new").toString().trim().toLowerCase()
    const stage = STAGE_ALIASES[rawStage]
    if (!stage) {
      results.skipped++
      results.errors.push(`Row ${rowNum}: unrecognised stage "${rawStage}"`)
      continue
    }

    const rawCurrency = (row.Currency || row.currency || "INR").toString().trim().toUpperCase()
    if (!VALID_CURRENCIES.includes(rawCurrency)) {
      results.skipped++
      results.errors.push(`Row ${rowNum}: unrecognised currency "${rawCurrency}"`)
      continue
    }

    const value = Number(row.Value || row.value || row["Deal Value"] || 0)

    docs.push({
      name,
      company,
      email: (row.Email || row.email || "").toString().trim(),
      phone: (row.Phone || row.phone || "").toString().trim(),
      stage,
      value: isNaN(value) ? 0 : value,
      currency: rawCurrency,
      notes: (row.Notes || row.notes || "").toString().trim(),
      assignedTo: session.user.id,
      createdBy: session.user.id,
    })
  }

  if (docs.length > 0) {
    try {
      await Lead.insertMany(docs)
      results.created = docs.length
    } catch (err: any) {
      results.errors.push(`Bulk insert failed: ${err.message || "Unknown error"}`)
    }
  }

  return NextResponse.json(results)
}
