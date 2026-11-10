import { ReframeLibrary } from "@/components/reframe-library";
import { imageCatalog } from "@/lib/image-catalog";
import type { ReframeItem } from "@/components/reframe-preview";

export default function ExplorePage(){
  const initialItems:ReframeItem[]=imageCatalog.slice(0,24).map(item=>({
    id:item.id,name:item.name,image:item.url,kind:"image",category:item.category,
    likeId:item.likeId,
    editorHref:"/create/"+encodeURIComponent(item.id)+
      (item.source==="indian"||item.source==="indianmemetemplates"?"?source=indian":""),
  }));
  return <ReframeLibrary kind="image" mode="explore" initialItems={initialItems} initialTotal={imageCatalog.length}/>;
}
