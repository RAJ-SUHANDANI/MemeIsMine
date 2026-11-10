import { NextResponse } from "next/server";
import { authConfig } from "@/lib/auth-config";
export const runtime="nodejs";
export const dynamic="force-dynamic";
export function GET(){
 const ready=Boolean(authConfig());
 return NextResponse.json({ok:ready,provider:"hosted"},{
  status:ready?200:503,headers:{"Cache-Control":"no-store"},
 });
}
