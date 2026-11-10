import { NextResponse } from "next/server";
import { accountSession } from "@/lib/auth";
import { authConfig } from "@/lib/auth-config";
import { likeState } from "@/lib/mim-accounts";
import { canonicalReactionKey } from "@/lib/template-reactions";

export const runtime="nodejs";
export const dynamic="force-dynamic";
const headers={"Cache-Control":"private, no-store"};
export async function GET(request:Request) {
 const key=canonicalReactionKey(new URL(request.url).searchParams.get("key"));
 if(!key)return NextResponse.json({error:"Template not found"},{status:404,headers});
 if(!authConfig())return NextResponse.json({error:"Likes unavailable"},{status:503,headers});
 try{
  const user=(await accountSession())?.user;
  return NextResponse.json(await likeState(key,user?.id),{headers});
 }catch{return NextResponse.json({error:"Likes unavailable"},{status:503,headers});}
}
