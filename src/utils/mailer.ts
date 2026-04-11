import nodemailer from "nodemailer";

export function isMailConfigured(): boolean {
  return Boolean(
    process.env.NODEMAILER_EMAIL?.trim() && process.env.NODEMAILER_PASS?.trim()
  );
}

let cached: nodemailer.Transporter | null = null;

export function getTransporter(): nodemailer.Transporter {
  if (cached) return cached;
  if (!isMailConfigured()) {
    throw new Error("Mail not configured");
  }
  const host = process.env.SMTP_HOST || "smtp.gmail.com";
  const port = Number(process.env.SMTP_PORT || 587);
  const secure =
    process.env.SMTP_SECURE === "true" || port === 465;
  cached = nodemailer.createTransport({
    host,
    port,
    secure,
    auth: {
      user: process.env.NODEMAILER_EMAIL!,
      pass: process.env.NODEMAILER_PASS!,
    },
  });
  return cached;
}

export async function sendHtmlEmail(options: {
  to: string;
  subject: string;
  html: string;
}): Promise<void> {
  if (!isMailConfigured()) return;
  const transporter = getTransporter();
  const fromName = process.env.MAIL_FROM_NAME || "Ecommercely";
  const fromAddr = process.env.NODEMAILER_EMAIL!;
  await transporter.sendMail({
    from: `"${fromName}" <${fromAddr}>`,
    to: options.to,
    subject: options.subject,
    html: options.html,
  });
}
