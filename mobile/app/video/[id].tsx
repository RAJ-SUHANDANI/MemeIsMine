import { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Image } from "expo-image";
import { useEvent } from "expo";
import { useVideoPlayer, VideoView } from "expo-video";
import { useLocalSearchParams, router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { ArrowLeft, Bookmark, Film, Pause, Play, Volume2, VolumeX, WandSparkles } from "lucide-react-native";
import { getVideos, videoUri } from "../../src/lib/api";
import { getBookmarks, toggleBookmark } from "../../src/lib/storage";
import { colors, radius } from "../../src/theme";
import type { VideoTemplate } from "../../src/types";

export default function VideoTemplateScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [template, setTemplate] = useState<VideoTemplate | null>(null);
  const [saved, setSaved] = useState(false);
  const [muted, setMuted] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let alive = true;
    const controller = new AbortController();
    void Promise.all([getVideos({ limit: 100, signal: controller.signal }), getBookmarks()]).then(([data, bookmarks]) => {
      if (!alive) return;
      const found = data.templates.find((item) => item.id === id);
      if (!found) throw new Error("This moving template could not be found.");
      setTemplate(found);
      setSaved(bookmarks.includes(`video:${id}`));
    }).catch((reason) => { if (alive) setError(reason instanceof Error ? reason.message : "Could not load this clip."); });
    return () => { alive = false; controller.abort(); };
  }, [id]);

  const source = useMemo(() => template?.mediaType === "video" ? { uri: videoUri(template.url, template.sourcePage) } : null, [template]);
  const player = useVideoPlayer(source, (instance) => {
    instance.loop = true;
    instance.muted = true;
    instance.play();
  });
  const { playing } = useEvent(player, "playingChange", { playing: player.playing });
  const { status, error: playerError } = useEvent(player, "statusChange", { status: player.status, error: player.error });
  const poster = template?.posterUrl || (template?.mediaType === "gif" ? template.url : null);

  async function toggleSave() {
    const next = await toggleBookmark(`video:${id}`);
    setSaved(next.includes(`video:${id}`));
  }
  function togglePlayback() {
    try { if (playing) player.pause(); else player.play(); }
    catch { Alert.alert("Playback unavailable", "This clip could not be played on this device."); }
  }
  function toggleAudio() {
    const next = !muted;
    setMuted(next);
    player.muted = next;
  }

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <View style={styles.topbar}>
        <Pressable onPress={() => router.back()} style={styles.back}><ArrowLeft size={18} color={colors.ink}/></Pressable>
        <View style={{ flex: 1 }}><Text style={styles.kicker}>MOTION ARCHIVE</Text><Text style={styles.topTitle}>One good reaction.</Text></View>
        <Pressable onPress={() => void toggleSave()} style={styles.save}><Bookmark size={17} color={saved ? colors.red : colors.ink} fill={saved ? colors.red : "transparent"}/></Pressable>
      </View>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.kicker}>{template?.mediaType === "gif" ? "ANIMATED GIF" : "VIDEO TEMPLATE"}</Text>
        <Text style={styles.title}>{template?.name || "Loading clip…"}</Text>
        <View style={styles.playerFrame}>
          {template?.mediaType === "video" ? (
            <VideoView player={player} style={styles.player} contentFit="contain" nativeControls={false} allowsFullscreen allowsPictureInPicture/>
          ) : template?.mediaType === "gif" && poster ? (
            <Image source={{ uri: poster }} style={styles.player} contentFit="contain" />
          ) : (
            <View style={styles.placeholder}><Film size={27} color={colors.red}/>{error ? <Text style={styles.error}>{error}</Text> : <ActivityIndicator color={colors.red}/>}</View>
          )}
          {!!template && <View style={styles.controls}>
            <Pressable onPress={togglePlayback} style={styles.control}>{playing ? <Pause size={17} color={colors.surface}/> : <Play size={17} color={colors.surface}/>}</Pressable>
            {template.mediaType === "video" && <Pressable onPress={toggleAudio} style={styles.control}>{muted ? <VolumeX size={16} color={colors.surface}/> : <Volume2 size={16} color={colors.surface}/>}</Pressable>}
            <Text style={styles.controlLabel}>{template.mediaType === "gif" ? "ANIMATED PREVIEW" : status === "error" || playerError ? "PREVIEW UNAVAILABLE" : playing ? "PLAYING" : "PAUSED"}</Text>
          </View>}
        </View>
        {!!error && <Text style={styles.error}>{error}</Text>}
        {!!template && <Pressable onPress={() => router.push({ pathname: "/video-editor/[id]", params: { id } })} style={styles.editButton}><WandSparkles size={16} color={colors.surface}/><Text style={styles.editButtonText}>Open native motion editor</Text></Pressable>}
        <View style={styles.meta}>
          <View><Text style={styles.metaLabel}>FORMAT</Text><Text style={styles.metaValue}>{template?.mediaType === "gif" ? "LOOPING GIF" : "VIDEO CLIP"}</Text></View>
          <View><Text style={styles.metaLabel}>COLLECTION</Text><Text style={styles.metaValue}>{template?.category || "VIDEO MEMES"}</Text></View>
        </View>
        <View style={styles.note}><Text style={styles.noteTitle}>A NOTE ON VIDEO EDITING</Text><Text style={styles.noteCopy}>This screen previews the original moving template. Native video caption rendering and MP4 export are not yet connected; the web editor’s browser-based WebM renderer cannot be reused directly in Expo.</Text></View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.paper },
  topbar: { minHeight: 62, paddingHorizontal: 17, flexDirection: "row", alignItems: "center", gap: 12, borderBottomWidth: 1, borderBottomColor: colors.line },
  back: { width: 36, height: 36, borderWidth: 1, borderColor: colors.line, borderRadius: 18, alignItems: "center", justifyContent: "center" },
  kicker: { color: colors.red, fontSize: 8, fontWeight: "900", letterSpacing: 1.3 },
  topTitle: { color: colors.ink, fontSize: 14, fontWeight: "900", marginTop: 3 },
  save: { width: 37, height: 37, borderWidth: 1, borderColor: colors.line, borderRadius: 19, alignItems: "center", justifyContent: "center" },
  content: { padding: 20, paddingBottom: 32 },
  title: { color: colors.ink, fontSize: 30, lineHeight: 35, fontWeight: "900", letterSpacing: -1.2, marginTop: 7, marginBottom: 18 },
  playerFrame: { borderRadius: radius.lg, overflow: "hidden", backgroundColor: "#211F1B", minHeight: 250, aspectRatio: 1, justifyContent: "center" },
  player: { width: "100%", height: "100%" },
  placeholder: { minHeight: 250, alignItems: "center", justifyContent: "center", gap: 12 },
  controls: { position: "absolute", bottom: 12, left: 12, right: 12, flexDirection: "row", alignItems: "center", gap: 8 },
  control: { width: 36, height: 36, backgroundColor: "rgba(24,23,19,.86)", borderRadius: 18, alignItems: "center", justifyContent: "center" },
  controlLabel: { color: colors.surface, fontSize: 8, fontWeight: "900", letterSpacing: 1, marginLeft: 4 },
  editButton: { height: 48, backgroundColor: colors.red, borderRadius: radius.pill, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, marginTop: 17 },
  editButtonText: { color: colors.surface, fontSize: 11, fontWeight: "900" },
  meta: { flexDirection: "row", gap: 35, marginTop: 21, paddingBottom: 18, borderBottomWidth: 1, borderColor: colors.line },
  metaLabel: { color: colors.muted, fontSize: 8, fontWeight: "900", letterSpacing: 1.1 },
  metaValue: { color: colors.ink, fontSize: 11, fontWeight: "800", marginTop: 5 },
  note: { backgroundColor: "#E8E1D7", borderRadius: radius.md, padding: 15, marginTop: 20 },
  noteTitle: { color: colors.red, fontSize: 8, fontWeight: "900", letterSpacing: 1.1 },
  noteCopy: { color: colors.muted, fontSize: 11, lineHeight: 17, marginTop: 7 },
  error: { color: colors.red, fontSize: 11, marginTop: 8 },
});