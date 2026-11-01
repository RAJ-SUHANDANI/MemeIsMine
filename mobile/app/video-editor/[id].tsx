import { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { useEvent } from "expo";
import { Image } from "expo-image";
import { useVideoPlayer, VideoView } from "expo-video";
import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";
import * as MediaLibrary from "expo-media-library";
import { execute } from "munim-ffmpeg";
import { useLocalSearchParams, router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { ArrowLeft, Check, Clock3, Download, Save, Volume2, VolumeX } from "lucide-react-native";
import { getVideos, videoUri } from "../../src/lib/api";
import { colors, radius } from "../../src/theme";
import { getVideoDrafts, saveVideoDraft, type VideoDraft } from "../../src/lib/storage";
import type { VideoTemplate } from "../../src/types";

const sizes=[{label:"Square",ratio:1,width:1080,height:1080},{label:"Story",ratio:9/16,width:1080,height:1920},{label:"Landscape",ratio:16/9,width:1920,height:1080},{label:"Portrait",ratio:4/5,width:1080,height:1350}];
function assColour(hex:string){const value=hex.replace("#","");return "&H00"+value.slice(4,6)+value.slice(2,4)+value.slice(0,2);}
function assText(value:string){return value.replace(/\\/g,"\\\\").replace(/{/g,"\\{").replace(/}/g,"\\}").replace(/\r?\n/g,"\\N");}
function makeAss(width:number,height:number,fontSize:number,color:string,outline:boolean,top:string,bottom:string,duration:number){
 const end="0:00:"+String(duration).padStart(2,"0")+".00";
 return [
  "[Script Info]","ScriptType: v4.00+","PlayResX: "+width,"PlayResY: "+height,"WrapStyle: 2","ScaledBorderAndShadow: yes","",
  "[V4+ Styles]",
  "Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding",
  "Style: Main,Arial,"+fontSize+","+assColour(color)+",&H000000FF,&H00000000,&H64000000,1,0,0,0,100,100,0,0,1,"+(outline?4:0)+",2,2,60,60,80,1",
  "Style: Top,Arial,"+Math.round(fontSize*.78)+","+assColour(color)+",&H000000FF,&H00000000,&H64000000,1,0,0,0,100,100,0,0,1,"+(outline?4:0)+",2,8,60,60,80,1","",
  "[Events]","Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text",
  top.trim()?"Dialogue: 0,0:00:00.00,"+end+",Top,,0,0,0,,"+assText(top):"",
  bottom.trim()?"Dialogue: 0,0:00:00.00,"+end+",Main,,0,0,0,,"+assText(bottom):""
 ].join(String.fromCharCode(10));
}

export default function NativeVideoEditorScreen(){
 const {id,draft:draftId}=useLocalSearchParams<{id:string;draft?:string}>();
 const [template,setTemplate]=useState<VideoTemplate|null>(null);
 const [caption,setCaption]=useState("YOUR TEXT HERE");
 const [topCaption,setTopCaption]=useState("");
 const [fontSize,setFontSize]=useState(28);
 const [color,setColor]=useState("#FFFFFF");
 const [outline,setOutline]=useState(true);
 const [duration,setDuration]=useState(8);
 const [speed,setSpeed]=useState(1);
 const [ratio,setRatio]=useState(1);
 const [muted,setMuted]=useState(true);
 const [loading,setLoading]=useState(true);
 const [saving,setSaving]=useState(false);
 const [message,setMessage]=useState("");
 const [exporting,setExporting]=useState(false);
 const [progress,setProgress]=useState(0);
 const [outputUri,setOutputUri]=useState("");
 useEffect(()=>{
  let alive=true;const controller=new AbortController();
  void getVideos({limit:100,signal:controller.signal}).then(async data=>{
   if(!alive)return;
   const item=data.templates.find(x=>x.id===id);
   if(!item)throw new Error("This video template is no longer available.");
   setTemplate(item);
   if(draftId){const draft=(await getVideoDrafts()).find(x=>x.id===draftId);if(draft&&alive){setCaption(draft.caption);setTopCaption(draft.topCaption);setFontSize(draft.fontSize);setColor(draft.color);setOutline(draft.outline);setDuration(draft.duration);setSpeed(draft.speed);setRatio(draft.ratio);setMuted(draft.muted);}}
  }).catch(e=>{if(alive)setMessage(e instanceof Error?e.message:"Could not load this video.");}).finally(()=>{if(alive)setLoading(false)});
  return()=>{alive=false;controller.abort()};
 },[id,draftId]);
 const source=useMemo(()=>template?videoUri(template.url,template.sourcePage):null,[template]);
 const player=useVideoPlayer(template?.mediaType==="video"&&source?{uri:source}:null,p=>{p.loop=true;p.muted=muted;p.play()});
 const playing=useEvent(player,"playingChange",{isPlaying:player.playing})?.isPlaying ?? player.playing;
 useEffect(()=>{player.playbackRate=speed;player.muted=muted},[player,speed,muted]);
 function togglePlay(){if(playing)player.pause();else player.play()}
 function toggleMute(){const next=!muted;setMuted(next);player.muted=next}
 async function save(){
  if(!template)return;
  setSaving(true);
  try{const item:VideoDraft={id:draftId||`video-draft-${Date.now()}`,templateId:id,name:template.name,caption,topCaption,fontSize,color,outline,duration,speed,ratio,muted,updatedAt:new Date().toISOString()};await saveVideoDraft(item);setMessage("Video edit saved on this device.");}
  catch(e){setMessage(e instanceof Error?e.message:"Could not save video edit.");}
  finally{setSaving(false)}
 }
 async function exportVideo(){
  if(!template||!source||exporting)return;
  setExporting(true);setProgress(0);setOutputUri("");setMessage("Preparing your video…");
  let assUri="";
  try{
   const dimensions=sizes.find(item=>item.ratio===ratio)??sizes[0];
   const base=FileSystem.cacheDirectory??FileSystem.documentDirectory;
   if(!base)throw new Error("The app storage directory is unavailable.");
   const stamp=Date.now();
   assUri=base+"memeismine-"+stamp+".ass";
   const output=base+"memeismine-"+stamp+".mp4";
   const exportFontSize=Math.round(fontSize*dimensions.width/360);\n   const script=makeAss(dimensions.width,dimensions.height,exportFontSize,color,outline,topCaption,caption,duration);
   await FileSystem.writeAsStringAsync(assUri,script,{encoding:FileSystem.EncodingType.UTF8});
   const assPath=assUri.replace(/^file:\/\//,"");
   const filter="scale="+dimensions.width+":"+dimensions.height+":force_original_aspect_ratio=decrease,pad="+dimensions.width+":"+dimensions.height+":(ow-iw)/2:(oh-ih)/2,ass="+assPath+",setpts=PTS/"+speed;
   const result=await execute([
    "-y","-stream_loop","-1","-i",source,
    "-t",String(duration*speed),
    "-map","0:v:0","-map","0:a?",
    "-vf",filter,"-af","atempo="+speed,
    "-r","30","-c:v","libopenh264","-pix_fmt","yuv420p",
    "-c:a","aac","-b:a","128k","-movflags","+faststart",
    "-shortest",output
   ],log=>setMessage(log.slice(-180)),timeMs=>setProgress(Math.min(99,Math.round(timeMs/(duration*1000)*100))));
   if(!result.success||result.cancelled)throw new Error(result.failStackTrace||result.output||"Video encoding did not complete.");
   const info=await FileSystem.getInfoAsync(output);
   if(!info.exists||!("size" in info)||!info.size)throw new Error("The video encoder returned an empty file.");
   setOutputUri(output);setProgress(100);setMessage("Your edited MP4 is ready.");
  }catch(error){setMessage(error instanceof Error?error.message:"Could not render this video.");}
  finally{if(assUri)void FileSystem.deleteAsync(assUri,{idempotent:true}).catch(()=>undefined);setExporting(false);}
 }
 async function shareVideo(){
  if(!outputUri)return;
  if(await Sharing.isAvailableAsync())await Sharing.shareAsync(outputUri,{mimeType:"video/mp4",dialogTitle:"Share your MemeIsMine video"});
  else Alert.alert("Sharing unavailable","The share sheet is not available on this device.");
 }
 async function saveToPhotos(){
  if(!outputUri)return;
  const permission=await MediaLibrary.requestPermissionsAsync();
  if(!permission.granted){Alert.alert("Photo access needed","Allow photo access to save your exported video.");return;}
  await MediaLibrary.saveToLibraryAsync(outputUri);
  Alert.alert("Saved","Your edited MP4 is now in your photo library.");
 }
 return <SafeAreaView style={styles.safe} edges={["top"]}>
  <View style={styles.header}><Pressable onPress={()=>router.back()} style={styles.back}><ArrowLeft size={18} color={colors.ink}/></Pressable><View style={{flex:1}}><Text style={styles.kicker}>NATIVE MOTION STUDIO</Text><Text style={styles.headerTitle}>Edit your video.</Text></View><Pressable onPress={()=>void save()} style={styles.save}><Save size={14} color={colors.ink}/><Text style={styles.saveText}>Save</Text></Pressable></View>
  <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
   <Text style={styles.name}>{template?.name||"Loading template…"}</Text>
   <View style={[styles.preview,{aspectRatio:ratio}]}>
    {template?.mediaType==="video"?<VideoView player={player} style={StyleSheet.absoluteFill} contentFit="contain" nativeControls={false}/>:template?.mediaType==="gif"?<Image source={{uri:videoUri(template.url,template.sourcePage)}} style={StyleSheet.absoluteFill} contentFit="contain"/>:<Text style={styles.gifNote}>{loading?"Loading…":message}</Text>}
    <View pointerEvents="none" style={styles.overlay}>
     {!!topCaption&&<Text style={[styles.overlayText,{fontSize:fontSize*.75,color,textShadowColor:outline?"#000":"transparent"}]}>{topCaption}</Text>}
     <Text style={[styles.overlayText,{fontSize,color,textShadowColor:outline?"#000":"transparent"}]}>{caption||" "}</Text>
    </View>
   </View>
   <View style={styles.transport}><Pressable onPress={togglePlay} style={styles.transportButton}><Text style={styles.transportText}>{playing?"PAUSE":"PLAY"}</Text></Pressable><Pressable onPress={toggleMute} style={styles.transportButton}>{muted?<VolumeX size={15} color={colors.ink}/>:<Volume2 size={15} color={colors.ink}/>}<Text style={styles.transportText}>{muted?"MUTED":"SOUND ON"}</Text></Pressable><View style={styles.transportButton}><Clock3 size={14} color={colors.muted}/><Text style={styles.transportText}>{duration}s export length</Text></View></View>
   <Text style={styles.section}>CAPTION LAYERS</Text>
   <TextInput value={topCaption} onChangeText={setTopCaption} style={styles.input} placeholder="Optional top caption…" placeholderTextColor={colors.muted}/>
   <TextInput value={caption} onChangeText={setCaption} style={[styles.input,{minHeight:74,textAlignVertical:"top"}]} multiline placeholder="Main caption…" placeholderTextColor={colors.muted}/>
   <View style={styles.controlRow}><Text style={styles.label}>TEXT SIZE · {fontSize}px</Text><View style={styles.stepper}><Pressable onPress={()=>setFontSize(v=>Math.max(14,v-2))}><Text style={styles.stepText}>−</Text></Pressable><Pressable onPress={()=>setFontSize(v=>Math.min(52,v+2))}><Text style={styles.stepText}>＋</Text></Pressable></View></View>
   <View style={styles.controlRow}><Text style={styles.label}>TEXT COLOUR</Text><View style={{flexDirection:"row",gap:10}}>{["#FFFFFF","#F7D05A","#F04A36","#151515"].map(v=><Pressable key={v} onPress={()=>setColor(v)} style={[styles.swatch,{backgroundColor:v},color===v&&styles.selected]}/>)}</View></View>
   <Pressable style={styles.controlRow} onPress={()=>setOutline(v=>!v)}><Text style={styles.label}>BLACK OUTLINE</Text><Text style={styles.label}>{outline?"ON ✓":"OFF"}</Text></Pressable>
   <Text style={styles.section}>EXPORT SETTINGS</Text>
   <View style={styles.chips}>{[3,5,8,12,15].map(v=><Pressable key={v} onPress={()=>setDuration(v)} style={[styles.chip,duration===v&&styles.chipActive]}><Text style={[styles.chipText,duration===v&&styles.chipTextActive]}>{v}s</Text></Pressable>)}</View>
   <View style={styles.chips}>{[.5,.75,1,1.25,1.5,2].map(v=><Pressable key={v} onPress={()=>setSpeed(v)} style={[styles.chip,speed===v&&styles.chipActive]}><Text style={[styles.chipText,speed===v&&styles.chipTextActive]}>{v}×</Text></Pressable>)}</View>
   <View style={styles.chips}>{sizes.map(v=><Pressable key={v.label} onPress={()=>setRatio(v.ratio)} style={[styles.chip,ratio===v.ratio&&styles.chipActive]}><Text style={[styles.chipText,ratio===v.ratio&&styles.chipTextActive]}>{v.label}</Text></Pressable>)}</View>
   <Pressable onPress={()=>void save()} disabled={saving} style={styles.primary}><Check size={16} color={colors.surface}/><Text style={styles.primaryText}>{saving?"Saving…":"Save video project"}</Text></Pressable>
   <Pressable onPress={()=>void exportVideo()} disabled={exporting||!template} style={[styles.primary,(exporting||!template)&&{opacity:.55}]}><Download size={16} color={colors.surface}/><Text style={styles.primaryText}>{exporting?"Rendering MP4…":"Render edited MP4"}</Text></Pressable>{exporting&&<View style={styles.progressTrack}><View style={[styles.progressFill,{transform:[{scaleX:progress/100}]}]}/></View>}{!!outputUri&&<View style={styles.outputActions}><Pressable onPress={()=>void shareVideo()} style={styles.outputButton}><Download size={14} color={colors.ink}/><Text style={styles.outputText}>Share MP4</Text></Pressable><Pressable onPress={()=>void saveToPhotos()} style={styles.outputButton}><Check size={14} color={colors.ink}/><Text style={styles.outputText}>Save to Photos</Text></Pressable></View>}
   {!!message&&<Text style={styles.message}>{message}</Text>}
   <View style={styles.note}><Text style={styles.noteTitle}>ABOUT NATIVE VIDEO EXPORT</Text><Text style={styles.noteText}>The app renders your captions into the video with native FFmpeg, preserves the original audio when present, applies speed and aspect-ratio settings, and creates an MP4 on your device. A development or release build is required; Expo Go cannot load the native encoder.</Text></View>
  </ScrollView>
 </SafeAreaView>
}
const styles=StyleSheet.create({
 safe:{flex:1,backgroundColor:colors.paper},header:{height:60,paddingHorizontal:16,flexDirection:"row",alignItems:"center",gap:10,borderBottomWidth:1,borderColor:colors.line},
 back:{width:35,height:35,borderRadius:18,borderWidth:1,borderColor:colors.line,alignItems:"center",justifyContent:"center"},
 kicker:{fontSize:8,color:colors.red,fontWeight:"900",letterSpacing:1.2},headerTitle:{fontSize:14,color:colors.ink,fontWeight:"900",marginTop:2},
 save:{paddingHorizontal:12,paddingVertical:9,borderRadius:20,borderWidth:1,borderColor:colors.line,flexDirection:"row",alignItems:"center",gap:5},saveText:{fontSize:10,color:colors.ink,fontWeight:"900"},
 content:{padding:17,paddingBottom:40},name:{fontSize:21,color:colors.ink,fontWeight:"900",marginBottom:12},
 preview:{width:"100%",maxHeight:430,backgroundColor:"#1D1B18",borderRadius:radius.lg,overflow:"hidden",justifyContent:"center",alignItems:"center"},
 overlay:{...StyleSheet.absoluteFillObject,justifyContent:"space-between",alignItems:"center",padding:15},
 overlayText:{color:"#fff",fontWeight:"900",textAlign:"center",textTransform:"uppercase",textShadowOffset:{width:2,height:2},textShadowRadius:4},
 gifNote:{color:colors.surface,fontSize:11,padding:20,textAlign:"center"},
 transport:{flexDirection:"row",gap:7,justifyContent:"space-between",marginTop:10},
 transportButton:{minHeight:36,paddingHorizontal:10,borderRadius:18,backgroundColor:"#E8E1D7",flexDirection:"row",alignItems:"center",justifyContent:"center",gap:5},
 transportText:{fontSize:8,fontWeight:"900",color:colors.ink},
 section:{color:colors.red,fontSize:8,fontWeight:"900",letterSpacing:1.3,marginTop:22,marginBottom:10},
 input:{backgroundColor:colors.surface,borderWidth:1,borderColor:colors.line,borderRadius:radius.md,padding:12,color:colors.ink,fontSize:12,fontWeight:"700",marginBottom:8},
 controlRow:{minHeight:44,flexDirection:"row",alignItems:"center",justifyContent:"space-between",borderBottomWidth:1,borderColor:colors.line},
 label:{color:colors.muted,fontSize:9,fontWeight:"900",letterSpacing:.7},
 stepper:{flexDirection:"row",gap:12},stepText:{fontSize:18,color:colors.ink,fontWeight:"800"},
 swatch:{width:24,height:24,borderRadius:12,borderWidth:1,borderColor:colors.line},selected:{borderWidth:3,borderColor:colors.red},
 chips:{flexDirection:"row",flexWrap:"wrap",gap:7,marginBottom:9},
 chip:{paddingHorizontal:12,paddingVertical:8,borderRadius:18,borderWidth:1,borderColor:colors.line},
 chipActive:{backgroundColor:colors.ink,borderColor:colors.ink},chipText:{color:colors.muted,fontSize:9,fontWeight:"800"},chipTextActive:{color:colors.surface},
 primary:{height:48,backgroundColor:colors.red,borderRadius:24,flexDirection:"row",alignItems:"center",justifyContent:"center",gap:8,marginTop:12},
 primaryText:{color:colors.surface,fontSize:11,fontWeight:"900"},
 secondary:{height:43,borderRadius:22,borderWidth:1,borderColor:colors.line,flexDirection:"row",alignItems:"center",justifyContent:"center",gap:7,marginTop:8},
 secondaryText:{color:colors.ink,fontSize:10,fontWeight:"800"},
 progressTrack:{height:6,backgroundColor:"#E1D8CB",borderRadius:4,overflow:"hidden",marginTop:10},
 progressFill:{height:6,width:"100%",backgroundColor:colors.red,borderRadius:4},
 outputActions:{flexDirection:"row",gap:8,marginTop:10},
 outputButton:{flex:1,height:42,borderWidth:1,borderColor:colors.line,borderRadius:22,flexDirection:"row",alignItems:"center",justifyContent:"center",gap:6},
 outputText:{color:colors.ink,fontSize:10,fontWeight:"900"},
 message:{color:colors.green,fontSize:10,textAlign:"center",marginTop:10},
 note:{backgroundColor:"#E8E1D7",padding:13,borderRadius:radius.md,marginTop:18},
 noteTitle:{color:colors.red,fontSize:8,fontWeight:"900",letterSpacing:1},noteText:{color:colors.muted,fontSize:10,lineHeight:16,marginTop:6}
});
