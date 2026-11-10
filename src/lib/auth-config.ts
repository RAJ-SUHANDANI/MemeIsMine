/**
 * Appwrite Cloud Free replaces the self-hosted SQLite/SMTP infrastructure.
 * None of these settings should be user-entered; configure them in the host.
 */
export function authConfig(){
 const endpoint=process.env.APPWRITE_ENDPOINT?.trim();
 const projectId=process.env.APPWRITE_PROJECT_ID?.trim();
 const apiKey=process.env.APPWRITE_API_KEY?.trim();
 if(!endpoint||!projectId||!apiKey)return null;
 try{
  const url=new URL(endpoint);
  if(url.protocol!=="https:"||url.username||url.password||url.port||
     !url.hostname.endsWith(".cloud.appwrite.io")||url.pathname!=="/v1")return null;
  return {endpoint:url.toString().replace(/\/$/,""),projectId,apiKey};
 }catch{return null;}
}
export function likesConfig(){
 const config=authConfig();
 if(!config)return null;
 return { ...config,
  databaseId:process.env.APPWRITE_DATABASE_ID||"mim",
  collectionId:process.env.APPWRITE_LIKES_COLLECTION_ID||"template_likes",
 };
}
