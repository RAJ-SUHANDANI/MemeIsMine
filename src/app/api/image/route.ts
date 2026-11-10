import { NextResponse } from "next/server";

const ALLOWED_HOSTS = new Set([
  "i.imgflip.com","imgflip.com","indianmemetemplates.com","www.indianmemetemplates.com",
]);
const MAX_IMAGE_BYTES=12*1024*1024;
const ALLOWED_TYPES=new Set(["image/jpeg","image/png","image/webp","image/gif","image/avif"]);
const noStore={"Cache-Control":"no-store","X-Content-Type-Options":"nosniff"};
function permittedImage(target:URL){
  const memegen=target.hostname==="api.memegen.link" &&
    /^\/images\/[a-z0-9-]+\.jpg$/.test(target.pathname) && !target.search;
  return target.protocol==="https:" && !target.port && !target.username && !target.password &&
    (memegen || ALLOWED_HOSTS.has(target.hostname));
}
export async function GET(request:Request){
  const raw=new URL(request.url).searchParams.get("url");
  if(!raw || raw.length>2048)return NextResponse.json({error:"Invalid image URL"},{status:400,headers:noStore});
  let url:URL;
  try{url=new URL(raw);}catch{return NextResponse.json({error:"Invalid image URL"},{status:400,headers:noStore});}
  if(!permittedImage(url))return NextResponse.json({error:"Image host not permitted"},{status:400,headers:noStore});
  try{
    // Never let a whitelisted URL redirect to an arbitrary private address.
    // Revalidate every redirect and permit at most two hops.
    let response:Response|null=null;
    for(let step=0;step<3;step++){
      response=await fetch(url.toString(),{
        redirect:"manual",signal:AbortSignal.timeout(10000),
        next:{revalidate:86400},
      });
      if(![301,302,303,307,308].includes(response.status))break;
      const location=response.headers.get("location");
      await response.body?.cancel();
      if(!location||step===2)throw Error("Redirect refused");
      const destination=new URL(location,url);
      if(!permittedImage(destination))throw Error("Untrusted redirect");
      url=destination;
    }
    if(!response?.ok||!response.body)
      return NextResponse.json({error:"Image unavailable"},{status:502,headers:noStore});
    const contentType=(response.headers.get("content-type")??"").split(";")[0].trim().toLowerCase();
    if(!ALLOWED_TYPES.has(contentType)){
      await response.body.cancel();
      return NextResponse.json({error:"Unsupported image type"},{status:415,headers:noStore});
    }
    const length=Number(response.headers.get("content-length")??"0");
    if(Number.isFinite(length)&&length>MAX_IMAGE_BYTES){
      await response.body.cancel();
      return NextResponse.json({error:"Image exceeds the size limit"},{status:413,headers:noStore});
    }
    let received=0;
    const limiter=new TransformStream<Uint8Array,Uint8Array>({
      transform(chunk,controller){
        received+=chunk.byteLength;
        if(received>MAX_IMAGE_BYTES)throw Error("Image exceeds the size limit");
        controller.enqueue(chunk);
      },
    });
    return new NextResponse(response.body.pipeThrough(limiter),{
      headers:{
        "Content-Type":contentType,
        "Cache-Control":"public, max-age=86400, s-maxage=604800",
        "X-Content-Type-Options":"nosniff",
      },
    });
  }catch{
    return NextResponse.json({error:"Image temporarily unavailable"},{status:502,headers:noStore});
  }
}
