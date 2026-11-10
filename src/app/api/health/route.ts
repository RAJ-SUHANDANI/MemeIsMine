import { NextResponse } from "next/server";
import { authConfig } from "@/lib/auth-config";
import { database } from "@/lib/local-db";

export const runtime="nodejs";
export const dynamic="force-dynamic";
export async function GET(){
 try{
  if(!authConfig())throw new Error("Not configured");
  database().prepare("SELECT 1").get();
  return NextResponse.json({ok:true},{headers:{"Cache-Control":"no-store"}});
 }catch{
  return NextResponse.json({ok:false},{status:503,headers:{"Cache-Control":"no-store"}});
 }
}
