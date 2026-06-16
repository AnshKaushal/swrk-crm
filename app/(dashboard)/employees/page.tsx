"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { IconEye } from "@tabler/icons-react"
import { toast } from "sonner"

interface Employee {
  _id: string
  name: string
  email: string
  assignedManager?: { _id: string; name: string; email: string }
  createdAt: string
}

export default function EmployeesPage() {
  const router = useRouter()
  const [employees, setEmployees] = useState<Employee[]>([])
  const [loading, setLoading] = useState(true)

  const fetchEmployees = useCallback(async () => {
    try {
      const res = await fetch("/api/employees")
      if (res.status === 403) {
        router.push("/pipeline")
        return
      }
      const data = await res.json()
      setEmployees(Array.isArray(data) ? data : [])
    } catch {
      toast.error("Failed to load employees")
    } finally {
      setLoading(false)
    }
  }, [router])

  useEffect(() => {
    fetchEmployees()
  }, [fetchEmployees])

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-medium">Employees</h1>
      </div>

      {employees.length === 0 ? (
        <div className="text-sm text-muted-foreground py-8 text-center">
          No employees found.
        </div>
      ) : (
        <div className="rounded-sm border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-xs">Name</TableHead>
                <TableHead className="text-xs">Email</TableHead>
                <TableHead className="text-xs">Manager</TableHead>
                <TableHead className="text-xs">Joined</TableHead>
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {employees.map((emp) => (
                <TableRow key={emp._id}>
                  <TableCell className="text-xs font-medium">{emp.name}</TableCell>
                  <TableCell className="text-xs">{emp.email}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {emp.assignedManager?.name || "—"}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {new Date(emp.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="icon-xs"
                      onClick={() => router.push(`/employees/${emp._id}`)}
                    >
                      <IconEye className="size-3" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}
