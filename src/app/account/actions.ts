"use server";
import { redirect } from "next/navigation";
import { authConfig } from "@/lib/auth-config";
import { changePassword, finishVerification, normalizedEmail, pendingVerification,
  register, removeSession, requestRecovery, resendCode, signIn } from "@/lib/mim-accounts";
import { returnPath } from "@/lib/return-path";

function toStatus(error:unknown,fallBack="unavailable"){
 const code=typeof error==="object"&&error!==null&&"code" in error?Number((error as {code:unknown}).code):0;
 if(code===409)return "account-exists";
 if(code===429)return "rate-limited";
 if(code===401)return "login-error";
 if(code===400)return "invalid";
 return fallBack;
}
function fail(route:string,next:string,status:string):never{
 redirect(route+"?"+new URLSearchParams({next,status}));
}
export async function authenticate(form:FormData){
 const signup=form.get("mode")==="signup";
 const route=signup?"/signup":"/login";
 const next=returnPath(form.get("next"));
 const email=normalizedEmail(String(form.get("email")??""));
 const password=String(form.get("password")??"");
 if(!email||password.length>128||password.length<(signup?12:1))fail(route,next,"invalid");
 if(!authConfig())fail(route,next,"unavailable");
 if(signup && form.get("acceptedTerms")!=="yes")fail(route,next,"terms-required");
 if(signup){
  let result:"sent"|"email-unavailable";
  try{result=await register(email!,password);}
  catch(error){
   if(toStatus(error)==="account-exists")redirect("/login?"+new URLSearchParams({next,status:"account-exists"}));
   fail(route,next,toStatus(error,"signup-error"));
  }
  redirect("/account/verify?"+new URLSearchParams({next,...(result==="email-unavailable"?{status:"unavailable"}:{})}));
 }
 let result:"signed-in"|"verify";
 try{result=await signIn(email!,password);}
 catch(error){fail(route,next,toStatus(error,"login-error"));}
 if(result==="verify")redirect("/account/verify?"+new URLSearchParams({next}));
 redirect(next);
}
export async function verifyEmailCode(form:FormData){
 const pending=await pendingVerification();
 const next=returnPath(form.get("next"));
 if(!pending)redirect("/login?status=expired");
 const code=String(form.get("code")??"").trim();
 const password=String(form.get("password")??"");
 if(!/^\d{6}$/.test(code))redirect("/account/verify?"+new URLSearchParams({next,status:"invalid-code"}));
 if(pending.purpose==="recovery"&&(password.length<12||password.length>128))
  redirect("/account/verify?"+new URLSearchParams({next,status:"invalid-password"}));
 let result:"signup"|"recovery"|null=null;
 try{result=await finishVerification(code,password);}
 catch(error){redirect("/account/verify?"+new URLSearchParams({next,status:toStatus(error,"invalid-code")}));}
 if(!result)redirect("/account/verify?"+new URLSearchParams({next,status:"invalid-code"}));
 redirect(result==="recovery"?"/login?status=password-reset":next);
}
export async function resendEmailCode(form:FormData){
 const next=returnPath(form.get("next"));
 const pending=await pendingVerification();
 if(!pending)redirect("/login?status=expired");
 let status="sent";
 try{if(!(await resendCode()))status="unavailable";}
 catch(error){status=toStatus(error);}
 redirect("/account/verify?"+new URLSearchParams({next,status}));
}
export async function requestPasswordReset(form:FormData){
 const email=normalizedEmail(String(form.get("email")??""));
 if(!authConfig())redirect("/account/recover?status=unavailable");
 if(!email)redirect("/account/recover?status=invalid");
 try{await requestRecovery(email);}
 catch(error){
  if(toStatus(error)==="rate-limited")redirect("/account/recover?status=rate-limited");
  // Avoid revealing account existence to unauthenticated visitors.
  redirect("/account/recover?status=unavailable");
 }
 redirect("/account/verify?purpose=recovery");
}
export async function updatePassword(form:FormData){
 const password=String(form.get("password")??"");
 const currentPassword=String(form.get("currentPassword")??"");
 if(password.length<12||password.length>128||!currentPassword)redirect("/account/password?error=1");
 try{if(!(await changePassword(password,currentPassword)))redirect("/account/password?error=1");}
 catch(error){
  if(error&&typeof error==="object"&&"digest" in error)throw error;
  redirect("/account/password?error=1");
 }
 redirect("/account?status=password-updated");
}
export async function signOut(){
 await removeSession();
 redirect("/login");
}
