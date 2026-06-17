"use client"

import { useState, useRef, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { toast } from "sonner"
import { IconArrowLeft, IconUpload, IconFileSpreadsheet, IconDownload, IconCheck, IconX } from "@tabler/icons-react"
import Link from "next/link"
import * as XLSX from "xlsx"

const STAGE_LABELS: Record<string, string> = {
  new: "New",
  contacted: "Contacted",
  qualified: "Qualified",
  proposal: "Proposal",
  negotiation: "Negotiation",
  closed_won: "Closed Won",
  closed_lost: "Closed Lost",
}

const STAGE_ALIASES: Record<string, string> = {
  new: "new",
  contacted: "contacted",
  qualified: "qualified",
  proposal: "proposal",
  negotiation: "negotiation",
  "closed won": "closed_won",
  closed_won: "closed_won",
  won: "closed_won",
  "closed lost": "closed_lost",
  closed_lost: "closed_lost",
  lost: "closed_lost",
}

const VALID_CURRENCIES = ["USD", "INR"]

interface PreviewRow {
  row: number
  name: string
  company: string
  email: string
  phone: string
  stage: string
  value: number
  currency: string
  valid: boolean
  warnings: string[]
}

interface UploadResult {
  created: number
  skipped: number
  errors: string[]
}

export default function UploadLeadsPage() {
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<PreviewRow[]>([])
  const [totalRows, setTotalRows] = useState(0)
  const [uploading, setUploading] = useState(false)
  const [result, setResult] = useState<UploadResult | null>(null)
  const [dragging, setDragging] = useState(false)

  const parseFile = useCallback(async (f: File) => {
    const buffer = await f.arrayBuffer()
    const workbook = XLSX.read(buffer, { type: "array" })
    const sheet = workbook.Sheets[workbook.SheetNames[0]]
    const rows: Record<string, string>[] = XLSX.utils.sheet_to_json(sheet, { defval: "" })

    const allRows = rows.map((row, i) => {
      const rowNum = i + 2
      const warnings: string[] = []
      const name = (row.Name || row.name || row["Lead Name"] || "").toString().trim()
      const company = (row.Company || row.company || "").toString().trim()
      const rawStage = (row.Stage || row.stage || "new").toString().trim().toLowerCase()
      const resolvedStage = STAGE_ALIASES[rawStage] || rawStage
      if (!STAGE_ALIASES[rawStage]) warnings.push(`Unrecognised stage "${rawStage}"`)
      const rawCurrency = (row.Currency || row.currency || "INR").toString().trim().toUpperCase()
      if (!VALID_CURRENCIES.includes(rawCurrency)) warnings.push(`Unrecognised currency "${rawCurrency}"`)
      const valid = !!name && !!company && !!STAGE_ALIASES[rawStage] && VALID_CURRENCIES.includes(rawCurrency)

      return {
        row: rowNum,
        name,
        company,
        email: (row.Email || row.email || "").toString().trim(),
        phone: (row.Phone || row.phone || "").toString().trim(),
        stage: resolvedStage,
        value: Number(row.Value || row.value || row["Deal Value"] || 0),
        currency: rawCurrency,
        valid,
        warnings,
      }
    })

    setFile(f)
    setPreview(allRows.slice(0, 10))
    setTotalRows(allRows.length)
    setResult(null)
  }, [])

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragging(false)
    const f = e.dataTransfer.files[0]
    if (f && (f.name.endsWith(".xlsx") || f.name.endsWith(".xls"))) {
      parseFile(f)
    } else {
      toast.error("Please upload a .xlsx or .xls file")
    }
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]
    if (f) parseFile(f)
  }

  function downloadTemplate() {
    const wb = XLSX.utils.book_new()
    const data = [
      {
        Name: "John Doe",
        Company: "Acme Corp",
        Email: "john@acme.com",
        Phone: "+1-555-0123",
        Stage: "new",
        Value: 50000,
        Currency: "INR",
        Notes: "Warm lead from conference",
      },
    ]
    const ws = XLSX.utils.json_to_sheet(data)
    XLSX.utils.book_append_sheet(wb, ws, "Leads")
    XLSX.writeFile(wb, "lead-upload-template.xlsx")
  }

  async function handleUpload() {
    if (!file) return
    setUploading(true)

    try {
      const formData = new FormData()
      formData.append("file", file)

      const res = await fetch("/api/leads/upload", {
        method: "POST",
        body: formData,
      })

      const data = await res.json()

      if (!res.ok) {
        toast.error(data.error || "Upload failed")
        setResult({ created: 0, skipped: 0, errors: [data.error || "Upload failed"] })
        return
      }

      setResult(data)

      if (data.created > 0) {
        toast.success(`${data.created} leads created`)
      }
      if (data.skipped > 0) {
        toast.error(`${data.skipped} rows skipped`)
      }
    } catch {
      toast.error("Upload failed")
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <div>
        <Button variant="ghost" size="sm" asChild className="mb-2">
          <Link href="/leads" className="flex items-center gap-1">
            <IconArrowLeft className="size-3.5" />
            Back
          </Link>
        </Button>
        <h1 className="text-lg font-medium">Bulk Upload Leads</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Upload Spreadsheet</CardTitle>
          <CardDescription className="text-xs">
            Upload a .xlsx or .xls file with columns: Name, Company, Email, Phone, Stage, Value, Currency, Notes
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={downloadTemplate}>
              <IconDownload className="size-3.5" />
              Download Template
            </Button>
          </div>

          <div
            onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
            onClick={() => inputRef.current?.click()}
            className={`flex cursor-pointer flex-col items-center justify-center rounded-sm border-2 border-dashed p-8 transition-colors ${
              dragging ? "border-primary bg-primary/5" : "border-muted-foreground/25"
            }`}
          >
            <IconFileSpreadsheet className="size-8 text-muted-foreground mb-2" />
            <p className="text-sm font-medium">
              {file ? file.name : "Drop your spreadsheet here or click to browse"}
            </p>
            <p className="text-xs text-muted-foreground mt-1">.xlsx or .xls files only</p>
            <input
              ref={inputRef}
              type="file"
              accept=".xlsx,.xls"
              onChange={handleFileSelect}
              className="hidden"
            />
          </div>

          {preview.length > 0 && (
            <>
              <Separator />
              <div>
                <p className="text-xs font-medium mb-2">
                  Preview (first {preview.length} of {totalRows} rows)
                </p>
                <div className="overflow-x-auto rounded-sm border">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="bg-muted/50">
                        <th className="text-left p-2 font-medium">Name</th>
                        <th className="text-left p-2 font-medium">Company</th>
                        <th className="text-left p-2 font-medium">Stage</th>
                        <th className="text-right p-2 font-medium">Value</th>
                        <th className="text-left p-2 font-medium">Currency</th>
                        <th className="text-left p-2 font-medium">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {preview.map((row) => (
                        <tr key={row.row} className={`border-t ${!row.valid ? "bg-destructive/5" : ""}`}>
                          <td className="p-2">{row.name}</td>
                          <td className="p-2">{row.company}</td>
                          <td className="p-2 capitalize">{STAGE_LABELS[row.stage] || row.stage}</td>
                          <td className="p-2 text-right">{row.value.toLocaleString()}</td>
                          <td className="p-2">{row.currency}</td>
                          <td className="p-2">
                            {row.warnings.length > 0 ? (
                              <span className="text-[10px] text-destructive" title={row.warnings.join(". ")}>
                                {row.warnings.length} issue{row.warnings.length > 1 ? "s" : ""}
                              </span>
                            ) : (
                              <IconCheck className="size-3 text-emerald-500" />
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {totalRows > 10 && (
                  <p className="text-[10px] text-muted-foreground mt-1">
                    + {totalRows - 10} more rows
                  </p>
                )}
              </div>

              <Button
                size="sm"
                className="w-full"
                onClick={handleUpload}
                disabled={uploading}
              >
                {uploading ? (
                  "Uploading..."
                ) : (
                  <>
                    <IconUpload className="size-3.5" />
                    Upload {totalRows} Leads
                  </>
                )}
              </Button>
            </>
          )}

          {result && (
            <>
              <Separator />
              <div className="space-y-2">
                <p className="text-xs font-medium">Result</p>
                <div className="flex items-center gap-3">
                  <Badge variant="outline" className="gap-1 text-[10px]">
                    <IconCheck className="size-3 text-emerald-500" />
                    {result.created} created
                  </Badge>
                  {result.skipped > 0 && (
                    <Badge variant="outline" className="gap-1 text-[10px] border-amber-500 text-amber-500">
                      <IconX className="size-3" />
                      {result.skipped} skipped
                    </Badge>
                  )}
                </div>
                {result.errors.length > 0 && (
                  <div className="max-h-32 overflow-y-auto rounded-sm border p-2">
                    {result.errors.map((err, i) => (
                      <p key={i} className="text-[10px] text-destructive">{err}</p>
                    ))}
                  </div>
                )}
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => router.push("/pipeline")}>
                    View Pipeline
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => router.push("/leads")}>
                    View Leads
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
