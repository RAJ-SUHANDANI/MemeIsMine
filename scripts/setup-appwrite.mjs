#!/usr/bin/env node
/**
 * Idempotent Appwrite TablesDB initialization for Meme Is Mine.
 * Expects a server-only key with databases.write and tables.write scopes.
 */
import {Client,TablesDB} from "node-appwrite";
const endpoint=process.env.APPWRITE_ENDPOINT;
const projectId=process.env.APPWRITE_PROJECT_ID;
const apiKey=process.env.APPWRITE_API_KEY;
const databaseId=process.env.APPWRITE_DATABASE_ID||"mim";
const tableId=process.env.APPWRITE_LIKES_COLLECTION_ID||"template_likes";
if(!endpoint||!projectId||!apiKey){
 console.error("Set APPWRITE_ENDPOINT, APPWRITE_PROJECT_ID and APPWRITE_API_KEY.");
 process.exit(1);
}
const client=new Client().setEndpoint(endpoint).setProject(projectId).setKey(apiKey);
const tables=new TablesDB(client);
async function ensure(label,call){
 try{await call();console.log("CREATED "+label);}
 catch(error){if(error?.code===409){console.log("EXISTS "+label);return;}throw error;}
}
try{
 await ensure("database "+databaseId,()=>tables.create({databaseId,name:"Meme Is Mine"}));
 await ensure("table "+tableId,()=>tables.createTable({
  databaseId,tableId,name:"Template Likes",permissions:[],rowSecurity:false,
  columns:[
   {key:"templateKey",type:"varchar",size:255,required:true},
   {key:"userId",type:"varchar",size:64,required:true},
   {key:"createdAt",type:"bigint",required:true},
  ],
  indexes:[
   {key:"likes_by_template",type:"key",attributes:["templateKey"]},
   {key:"likes_by_user",type:"key",attributes:["userId"]},
  ],
 }));
 console.log("Private indexed Appwrite likes table is ready.");
}catch(error){
 console.error("Appwrite setup failed:",error instanceof Error?error.message:"unknown");
 process.exitCode=1;
}
