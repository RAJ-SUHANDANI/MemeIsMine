import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { Film, Search, Sparkles, X } from "lucide-react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, useFocusEffect } from "expo-router";
import { TemplateCard } from "../../src/components/TemplateCard";
import { getVideos } from "../../src/lib/api";
import { getBookmarks, toggleBookmark } from "../../src/lib/storage";
import { colors, radius } from "../../src/theme";
import type { VideoTemplate } from "../../src/types";

const filters = [{ key: "popular", label: "Popular" }, { key: "trending", label: "Trending" }, { key: "recent", label: "Recent" }, { key: "name", label: "A–Z" }, { key: "surprise", label: "Surprise me" }];
export default function VideosScreen() {
  const [items, setItems] = useState<VideoTemplate[]>([]);
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState("popular");
  const [saved, setSaved] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [seed, setSeed] = useState(1);
  useEffect(() => {
    const controller = new AbortController();
    let alive = true;
    setLoading(true);
    setError("");
    void Promise.all([
      getVideos({ q: query.trim(), sort, page: 1, limit: 60, signal: controller.signal }),
      getBookmarks()
    ]).then(([data, bookmarks]) => {
      if (!alive) return;
      setItems(data.templates);
      setSaved(bookmarks);
    }).catch((reason) => {
      if (alive && !(reason instanceof Error && reason.name === "AbortError")) {
        setError(reason instanceof Error ? reason.message : "Could not load moving templates.");
      }
    }).finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; controller.abort(); };
  }, [query, sort, seed]);
  useFocusEffect(useCallback(() => { void getBookmarks().then(setSaved); }, []));
  async function bookmark(id: string) { setSaved(await toggleBookmark(`video:${id}`)); }
  function choose(key: string) { setSort(key); if (key === "surprise") setSeed((value) => value + 1); }
  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <View style={styles.header}>
        <View style={styles.headingRow}><View><Text style={styles.kicker}>THE MOVING PICTURE SHOW</Text><Text style={styles.title}>Memes in{"\n"}<Text style={styles.italic}>motion.</Text></Text></View><View style={styles.filmIcon}><Film color={colors.surface} size={24}/></View></View>
        <Text style={styles.copy}>GIFs and video clips, ready for your next reaction.</Text>
      </View>
      <View style={styles.search}><Search color={colors.muted} size={18}/><TextInput value={query} onChangeText={setQuery} placeholder="Find a moving format…" placeholderTextColor={colors.muted} style={styles.input}/>{query.length > 0 && <Pressable onPress={() => setQuery("")}><X size={16} color={colors.muted}/></Pressable>}</View>
      <View style={styles.filters}>{filters.map((item) => <Pressable key={item.key} onPress={() => choose(item.key)} style={[styles.filter, sort === item.key && styles.active]}><Text style={[styles.filterText, sort === item.key && styles.activeText]}>{item.key === "surprise" ? "✳ " : ""}{item.label}</Text></Pressable>)}</View>
      <View style={styles.resultLine}><Text style={styles.kicker}>{query ? "SEARCH RESULTS" : "CURATED MOTION FORMATS"}</Text><Text style={styles.total}>{items.length} CLIPS</Text></View>
      {loading ? <ActivityIndicator color={colors.red} style={{ marginTop: 45 }}/> : error ? <Text style={styles.error}>{error}</Text> : (
        <FlatList
          data={items}
          numColumns={2}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          columnWrapperStyle={styles.columns}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => <View style={styles.cell}><TemplateCard item={item} kind="video" saved={saved.includes(`video:${item.id}`)} onPress={() => router.push({ pathname: "/video/[id]", params: { id: item.id } })} onBookmark={() => bookmark(item.id)}/></View>}
          ListEmptyComponent={<View style={styles.empty}><Sparkles size={25} color={colors.red}/><Text style={styles.emptyTitle}>No motion found.</Text><Text style={styles.copy}>Try another search and we'll take it from there.</Text></View>}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.paper },
  header: { paddingHorizontal: 22, paddingTop: 18, paddingBottom: 17 },
  headingRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  kicker: { color: colors.red, fontSize: 9, fontWeight: "900", letterSpacing: 1.6 },
  title: { color: colors.ink, fontSize: 43, lineHeight: 45, fontWeight: "900", letterSpacing: -2, marginTop: 8 },
  italic: { fontFamily: "Georgia", fontStyle: "italic", color: colors.red, fontWeight: "400" },
  filmIcon: { width: 56, height: 56, backgroundColor: colors.ink, borderRadius: 18, alignItems: "center", justifyContent: "center", transform: [{ rotate: "6deg" }] },
  copy: { color: colors.muted, fontSize: 12, lineHeight: 18, marginTop: 8 },
  search: { marginHorizontal: 20, height: 47, borderRadius: radius.md, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line, flexDirection: "row", alignItems: "center", paddingHorizontal: 13, gap: 9 },
  input: { flex: 1, fontSize: 13, color: colors.ink, paddingVertical: 0 },
  filters: { flexDirection: "row", flexWrap: "wrap", gap: 6, paddingHorizontal: 20, paddingTop: 14, paddingBottom: 12 },
  filter: { borderRadius: radius.pill, paddingHorizontal: 10, paddingVertical: 7, borderWidth: 1, borderColor: colors.line },
  active: { backgroundColor: colors.ink, borderColor: colors.ink },
  filterText: { color: colors.muted, fontSize: 9, fontWeight: "700" },
  activeText: { color: colors.surface },
  resultLine: { paddingHorizontal: 21, paddingBottom: 10, flexDirection: "row", justifyContent: "space-between" },
  total: { color: colors.muted, fontSize: 8, fontWeight: "800", letterSpacing: 1 },
  list: { paddingHorizontal: 18, paddingBottom: 24 },
  columns: { gap: 12 },
  cell: { width: "48%" },
  error: { color: colors.red, padding: 22 },
  empty: { alignItems: "center", padding: 35, gap: 9 },
  emptyTitle: { color: colors.ink, fontSize: 19, fontWeight: "900" },
});