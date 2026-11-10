#!/usr/bin/env node
/**
 * Readiness gate for a self-hosted Meme Is Mine installation.
 *
 * Example (from the Docker container):
 *   node scripts/check-auth-readiness.mjs --smtp
 *   node scripts/check-auth-readiness.mjs --smtp --send-to you@example.com
 *
 * No credentials, account data, or verification codes are printed.
 */
import path from "node:path";
import { accessSync, constants, existsSync, mkdirSync } from "node:fs";
import { DatabaseSync } from "node:sqlite";
import nodemailer from "nodemailer";

const args=process.argv.slice(2);
const sendIndex=args.indexOf("--send-to");
const recipient=sendIndex>=0?args[sendIndex+1]:"";
const checkSmtp=args.includes("--smtp")||Boolean(recipient);
const failures=[];
const dbPath=process.env.MIM_DATABASE_PATH;
const secret=process.env.MIM_AUTH_SECRET;
const origin=process.env.NEXT_PUBLIC_SITE_URL;

if(process.env.VERCEL)failures.push("Serverless ephemeral storage is unsupported.");
if(!dbPath||!path.isAbsolute(dbPath))failures.push("MIM_DATABASE_PATH must be an absolute path.");
else if(dbPath.startsWith("/tmp/")||dbPath==="/tmp")failures.push("Use a persistent database volume, not /tmp.");
if(!secret||secret.length<32)failures.push("MIM_AUTH_SECRET must have at least 32 unpredictable characters.");
if(process.env.NODE_ENV==="production"&&(!origin||!/^https:\/\//.test(origin)))
  failures.push("Set NEXT_PUBLIC_SITE_URL to the final HTTPS origin.");
if(recipient && (recipient.length>254||!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(recipient)))
  failures.push("The --send-to address is invalid.");

if(failures.length){
  for(const message of failures)console.error("NOT READY:",message);
  process.exit(1);
}
let db;
try{
  mkdirSync(path.dirname(dbPath),{recursive:true,mode:0o700});
  accessSync(path.dirname(dbPath),constants.R_OK|constants.W_OK);
  db=new DatabaseSync(dbPath);
  const result=db.prepare("PRAGMA integrity_check").get();
  if(!result||Object.values(result)[0]!=="ok")throw Error("SQLite integrity check failed");
  db.prepare("SELECT 1").get();
  const hasUsers=db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='users'").get();
  console.log("PASS writable SQLite volume, integrity check"+(hasUsers?" and account schema":" (first start; schema initializes on app boot)"));
}catch(error){
  console.error("NOT READY: database cannot be opened or passed integrity checks:",error instanceof Error?error.message:"unknown error");
  process.exitCode=1;
}finally{db?.close();}

if(checkSmtp&&!process.exitCode){
  const host=process.env.MIM_SMTP_HOST;
  const port=Number(process.env.MIM_SMTP_PORT||465);
  const user=process.env.MIM_SMTP_USER;
  const password=process.env.MIM_SMTP_PASSWORD;
  const from=process.env.MIM_SMTP_FROM;
  if(!host||!user||!password||!from||![465,587].includes(port)){
    console.error("NOT READY: SMTP hostname, port (465/587), credentials and sender are required.");
    process.exitCode=1;
  }else{
    const client=nodemailer.createTransport({
      host,port,secure:port===465,requireTLS:port===587,
      auth:{user,pass:password},
      connectionTimeout:10000,greetingTimeout:10000,socketTimeout:12000,
      tls:{rejectUnauthorized:true},
    });
    try{
      await client.verify();
      console.log("PASS authenticated SMTP connection and TLS");
      if(recipient){
        await client.sendMail({
          from,to:recipient,
          subject:"Meme Is Mine — email delivery test",
          text:"Your Meme Is Mine server successfully delivered this test message. This is not an authentication code.",
        });
        console.log("PASS SMTP provider accepted a test email for delivery");
        console.log("Check the recipient inbox and spam folder to verify actual delivery.");
      }
    }catch(error){
      console.error("NOT READY: SMTP verification or delivery failed:",error instanceof Error?error.message:"unknown SMTP error");
      process.exitCode=1;
    }finally{client.close();}
  }
}
if(!process.exitCode)console.log("Meme Is Mine readiness checks passed.");
