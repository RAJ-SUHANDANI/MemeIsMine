import { useMemo, useRef, useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import * as Sharing from "expo-sharing";
import ViewShot, { type ViewShotRef } from "react-native-view-shot";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { ArrowRight, Camera, Crown, Flame, Share2, Sparkles, Trophy } from "lucide-react-native";
import { colors, radius } from "../../src/theme";
import { getBattleEntries, saveBattleEntry } from "../../src/lib/storage";

const prompts = [
  "That one friend who says “I'm 5 minutes away”",
  "When the Wi-Fi disconnects during the final boss",
  "Me opening the fridge for the 8th time",
  "When the group project has one person doing everything",
  "POV: You said “one more episode” at 2 AM",
  "When salary arrives and bills are already waiting",
  "That look when someone says “it's not that deep”",
];
function dayKey(date = new Date()) { return [date.getFullYear(), String(date.getMonth()+1).padStart(2,"0"), String(date.getDate()).padStart(2,"0")].join("-"); }
export default function BattleScreen() {
  const today = dayKey();
  const prompt = useMemo(() => prompts[Math.floor(new Date(today).getTime()/86400000)%prompts.length], [today]);
  const [uri, setUri] = useState("");
  const [caption, setCaption] = useState("");
  const [entries, setEntries] = useState<Awaited<ReturnType<typeof getBattleEntries>>>([]);
  const [busy, setBusy] = useState(false);
  const shot = useRef<ViewShotRef>(null);
  const todaysEntry = entries.find((entry) => entry.dateKey === today);
  async function choosePhoto() {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) { Alert.alert("Photo access needed", "Allow photo access to enter today's challenge."); return; }
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ["images"], quality: 1 });
    if (!result.canceled && result.assets[0]) setUri(result.assets[0].uri);
  }
  async function submit() {
    if (!uri || !caption.trim() || !shot.current) return;
    setBusy(true);
    try {
      const rendered = await shot.current.capture?.();
      if (!rendered) throw new Error("Could not render your entry.");
      const next = await saveBattleEntry({ id: `battle-${today}`, dateKey: today, prompt, uri: rendered, caption: caption.trim(), createdAt: new Date().toISOString(), votes: 0 });
      setEntries(next);
      setUri("");
      setCaption("");
      Alert.alert("You're in!", "Your entry is saved. Challenge a friend by sharing it.");
    } catch (error) { Alert.alert("Couldn't save entry", error instanceof Error ? error.message : "Please try again."); }
    finally { setBusy(false); }
  }
  async function shareEntry() {
    if (!todaysEntry) return;
    const available = await Sharing.isAvailableAsync();
    if (available) await Sharing.shareAsync(todaysEntry.uri, { mimeType: "image/png", dialogTitle: "Share my Meme Battle entry" });
    else Alert.alert("Sharing unavailable", "Sharing is not available on this device.");
  }
  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.top}><View><Text style={styles.kicker}>THE DAILY CREATIVE SHOWDOWN</Text><Text style={styles.title}>Meme <Text style={styles.italic}>Battle.</Text></Text></View><View style={styles.trophy}><Trophy color={colors.orange} size={24}/></View></View>
        <View style={styles.streak}><Flame color={colors.orange} size={16}/><Text style={styles.streakText}>ONE PROMPT. ONE DAY. INFINITE WAYS TO WIN.</Text></View>
        <View style={styles.promptCard}>
          <Text style={styles.promptLabel}>TODAY'S CHALLENGE · {today}</Text>
          <Text style={styles.prompt}>{prompt}</Text>
          <Text style={styles.promptHint}>Make the funniest take you can. Then send it to your group chat.</Text>
        </View>
        {todaysEntry ? (
          <View style={styles.doneCard}>
            <View style={styles.doneHead}><Crown color={colors.orange} size={18}/><Text style={styles.doneTitle}>YOU ENTERED TODAY</Text></View>
            <Image source={{ uri: todaysEntry.uri }} style={styles.entryImage} contentFit="contain"/>
            <Text style={styles.entryCaption}>{todaysEntry.caption}</Text>
            <Pressable style={styles.share} onPress={() => void shareEntry()}><Share2 color={colors.surface} size={16}/><Text style={styles.shareText}>Challenge a friend</Text></Pressable>
          </View>
        ) : (
          <>
            <Text style={styles.section}>YOUR ENTRY</Text>
            <Pressable onPress={choosePhoto} style={styles.picker}>
              {uri ? <Image source={{ uri }} style={StyleSheet.absoluteFill} contentFit="cover"/> : <><View style={styles.pickIcon}><Camera color={colors.red} size={24}/></View><Text style={styles.pickTitle}>Choose your meme image</Text><Text style={styles.pickHint}>Pick a photo from your camera roll</Text></>}
            </Pressable>
            {!!uri && <Pressable onPress={choosePhoto}><Text style={styles.change}>CHANGE IMAGE ↗</Text></Pressable>}
            <TextInput value={caption} onChangeText={setCaption} placeholder="Add your punchline…" placeholderTextColor={colors.muted} multiline style={styles.input}/>
            {!!uri && <ViewShot ref={shot} options={{ format: "png", quality: 1, result: "tmpfile" }} style={styles.renderCard}>
              <Image source={{ uri }} style={StyleSheet.absoluteFill} contentFit="cover"/>
              <View style={styles.renderOverlay}><Text style={styles.renderPrompt}>{prompt}</Text><Text style={styles.renderCaption}>{caption}</Text><Text style={styles.watermark}>MEME BATTLE · MEME IS MINE</Text></View>
            </ViewShot>}
            <Pressable disabled={!uri || !caption.trim() || busy} onPress={() => void submit()} style={[styles.submit, (!uri || !caption.trim() || busy) && styles.disabled]}><Sparkles size={17} color={colors.surface}/><Text style={styles.submitText}>{busy ? "Submitting…" : "Enter today's battle"}</Text><ArrowRight color={colors.surface} size={16}/></Pressable>
          </>
        )}
        <View style={styles.info}><Text style={styles.infoTitle}>HOW THE BATTLE WORKS</Text><Text style={styles.infoCopy}>A new prompt rotates every day. Your entry is saved privately on this device and can be shared with friends. Community voting and global leaderboards will require a connected backend in a later release.</Text></View>
        <Pressable onPress={() => router.push("/(tabs)/explore")} style={styles.explore}><Text style={styles.exploreText}>Need a template? Browse the meme library ↗</Text></Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}
const styles=StyleSheet.create({
 safe:{flex:1,backgroundColor:colors.paper},content:{padding:20,paddingBottom:40},
 top:{flexDirection:"row",justifyContent:"space-between",alignItems:"center",marginTop:10},
 kicker:{color:colors.red,fontSize:8,fontWeight:"900",letterSpacing:1.5},
 title:{color:colors.ink,fontSize:38,fontWeight:"900",letterSpacing:-1.8,marginTop:7},
 italic:{fontFamily:"Georgia",fontStyle:"italic",fontWeight:"400",color:colors.red},
 trophy:{width:54,height:54,borderRadius:18,backgroundColor:colors.ink,alignItems:"center",justifyContent:"center"},
 streak:{flexDirection:"row",alignItems:"center",gap:8,marginTop:18,marginBottom:16},
 streakText:{color:colors.muted,fontSize:8,fontWeight:"900",letterSpacing:1},
 promptCard:{backgroundColor:colors.ink,borderRadius:radius.lg,padding:20},
 promptLabel:{color:colors.orange,fontSize:8,fontWeight:"900",letterSpacing:1.4},
 prompt:{color:colors.surface,fontSize:25,lineHeight:31,fontWeight:"900",letterSpacing:-.7,marginTop:14},
 promptHint:{color:"#C7BFB3",fontSize:11,lineHeight:17,marginTop:12},
 section:{color:colors.red,fontSize:9,fontWeight:"900",letterSpacing:1.3,marginTop:25,marginBottom:10},
 picker:{height:210,backgroundColor:colors.surface,borderWidth:1,borderStyle:"dashed",borderColor:colors.line,borderRadius:radius.lg,alignItems:"center",justifyContent:"center",overflow:"hidden"},
 pickIcon:{width:52,height:52,borderRadius:26,backgroundColor:"#F7E4DC",alignItems:"center",justifyContent:"center",marginBottom:12},
 pickTitle:{color:colors.ink,fontSize:14,fontWeight:"900"},
 pickHint:{color:colors.muted,fontSize:10,marginTop:6},
 change:{color:colors.red,fontSize:9,fontWeight:"900",letterSpacing:1,marginTop:9,textAlign:"right"},
 input:{backgroundColor:colors.surface,borderWidth:1,borderColor:colors.line,borderRadius:radius.md,minHeight:75,padding:14,color:colors.ink,fontSize:14,fontWeight:"700",textAlignVertical:"top",marginTop:12},
 renderCard:{width:"100%",aspectRatio:1,marginTop:14,overflow:"hidden",backgroundColor:colors.ink},
 renderOverlay:{...StyleSheet.absoluteFillObject,justifyContent:"space-between",padding:16,backgroundColor:"rgba(0,0,0,.18)"},
 renderPrompt:{color:colors.surface,fontSize:13,fontWeight:"900",textShadowColor:"#000",textShadowRadius:5,textShadowOffset:{width:1,height:1}},
 renderCaption:{color:colors.surface,fontSize:25,fontWeight:"900",textAlign:"center",textTransform:"uppercase",textShadowColor:"#000",textShadowRadius:5,textShadowOffset:{width:2,height:2}},
 watermark:{color:colors.surface,fontSize:8,fontWeight:"900",letterSpacing:1.2,textAlign:"right"},
 submit:{height:51,backgroundColor:colors.red,borderRadius:radius.pill,marginTop:15,flexDirection:"row",alignItems:"center",justifyContent:"center",gap:10},
 submitText:{color:colors.surface,fontSize:12,fontWeight:"900"},
 disabled:{opacity:.4},
 doneCard:{backgroundColor:colors.surface,borderRadius:radius.lg,padding:15,marginTop:22,borderWidth:1,borderColor:colors.line},
 doneHead:{flexDirection:"row",alignItems:"center",gap:8,marginBottom:12},
 doneTitle:{color:colors.ink,fontSize:10,fontWeight:"900",letterSpacing:1},
 entryImage:{width:"100%",aspectRatio:1,backgroundColor:"#E7DED1",borderRadius:radius.md},
 entryCaption:{color:colors.ink,fontSize:14,fontWeight:"800",marginTop:10},
 share:{height:46,backgroundColor:colors.ink,borderRadius:radius.pill,marginTop:13,flexDirection:"row",alignItems:"center",justifyContent:"center",gap:8},
 shareText:{color:colors.surface,fontSize:11,fontWeight:"900"},
 info:{padding:15,backgroundColor:"#E8E1D7",borderRadius:radius.md,marginTop:22},
 infoTitle:{color:colors.red,fontSize:8,fontWeight:"900",letterSpacing:1.2},
 infoCopy:{color:colors.muted,fontSize:10,lineHeight:16,marginTop:7},
 explore:{paddingVertical:18,alignItems:"center"},
 exploreText:{color:colors.ink,fontSize:11,fontWeight:"800"}
});