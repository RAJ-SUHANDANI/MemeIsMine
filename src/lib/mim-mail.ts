import "server-only";
import nodemailer from "nodemailer";
import { emailConfig } from "./auth-config";

export async function sendVerificationCode(email: string, code: string, purpose: "signup" | "recovery") {
  if(!/^\d{6}$/.test(code))throw new Error("Invalid verification code");
  const config=emailConfig();
  if(!config)throw new Error("Email delivery is not configured.");
  const transporter=nodemailer.createTransport({
    host:config.host,
    port:config.port,
    secure:config.port===465,
    requireTLS:config.port!==465,
    auth:{user:config.user,pass:config.password},
    connectionTimeout:10000,
    greetingTimeout:10000,
    socketTimeout:12000,
    tls:{rejectUnauthorized:true},
  });
  const isSignup=purpose==="signup";
  const subject=isSignup?"Verify your Meme Is Mine account":"Your password reset code";
  const title=isSignup?"One more step.":"Back to your studio.";
  const instructions=isSignup
    ?"Enter this code on the sign-up screen to verify your email."
    :"Use this code on the recovery screen to reset your password.";
  const digits=code.split("").map(d=>`<span style="display:inline-block;font-size:30px;font-weight:750;letter-spacing:0;margin:0 4px">${d}</span>`).join("");
  const html=`<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:32px 12px;background:#f1ebdf;font-family:Arial,Helvetica,sans-serif;color:#1b211d">
<table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="max-width:520px;margin:0 auto;background:#fffdf7;border:1px solid #d0c7b8">
<tr><td style="padding:24px 30px;border-bottom:1px solid #d0c7b8;font-size:13px;font-weight:bold;letter-spacing:2px">MEME IS MINE <span style="color:#b93e2e">✳</span></td></tr>
<tr><td style="padding:38px 30px 12px">
<p style="font-size:11px;letter-spacing:2px;color:#b93e2e;font-weight:bold;margin:0 0 22px">ACCOUNT VERIFICATION</p>
<h1 style="font-size:42px;letter-spacing:-2px;line-height:1.02;margin:0 0 20px">${title}</h1>
<p style="font-size:16px;line-height:1.65;color:#585b53;margin:0">${instructions}</p>
</td></tr>
<tr><td style="padding:30px;text-align:center">
<div style="padding:24px 12px;background:#f1ebdf;border:1px solid #d0c7b8;white-space:nowrap">${digits}</div>
<p style="font-size:12px;color:#585b53;line-height:1.6;margin:18px 0 0">This code expires in <strong>10 minutes</strong> and works only once.</p>
</td></tr>
<tr><td style="padding:0 30px 34px"><p style="font-size:13px;line-height:1.6;color:#585b53;margin:0">Didn't request this? You can safely ignore this email. Never share your code with anyone, including someone claiming to help you with your account.</p></td></tr>
<tr><td style="padding:18px 30px;border-top:1px solid #d0c7b8;font-size:11px;color:#585b53;letter-spacing:1px">YOUR MEMES. YOUR RULES.</td></tr>
</table></body></html>`;
  try{
    await transporter.sendMail({
      from:config.from,
      to:email,
      subject,
      text:`Meme Is Mine — ${title}\n\n${instructions}\n\nYour six-digit code: ${code}\n\nThis code expires in 10 minutes and works only once. If you didn't request it, ignore this email. Never share your code.`,
      html,
    });
  }finally{
    transporter.close();
  }
}
