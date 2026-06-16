"use client"

import { useState, useCallback, useRef } from "react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

interface ConfirmOptions {
  title: string
  description?: string
  confirmLabel?: string
  cancelLabel?: string
}

export function useConfirm() {
  const [state, setState] = useState<{
    open: boolean
    opts: ConfirmOptions
  }>({ open: false, opts: { title: "" } })
  const resolveRef = useRef<((value: boolean) => void) | undefined>(undefined)

  const confirm = useCallback(async (opts: ConfirmOptions | string): Promise<boolean> => {
    const options = typeof opts === "string" ? { title: opts } : opts
    return new Promise((res) => {
      resolveRef.current = res
      setState({ open: true, opts: options })
    })
  }, [])

  const handleConfirm = useCallback(() => {
    resolveRef.current?.(true)
    setState((s) => ({ ...s, open: false }))
  }, [])

  const handleCancel = useCallback(() => {
    resolveRef.current?.(false)
    setState((s) => ({ ...s, open: false }))
  }, [])

  return {
    confirm,
    dialog: (
      <AlertDialog open={state.open} onOpenChange={(o) => { if (!o) handleCancel() }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-sm">{state.opts.title}</AlertDialogTitle>
            {state.opts.description && (
              <AlertDialogDescription className="text-xs">
                {state.opts.description}
              </AlertDialogDescription>
            )}
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="h-8 text-xs">
              {state.opts.cancelLabel || "Cancel"}
            </AlertDialogCancel>
            <AlertDialogAction className="h-8 text-xs" onClick={handleConfirm}>
              {state.opts.confirmLabel || "Continue"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    ),
  }
}
