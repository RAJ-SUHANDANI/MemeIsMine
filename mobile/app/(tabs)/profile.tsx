import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { ArrowUpRight, GitBranch, Globe2, Heart, Mail, ShieldCheck, Smartphone } from "lucide-react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors, radius } from "../../src/theme";

const links = [
  { label: "MemeIsMine on the web", url: "https://memeismine.vercel.app/", icon: Globe2 },
  { label: "Source code", url: "https://github.com/RAJ-SUHANDANI/MemeIsMine", icon: GitBranch },
  { label: "Privacy information", url: "https://memeismine.vercel.app/privacy", icon: ShieldCheck },
  { label: "Contact the creator", url: "mailto:rajsuhandani28@gmail.com", icon: Mail },
];
export default function ProfileScreen() {
  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.kicker}>THE PEOPLE BEHIND THE PIXELS</Text>
        <Text style={styles.title}>Made for{"\n"}<Text style={styles.italic}>the bit.</Text></Text>
        <View style={styles.card}>
          <View style={styles.mark}><Text style={styles.markText}>m</Text></View>
          <Text style={styles.name}>Meme Is Mine</Text>
          <Text style={styles.description}>An independent meme-creation studio. Find a format, make it yours, pass the laugh along.</Text>
          <View style={styles.version}><Smartphone size={13} color={colors.muted}/><Text style={styles.versionText}>MOBILE EDITION · 1.0</Text></View>
        </View>
        <Text style={styles.section}>A FEW USEFUL PLACES</Text>
        <View style={styles.links}>
          {links.map((item) => {
            const Icon = item.icon;
            return <Pressable key={item.label} onPress={() => Linking.openURL(item.url)} style={styles.link}><Icon size={18} color={colors.ink}/><Text style={styles.linkLabel}>{item.label}</Text><ArrowUpRight size={15} color={colors.muted}/></Pressable>;
          })}
        </View>
        <View style={styles.privacy}>
          <ShieldCheck size={17} color={colors.green}/>
          <View style={{ flex: 1 }}><Text style={styles.privacyTitle}>Your drafts stay yours.</Text><Text style={styles.privacyCopy}>Drafts, bookmarks, Battle entries and stickers are stored locally on this device. This version does not offer accounts or cloud sync.</Text></View>
        </View>
        <View style={styles.end}><Heart color={colors.red} size={13}/><Text style={styles.endText}>A little creativity goes a long way.</Text></View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.paper },
  content: { padding: 22, paddingTop: 25 },
  kicker: { color: colors.red, fontSize: 9, fontWeight: "900", letterSpacing: 1.6 },
  title: { color: colors.ink, fontSize: 43, lineHeight: 45, fontWeight: "900", letterSpacing: -2, marginTop: 9, marginBottom: 22 },
  italic: { fontFamily: "Georgia", fontStyle: "italic", color: colors.red, fontWeight: "400" },
  card: { borderRadius: radius.lg, padding: 22, backgroundColor: colors.ink, alignItems: "flex-start" },
  mark: { backgroundColor: colors.red, width: 42, height: 42, borderRadius: 13, alignItems: "center", justifyContent: "center", transform: [{ rotate: "-7deg" }] },
  markText: { color: colors.surface, fontSize: 30, fontWeight: "900", fontStyle: "italic" },
  name: { color: colors.surface, fontSize: 25, fontWeight: "900", letterSpacing: -1, marginTop: 19 },
  description: { color: "#C7BFB3", fontSize: 13, lineHeight: 20, marginTop: 8 },
  version: { flexDirection: "row", alignItems: "center", gap: 7, marginTop: 20 },
  versionText: { color: "#B5ADA1", fontSize: 9, fontWeight: "800", letterSpacing: 1.1 },
  section: { color: colors.red, fontSize: 9, fontWeight: "900", letterSpacing: 1.4, marginTop: 32, marginBottom: 10 },
  links: { borderTopWidth: 1, borderTopColor: colors.line },
  link: { height: 55, borderBottomWidth: 1, borderBottomColor: colors.line, flexDirection: "row", alignItems: "center", gap: 12 },
  linkLabel: { flex: 1, color: colors.ink, fontSize: 13, fontWeight: "700" },
  privacy: { backgroundColor: "#E8E5DB", padding: 15, borderRadius: radius.md, flexDirection: "row", gap: 11, marginTop: 25 },
  privacyTitle: { color: colors.ink, fontSize: 12, fontWeight: "900" },
  privacyCopy: { color: colors.muted, fontSize: 11, lineHeight: 17, marginTop: 4 },
  end: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 7, marginTop: 35, marginBottom: 25 },
  endText: { color: colors.muted, fontSize: 10, fontWeight: "700" },
});