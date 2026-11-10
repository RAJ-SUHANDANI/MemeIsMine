/** Central canonical origin for all metadata, sitemap and schema.
 * Configure NEXT_PUBLIC_SITE_URL with the HTTPS production domain before launch.
 */
export function siteOrigin() {
  const candidate=process.env.NEXT_PUBLIC_SITE_URL||"https://memeismine.vercel.app";
  try{
    const parsed=new URL(candidate);
    if(parsed.protocol!=="https:" && !(process.env.NODE_ENV!=="production" && parsed.hostname==="localhost"))
      throw new Error("Invalid canonical origin");
    return parsed.origin;
  }catch{
    return "https://memeismine.vercel.app";
  }
}
export function siteAbsolute(path="/"){
  return siteOrigin()+path;
}
/** Prevent malicious strings from ending HTML script tags. */
export function safeJsonLd(value:unknown){
  return JSON.stringify(value).replace(/</g,"\\u003c");
}
