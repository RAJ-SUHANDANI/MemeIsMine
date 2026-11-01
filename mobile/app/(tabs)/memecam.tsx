import { useCallback, useRef, useState } from "react";
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { CameraView, useCameraPermissions, type CameraType } from "expo-camera";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, useFocusEffect } from "expo-router";
import { ArrowLeft, Camera, FlipHorizontal, Zap } from "lucide-react-native";
import { colors, radius } from "../../src/theme";

export default function MemeCamScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [facing, setFacing] = useState<CameraType>("back");
  const [caption, setCaption] = useState("WHEN THE PLAN ACTUALLY WORKS");
  const [flash, setFlash] = useState(false);
  const camera = useRef<CameraView>(null);
  const [busy, setBusy] = useState(false);
  const [focused, setFocused] = useState(true);
  useFocusEffect(useCallback(() => { setFocused(true); return () => setFocused(false); }, []));
  async function capture() {
    if (!camera.current || busy) return;
    setBusy(true);
    try {
      const photo = await camera.current.takePictureAsync({ quality: 1, skipProcessing: false });
      if (photo?.uri) router.push({ pathname: "/editor/[id]", params: { id: "upload", uri: photo.uri, top: caption } });
    } catch (error) { Alert.alert("Camera couldn't capture", error instanceof Error ? error.message : "Please try again."); }
    finally { setBusy(false); }
  }
  if (!permission) return <SafeAreaView style={styles.safe}><View style={styles.center}><Text style={styles.help}>Checking camera permissions…</Text></View></SafeAreaView>;
  if (!permission.granted) return (
    <SafeAreaView style={styles.safe}><View style={styles.center}><View style={styles.cameraIcon}><Camera color={colors.red} size={27}/></View><Text style={styles.permissionTitle}>MemeCam needs a lens.</Text><Text style={styles.help}>Allow camera access to capture your own reaction shots. Your photos stay on your device unless you choose to share them.</Text><Pressable style={styles.allow} onPress={() => void requestPermission()}><Text style={styles.allowText}>Allow camera access</Text></Pressable></View></SafeAreaView>
  );
  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <View style={styles.header}><View><Text style={styles.kicker}>APP ORIGINAL · LIVE CAMERA</Text><Text style={styles.title}>Meme<Text style={styles.italic}>Cam.</Text></Text></View><Pressable onPress={() => setFacing((v) => v === "back" ? "front" : "back")} style={styles.flip}><FlipHorizontal color={colors.ink} size={19}/></Pressable></View>
      <View style={styles.cameraFrame}>
        {focused ? <CameraView ref={camera} style={StyleSheet.absoluteFill} facing={facing} flash={flash ? "on" : "off"}>
          <View style={styles.liveOverlay} pointerEvents="none"><Text numberOfLines={3} adjustsFontSizeToFit style={styles.liveCaption}>{caption || "YOUR REACTION HERE"}</Text><Text style={styles.liveMark}>MEMECAM · MEME IS MINE</Text></View>
        </CameraView> : <View style={StyleSheet.absoluteFill} />}
      </View>
      <View style={styles.controls}>
        <Text style={styles.label}>LIVE CAPTION</Text>
        <TextInput value={caption} onChangeText={setCaption} style={styles.input} placeholder="Type something funny…" placeholderTextColor={colors.muted} multiline/>
        <View style={styles.bottomRow}>
          <Pressable style={styles.flash} onPress={() => setFlash((v) => !v)}><Zap size={16} color={flash ? colors.orange : colors.ink}/><Text style={styles.flashText}>{flash ? "FLASH ON" : "FLASH OFF"}</Text></Pressable>
          <Pressable onPress={() => void capture()} disabled={busy} style={[styles.capture,busy && {opacity:.5}]}><View style={styles.captureInner}/></Pressable>
          <View style={styles.captureHint}><Text style={styles.hintText}>TAP TO</Text><Text style={styles.hintText}>CAPTURE</Text></View>
        </View>
        <Text style={styles.footnote}>Preview your caption live, capture the moment, then finish editing and export in the studio.</Text>
      </View>
    </SafeAreaView>
  );
}
const styles=StyleSheet.create({
 safe:{flex:1,backgroundColor:colors.paper},
 header:{paddingHorizontal:20,paddingTop:12,paddingBottom:14,flexDirection:"row",alignItems:"center",justifyContent:"space-between"},
 kicker:{color:colors.red,fontSize:8,fontWeight:"900",letterSpacing:1.4},
 title:{color:colors.ink,fontSize:32,fontWeight:"900",letterSpacing:-1.3,marginTop:4},
 italic:{fontFamily:"Georgia",fontStyle:"italic",fontWeight:"400",color:colors.red},
 flip:{width:42,height:42,borderRadius:21,borderWidth:1,borderColor:colors.line,alignItems:"center",justifyContent:"center"},
 cameraFrame:{flex:1,marginHorizontal:14,borderRadius:radius.lg,overflow:"hidden",backgroundColor:"#27231F"},
 liveOverlay:{...StyleSheet.absoluteFillObject,justifyContent:"space-between",alignItems:"center",padding:18,backgroundColor:"rgba(0,0,0,.08)"},
 liveCaption:{color:"#fff",fontSize:30,lineHeight:35,textAlign:"center",fontWeight:"900",textTransform:"uppercase",textShadowColor:"#000",textShadowRadius:5,textShadowOffset:{width:2,height:2},marginTop:18},
 liveMark:{color:"#fff",fontSize:8,fontWeight:"900",letterSpacing:1.5,textShadowColor:"#000",textShadowRadius:4,marginBottom:6},
 controls:{padding:18,paddingBottom:15},
 label:{color:colors.red,fontSize:8,fontWeight:"900",letterSpacing:1.3},
 input:{marginTop:7,backgroundColor:colors.surface,borderWidth:1,borderColor:colors.line,borderRadius:radius.md,paddingHorizontal:12,paddingVertical:10,minHeight:47,color:colors.ink,fontWeight:"800",fontSize:12},
 bottomRow:{height:80,flexDirection:"row",alignItems:"center",justifyContent:"space-between"},
 flash:{flexDirection:"row",alignItems:"center",gap:6,width:90},
 flashText:{fontSize:8,color:colors.ink,fontWeight:"900"},
 capture:{width:62,height:62,borderRadius:31,borderWidth:4,borderColor:colors.ink,alignItems:"center",justifyContent:"center"},
 captureInner:{width:46,height:46,borderRadius:23,backgroundColor:colors.red},
 captureHint:{width:90,alignItems:"flex-end"},
 hintText:{fontSize:8,fontWeight:"900",color:colors.muted,letterSpacing:1},
 footnote:{fontSize:9,color:colors.muted,lineHeight:14,textAlign:"center"}
 ,center:{flex:1,alignItems:"center",justifyContent:"center",padding:28},
 cameraIcon:{width:58,height:58,borderRadius:20,backgroundColor:"#F7E4DC",alignItems:"center",justifyContent:"center"},
 permissionTitle:{fontSize:22,fontWeight:"900",color:colors.ink,marginTop:18},
 help:{fontSize:12,lineHeight:19,color:colors.muted,textAlign:"center",marginTop:10},
 allow:{backgroundColor:colors.red,borderRadius:radius.pill,paddingHorizontal:22,paddingVertical:13,marginTop:20},
 allowText:{color:colors.surface,fontWeight:"900",fontSize:12}
});