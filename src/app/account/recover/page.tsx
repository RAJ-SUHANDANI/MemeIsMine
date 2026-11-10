import Link from "next/link";
import { ArrowLeft, ArrowUpRight, KeyRound } from "lucide-react";
import { SiteHeader } from "@/components/site";
import { SiteFooter } from "@/components/site-chrome";
import { authConfig, emailConfig } from "@/lib/auth-config";
import { requestPasswordReset } from "../actions";
export const metadata={title:"Reset your password"};
export default async function Recover({searchParams}:{searchParams:Promise<{status?:string}>}){
 const {status}=await searchParams;
 const enabled=Boolean(authConfig()&&emailConfig());
 return <main id="main-content" className="rf-site mim-verify-page">
   <SiteHeader/>
   <section className="mim-verify-wrap mim-recover-wrap">
    <div className="mim-verify-art" aria-hidden="true"><div className="mim-verify-art-inner"><span>✳</span><strong>WE HAVE<br/>GOT<br/>YOU.</strong><small>GET BACK TO THE GOOD STUFF.</small></div></div>
    <div className="mim-verify-content">
     <div className="mim-verify-icon"><KeyRound size={31}/></div>
     <span className="rf-kicker">ACCOUNT / RECOVERY</span>
     <h1>Back in <em>business.</em></h1>
     <p>Enter your email address. If it belongs to an account, we will send a six-digit code to verify it is you.</p>
     {status==="unavailable"&&<p className="mim-auth-notice" role="status">Email verification is not configured on this server yet.</p>}
     {status==="rate-limited"&&<p className="mim-auth-notice" role="status">Too many recovery requests. Please try again later.</p>}
     <form action={requestPasswordReset} className="mim-verify-form">
      <label htmlFor="recovery-email">EMAIL ADDRESS</label>
      <input id="recovery-email" type="email" autoComplete="email" name="email" placeholder="you@example.com" maxLength={254} required disabled={!enabled}/>
      <button type="submit" disabled={!enabled}>Send recovery code <ArrowUpRight size={19}/></button>
     </form>
     <Link href="/login" className="mim-verify-back"><ArrowLeft size={17}/> Return to sign in</Link>
    </div>
   </section><SiteFooter/>
 </main>;
}
