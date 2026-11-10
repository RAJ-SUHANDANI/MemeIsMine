import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import path from "node:path";
import {createRequire} from "node:module";
import ts from "typescript";

const fallbackRequire=createRequire(import.meta.url);
process.env.APPWRITE_ENDPOINT="https://fra.cloud.appwrite.io/v1";
process.env.APPWRITE_PROJECT_ID="contract-test";
process.env.APPWRITE_API_KEY="local-test-key-not-a-live-secret";
const jar=new Map();
const users=new Map();
const sessions=new Map();
const likes=new Map();
let nextUser=0;
let nextSession=0;
const pendingCodes=new Map();
const tokenCode="123456";
function exception(code){const error=new Error("Stub Appwrite error");error.code=code;return error;}
function userAccount(sessionSecret){
 function current(){
  const id=sessions.get(sessionSecret);
  const record=[...users.values()].find(u=>u.id===id);
  if(!record)throw exception(401);
  return record;
 }
 return {
  get:async()=>{const u=current();return {$id:u.id,email:u.email,emailVerification:u.verified};},
  createEmailVerificationOTP:async()=>{const u=current();pendingCodes.set(u.id,tokenCode);return {userId:u.id};},
  updateEmailVerificationOTP:async({userId,secret})=>{
   const u=current();
   if(u.id!==userId||pendingCodes.get(userId)!==secret)throw exception(401);
   u.verified=true;pendingCodes.delete(userId);return {};
  },
  updatePassword:async({password,oldPassword})=>{
   const u=current();if(u.password!==oldPassword)throw exception(401);u.password=password;return {};
  },
  deleteSession:async()=>{sessions.delete(sessionSecret);return {};}
 };
}
const adminAccount={
 create:async({userId,email,password})=>{
  if(users.has(email))throw exception(409);
  users.set(email,{id:userId,email,password,verified:false});return {$id:userId};
 },
 createEmailPasswordSession:async({email,password})=>{
  const user=users.get(email);
  if(!user||user.password!==password)throw exception(401);
  const secret="mock-appwrite-session-secret-"+(++nextSession);
  sessions.set(secret,user.id);
  return {secret,expire:new Date(Date.now()+86400000).toISOString()};
 },
 createRecoveryOTP:async({email})=>{
  const user=users.get(email);
  if(user)pendingCodes.set(user.id,tokenCode);
  return {userId:user?.id??"nonexistent-id"};
 },
 updateRecoveryOTP:async({userId,secret,password})=>{
  const user=[...users.values()].find(u=>u.id===userId);
  if(!user||pendingCodes.get(userId)!==secret)throw exception(401);
  user.password=password;pendingCodes.delete(userId);return {};
 },
};
const mockedAppwrite={
 adminClient:()=>({account:adminAccount}),
 userClient:(secret)=>({account:userAccount(secret)}),
 sessionClient:async()=>{const secret=jar.get("mim_session");return secret?{account:userAccount(secret)}:null;},
 createSessionCookie:async(secret)=>{jar.set("mim_session",secret);},
 dropSessionCookie:async()=>{jar.delete("mim_session");},
 likesClient:()=>({databaseId:"mim",collectionId:"template_likes",documents:{
  listDocuments:async({queries})=>{
   const filters=queries.filter(q=>q.type==="equal");
   const selected=[...likes.values()].filter(doc=>filters.every(q=>doc[q.column]===q.value));
   return {total:selected.length,documents:selected.slice(0,1000)};
  },
  createDocument:async({documentId,data})=>{
   if(likes.has(documentId))throw exception(409);
   likes.set(documentId,{$id:documentId,...data});return likes.get(documentId);
  },
  getDocument:async({documentId})=>{if(!likes.has(documentId))throw exception(404);return likes.get(documentId);},
  deleteDocument:async({documentId})=>{if(!likes.has(documentId))throw exception(404);likes.delete(documentId);return {};},
 }}),
};
const appwriteModule={
 ID:{unique:()=> "user-"+(++nextUser)},
 Query:{equal:(column,value)=>({type:"equal",column,value}),limit:value=>({type:"limit",value})},
};
const cache=new Map();
function load(name){
 const location=path.join(process.cwd(),"src/lib",name);
 if(cache.has(location))return cache.get(location).exports;
 const loadedModule={exports:{}};
 cache.set(location,loadedModule);
 const source=readFileSync(location,"utf8");
 const javascript=ts.transpileModule(source,{compilerOptions:{
  module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true,
 }}).outputText;
 const require=(path)=>{
  if(path==="server-only")return {};
  if(path==="node-appwrite")return appwriteModule;
  if(path==="next/headers")return {cookies:async()=>({
   get:key=>jar.has(key)?{value:jar.get(key)}:undefined,
   set:(key,value)=>jar.set(key,value),
   delete:key=>jar.delete(key),
  })};
  if(path==="./appwrite")return mockedAppwrite;
  if(path.startsWith("./"))return load(path.slice(2)+".ts");
  return fallbackRequire(path);
 };
 new Function("require","module","exports","process","Buffer",javascript)(require,loadedModule,loadedModule.exports,process,Buffer);
 return loadedModule.exports;
}
try{
 const accounts=load("mim-accounts.ts");
 const email="test@example.invalid";
 const password="unique-signup-password-2026";
 assert.equal(accounts.normalizedEmail(" TEST@EXAMPLE.INVALID "),email);
 assert.equal(await accounts.register(email,password),"sent");
 assert.equal(await accounts.currentUser(),null,"new account must not access Studio before email verification");
 assert.deepEqual(await accounts.pendingVerification(),{email,purpose:"signup",userId:"user-1"});
 const pending=jar.get("mim_verify");
 const bad=pending.slice(0,-1)+(pending.endsWith("f")?"a":"f");
 jar.set("mim_verify",bad);
 assert.equal(await accounts.pendingVerification(),null,"tampered OTP state must be rejected");
 jar.set("mim_verify",pending);
 assert.equal(await accounts.finishVerification("111111"),null,"invalid code must fail");
 assert.equal(await accounts.finishVerification(tokenCode),"signup");
 const user=await accounts.currentUser();
 assert.equal(user?.email,email,"correct OTP verifies the account");
 assert.equal(await accounts.signIn(email,password),"signed-in");
 assert.equal((await accounts.likeState("image:drake",user.id)).liked,false);
 assert.equal((await accounts.toggleLike("image:drake",user.id,true)).count,1);
 assert.equal((await accounts.toggleLike("image:drake",user.id,true)).count,1,"like must be idempotent");
 assert.deepEqual(await accounts.likedKeys(user.id),["image:drake"]);
 assert.equal((await accounts.toggleLike("image:drake",user.id,false)).count,0);
 await accounts.removeSession();
 assert.equal(await accounts.currentUser(),null);
 await accounts.requestRecovery(email);
 assert.equal((await accounts.pendingVerification())?.purpose,"recovery");
 assert.equal(await accounts.finishVerification(tokenCode,"better-unique-password-2026"),"recovery");
 assert.equal(await accounts.currentUser(),null,"recovery must not silently create a login");
 assert.equal(await accounts.signIn(email,"better-unique-password-2026"),"signed-in");
 console.log("PASS mocked Appwrite signup, six-digit OTP, signed state, sessions, recovery and private likes");
}catch(error){
 console.error("Appwrite contract test failed:",error);
 process.exitCode=1;
}
