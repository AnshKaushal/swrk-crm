import {
  Html,
  Head,
  Body,
  Container,
  Section,
  Text,
  Img,
  Hr,
} from "@react-email/components"

interface GenericEmailProps {
  recipientName: string
  subject: string
  body: string
  appUrl: string
}

export function GenericEmail({
  recipientName,
  subject,
  body,
  appUrl,
}: GenericEmailProps) {
  return (
    <Html>
      <Head />
      <Body style={main}>
        <Container style={container}>
          <Section style={header}>
            <Img
              src={`${appUrl}/logo-dark.svg`}
              alt="SWRK"
              width="80"
              height="24"
              style={logo}
            />
          </Section>
          <Section style={content}>
            <Text style={title}>{subject}</Text>
            <Text style={greeting}>Dear {recipientName},</Text>
            {body.split("\n").map((line, i) => (
              <Text key={i} style={paragraph}>
                {line}
              </Text>
            ))}
            <Text style={paragraph}>Best regards,</Text>
            <Text style={signature}>
              <strong>SWRK Team</strong>
              <br />
              {appUrl}
            </Text>
          </Section>
          <Hr style={hr} />
          <Section style={footer}>
            <Text style={footerText}>
              SWRK — Software Development & Consulting
              <br />
              {appUrl}
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  )
}

const main = {
  fontFamily:
    '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
  backgroundColor: "#f5f5f5",
  margin: "0",
  padding: "0",
}

const container = {
  maxWidth: "520px",
  margin: "0 auto",
  padding: "32px 0",
}

const header = {
  backgroundColor: "#ffffff",
  padding: "24px 32px",
  borderTopLeftRadius: "8px",
  borderTopRightRadius: "8px",
  borderBottom: "1px solid #e5e5e5",
}

const logo = { margin: "0" }

const content = {
  backgroundColor: "#ffffff",
  padding: "32px",
}

const title = {
  fontSize: "18px",
  fontWeight: "600",
  color: "#111111",
  margin: "0 0 20px 0",
}

const greeting = {
  fontSize: "14px",
  color: "#333333",
  margin: "0 0 12px 0",
}

const paragraph = {
  fontSize: "14px",
  color: "#555555",
  lineHeight: "1.6",
  margin: "0 0 12px 0",
}

const signature = {
  fontSize: "14px",
  color: "#333333",
  margin: "0",
}

const hr = { borderColor: "#e5e5e5", margin: "0" }

const footer = {
  backgroundColor: "#ffffff",
  padding: "16px 32px",
  borderBottomLeftRadius: "8px",
  borderBottomRightRadius: "8px",
}

const footerText = {
  fontSize: "11px",
  color: "#999999",
  margin: "0",
  textAlign: "center" as const,
}
