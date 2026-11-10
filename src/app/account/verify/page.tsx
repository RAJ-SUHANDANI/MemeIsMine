import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, ArrowUpRight, KeyRound, MailCheck } from "lucide-react";
import { SiteHeader } from "@/components/site";
import { SiteFooter } from "@/components/site-chrome";
import { pendingVerification } from "@/lib/mim-accounts";
import { returnPath } from "@/lib/return-path";
import { resendEmailCode, verifyEmailCode } from "../actions";

export const dynamic="force-dynamic";
export const metadata={title:"Verify your email"};
const messages:Record<string,string>={
 "invalid-code":"That code didn't match, expired, or was used too many times. Request a new one if needed.",
 "too-many-codes":"Too many requests. Please try again in an hour.",
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
    <p>Enter the six-digit verification code sent to <strong>{pending.email}</strong>. Codes expire after 10 minutes.</p>
    {query.status&&messages[query.status]&&<p className="mim-auth-notice" role="status">{messages[query.status]}</p>}
    <form action={verifyEmailCode} className="mim-verify-form">
      <input type="hidden" name="next" value={next}/>
      <label htmlFor="mim-otp">YOUR SIX-DIGIT CODE</label>
      <input id="mim-otp" name="code" autoComplete="one-time-code" inputMode="numeric" pattern="[0-9]{6}" placeholder="0 0 0 0 0 0" maxLength={6} required/>
      <button type="submit">Verify email <ArrowUpRight size={19}/></button>
    </form>
    <form action={resendEmailCode} className="mim-verify-resend"><input type="hidden" name="next" value={next}/><p>Didn't get it?</p><button type="submit">Send another code <KeyRound size={16}/></button></form>
    <Link className="mim-verify-back" href="/login"><ArrowLeft size={17}/> Back to sign in</Link>
   </div>
  </section>
  <SiteFooter/>
 </main>;
}
