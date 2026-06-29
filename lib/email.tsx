import nodemailer from "nodemailer"
import type { ReactElement } from "react"

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  secure: String(process.env.SMTP_SECURE).trim().toLowerCase() === "true",
  auth: {
    user: process.env.SMTP_USER?.trim(),
    pass: process.env.SMTP_PASS?.trim(),
  },
})

async function renderEmail(component: ReactElement): Promise<string> {
  const { renderToString } = await import("react-dom/server")
  return renderToString(component)
}

export async function sendWelcomeEmail(
  email: string,
  name: string,
  tempPassword: string,
) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"

  await transporter.sendMail({
    from: process.env.MAIL_FROM || `"SWRK CRM" <hello@swrk.in>`,
    to: email,
    subject: "Welcome to SWRK CRM - Your Account Details",
    html: `
      <div style="font-family: monospace; max-width: 480px; margin: 0 auto;">
        <h1>Welcome to SWRK CRM</h1>
        <p>Hi ${name},</p>
        <p>Your account has been created. Here are your login details:</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Temporary Password:</strong> <code style="background: #f0f0f0; padding: 4px 8px;">${tempPassword}</code></p>
        <p><a href="${appUrl}/login" style="display: inline-block; padding: 10px 24px; background: #000; color: #fff; text-decoration: none;">Login to SWRK CRM</a></p>
        <p>You'll be required to change your password on first login.</p>
      </div>
    `,
  })
}

export async function sendMOUEmail(
  email: string,
  name: string,
  date: string,
  mouId: string,
  pdfBuffer?: Buffer,
) {
  const { MOUEmail } = await import("@/components/emails/mou-email")
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"

  const html = await renderEmail(MOUEmail({ name, date, appUrl, mouId }))

  const mailOptions: nodemailer.SendMailOptions = {
    from: process.env.MAIL_FROM || `"SWRK" <hello@swrk.in>`,
    to: email,
    subject: "Your Business Development Associate Agreement with SWRK",
    html,
  }

  if (pdfBuffer) {
    mailOptions.attachments = [
      {
        filename: `SWRK-BDE-Agreement-${name.replace(/\s+/g, "-")}.pdf`,
        content: pdfBuffer,
        contentType: "application/pdf",
      },
    ]
  }

  await transporter.sendMail(mailOptions)
}

export async function sendCustomEmail(
  email: string,
  recipientName: string,
  subject: string,
  body: string,
) {
  const { GenericEmail } = await import("@/components/emails/generic-email")
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"

  const html = await renderEmail(
    GenericEmail({ recipientName, subject, body, appUrl }),
  )

  await transporter.sendMail({
    from: process.env.MAIL_FROM || `"SWRK" <hello@swrk.in>`,
    to: email,
    subject,
    html,
  })
}
