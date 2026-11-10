import "server-only";
import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import { Account, ID, Query } from "node-appwrite";
import { cookies } from "next/headers";
import { authConfig } from "./auth-config";
import { adminClient, createSessionCookie, dropSessionCookie, likesClient, sessionClient, userClient } from "./appwrite";

type Purpose="signup"|"recovery";
type Pending={email:string;purpose:Purpose;userId:string};
type CurrentUser={id:string;email:string};
const PENDING_COOKIE="mim_verify";
const FIFTEEN_MINUTES=15*60*1000;

export function normalizedEmail(value:string):string|null{
 const email=value.trim().toLowerCase();
 return email.length>=5&&email.length<=254&&!/[\s\r\n]/.test(email)&&/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)?email:null;
}
function pendingSignature(payload:string){
 const config=authConfig();
 if(!config)throw Error("Appwrite is not configured");
 return createHmac("sha256",config.apiKey).update("pending:"+payload).digest("hex");
}
export async function savePending(email:string,purpose:Purpose,userId:string){
 const payload=Buffer.from(JSON.stringify({email,purpose,userId,expires:Date.now()+FIFTEEN_MINUTES})).toString("base64url");
 (await cookies()).set(PENDING_COOKIE,payload+"."+pendingSignature(payload),{
  httpOnly:true,secure:process.env.NODE_ENV==="production",sameSite:"lax",path:"/",maxAge:900,
 });
}
export async function pendingVerification():Promise<Pending|null>{
 if(!authConfig())return null;
 const raw=(await cookies()).get(PENDING_COOKIE)?.value;
 if(!raw||raw.length>1400)return null;
 const [payload,signature,...extras]=raw.split(".");
 if(extras.length||!payload||!signature||! /^[a-f0-9]{64}$/.test(signature))return null;
 const expected=Buffer.from(pendingSignature(payload),"hex");
 if(!timingSafeEqual(Buffer.from(signature,"hex"),expected))return null;
 try{
  const value:unknown=JSON.parse(Buffer.from(payload,"base64url").toString("utf8"));
  if(!value||typeof value!=="object")return null;
  const v=value as Record<string,unknown>;
  if(typeof v.email!=="string"||(v.purpose!=="signup"&&v.purpose!=="recovery")||
     typeof v.userId!=="string"||typeof v.expires!=="number"||
     v.userId.length>100||v.expires<Date.now()||v.expires>Date.now()+FIFTEEN_MINUTES)return null;
  const email=normalizedEmail(v.email);
  return email?{email,purpose:v.purpose,userId:v.userId}:null;
 }catch{return null;}
}
async function clearPending(){(await cookies()).delete(PENDING_COOKIE);}
export async function getAccount(allowUnverified=false):Promise<CurrentUser|null>{
 const client=await sessionClient();
 if(!client)return null;
 try{
  const account=await client.account.get();
  if(!allowUnverified && !account.emailVerification)return null;
  return {id:account.$id,email:account.email};
 }catch{return null;}
}
export async function currentUser(){return getAccount(false);}
export async function readSession(){
 const user=await currentUser();
 return user?{...user,scope:"user" as const}:null;
}
export async function register(email:string,password:string){
 const account=adminClient().account;
 const created=await account.create({userId:ID.unique(),email,password});
 const session=await account.createEmailPasswordSession({email,password});
 await createSessionCookie(session.secret,session.expire);
 await savePending(email,"signup",created.$id);
 try{
  await userClient(session.secret).account.createEmailVerificationOTP();
  return "sent" as const;
 }catch{return "email-unavailable" as const;}
}
export async function signIn(email:string,password:string){
 const session=await adminClient().account.createEmailPasswordSession({email,password});
 await createSessionCookie(session.secret,session.expire);
 const user=await userClient(session.secret).account.get();
 if(!user.emailVerification){
  await savePending(user.email,"signup",user.$id);
  try{await userClient(session.secret).account.createEmailVerificationOTP();}catch{/* User can resend. */}
  return "verify" as const;
 }
 await clearPending();
 return "signed-in" as const;
}
export async function requestRecovery(email:string){
 const token=await adminClient().account.createRecoveryOTP({email});
 await savePending(email,"recovery",token.userId);
}
export async function resendCode(){
 const pending=await pendingVerification();
 if(!pending)return false;
 if(pending.purpose==="signup"){
  const client=await sessionClient();
  if(!client)return false;
  const user=await client.account.get();
  if(user.$id!==pending.userId||user.email.toLowerCase()!==pending.email||user.emailVerification)return false;
  await client.account.createEmailVerificationOTP();
  return true;
 }
 const token=await adminClient().account.createRecoveryOTP({email:pending.email});
 await savePending(pending.email,"recovery",token.userId);
 return true;
}
export async function finishVerification(code:string,password?:string){
 const pending=await pendingVerification();
 if(!pending||!/^\d{6}$/.test(code))return null;
 if(pending.purpose==="signup"){
  const client=await sessionClient();
  if(!client)return null;
  const user=await client.account.get();
  if(user.$id!==pending.userId||user.email.toLowerCase()!==pending.email)return null;
  await client.account.updateEmailVerificationOTP({userId:user.$id,secret:code});
  await clearPending();
  return "signup" as const;
 }
 if(!password||password.length<12||password.length>128)return null;
 await adminClient().account.updateRecoveryOTP({userId:pending.userId,secret:code,password});
 await clearPending();
 await removeSession();
 return "recovery" as const;
}
export async function changePassword(password:string,currentPassword:string){
 if(password.length<12||password.length>128||!currentPassword)return false;
 const client=await sessionClient();
 if(!client)return false;
 const user=await client.account.get();
 if(!user.emailVerification)return false;
 await client.account.updatePassword({password,oldPassword:currentPassword});
 return true;
}
export async function removeSession(){
 const client=await sessionClient();
 if(client){
  try{await client.account.deleteSession({sessionId:"current"});}catch{}
 }
 await dropSessionCookie();
}

function likeId(key:string,userId:string){
 return createHash("sha256").update(userId+"\0"+key).digest("hex").slice(0,36);
}
function appwriteCode(error:unknown){
 return typeof error==="object"&&error!==null&&"code" in error?Number((error as {code:unknown}).code):0;
}
export async function likeState(key:string,userId?:string){
 const {tables,databaseId,tableId}=likesClient();
 const result=await tables.listRows({
  databaseId,tableId,queries:[Query.equal("templateKey",key),Query.limit(1)],
 });
 let liked=false;
 if(userId){
  try{await tables.getRow({databaseId,tableId,rowId:likeId(key,userId)});liked=true;}
  catch(error){if(appwriteCode(error)!==404)throw error;}
 }
 return {key,count:result.total,revision:Date.now(),liked,signedIn:Boolean(userId)};
}
export async function toggleLike(key:string,userId:string,liked:boolean){
 const {tables,databaseId,tableId}=likesClient();
 const rowId=likeId(key,userId);
 if(liked){
  try{
   await tables.createRow({databaseId,tableId,rowId,data:{
    templateKey:key,userId,createdAt:Date.now(),
   }});
  }catch(error){if(appwriteCode(error)!==409)throw error;}
 }else{
  try{await tables.deleteRow({databaseId,tableId,rowId});}
  catch(error){if(appwriteCode(error)!==404)throw error;}
 }
 return likeState(key,userId);
}
export async function likedKeys(userId:string):Promise<string[]>{
 const {tables,databaseId,tableId}=likesClient();
 const keys:string[]=[];
 let cursor:string|undefined;
 // Appwrite caps listRows responses at 100, so page rather than using
 // an invalid 1000-item query.
 while(keys.length<1000){
  const queries=[Query.equal("userId",userId),Query.limit(100)];
  if(cursor)queries.push(Query.cursorAfter(cursor));
  const found=await tables.listRows({databaseId,tableId,queries});
  for(const row of found.rows){
   if(typeof row.templateKey==="string")keys.push(row.templateKey);
  }
  if(found.rows.length<100)break;
  cursor=found.rows[found.rows.length-1].$id;
 }
 return keys;
}
