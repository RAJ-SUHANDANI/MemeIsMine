import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowUpRight, LockKeyhole } from "lucide-react";
import { SiteHeader } from "@/components/site";
import { SiteFooter } from "@/components/site-chrome";
import { readSession } from "@/lib/mim-accounts";
import { updatePassword } from "../actions";
export const metadata={title:"Set a new password",robots:{index:false,follow:false}};
export default async function Password({searchParams}:{searchParams:Promise<{error?:string}>}){
 const session=await readSession();
 if(!session)redirect("/account/recover");
 const {error}=await searchParams;
 return <main id="main-content" className="rf-site mim-verify-page">
  <SiteHeader/>
  <section className="mim-verify-wrap mim-password-wrap">
    <div className="mim-verify-art" aria-hidden="true"><div className="mim-verify-art-inner"><span>✳</span><strong>A FRESH<br/>START.</strong><small>TAKE YOUR STUDIO BACK.</small></div></div>
    <div className="mim-verify-content">
      <div className="mim-verify-icon"><LockKeyhole size={31}/></div>
      <span className="rf-kicker">ACCOUNT / SECURITY</span>
      <h1>Keep it <em>yours.</em></h1>
      <p>Choose a new, unique password. This will sign out other sessions to protect your account.</p>
      {error&&<p className="mim-auth-notice" role="status">Use a password between 12 and 128 characters. Please try again.</p>}
      <form action={updatePassword} className="mim-verify-form">
        {session.scope==="user"&&<>
          <label htmlFor="password-current">CURRENT PASSWORD</label>
          <input id="password-current" name="currentPassword" type="password" required autoComplete="current-password" placeholder="Your current password"/>
        </>}
        <label htmlFor="password-new">NEW PASSWORD</label>
        <input id="password-new" name="password" type="password" minLength={12} maxLength={128} required autoComplete="new-password" placeholder="At least 12 characters"/>
        <button type="submit">Save password <ArrowUpRight size={19}/></button>
      </form>
      <Link href="/account" className="mim-verify-back">Back to account</Link>
    </div>
  </section><SiteFooter/>
 </main>;
}
