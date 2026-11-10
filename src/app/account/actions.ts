"use server";
import { redirect } from "next/navigation";
import { authConfig, emailConfig } from "@/lib/auth-config";
import {
  changePassword, finishVerification, normalizedEmail, pendingVerification,
  register, removeSession, savePending, sendChallenge, signIn
} from "@/lib/mim-accounts";
import { returnPath } from "@/lib/return-path";

function failure(route:string,next:string,status:string):never {
 redirect(route+"?"+new URLSearchParams({next,status}));
}
export async function authenticate(form:FormData){
 const signup=form.get("mode")==="signup";
 const route=signup?"/signup":"/login";
 const next=returnPath(form.get("next"));
 const email=normalizedEmail(String(form.get("email")??""));
 const password=String(form.get("password")??"");
 if(!email || password.length>128 || password.length<(signup?12:1))failure(route,next,"invalid");
 if(!authConfig() || (signup&&!emailConfig()))failure(route,next,"unavailable");
 try{
  if(signup){
   const result=await register(email!,password);
   if(result==="unavailable")failure(route,next,"unavailable");
   if(result==="limited")failure(route,next,"too-many-codes");
   await savePending(email!,"signup");
   redirect("/account/verify?"+new URLSearchParams({next, ...(result==="cooldown"?{status:"wait"}:{})}));
  }
  const ok=await signIn(email!,password);
  if(!ok)failure(route,next,"login-error");
 }catch(error){
  if(error && typeof error==="object" && "digest" in error)throw error;
  console.error("Authentication backend error:",error instanceof Error?error.message:"unknown");
  failure(route,next,"unavailable");
 }
 redirect(next);
}

export async function verifyEmailCode(form:FormData){
 const pending=await pendingVerification();
 const next=returnPath(form.get("next"));
 if(!pending)redirect("/login?status=expired");
 const code=String(form.get("code")??"").replace(/\s/g,"");
 if(!/^\d{6}$/.test(code))redirect("/account/verify?"+new URLSearchParams({next,status:"invalid-code"}));
 let verified=false;
 try{verified=await finishVerification(pending!.email,code,pending!.purpose);}
 catch(error){console.error("Verification failed:",error instanceof Error?error.message:"unknown");}
 if(!verified)redirect("/account/verify?"+new URLSearchParams({next,status:"invalid-code"}));
 redirect(pending!.purpose==="recovery"?"/account/password":next);
}

export async function resendEmailCode(form:FormData){
 const pending=await pendingVerification();
 const next=returnPath(form.get("next"));
 if(!pending)redirect("/login?status=expired");
 let status="sent";
 try{
  const result=await sendChallenge(pending!.email,pending!.purpose);
  status=result==="cooldown"?"wait":result==="limited"?"too-many-codes":result==="unavailable"?"unavailable":"sent";
 }catch{status="unavailable";}
 redirect("/account/verify?"+new URLSearchParams({next,status}));
}

export async function requestPasswordReset(form:FormData){
 const email=normalizedEmail(String(form.get("email")??""));
 if(!authConfig()||!emailConfig())redirect("/account/recover?status=unavailable");
 if(email){
  try{await sendChallenge(email,"recovery");await savePending(email,"recovery");}
  catch(error){console.error("Reset dispatch failed:",error instanceof Error?error.message:"unknown");}
 }
 // The same screen is shown whether or not an account exists.
 redirect("/account/verify?purpose=recovery");
}
export async function updatePassword(form:FormData){
 const password=String(form.get("password")??"");
 if(password.length<12||password.length>128)redirect("/account/password?error=1");
 let success=false;
 try{success=await changePassword(password);}
 catch(error){console.error("Password change failed:",error instanceof Error?error.message:"unknown");}
 if(!success)redirect("/account/password?error=1");
 redirect("/account");
}
export async function signOut(){
 try{await removeSession();}catch(error){console.error("Could not revoke session:",error instanceof Error?error.message:"unknown");}
 redirect("/login");
}
