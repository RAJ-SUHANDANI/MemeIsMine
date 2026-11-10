import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowUpRight, Check, LockKeyhole, Sparkles } from "lucide-react";
import { SiteHeader } from "./site";
import { SiteFooter } from "./site-chrome";
import { accountSession } from "@/lib/auth";
import { authConfig, emailConfig } from "@/lib/auth-config";
import { returnPath } from "@/lib/return-path";
import { authenticate } from "@/app/account/actions";
import { AuthPassword, AuthSubmit } from "./auth-fields";

const messages:Record<string,string>={
 unavailable:"Account services are not configured on this server yet.",
 invalid:"Enter a valid email address. New passwords must be 12–128 characters.",
 "signup-error":"Couldn't create the account. Please try again.",
 "login-error":"Email or password is incorrect, or the email hasn't been verified.",
 "too-many-codes":"Too many codes were requested. Try again later.",
 "check-email":"Check your inbox for the six-digit confirmation code.",
 "confirmation-error":"That verification code has expired.",
 expired:"Your verification session expired. Please start again.",
};

export async function AccountForm({mode,query}:{
 mode:"login"|"signup";query:{next?:string;status?:string};
}){
 const next=returnPath(query.next);
 if(await accountSession())redirect(next);
 const signup=mode==="signup";
 const enabled=Boolean(authConfig() && (!signup||emailConfig()));
 const message=enabled?messages[query.status??""]:messages.unavailable;
 const suffix="?next="+encodeURIComponent(next);
 return <main id="main-content" className="rf-site mim-auth-page">
   <SiteHeader/>
   <div className="mim-auth-layout">
     <aside className="mim-auth-art">
       <div className="mim-auth-art-top"><span>MEME IS MINE</span><span>THE CREATIVE CORNER / 001</span></div>
       <div className="mim-auth-art-stage">
         <div className="mim-auth-stamp" aria-hidden="true">✳</div>
         <figure className="mim-auth-art-card mim-auth-card-1"><Image src="/templates/drake.jpg" alt="" width={480} height={480}/><figcaption>YOUR NEXT REACTION / 01</figcaption></figure>
         <figure className="mim-auth-art-card mim-auth-card-2"><Image src="/templates/distracted-boyfriend.jpg" alt="" width={480} height={340}/><figcaption>THE INTERNET / 02</figcaption></figure>
         <figure className="mim-auth-art-card mim-auth-card-3"><Image src="/templates/two-buttons.jpg" alt="" width={350} height={350}/><figcaption>ONE MORE TAKE / 03</figcaption></figure>
       </div>
       <div className="mim-auth-art-bottom"><span>EVERY GREAT JOKE STARTS SOMEWHERE.</span><span>EST. IN YOUR BROWSER</span></div>
     </aside>
     <section className="mim-auth-form-side" aria-labelledby="auth-title">
       <div className="mim-auth-panel">
         <div className="mim-auth-topline"><span className="rf-kicker"><span aria-hidden="true">✳</span> YOUR PERSONAL STUDIO</span><Link href="/explore">Browse first <ArrowUpRight size={16}/></Link></div>
         <nav className="mim-auth-switcher" aria-label="Choose account action">
           <Link href={"/login"+suffix} aria-current={!signup?"page":undefined}>Sign in</Link>
           <Link href={"/signup"+suffix} aria-current={signup?"page":undefined}>Create account</Link>
         </nav>
         <span className="mim-auth-overline">{signup?"01 — A NEW BEGINNING":"02 — WELCOME BACK"}</span>
         <h1 id="auth-title">{signup?<>Make room for<br/><em>the good ones.</em></>:<>The good ones<br/><em>are waiting.</em></>}</h1>
         <p className="mim-auth-intro">{signup?
           "Create your free account. Verify your email with a six-digit code, then the studio is yours.":
           "Your drafts, your saved formats, your next punchline. Pick up exactly where you left off on this device."}</p>
         {message && <p className="mim-auth-notice" role="status">{message}</p>}
         <form action={authenticate} className="mim-auth-form">
           <input type="hidden" name="mode" value={mode}/><input type="hidden" name="next" value={next}/>
           <label htmlFor="mim-auth-email">EMAIL ADDRESS</label>
           <input id="mim-auth-email" type="email" name="email" autoComplete="email" placeholder="you@example.com" required maxLength={254} disabled={!enabled}/>
           <div className="mim-auth-password-heading"><label htmlFor="auth-password">PASSWORD</label>{!signup&&<Link href="/account/recover">Forgot password?</Link>}</div>
           <AuthPassword signup={signup} disabled={!enabled}/>
           {signup&&<p className="mim-auth-hint"><LockKeyhole size={15}/> At least 12 characters. Use a unique password.</p>}
           <AuthSubmit signup={signup} disabled={!enabled}/>
         </form>
         <div className="mim-auth-underform"><span><Check size={16}/> Free to create</span><span><Sparkles size={16}/> Your work stays yours</span></div>
         <div className="mim-auth-below"> {signup?"Already have an account?":"New to Meme Is Mine?"} <Link href={(signup?"/login":"/signup")+suffix}>{signup?"Sign in":"Create an account"} <ArrowUpRight size={15}/></Link></div>
       </div>
     </section>
   </div>
   <SiteFooter/>
 </main>;
}
