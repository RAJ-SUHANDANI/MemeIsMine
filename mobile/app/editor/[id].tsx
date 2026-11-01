import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { Image } from "expo-image";
import ViewShot, { type ViewShotRef } from "react-native-view-shot";
import * as Sharing from "expo-sharing";
import * as MediaLibrary from "expo-media-library";
import { useLocalSearchParams, router } from "expo-router";
import { ArrowLeft, Check, Download, ImagePlus, Save, Type, Undo2 } from "lucide-react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { TemplateCard } from "../../src/components/TemplateCard";
import { getMemes, imageUri } from "../../src/lib/api";
import { getDrafts, saveDraft } from "../../src/lib/storage";
import { colors, radius } from "../../src/theme";
import type { Draft, MemeTemplate } from "../../src/types";

const defaultTop = "WHEN THE MEME HITS";
const defaultBottom = "JUST RIGHT";
export default function ImageEditorScreen() {
  const { id, draft: draftId } = useLocalSearchParams<{ id: string; draft?: string }>();
  const [catalog, setCatalog] = useState<MemeTemplate[]>([]);
  const [template, setTemplate] = useState<MemeTemplate | null>(null);
  const [topText, setTopText] = useState(defaultTop);
  const [bottomText, setBottomText] = useState(defaultBottom);
  const [fontSize, setFontSize] = useState(27);
  const [color, setColor] = useState("#FFFFFF");
  const [stroke, setStroke] = useState(true);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const shot = useRef<ViewShotRef>(null);

  useEffect(() => {
    let active = true;
    const controller = new AbortController();
    void getMemes({ limit: 100, signal: controller.signal }).then(async (items) => {
      if (!active) return;
      setCatalog(items);
      const found = items.find((item) => item.id === id) ?? null;
      if (found) setTemplate(found);
      if (draftId) {
        const draft = (await getDrafts()).find((item) => item.id === draftId);
        if (draft && active) {
          setTopText(draft.topText); setBottomText(draft.bottomText); setTemplate(found ?? { id: draft.templateId, name: draft.name, url: draft.imageUrl, width: 0, height: 0 });
        }
      }
    }).catch((reason) => { if (active) setMessage(reason instanceof Error ? reason.message : "Could not load template."); });
    return () => { active = false; controller.abort(); };
  }, [id, draftId]);

  const randomize = useCallback(() => {
    if (!catalog.length) return;
    const next = catalog[Math.floor(Math.random() * catalog.length)];
    setTemplate(next); setTopText(next.name.toUpperCase()); setBottomText("BUT MAKE IT YOURS");
  }, [catalog]);

  const previewUri = useMemo(() => template ? imageUri(template.url) : null, [template]);
  async function persist() {
    if (!template) return;
    const draft: Draft = {
      id: draftId || `draft-${Date.now()}`, templateId: template.id, name: template.name,
      imageUrl: template.url, topText, bottomText, updatedAt: new Date().toISOString(),
    };
    await saveDraft(draft);
    setMessage("Saved to your studio.");
  }
  async function exportImage() {
    if (!shot.current || !template) return;
    setBusy(true); setMessage("");
    try {
      const uri = await shot.current.capture?.();
      if (!uri) throw new Error("Could not render the image.");
      const available = await Sharing.isAvailableAsync();
      if (available) await Sharing.shareAsync(uri, { mimeType: "image/png", dialogTitle: "Share your meme" });
      else {
        const permission = await MediaLibrary.requestPermissionsAsync();
        if (!permission.granted) throw new Error("Allow photo access to save your meme.");
        await MediaLibrary.saveToLibraryAsync(uri);
        setMessage("Meme saved to your photos.");
      }
    } catch (reason) { Alert.alert("Export couldn't finish", reason instanceof Error ? reason.message : "Try again."); }
    finally { setBusy(false); }
  }

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <View style={styles.topbar}>
        <Pressable onPress={() => router.back()} style={styles.back}><ArrowLeft size={18} color={colors.ink}/></Pressable>
        <View style={{ flex: 1 }}><Text style={styles.kicker}>MEME STUDIO / IMAGE</Text><Text style={styles.topTitle}>Make it yours.</Text></View>
        <Pressable onPress={() => void persist()} style={styles.save}><Save size={15} color={colors.ink}/><Text style={styles.saveText}>Save</Text></Pressable>
      </View>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.content}>
          <View style={styles.canvasFrame}>
            {template && previewUri ? (
              <ViewShot ref={shot} options={{ format: "png", quality: 1, result: "tmpfile" }} style={styles.canvas}>
                <Image source={{ uri: previewUri }} style={StyleSheet.absoluteFill} contentFit="contain" cachePolicy="memory-disk"/>
                <View style={styles.captionLayer} pointerEvents="none">
                  <Text numberOfLines={3} adjustsFontSizeToFit style={[styles.caption, { fontSize, color, textShadowColor: stroke ? "#000" : "transparent" }]}>{topText || " "}</Text>
                  <Text numberOfLines={3} adjustsFontSizeToFit style={[styles.caption, styles.bottomCaption, { fontSize, color, textShadowColor: stroke ? "#000" : "transparent" }]}>{bottomText || " "}</Text>
                </View>
              </ViewShot>
            ) : <View style={styles.placeholder}><Text style={styles.placeholderText}>{message || "Loading template…"}</Text></View>}
          </View>
          <View style={styles.actionRow}>
            <Text style={styles.sectionTitle}>THE CAPTIONS</Text>
            <Pressable onPress={randomize} style={styles.surprise}><Undo2 size={12} color={colors.red}/><Text style={styles.surpriseText}>Surprise me</Text></Pressable>
          </View>
          <View style={styles.field}>
            <Text style={styles.label}>TOP LINE</Text>
            <TextInput value={topText} onChangeText={setTopText} style={styles.captionInput} placeholder="Write your opening line…" placeholderTextColor={colors.muted} multiline/>
          </View>
          <View style={styles.field}>
            <Text style={styles.label}>BOTTOM LINE</Text>
            <TextInput value={bottomText} onChangeText={setBottomText} style={styles.captionInput} placeholder="Land the punchline…" placeholderTextColor={colors.muted} multiline/>
          </View>
          <View style={styles.tools}>
            <View style={styles.toolHeader}><Type color={colors.ink} size={15}/><Text style={styles.sectionTitle}>TYPE TREATMENT</Text></View>
            <View style={styles.optionRow}><Text style={styles.label}>SIZE</Text><View style={styles.sizeActions}><Pressable style={styles.sizeBtn} onPress={() => setFontSize((v) => Math.max(16, v - 2))}><Text style={styles.sizeBtnText}>−</Text></Pressable><Text style={styles.sizeValue}>{fontSize}px</Text><Pressable style={styles.sizeBtn} onPress={() => setFontSize((v) => Math.min(42, v + 2))}><Text style={styles.sizeBtnText}>+</Text></Pressable></View></View>
            <View style={styles.optionRow}><Text style={styles.label}>COLOUR</Text><View style={{ flexDirection: "row", gap: 10 }}>{["#FFFFFF", "#F7D05A", "#F04A36", "#151515"].map((value) => <Pressable key={value} onPress={() => setColor(value)} style={[styles.swatch, { backgroundColor: value }, color === value && styles.selectedSwatch]}/>)}</View></View>
            <Pressable onPress={() => setStroke((v) => !v)} style={styles.outlineToggle}><Text style={styles.body}>Black outline</Text><View style={[styles.toggle, stroke && styles.toggleOn]}><View style={[styles.toggleDot, stroke && styles.toggleDotOn]}/></View></Pressable>
          </View>
          <View style={styles.footerActions}>
            <Pressable onPress={() => void persist()} style={styles.secondary}><Save size={15} color={colors.ink}/><Text style={styles.secondaryText}>Save draft</Text></Pressable>
            <Pressable disabled={busy || !template} onPress={() => void exportImage()} style={[styles.export, busy && { opacity: 0.6 }]}><Download size={16} color={colors.surface}/><Text style={styles.exportText}>{busy ? "Preparing…" : "Export meme"}</Text></Pressable>
          </View>
          {!!message && <Text style={styles.message}>{message}</Text>}
          <Text style={styles.note}>Your work is saved on this device. Export uses a rendered PNG and your device’s share sheet.</Text>
          <Text style={styles.nextTitle}>KEEP THE IDEAS COMING</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12, paddingBottom: 12 }}>
            {catalog.filter((item) => item.id !== template?.id).slice(0, 6).map((item) => <View key={item.id} style={{ width: 138 }}><TemplateCard item={item} compact onPress={() => { setTemplate(item); setTopText(item.name.toUpperCase()); setBottomText(defaultBottom); }}/></View>)}
          </ScrollView>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.paper },
  topbar: { minHeight: 62, paddingHorizontal: 17, flexDirection: "row", alignItems: "center", gap: 12, borderBottomWidth: 1, borderBottomColor: colors.line },
  back: { width: 36, height: 36, borderWidth: 1, borderColor: colors.line, borderRadius: 18, alignItems: "center", justifyContent: "center" },
  kicker: { color: colors.red, fontSize: 8, fontWeight: "900", letterSpacing: 1.2 },
  topTitle: { color: colors.ink, fontSize: 14, fontWeight: "900", marginTop: 2 },
  save: { borderRadius: radius.pill, borderWidth: 1, borderColor: colors.line, paddingVertical: 9, paddingHorizontal: 12, flexDirection: "row", alignItems: "center", gap: 6 },
  saveText: { color: colors.ink, fontSize: 11, fontWeight: "800" },
  content: { padding: 18, paddingBottom: 35 },
  canvasFrame: { borderRadius: radius.lg, backgroundColor: "#E3DBCE", padding: 10 },
  canvas: { width: "100%", aspectRatio: 1, backgroundColor: "#D5CFC4", overflow: "hidden", justifyContent: "space-between" },
  captionLayer: { ...StyleSheet.absoluteFillObject, justifyContent: "space-between", alignItems: "center", paddingHorizontal: 12, paddingVertical: 12 },
  caption: { width: "100%", textAlign: "center", fontWeight: "900", letterSpacing: 0.3, textTransform: "uppercase", includeFontPadding: false, lineHeight: 34, textShadowOffset: { width: 2, height: 2 }, textShadowRadius: 3 },
  bottomCaption: {},
  placeholder: { height: 300, alignItems: "center", justifyContent: "center" },
  placeholderText: { color: colors.muted, fontSize: 12 },
  actionRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 23, marginBottom: 11 },
  sectionTitle: { color: colors.ink, fontSize: 12, fontWeight: "900", letterSpacing: 0.3 },
  surprise: { flexDirection: "row", gap: 5, alignItems: "center", paddingVertical: 7, paddingHorizontal: 10, borderRadius: radius.pill, backgroundColor: "#F3DDD4" },
  surpriseText: { color: colors.red, fontSize: 10, fontWeight: "800" },
  field: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line, borderRadius: radius.md, padding: 12, marginBottom: 9 },
  label: { color: colors.muted, fontSize: 8, fontWeight: "900", letterSpacing: 1.3 },
  captionInput: { color: colors.ink, fontSize: 14, fontWeight: "700", minHeight: 42, paddingTop: 8, textAlignVertical: "top" },
  tools: { marginTop: 12, borderTopWidth: 1, borderBottomWidth: 1, borderColor: colors.line, paddingVertical: 16, gap: 18 },
  toolHeader: { flexDirection: "row", gap: 8, alignItems: "center" },
  optionRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  sizeActions: { flexDirection: "row", gap: 14, alignItems: "center" },
  sizeBtn: { width: 30, height: 30, borderRadius: 15, backgroundColor: "#E9E2D8", alignItems: "center", justifyContent: "center" },
  sizeBtnText: { color: colors.ink, fontSize: 20 },
  sizeValue: { color: colors.ink, fontSize: 11, fontWeight: "800" },
  swatch: { width: 23, height: 23, borderRadius: 12, borderWidth: 1, borderColor: colors.line },
  selectedSwatch: { borderWidth: 3, borderColor: colors.red },
  outlineToggle: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  body: { color: colors.ink, fontSize: 12, fontWeight: "600" },
  toggle: { width: 42, height: 24, borderRadius: 12, backgroundColor: "#C7C0B5", padding: 3, justifyContent: "center" },
  toggleOn: { backgroundColor: colors.green, alignItems: "flex-end" },
  toggleDot: { width: 18, height: 18, borderRadius: 9, backgroundColor: colors.surface },
  toggleDotOn: {},
  footerActions: { flexDirection: "row", gap: 10, marginTop: 20 },
  secondary: { flex: 1, height: 48, borderRadius: radius.pill, borderWidth: 1, borderColor: colors.line, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 7 },
  secondaryText: { color: colors.ink, fontSize: 11, fontWeight: "800" },
  export: { flex: 1.3, backgroundColor: colors.red, height: 48, borderRadius: radius.pill, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8 },
  exportText: { color: colors.surface, fontSize: 12, fontWeight: "900" },
  message: { color: colors.green, fontSize: 11, marginTop: 12, textAlign: "center", fontWeight: "700" },
  note: { color: colors.muted, fontSize: 10, lineHeight: 16, marginTop: 13 },
  nextTitle: { color: colors.red, fontSize: 9, fontWeight: "900", letterSpacing: 1.4, marginTop: 27, marginBottom: 12 },
});