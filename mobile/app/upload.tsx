import { useState } from "react";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";
import * as ImagePicker from "expo-image-picker";
import { Image } from "expo-image";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { ArrowLeft, ImagePlus, Upload } from "lucide-react-native";
import { colors, radius } from "../src/theme";

export default function UploadScreen() {
  const [uri, setUri] = useState<string | null>(null);
  async function choose() {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) { Alert.alert("Photo access needed", "Allow photo access to choose an image for your meme."); return; }
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ["images"], allowsEditing: false, quality: 1 });
    if (!result.canceled && result.assets[0]) setUri(result.assets[0].uri);
  }
  function create() {
    if (!uri) return;
    router.replace({ pathname: "/editor/[id]", params: { id: "upload", uri } });
  }
  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      <View style={styles.topbar}><Pressable onPress={() => router.back()}><ArrowLeft size={20} color={colors.ink}/></Pressable><Text style={styles.title}>Start with yours.</Text><View style={{ width: 20 }}/></View>
      <View style={styles.body}>
        <Text style={styles.kicker}>A BLANK CANVAS IS OVERRATED</Text>
        <Text style={styles.headline}>Bring your{"\n"}<Text style={styles.italic}>own image.</Text></Text>
        <Text style={styles.copy}>Choose a photo from your library, then give it a caption worth sharing.</Text>
        <Pressable onPress={choose} style={styles.drop}>
          {uri ? <Image source={{ uri }} style={StyleSheet.absoluteFill} contentFit="contain"/> : <><View style={styles.icon}><ImagePlus size={25} color={colors.red}/></View><Text style={styles.pick}>Choose a photo</Text><Text style={styles.hint}>JPG, PNG or HEIC from your library</Text></>}
        </Pressable>
        {uri ? <Pressable onPress={choose} style={styles.secondary}><Upload size={15} color={colors.ink}/><Text style={styles.secondaryText}>Choose a different photo</Text></Pressable> : null}
        <Pressable disabled={!uri} onPress={create} style={[styles.primary, !uri && styles.disabled]}><Text style={styles.primaryText}>Open in the editor</Text></Pressable>
      </View>
    </SafeAreaView>
  );
}
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.paper },
  topbar: { padding: 20, flexDirection: "row", alignItems: "center", justifyContent: "space-between", borderBottomWidth: 1, borderColor: colors.line },
  title: { color: colors.ink, fontSize: 14, fontWeight: "900" },
  body: { padding: 22, flex: 1 },
  kicker: { color: colors.red, fontSize: 9, fontWeight: "900", letterSpacing: 1.6, marginTop: 18 },
  headline: { color: colors.ink, fontSize: 43, fontWeight: "900", lineHeight: 46, letterSpacing: -2, marginTop: 10 },
  italic: { fontFamily: "Georgia", fontStyle: "italic", color: colors.red, fontWeight: "400" },
  copy: { color: colors.muted, fontSize: 13, lineHeight: 20, marginTop: 11, maxWidth: 280 },
  drop: { height: 300, marginTop: 27, backgroundColor: colors.surface, borderRadius: radius.lg, borderWidth: 1, borderStyle: "dashed", borderColor: "#BDB3A5", alignItems: "center", justifyContent: "center", overflow: "hidden" },
  icon: { width: 55, height: 55, borderRadius: 28, backgroundColor: "#F7E4DC", alignItems: "center", justifyContent: "center", marginBottom: 15 },
  pick: { color: colors.ink, fontSize: 16, fontWeight: "900" },
  hint: { color: colors.muted, fontSize: 10, marginTop: 7 },
  primary: { height: 50, backgroundColor: colors.red, borderRadius: radius.pill, marginTop: 15, alignItems: "center", justifyContent: "center" },
  disabled: { opacity: 0.4 },
  primaryText: { color: colors.surface, fontSize: 12, fontWeight: "900" },
  secondary: { height: 45, flexDirection: "row", gap: 8, alignItems: "center", justifyContent: "center" },
  secondaryText: { color: colors.ink, fontSize: 11, fontWeight: "800" },
});