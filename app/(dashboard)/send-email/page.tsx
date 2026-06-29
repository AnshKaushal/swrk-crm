"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { IconSend, IconMail } from "@tabler/icons-react"
import { toast } from "sonner"

export default function SendEmailPage() {
  const router = useRouter()
  const [recipientName, setRecipientName] = useState("")
  const [email, setEmail] = useState("")
  const [subject, setSubject] = useState("")
  const [body, setBody] = useState("")
  const [sending, setSending] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email.trim() || !subject.trim() || !body.trim()) {
      toast.error("Email, subject, and body are required")
      return
    }

    setSending(true)
    try {
      const res = await fetch("/api/send-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          recipientName: recipientName.trim() || "Recipient",
          subject: subject.trim(),
          body: body.trim(),
        }),
      })

      if (res.status === 403) {
        router.push("/pipeline")
        return
      }

      if (!res.ok) {
        const err = await res.json()
        toast.error(err.error || "Failed to send")
        return
      }

      toast.success("Email sent successfully")
      setRecipientName("")
      setEmail("")
      setSubject("")
      setBody("")
    } catch {
      toast.error("Failed to send email")
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="space-y-4 max-w-2xl">
      <div className="flex items-center gap-3">
        <h1 className="text-lg font-medium flex items-center gap-2">
          <IconMail className="size-4" />
          Send Email
        </h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Compose Email</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="recipientName" className="text-xs">
                  Recipient Name
                </Label>
                <Input
                  id="recipientName"
                  value={recipientName}
                  onChange={(e) => setRecipientName(e.target.value)}
                  placeholder="John Doe"
                  className="text-xs"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email" className="text-xs">
                  Recipient Email *
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="john@example.com"
                  className="text-xs"
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="subject" className="text-xs">
                Subject *
              </Label>
              <Input
                id="subject"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Enter email subject"
                className="text-xs"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="body" className="text-xs">
                Message Body *
              </Label>
              <Textarea
                id="body"
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="Write your message here... Each line will be rendered as a separate paragraph."
                className="text-xs min-h-[200px]"
                required
              />
            </div>
            <div className="text-[10px] text-muted-foreground">
              The email will be sent using the SWRK branded template with your
              message as the body content.
            </div>
            <div className="flex justify-end pt-2">
              <Button type="submit" size="sm" disabled={sending}>
                <IconSend className="size-3.5" />
                {sending ? "Sending..." : "Send Email"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
