import nodemailer from "nodemailer"

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  secure: Number(process.env.SMTP_PORT) === 465,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
})

export async function sendWelcomeEmail(
  email: string,
  name: string,
  tempPassword: string,
) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"

  await transporter.sendMail({
    from: `"SWRK CRM" <${process.env.SMTP_FROM}>`,
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
