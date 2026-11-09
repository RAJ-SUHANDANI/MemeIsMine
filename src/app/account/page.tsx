import Link from "next/link";
import { ArrowRight, ArrowUpRight, Bookmark, FolderOpen, HardDrive, KeyRound, LogOut, ShieldCheck } from "lucide-react";
import { SiteHeader } from "@/components/site";
import { SiteFooter } from "@/components/site-chrome";
import { requireAccount } from "@/lib/require-account";
import { signOut } from "./actions";

export const metadata={title:"Your account"};
export default async function Account(){
 const {user}=await requireAccount("/account");
 return <main id="main-content" tabIndex={-1} className="rf-site rf-account">
  <SiteHeader/>
  <section className="rf-account-hero"><div className="container"><span className="rf-kicker">ACCOUNT / PERSONAL SPACE</span><h1>The person<br/>behind <em>the punchline.</em></h1><p>Everything important about your account, without a complicated settings maze.</p></div></section>
  <section className="container rf-account-body">
   <div className="rf-account-identity"><div className="rf-account-avatar" aria-hidden="true">✳</div><div><span className="rf-kicker">SIGNED IN AS</span><h2>{user.email}</h2><p>Your account lets you create, save locally and like formats. Your drafts remain in this browser unless you export a backup.</p></div><span className="rf-account-active"><ShieldCheck size={16}/> SIGNED IN</span></div>
   <div className="rf-account-heading"><span className="rf-kicker">YOUR SHORTCUTS</span><h2>Where to <em>next?</em></h2></div>
   <div className="rf-account-links">
    <Link href="/studio"><FolderOpen size={32}/><span>01 / YOUR WORKSPACE</span><strong>Open Studio</strong><p>Pick up drafts and browse saved formats.</p><ArrowUpRight size={23}/></Link>
    <Link href="/studio?tab=collections"><Bookmark size={32}/><span>02 / YOUR COLLECTIONS</span><strong>Organize your finds</strong><p>Keep the right reaction ready for later.</p><ArrowUpRight size={23}/></Link>
    <Link href="/studio?tab=backup"><HardDrive size={32}/><span>03 / LOCAL BACKUP</span><strong>Keep a copy</strong><p>Export your work from this device.</p><ArrowUpRight size={23}/></Link>
   </div>
   <div className="rf-account-security"><div><span className="rf-kicker">ACCOUNT & SECURITY</span><h2>Keep the keys.</h2><p>Manage your password or sign out of this browser.</p></div>
    <div><Link href="/account/password"><KeyRound size={18}/> Change password <ArrowRight size={17}/></Link><form action={signOut}><button type="submit"><LogOut size={18}/> Sign out <ArrowUpRight size={17}/></button></form></div>
   </div>
  </section>
  <SiteFooter/>
 </main>;
}
