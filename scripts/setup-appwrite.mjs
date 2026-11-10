#!/usr/bin/env node
/**
 * One-time Appwrite Cloud Free setup.
 *
 * Requires APPWRITE_ENDPOINT, APPWRITE_PROJECT_ID and APPWRITE_API_KEY
 * with documentsdb.read and documentsdb.write scopes.
 * Creates one database and one private, schemaless likes collection.
 *
 * Idempotent: an existing database or collection is preserved.
 */
import { Client, DocumentsDB } from "node-appwrite";

const endpoint=process.env.APPWRITE_ENDPOINT;
const projectId=process.env.APPWRITE_PROJECT_ID;
const apiKey=process.env.APPWRITE_API_KEY;
const databaseId=process.env.APPWRITE_DATABASE_ID||"mim";
const collectionId=process.env.APPWRITE_LIKES_COLLECTION_ID||"template_likes";
if(!endpoint||!projectId||!apiKey){
 console.error("Set APPWRITE_ENDPOINT, APPWRITE_PROJECT_ID and APPWRITE_API_KEY first.");
 process.exit(1);
}
const client=new Client().setEndpoint(endpoint).setProject(projectId).setKey(apiKey);
const documents=new DocumentsDB(client);
async function ensure(label,action){
 try{await action();console.log("CREATED "+label);}
 catch(error){
  if(error?.code===409){console.log("EXISTS "+label);return;}
  throw error;
 }
}
try{
 await ensure("database "+databaseId,()=>documents.createDatabase({
  databaseId,name:"Meme Is Mine",enabled:true,
 }));
 await ensure("private likes collection "+collectionId,()=>documents.createCollection({
  databaseId,collectionId,name:"Template likes",
  permissions:[],documentSecurity:false,enabled:true,
 }));
 console.log("Appwrite database setup complete. Account emails use Appwrite's default email sender.");
}catch(error){
 console.error("Appwrite setup failed:",error instanceof Error?error.message:"unknown error");
 process.exitCode=1;
}
