import { useEffect, useRef, useState } from "react";
import { Alert, FlatList, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import * as Sharing from "expo-sharing";
import * as MediaLibrary from "expo-media-library";
import ViewShot from "react-native-view-shot";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Download, PackagePlus, Plus, Share2, Sticker, Trash2 } from "lucide-react-native";
import { colors, radius } from "../../src/theme";
import { getVaultStickers, removeVaultSticker, saveVaultSticker, type VaultSticker } from "../../src/lib/storage";

const moods=["😂 LOL","😭 CRYING","😎 COOL","🤡 CHAOS","❤️ LOVE","😤 MOOD"];
export default function MemeVaultScreen() {
  const [stickers,setStickers]=useState<VaultSticker[]>([]);
  const [uri,setUri]=useState("");
  const [name,setName]=useState("");
  const [mood,setMood]=useState(moods[0]);
  const [shape,setShape]=useState<"circle"|"rounded">("circle");
  const [busy,setBusy]=useState(false);
  const shot=useRef<ViewShot>(null);
  useEffect(()=>{void getVaultStickers().then(setStickers)},[]);
  async function choose(){
    const permission=await ImagePicker.requestMediaLibraryPermissionsAsync();
    if(!permission.granted){Alert.alert("Photo access needed","Allow access to build your own reaction stickers.");return;}
    const result=await ImagePicker.launchImageLibraryAsync({mediaTypes:["images"],quality:1});
    if(!result.canceled&&result.assets[0]){setUri(result.assets[0].uri);setName(result.assets[0].fileName?.replace(/\.[^.]+$/,"")||"My reaction");}
  }
  async function create(){
    if(!uri||!shot.current)return;
    setBusy(true);
    try{
      const png=await shot.current.capture?.();
      if(!png)throw new Error("Could not render transparent sticker.");
      const item:VaultSticker={id:`sticker-${Date.now()}`,name:name.trim()||"My reaction",uri:png,mood,createdAt:new Date().toISOString()};
      setStickers(await saveVaultSticker(item));setUri("");setName("");
      Alert.alert("Added to your vault","Your transparent PNG reaction sticker is ready.");
    }catch(error){Alert.alert("Sticker couldn't be created",error instanceof Error?error.message:"Try again.");}
    finally{setBusy(false);}
  }
  async function share(item:VaultSticker){
    const available=await Sharing.isAvailableAsync();
    if(available)await Sharing.shareAsync(item.uri,{mimeType:"image/png",dialogTitle:`Share ${item.name}`});
    else Alert.alert("Sharing unavailable","Sharing isn't available on this device.");
  }
  async function download(item:VaultSticker){
    const permission=await MediaLibrary.requestPermissionsAsync();
    if(!permission.granted){Alert.alert("Photo access needed","Allow photo access to save stickers.");return;}
    await MediaLibrary.saveToLibraryAsync(item.uri);
    Alert.alert("Saved","Sticker saved to your photo library.");
  }
  async function remove(id:string){setStickers(await removeVaultSticker(id));}
  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}><View><Text style={styles.kicker}>APP ORIGINAL · PERSONAL REACTIONS</Text><Text style={styles.title}>Meme<Text style={styles.italic}>Vault.</Text></Text></View><View style={styles.icon}><Sticker color={colors.orange} size={24}/></View></View>
        <Text style={styles.intro}>Turn your camera-roll moments into a reaction pack that's unmistakably yours.</Text>
        <View style={styles.creator}>
          <View style={styles.creatorHead}><PackagePlus color={colors.red} size={17}/><Text style={styles.section}>STICKER WORKSHOP</Text></View>
          <Pressable onPress={choose} style={styles.choose}>
            {uri?<Image source={{uri}} style={StyleSheet.absoluteFill} contentFit="contain"/>:<><Plus color={colors.red} size={22}/><Text style={styles.chooseText}>Choose a photo</Text><Text style={styles.muted}>Use a face, pet, object or meme</Text></>}
          </Pressable>
          {!!uri&&<>
            <ViewShot ref={shot} options={{format:"png",quality:1,result:"tmpfile"}} style={styles.stickerStage}>
              <View style={[styles.stickerShape,shape==="circle"?styles.circle:styles.rounded]}>
                <Image source={{uri}} style={StyleSheet.absoluteFill} contentFit="cover"/>
                <View style={styles.stickerShade}><Text style={styles.stickerMood}>{mood}</Text></View>
              </View>
            </ViewShot>
            <TextInput value={name} onChangeText={setName} style={styles.input} placeholder="Name this reaction…" placeholderTextColor={colors.muted}/>
            <Text style={styles.fieldLabel}>REACTION MOOD</Text>
            <View style={styles.moods}>{moods.map(value=><Pressable key={value} onPress={()=>setMood(value)} style={[styles.mood,mood===value&&styles.moodActive]}><Text style={[styles.moodText,mood===value&&styles.moodTextActive]}>{value}</Text></Pressable>)}</View>
            <Text style={styles.fieldLabel}>STICKER CUT</Text>
            <View style={styles.moods}><Pressable onPress={()=>setShape("circle")} style={[styles.mood,shape==="circle"&&styles.moodActive]}><Text style={[styles.moodText,shape==="circle"&&styles.moodTextActive]}>Circle</Text></Pressable><Pressable onPress={()=>setShape("rounded")} style={[styles.mood,shape==="rounded"&&styles.moodActive]}><Text style={[styles.moodText,shape==="rounded"&&styles.moodTextActive]}>Rounded</Text></Pressable></View>
            <Pressable onPress={()=>void create()} disabled={busy} style={[styles.create,busy&&{opacity:.5}]}><Sticker size={16} color={colors.surface}/><Text style={styles.createText}>{busy?"Creating…":"Add to my vault"}</Text></Pressable>
          </>}
        </View>
        <View style={styles.libraryHead}><View><Text style={styles.kicker}>YOUR PERSONAL COLLECTION</Text><Text style={styles.libraryTitle}>Reaction packs</Text></View><Text style={styles.count}>{stickers.length} STICKERS</Text></View>
        {stickers.length===0?<View style={styles.empty}><Sticker color={colors.muted} size={27}/><Text style={styles.emptyTitle}>Your vault is waiting.</Text><Text style={styles.muted}>Create a sticker above to start your personal reaction pack.</Text></View>:<View style={styles.grid}>{stickers.map(item=><View key={item.id} style={styles.card}><View style={styles.thumb}><Image source={{uri:item.uri}} style={StyleSheet.absoluteFill} contentFit="contain"/></View><Text numberOfLines={1} style={styles.cardName}>{item.name}</Text><Text style={styles.cardMood}>{item.mood}</Text><View style={styles.actions}><Pressable onPress={()=>void share(item)} style={styles.action}><Share2 size={14} color={colors.ink}/></Pressable><Pressable onPress={()=>void download(item)} style={styles.action}><Download size={14} color={colors.ink}/></Pressable><Pressable onPress={()=>void remove(item.id)} style={styles.action}><Trash2 size={14} color={colors.red}/></Pressable></View></View>)}</View>}
        <View style={styles.note}><Text style={styles.noteTitle}>MADE TO TRAVEL</Text><Text style={styles.noteText}>Stickers are rendered as transparent PNGs and saved locally. Share individual stickers through any compatible app. Full ZIP pack export and direct keyboard integration are future upgrades.</Text></View>
        <Pressable onPress={()=>router.push("/(tabs)/studio")} style={styles.back}><Text style={styles.backText}>Back to your studio ↗</Text></Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}
const styles=StyleSheet.create({
 safe:{flex:1,backgroundColor:colors.paper},content:{padding:19,paddingBottom:40},
 header:{flexDirection:"row",alignItems:"center",justifyContent:"space-between",marginTop:10},
 kicker:{color:colors.red,fontSize:8,fontWeight:"900",letterSpacing:1.4},
 title:{color:colors.ink,fontSize:36,fontWeight:"900",letterSpacing:-1.5,marginTop:5},
 italic:{fontFamily:"Georgia",fontStyle:"italic",fontWeight:"400",color:colors.red},
 icon:{width:53,height:53,borderRadius:18,backgroundColor:colors.ink,alignItems:"center",justifyContent:"center"},
 intro:{color:colors.muted,fontSize:12,lineHeight:18,marginTop:10,marginBottom:18},
 creator:{backgroundColor:colors.surface,borderRadius:radius.lg,borderWidth:1,borderColor:colors.line,padding:14},
 creatorHead:{flexDirection:"row",alignItems:"center",gap:8,marginBottom:13},
 section:{color:colors.ink,fontSize:9,fontWeight:"900",letterSpacing:1.2},
 choose:{height:135,borderWidth:1,borderStyle:"dashed",borderColor:colors.line,borderRadius:radius.md,alignItems:"center",justifyContent:"center",overflow:"hidden",gap:6},
 chooseText:{color:colors.ink,fontSize:12,fontWeight:"900"},
 muted:{color:colors.muted,fontSize:9,lineHeight:14},
 stickerStage:{width:"100%",height:220,alignItems:"center",justifyContent:"center",backgroundColor:"transparent",marginTop:8},
 stickerShape:{width:190,height:190,overflow:"hidden",backgroundColor:"transparent",justifyContent:"flex-end"},
 circle:{borderRadius:95},rounded:{borderRadius:32},
 stickerShade:{backgroundColor:"rgba(0,0,0,.48)",padding:8},
 stickerMood:{color:"#fff",fontSize:17,fontWeight:"900",textAlign:"center"},
 input:{borderWidth:1,borderColor:colors.line,borderRadius:radius.md,padding:11,color:colors.ink,fontSize:12,marginTop:8},
 fieldLabel:{color:colors.muted,fontSize:8,fontWeight:"900",letterSpacing:1.1,marginTop:14,marginBottom:8},
 moods:{flexDirection:"row",flexWrap:"wrap",gap:6},
 mood:{borderWidth:1,borderColor:colors.line,borderRadius:radius.pill,paddingVertical:8,paddingHorizontal:10},
 moodActive:{backgroundColor:colors.ink,borderColor:colors.ink},
 moodText:{color:colors.muted,fontSize:9,fontWeight:"800"},
 moodTextActive:{color:colors.surface},
 create:{height:46,backgroundColor:colors.red,borderRadius:radius.pill,marginTop:17,flexDirection:"row",alignItems:"center",justifyContent:"center",gap:8},
 createText:{color:colors.surface,fontSize:11,fontWeight:"900"},
 libraryHead:{flexDirection:"row",alignItems:"flex-end",justifyContent:"space-between",marginTop:28,marginBottom:13},
 libraryTitle:{color:colors.ink,fontSize:22,fontWeight:"900",letterSpacing:-.6,marginTop:5},
 count:{color:colors.muted,fontSize:8,fontWeight:"900",letterSpacing:1},
 empty:{padding:30,alignItems:"center",gap:8,backgroundColor:"#E8E1D7",borderRadius:radius.md},
 emptyTitle:{color:colors.ink,fontSize:15,fontWeight:"900"},
 grid:{flexDirection:"row",flexWrap:"wrap",gap:10},
 card:{width:"48%",backgroundColor:colors.surface,borderWidth:1,borderColor:colors.line,borderRadius:radius.md,padding:9},
 thumb:{height:130,backgroundColor:"#EAE4DA",borderRadius:radius.sm,overflow:"hidden"},
 cardName:{color:colors.ink,fontSize:11,fontWeight:"900",marginTop:7},
 cardMood:{color:colors.muted,fontSize:9,marginTop:2},
 actions:{flexDirection:"row",gap:7,marginTop:8},
 action:{width:30,height:30,borderRadius:15,backgroundColor:"#EAE4DA",alignItems:"center",justifyContent:"center"},
 note:{backgroundColor:"#E8E1D7",borderRadius:radius.md,padding:14,marginTop:22},
 noteTitle:{color:colors.red,fontSize:8,fontWeight:"900",letterSpacing:1.2},
 noteText:{color:colors.muted,fontSize:10,lineHeight:16,marginTop:6},
 back:{alignItems:"center",paddingVertical:18},
 backText:{color:colors.ink,fontSize:11,fontWeight:"800"}
});