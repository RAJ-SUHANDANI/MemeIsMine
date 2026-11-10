"use server";
import { accountSession } from "@/lib/auth";
import { authConfig } from "@/lib/auth-config";
import { toggleLike } from "@/lib/mim-accounts";
import { canonicalReactionKey } from "@/lib/template-reactions";
import type { LikeState } from "@/components/use-template-likes";

export async function setTemplateLike(key:string,liked:boolean):Promise<LikeState|null> {
 const canonical=canonicalReactionKey(key);
 if(!canonical||typeof liked!=="boolean"||!authConfig())return null;
 const session=await accountSession();
 if(!session)return null;
 try{return await toggleLike(canonical,session.user.id,liked);}
 catch(error){console.error("Like update failed:",error instanceof Error?error.message:"unknown");return null;}
}
