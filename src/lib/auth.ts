import "server-only";
import { cache } from "react";
import { currentUser } from "./mim-accounts";

export const accountSession=cache(async()=>{
 const user=await currentUser();
 return user?{user}:null;
});
