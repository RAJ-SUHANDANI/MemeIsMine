import "server-only";
import nodemailer from "nodemailer";
import { emailConfig } from "./auth-config";

export async function sendVerificationCode(email: string, code: string, purpose: "signup" | "recovery") {
  const config = emailConfig();
  if (!config) throw new Error("Email delivery is not configured.");
  const transporter = nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.port === 465,
    requireTLS: config.port !== 465,
    auth: { user: config.user, pass: config.password },
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 12000,
    tls: { rejectUnauthorized: true },
  });
  const subject = purpose === "signup" ? "Your Meme Is Mine verification code" : "Reset your Meme Is Mine password";
  await transporter.sendMail({
    from: config.from,
    to: email,
    subject,
    text: `Your Meme Is Mine code is ${code}.\n\nThis code expires in 10 minutes. If you didn't request it, you can ignore this email.\n\nNever share this code with anyone.`,
  });
}
