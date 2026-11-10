import { ReframeLibrary } from "@/components/reframe-library";
import { videoCatalog } from "@/lib/video-catalog";
import type { ReframeItem } from "@/components/reframe-preview";

export default function VideoTemplatesPage(){
  const initialItems:ReframeItem[]=videoCatalog.slice(0,24).map(item=>({
    id:item.id,name:item.name,image:item.posterUrl??"",kind:"video",category:item.category??"Moving image",
    likeId:item.likeId,mediaUrl:item.url,mediaType:item.mediaType,sourceHref:item.originalUrl,
    editorHref:"/video-editor/"+encodeURIComponent(item.id),
  }));
  return <ReframeLibrary kind="video" initialItems={initialItems} initialTotal={videoCatalog.length}/>;
}
