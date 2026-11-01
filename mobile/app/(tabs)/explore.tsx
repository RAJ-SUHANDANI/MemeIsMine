import { useCallback, useEffect, useMemo, useState } from "react";
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { Search, SlidersHorizontal, X } from "lucide-react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, useFocusEffect } from "expo-router";
import { TemplateCard } from "../../src/components/TemplateCard";
import { getMemes } from "../../src/lib/api";
import { getBookmarks, toggleBookmark } from "../../src/lib/storage";
import { colors, radius } from "../../src/theme";
import type { MemeTemplate } from "../../src/types";

const sorts = [{ key: "popular", label: "Popular" }, { key: "trending", label: "Trending" }, { key: "recent", label: "Recent" }, { key: "name", label: "A–Z" }];
export default function ExploreScreen() {
  const [items, setItems] = useState<MemeTemplate[]>([]);
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState("popular");
  const [saved, setSaved] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const load = useCallback(async () => {
    const controller = new AbortController();
    try {
      setLoading(true); setError("");
      const [data, bookmarks] = await Promise.all([getMemes({ q: query.trim(), sort, limit: 100, signal: controller.signal }), getBookmarks()]);
      setItems(data); setSaved(bookmarks);
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Could not load memes."); }
    finally { setLoading(false); }
    return () => controller.abort();
  }, [query, sort]);
  useEffect(() => { let cancel: (() => void) | undefined; void load().then((cleanup) => { cancel = cleanup; }); return () => cancel?.(); }, [load]);
  useFocusEffect(useCallback(() => { void getBookmarks().then(setSaved); }, []));
  async function bookmark(id: string) { setSaved(await toggleBookmark(id)); }
  const subtitle = useMemo(() => query ? `MATCHES FOR “${query.toUpperCase()}”` : "THE IMGFLIP IMAGE INDEX", [query]);
  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <View style={styles.header}><Text style={styles.kicker}>BROWSE THE FORMATS</Text><Text style={styles.title}>Find your{"\n"}<Text style={styles.italic}>funny.</Text></Text></View>
      <View style={styles.search}><Search size={18} color={colors.muted}/><TextInput value={query} onChangeText={setQuery} placeholder="Search meme formats…" placeholderTextColor={colors.muted} style={styles.input} returnKeyType="search"/>{query.length > 0 && <Pressable onPress={() => setQuery("")}><X size={16} color={colors.muted}/></Pressable>}</View>
      <View style={styles.sortRow}><SlidersHorizontal size={14} color={colors.muted}/>{sorts.map((item) => <Pressable key={item.key} onPress={() => setSort(item.key)} style={[styles.chip, sort === item.key && styles.chipActive]}><Text style={[styles.chipText, sort === item.key && styles.chipTextActive]}>{item.label}</Text></Pressable>)}</View>
      <View style={styles.countRow}><Text style={styles.sub}>{subtitle}</Text><Text style={styles.count}>{items.length} FORMATS</Text></View>
      {loading ? <ActivityIndicator style={{ marginTop: 45 }} color={colors.red}/> : error ? <Text style={styles.error}>{error}</Text> : (
        <FlatList
          data={items}
          keyExtractor={(item) => item.id}
          numColumns={2}
          contentContainerStyle={styles.list}
          columnWrapperStyle={styles.columns}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => <View style={styles.cell}><TemplateCard item={item} saved={saved.includes(item.id)} onPress={() => router.push({ pathname: "/editor/[id]", params: { id: item.id } })} onBookmark={() => bookmark(item.id)}/></View>}
          ListEmptyComponent={<View style={styles.empty}><Text style={styles.emptyTitle}>Nothing in this frame.</Text><Text style={styles.sub}>Try a different name or clear your search.</Text></View>}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.paper },
  header: { paddingHorizontal: 22, paddingTop: 18, paddingBottom: 16 },
  kicker: { color: colors.red, fontSize: 9, fontWeight: "900", letterSpacing: 1.8 },
  title: { color: colors.ink, fontSize: 43, lineHeight: 45, fontWeight: "900", letterSpacing: -2, marginTop: 8 },
  italic: { fontFamily: "Georgia", fontStyle: "italic", color: colors.red, fontWeight: "400" },
  search: { marginHorizontal: 20, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line, height: 49, borderRadius: radius.md, flexDirection: "row", alignItems: "center", paddingHorizontal: 13, gap: 10 },
  input: { flex: 1, color: colors.ink, fontSize: 13, paddingVertical: 0 },
  sortRow: { flexDirection: "row", alignItems: "center", gap: 7, paddingHorizontal: 20, paddingTop: 15, paddingBottom: 12 },
  chip: { borderRadius: radius.pill, paddingHorizontal: 11, paddingVertical: 7, borderWidth: 1, borderColor: colors.line },
  chipActive: { backgroundColor: colors.ink, borderColor: colors.ink },
  chipText: { color: colors.muted, fontSize: 10, fontWeight: "700" },
  chipTextActive: { color: colors.surface },
  countRow: { flexDirection: "row", justifyContent: "space-between", paddingHorizontal: 21, paddingBottom: 10 },
  sub: { color: colors.muted, fontSize: 8, fontWeight: "800", letterSpacing: 1.2 },
  count: { color: colors.red, fontSize: 8, fontWeight: "900", letterSpacing: 1 },
  list: { paddingHorizontal: 18, paddingBottom: 25 },
  columns: { gap: 12 },
  cell: { width: "48%" },
  error: { color: colors.red, padding: 22 },
  empty: { padding: 35, alignItems: "center", gap: 8 },
  emptyTitle: { fontSize: 19, fontWeight: "900", color: colors.ink },
});