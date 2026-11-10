import "server-only";
import { Account, Client, DocumentsDB } from "node-appwrite";
import { cookies } from "next/headers";
import { authConfig, likesConfig } from "./auth-config";

export const SESSION_COOKIE="mim_session";

function appwriteClient(){
 const cfg=authConfig();
 if(!cfg)throw Error("Appwrite has not been configured");
 return new Client().setEndpoint(cfg.endpoint).setProject(cfg.projectId);
}
export function adminClient(){
 const cfg=authConfig();
 if(!cfg)throw Error("Appwrite has not been configured");
 const client=appwriteClient().setKey(cfg.apiKey);
 return {account:new Account(client),client};
}
export function userClient(secret:string){
 const client=appwriteClient().setSession(secret);
 return {account:new Account(client),client};
}
export async function sessionClient(){
 const secret=(await cookies()).get(SESSION_COOKIE)?.value;
 if(!secret||!authConfig())return null;
 return userClient(secret);
}
export async function createSessionCookie(secret:string,expires:string){
 if(!secret||secret.length<16)throw Error("Appwrite did not return a usable session");
 const expiry=new Date(expires);
 (await cookies()).set(SESSION_COOKIE,secret,{
  httpOnly:true,secure:process.env.NODE_ENV==="production",sameSite:"lax",
  path:"/",expires:Number.isFinite(expiry.getTime())?expiry:undefined,
 });
}
export async function dropSessionCookie(){
 (await cookies()).delete(SESSION_COOKIE);
}
export function likesClient(){
 const config=likesConfig();
 if(!config)throw Error("Appwrite likes are not configured");
 const client=appwriteClient().setKey(config.apiKey);
 return {documents:new DocumentsDB(client),databaseId:config.databaseId,collectionId:config.collectionId};
}
