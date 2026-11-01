import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";
import { Image } from "expo-image";
import { ArrowRight, Camera, Crown, Plus, Sparkles, Sticker } from "lucide-react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, useFocusEffect } from "expo-router";
import { TemplateCard } from "../../src/components/TemplateCard";
import { getMemes, imageUri } from "../../src/lib/api";
import { getBookmarks, toggleBookmark } from "../../src/lib/storage";
import { colors, radius } from "../../src/theme";
import type { MemeTemplate } from "../../src/types";

export default function HomeScreen() {
  const [memes, setMemes] = useState<MemeTemplate[]>([]);
  const [saved, setSaved] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const load = useCallback(async (refresh = false) => {
    try {
      if (refresh) setRefreshing(true); else setLoading(true);
      setError("");
      const [items, bookmarks] = await Promise.all([getMemes({ limit: 60 }), getBookmarks()]);
      setMemes(items);
      setSaved(bookmarks);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not load templates.");
    } finally { setLoading(false); setRefreshing(false); }
  }, []);
  useFocusEffect(useCallback(() => { void getBookmarks().then(setSaved); }, []));
  useEffect(() => { void load(); }, [load]);
  async function bookmark(id: string) { setSaved(await toggleBookmark(id)); }
  const spotlight = memes[0];
  const picks = memes.slice(1, 7);

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <ScrollView showsVerticalScrollIndicator={false} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} tintColor={colors.red}/>}>
        <View style={styles.topbar}>
          <View style={styles.brand}><View style={styles.mark}><Text style={styles.markText}>m</Text></View><Text style={styles.brandText}>meme is mine</Text></View>
          <Pressable onPress={() => router.push("/upload")} style={styles.create}><Plus size={17} color={colors.surface}/><Text style={styles.createText}>Create</Text></Pressable>
        </View>
        <View style={styles.hero}>
          <Text style={styles.kicker}>THE INTERNET, YOUR CANVAS</Text>
          <Text style={styles.heading}>Make a little{"\n"}<Text style={styles.italic}>noise.</Text></Text>
          <Text style={styles.intro}>Find the format. Add your twist. Send it into the group chat.</Text>
          <View style={styles.heroActions}>
            <Pressable onPress={() => router.push("/(tabs)/explore")} style={styles.primary}><Text style={styles.primaryText}>Find your meme</Text><ArrowRight size={16} color={colors.surface}/></Pressable>
            <Text style={styles.edition}>EDITION 01 / MEME CULTURE</Text>
          </View>
          {spotlight ? (
            <Pressable style={styles.spotlight} onPress={() => router.push({ pathname: "/editor/[id]", params: { id: spotlight.id } })}>
              <Image source={{ uri: imageUri(spotlight.url) }} style={StyleSheet.absoluteFill} contentFit="cover"/>
              <View style={styles.spotLabel}><Sparkles size={12} color={colors.surface}/><Text style={styles.spotLabelText}>TODAY'S STARTING POINT</Text></View>
              <View style={styles.spotBottom}><Text style={styles.spotName}>{spotlight.name}</Text><View style={styles.circle}><ArrowRight color={colors.ink} size={17}/></View></View>
            </Pressable>
          ) : <View style={styles.spotlightLoading}>{loading ? <ActivityIndicator color={colors.red}/> : <Text>{error || "Template spotlight is taking a breather."}</Text>}</View>}
        </View>
        <View style={styles.sectionHead}>
          <View><Text style={styles.kicker}>THE GOOD STUFF</Text><Text style={styles.sectionTitle}>Fresh from the feed.</Text></View>
          <Pressable onPress={() => router.push("/(tabs)/explore")}><Text style={styles.seeAll}>SEE ALL ↗</Text></Pressable>
        </View>
        {loading && !picks.length ? <ActivityIndicator style={{ margin: 30 }} color={colors.red}/> : error && !picks.length ? <Text style={styles.error}>{error}</Text> : (
          <View style={styles.grid}>{picks.map((item) => <View key={item.id} style={styles.gridCell}><TemplateCard item={item} saved={saved.includes(item.id)} onPress={() => router.push({ pathname: "/editor/[id]", params: { id: item.id } })} onBookmark={() => bookmark(item.id)}/></View>)}</View>
        )}
        <Pressable style={styles.motionBanner} onPress={() => router.push("/(tabs)/videos")}>
          <View style={{ flex: 1 }}><Text style={styles.bannerTag}>NOT JUST A STILL FRAME</Text><Text style={styles.bannerTitle}>Give it a little motion.</Text><Text style={styles.bannerCopy}>GIFs, clips and moving reactions.</Text></View>
          <View style={styles.bannerArrow}><ArrowRight color={colors.surface}/></View>
        </Pressable>
        <View style={styles.exclusiveHead}><Text style={styles.kicker}>ONLY ON THE APP</Text><Text style={styles.exclusiveTitle}>Your new favourite habits.</Text></View>
        <Pressable style={styles.exclusiveCard} onPress={() => router.push("/(tabs)/battle")}><View style={styles.exclusiveIcon}><Crown color={colors.orange} size={20}/></View><View style={styles.exclusiveCopy}><Text style={styles.exclusiveTag}>DAILY CHALLENGE</Text><Text style={styles.exclusiveName}>Meme Battle</Text><Text style={styles.exclusiveDesc}>A fresh prompt. Your funniest take.</Text></View><ArrowRight color={colors.surface} size={18}/></Pressable>
        <Pressable style={styles.exclusiveCard} onPress={() => router.push("/(tabs)/memecam")}><View style={styles.exclusiveIcon}><Camera color={colors.red} size={20}/></View><View style={styles.exclusiveCopy}><Text style={styles.exclusiveTag}>LIVE CAMERA</Text><Text style={styles.exclusiveName}>MemeCam</Text><Text style={styles.exclusiveDesc}>Catch the moment. Caption it live.</Text></View><ArrowRight color={colors.surface} size={18}/></Pressable>
        <Pressable style={styles.exclusiveCard} onPress={() => router.push("/(tabs)/vault")}><View style={styles.exclusiveIcon}><Sticker color={colors.lilac} size={20}/></View><View style={styles.exclusiveCopy}><Text style={styles.exclusiveTag}>YOUR REACTIONS</Text><Text style={styles.exclusiveName}>MemeVault</Text><Text style={styles.exclusiveDesc}>Build a sticker collection of your own.</Text></View><ArrowRight color={colors.surface} size={18}/></Pressable>
        <View style={styles.utilityLinks}><Pressable onPress={() => router.push("/(tabs)/explore")}><Text style={styles.utilityLink}>Explore image memes ↗</Text></Pressable><Pressable onPress={() => router.push("/(tabs)/videos")}><Text style={styles.utilityLink}>Browse video memes ↗</Text></Pressable></View>
        <View style={styles.footer}><Text style={styles.footerBrand}>MEME IS MINE.</Text><Text style={styles.footerCopy}>A small studio for big reactions.</Text></View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.paper },
  topbar: { height: 62, paddingHorizontal: 22, flexDirection: "row", alignItems: "center", justifyContent: "space-between", borderBottomWidth: 1, borderBottomColor: colors.line },
  brand: { flexDirection: "row", alignItems: "center", gap: 9 },
  mark: { backgroundColor: colors.red, width: 29, height: 29, borderRadius: 9, alignItems: "center", justifyContent: "center", transform: [{ rotate: "-7deg" }] },
  markText: { color: colors.white, fontSize: 22, fontWeight: "900", fontStyle: "italic", marginTop: -2 },
  brandText: { color: colors.ink, fontSize: 17, fontWeight: "900", letterSpacing: -0.8 },
  create: { backgroundColor: colors.ink, borderRadius: radius.pill, paddingHorizontal: 15, paddingVertical: 10, flexDirection: "row", gap: 6, alignItems: "center" },
  createText: { color: colors.surface, fontSize: 12, fontWeight: "800" },
  hero: { paddingHorizontal: 22, paddingTop: 34 },
  kicker: { color: colors.red, fontSize: 9, fontWeight: "900", letterSpacing: 2.1 },
  heading: { color: colors.ink, fontSize: 51, lineHeight: 53, letterSpacing: -2.7, fontWeight: "900", marginTop: 12 },
  italic: { fontFamily: "Georgia", fontStyle: "italic", fontWeight: "400", color: colors.red, letterSpacing: -2 },
  intro: { color: colors.muted, fontSize: 14, lineHeight: 21, marginTop: 12, maxWidth: 285 },
  heroActions: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 19, marginBottom: 22 },
  primary: { backgroundColor: colors.red, paddingVertical: 13, paddingHorizontal: 17, borderRadius: radius.pill, flexDirection: "row", gap: 13, alignItems: "center" },
  primaryText: { color: colors.surface, fontSize: 12, fontWeight: "800" },
  edition: { color: colors.muted, fontSize: 8, fontWeight: "700", letterSpacing: 1 },
  spotlight: { height: 245, borderRadius: radius.lg, overflow: "hidden", backgroundColor: "#D7C9B8", justifyContent: "space-between" },
  spotLabel: { alignSelf: "flex-start", margin: 13, backgroundColor: "rgba(24,23,19,.78)", borderRadius: 4, paddingHorizontal: 10, paddingVertical: 8, flexDirection: "row", gap: 7, alignItems: "center" },
  spotLabelText: { color: colors.surface, fontSize: 8, fontWeight: "900", letterSpacing: 1.2 },
  spotBottom: { backgroundColor: "rgba(24,23,19,.85)", paddingHorizontal: 15, paddingVertical: 13, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  spotName: { color: colors.surface, fontWeight: "800", fontSize: 16, maxWidth: "80%" },
  circle: { backgroundColor: colors.surface, width: 34, height: 34, borderRadius: 17, alignItems: "center", justifyContent: "center" },
  spotlightLoading: { height: 220, backgroundColor: "#E7DED1", borderRadius: radius.lg, alignItems: "center", justifyContent: "center" },
  sectionHead: { marginTop: 35, paddingHorizontal: 22, marginBottom: 17, flexDirection: "row", alignItems: "flex-end", justifyContent: "space-between" },
  sectionTitle: { color: colors.ink, fontSize: 23, fontWeight: "900", letterSpacing: -0.9, marginTop: 5 },
  seeAll: { color: colors.red, fontSize: 9, fontWeight: "900", letterSpacing: 1 },
  grid: { flexDirection: "row", flexWrap: "wrap", paddingHorizontal: 18, gap: 12 },
  gridCell: { width: "47.5%" },
  error: { color: colors.red, paddingHorizontal: 22 },
  motionBanner: { margin: 22, borderRadius: radius.lg, padding: 19, backgroundColor: colors.ink, flexDirection: "row", alignItems: "center" },
  bannerTag: { color: colors.orange, fontSize: 8, fontWeight: "900", letterSpacing: 1.6 },
  bannerTitle: { color: colors.surface, fontSize: 22, fontWeight: "900", letterSpacing: -0.8, marginTop: 9 },
  bannerCopy: { color: "#BDB6AC", fontSize: 11, marginTop: 5 },
  bannerArrow: { width: 42, height: 42, backgroundColor: colors.red, borderRadius: 21, alignItems: "center", justifyContent: "center" },
  exclusiveHead: { paddingHorizontal: 22, marginTop: 20, marginBottom: 13 },
  exclusiveTitle: { color: colors.ink, fontSize: 22, fontWeight: "900", letterSpacing: -0.8, marginTop: 5 },
  exclusiveCard: { marginHorizontal: 22, marginBottom: 9, padding: 13, borderRadius: radius.md, backgroundColor: colors.ink, flexDirection: "row", alignItems: "center", gap: 12 },
  exclusiveIcon: { width: 43, height: 43, borderRadius: 14, backgroundColor: "#34312A", alignItems: "center", justifyContent: "center" },
  exclusiveCopy: { flex: 1 },
  exclusiveTag: { color: colors.orange, fontSize: 7, fontWeight: "900", letterSpacing: 1.2 },
  exclusiveName: { color: colors.surface, fontSize: 15, fontWeight: "900", marginTop: 3 },
  exclusiveDesc: { color: "#BDB6AC", fontSize: 9, marginTop: 3 },
  utilityLinks: { paddingHorizontal: 22, paddingTop: 12, flexDirection: "row", justifyContent: "space-between" },
  utilityLink: { color: colors.red, fontSize: 9, fontWeight: "900" },
  footer: { paddingHorizontal: 22, paddingBottom: 28, paddingTop: 20 },
  footerBrand: { color: colors.ink, fontSize: 15, fontWeight: "900", letterSpacing: 1.1 },
  footerCopy: { color: colors.muted, fontSize: 10, marginTop: 5 },
});