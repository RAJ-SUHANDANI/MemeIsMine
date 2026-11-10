import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, ArrowUpRight, KeyRound, MailCheck } from "lucide-react";
import { SiteHeader } from "@/components/site";
import { SiteFooter } from "@/components/site-chrome";
import { pendingVerification } from "@/lib/mim-accounts";
import { returnPath } from "@/lib/return-path";
import { resendEmailCode, verifyEmailCode } from "../actions";

export const dynamic="force-dynamic";
export const metadata={title:"Verify your email",robots:{index:false,follow:false}};
const messages:Record<string,string>={
 "invalid-code":"That code did not match or has expired. Request a new one if needed.",
 "invalid-password":"Choose a new password between 12 and 128 characters.",
 "too-many-codes":"Too many requests. Please try again in an hour.",
 "rate-limited":"Too many requests from this connection. Try again later.",
 wait:"A code was recently sent. Check your inbox or wait a minute to request another.",
 unavailable:"Email delivery is temporarily unavailable. Please try again.",
 sent:"A fresh code has been requested. Check your inbox.",
};
export default async function Verify({searchParams}:{
 searchParams:Promise<{next?:string;status?:string}>;
}){
 const query=await searchParams;
 const pending=await pendingVerification();
 const next=returnPath(query.next);
 if(!pending)redirect("/login?status=expired");
 return <main id="main-content" className="rf-site mim-verify-page">
  <SiteHeader/>
  <section className="mim-verify-wrap">
   <div className="mim-verify-art" aria-hidden="true"><div className="mim-verify-art-inner"><span>✳</span><strong>ONE<br/>MORE<br/>STEP.</strong><small>YOUR CREATIVE SPACE IS ALMOST READY.</small></div></div>
   <div className="mim-verify-content">
    <div className="mim-verify-icon"><MailCheck size={34}/></div>
    <span className="rf-kicker">ACCOUNT SECURITY / EMAIL CHECK</span>
    <h1>{pending.purpose==="signup"?<>Check your <em>inbox.</em></>:<>Make it <em>yours again.</em></>}</h1>
    <p>{pending.purpose==="recovery"? "If this email belongs to an account, a six-digit recovery code was sent to ": "Enter the six-digit verification code sent to "}<strong>{pending.email}</strong>. Codes expire after 15 minutes.</p>
    {query.status&&messages[query.status]&&<p className="mim-auth-notice" role="status">{messages[query.status]}</p>}
    <form action={verifyEmailCode} className="mim-verify-form">
      <input type="hidden" name="next" value={next}/>
      <label htmlFor="mim-otp">YOUR SIX-DIGIT CODE</label>
      <input id="mim-otp" name="code" autoComplete="one-time-code" inputMode="numeric" pattern="[0-9]{6}" placeholder="0 0 0 0 0 0" maxLength={6} required/>
      {pending.purpose==="recovery"&&<>
        <label htmlFor="mim-new-password">CHOOSE A NEW PASSWORD</label>
        <input id="mim-new-password" name="password" type="password" minLength={12} maxLength={128}
          autoComplete="new-password" placeholder="At least 12 characters" required/>
      </>}
      <button type="submit">{pending.purpose==="recovery"?"Reset password":"Verify email"} <ArrowUpRight size={19}/></button>
    </form>
    <form action={resendEmailCode} className="mim-verify-resend"><input type="hidden" name="next" value={next}/><p>Did not get it?</p><button type="submit">Send another code <KeyRound size={16}/></button></form>
    <Link className="mim-verify-back" href="/login"><ArrowLeft size={17}/> Back to sign in</Link>
   </div>
  </section>
  <SiteFooter/>
 </main>;
}
