import { useCallback, useState } from "react";
import { Alert, FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { Image } from "expo-image";
import { Bookmark, Clock3, FileImage, Film, Trash2, UserRound } from "lucide-react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, useFocusEffect } from "expo-router";
import { imageUri } from "../../src/lib/api";
import { getBookmarks, getDrafts, getVideoDrafts, removeDraft, removeVideoDraft, toggleBookmark, type VideoDraft } from "../../src/lib/storage";
import { colors, radius } from "../../src/theme";
import type { Draft } from "../../src/types";

type Mode = "drafts" | "video" | "saved";
export default function StudioScreen() {
 const [mode,setMode]=useState<Mode>("drafts");
 const [drafts,setDrafts]=useState<Draft[]>([]);
 const [videoDrafts,setVideoDrafts]=useState<VideoDraft[]>([]);
 const [saved,setSaved]=useState<string[]>([]);
 const [busy,setBusy]=useState(false);
 const refresh=useCallback(async()=>{setBusy(true);try{const[d,b,v]=await Promise.all([getDrafts(),getBookmarks(),getVideoDrafts()]);setDrafts(d);setSaved(b);setVideoDrafts(v)}finally{setBusy(false)}},[]);
 useFocusEffect(useCallback(()=>{void refresh()},[refresh]));
 async function deleteImage(id:string){Alert.alert("Remove this draft?","This only removes the local copy from this device.",[{text:"Keep it",style:"cancel"},{text:"Remove",style:"destructive",onPress:async()=>setDrafts(await removeDraft(id))}])}
 async function deleteVideo(id:string){Alert.alert("Remove video project?","This removes its saved edit settings from this device.",[{text:"Keep it",style:"cancel"},{text:"Remove",style:"destructive",onPress:async()=>setVideoDrafts(await removeVideoDraft(id))}])}
 async function unsave(id:string){setSaved(await toggleBookmark(id))}
 function openSaved(id:string){const video=id.startsWith("video:");const templateId=video?id.slice(6):id;router.push(video?{pathname:"/video/[id]",params:{id:templateId}}:{pathname:"/editor/[id]",params:{id:templateId}})}
 const data:Draft[]=mode==="drafts"?drafts:mode==="video"?videoDrafts.map(item=>({id:item.id,templateId:item.templateId,name:item.name,imageUrl:"",topText:item.caption,bottomText:item.topCaption,updatedAt:item.updatedAt})):saved.map(id=>({id,templateId:id.replace(/^video:/,""),name:id.replace(/^video:/,"").replace(/-/g," "),imageUrl:"",topText:"",bottomText:"",updatedAt:""}));
 return <SafeAreaView style={styles.safe} edges={["top"]}>
  <View style={styles.header}><Pressable onPress={()=>router.push("/(tabs)/profile")} style={styles.profile}><UserRound size={16} color={colors.ink}/></Pressable><Text style={styles.kicker}>YOUR CORNER OF THE INTERNET</Text><Text style={styles.title}>The{"\n"}<Text style={styles.italic}>studio.</Text></Text><Text style={styles.copy}>Your unfinished punchlines and saved favourites.</Text></View>
  <View style={styles.tabs}>
   <Pressable onPress={()=>setMode("drafts")} style={[styles.tab,mode==="drafts"&&styles.active]}><FileImage size={13} color={mode==="drafts"?colors.surface:colors.muted}/><Text style={[styles.tabText,mode==="drafts"&&styles.activeText]}>Image · {drafts.length}</Text></Pressable>
   <Pressable onPress={()=>setMode("video")} style={[styles.tab,mode==="video"&&styles.active]}><Film size={13} color={mode==="video"?colors.surface:colors.muted}/><Text style={[styles.tabText,mode==="video"&&styles.activeText]}>Video · {videoDrafts.length}</Text></Pressable>
   <Pressable onPress={()=>setMode("saved")} style={[styles.tab,mode==="saved"&&styles.active]}><Bookmark size={13} color={mode==="saved"?colors.surface:colors.muted}/><Text style={[styles.tabText,mode==="saved"&&styles.activeText]}>Saved · {saved.length}</Text></Pressable>
  </View>
  <FlatList data={data} keyExtractor={item=>item.id} contentContainerStyle={styles.list} showsVerticalScrollIndicator={false} refreshing={busy} onRefresh={refresh}
   renderItem={({item})=><View style={styles.item}>
    <View style={styles.thumb}>{item.imageUrl?<Image source={{uri:imageUri(item.imageUrl)}} style={StyleSheet.absoluteFill} contentFit="cover"/>:<View style={styles.blank}>{mode==="video"?<Film size={19} color={colors.red}/>:<Bookmark size={19} color={colors.red}/>}</View>}</View>
    <View style={styles.details}><Text numberOfLines={2} style={styles.name}>{item.name}</Text><View style={styles.time}><Clock3 size={11} color={colors.muted}/><Text style={styles.date}>{item.updatedAt?new Date(item.updatedAt).toLocaleDateString():"Template saved"}</Text></View><Pressable onPress={()=>mode==="drafts"?router.push({pathname:"/editor/[id]",params:{id:item.templateId,draft:item.id}}):mode==="video"?router.push({pathname:"/video-editor/[id]",params:{id:item.templateId,draft:item.id}}):openSaved(item.id)}><Text style={styles.open}>{mode==="drafts"?"CONTINUE EDITING ↗":mode==="video"?"CONTINUE VIDEO EDIT ↗":"OPEN TEMPLATE ↗"}</Text></Pressable></View>
    <Pressable hitSlop={10} onPress={()=>mode==="drafts"?void deleteImage(item.id):mode==="video"?void deleteVideo(item.id):void unsave(item.id)} style={styles.remove}>{mode==="saved"?<Bookmark size={16} fill={colors.red} color={colors.red}/>:<Trash2 size={16} color={colors.muted}/>}</Pressable>
   </View>}
   ListEmptyComponent={<View style={styles.empty}><Text style={styles.emptyTitle}>{mode==="drafts"?"A blank page, for now.":mode==="video"?"No motion projects yet.":"Nothing pinned yet."}</Text><Text style={styles.copy}>{mode==="drafts"?"Start with a template and save a work in progress here.":mode==="video"?"Edit a video template and save your project here.":"Tap the bookmark on any template to keep it close."}</Text></View>}
  />
 </SafeAreaView>
}
const styles=StyleSheet.create({
 safe:{flex:1,backgroundColor:colors.paper},header:{paddingHorizontal:22,paddingTop:20,paddingBottom:24},
 profile:{position:"absolute",right:20,top:18,zIndex:2,width:34,height:34,borderRadius:17,borderWidth:1,borderColor:colors.line,alignItems:"center",justifyContent:"center"},
 kicker:{color:colors.red,fontSize:9,fontWeight:"900",letterSpacing:1.6},title:{color:colors.ink,fontSize:43,lineHeight:45,fontWeight:"900",letterSpacing:-2,marginTop:9},
 italic:{fontFamily:"Georgia",fontStyle:"italic",color:colors.red,fontWeight:"400"},copy:{color:colors.muted,fontSize:12,lineHeight:18,marginTop:8,maxWidth:270},
 tabs:{flexDirection:"row",marginHorizontal:16,backgroundColor:"#E8E1D7",padding:4,borderRadius:radius.md,gap:3},
 tab:{flex:1,borderRadius:11,paddingVertical:11,justifyContent:"center",alignItems:"center",flexDirection:"row",gap:5},
 active:{backgroundColor:colors.ink},tabText:{color:colors.muted,fontSize:9,fontWeight:"800"},activeText:{color:colors.surface},
 list:{padding:18,gap:12,flexGrow:1},item:{padding:10,borderRadius:radius.md,borderWidth:1,borderColor:colors.line,backgroundColor:colors.surface,flexDirection:"row",alignItems:"center",gap:12},
 thumb:{width:76,height:76,backgroundColor:"#E8E0D4",borderRadius:11,overflow:"hidden"},blank:{flex:1,alignItems:"center",justifyContent:"center"},
 details:{flex:1,gap:6},name:{color:colors.ink,fontSize:13,fontWeight:"800"},time:{flexDirection:"row",alignItems:"center",gap:5},date:{color:colors.muted,fontSize:9},
 open:{color:colors.red,fontSize:9,fontWeight:"900",letterSpacing:.6},remove:{padding:7},
 empty:{alignItems:"center",paddingTop:70,paddingHorizontal:22},emptyTitle:{color:colors.ink,fontSize:19,fontWeight:"900"}
});