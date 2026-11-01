import { Pressable, StyleSheet, Text, View } from "react-native";
import { Image } from "expo-image";
import { Bookmark, Play } from "lucide-react-native";
import { colors, radius } from "../theme";
import { imageUri } from "../lib/api";
import type { MemeTemplate, VideoTemplate } from "../types";

type Props = {
  item: MemeTemplate | VideoTemplate;
  kind?: "image" | "video";
  saved?: boolean;
  onPress: () => void;
  onBookmark?: () => void;
  compact?: boolean;
};

export function TemplateCard({ item, kind = "image", saved = false, onPress, onBookmark, compact = false }: Props) {
  const isVideo = kind === "video";
  const source = isVideo ? (item as VideoTemplate).posterUrl || item.url : item.url;
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.card, compact && styles.compact, pressed && styles.pressed]}>
      <View style={styles.art}>
        <Image
          source={{ uri: imageUri(source) }}
          style={StyleSheet.absoluteFill}
          contentFit="cover"
          transition={180}
          cachePolicy="memory-disk"
        />
        {isVideo && <View style={styles.play}><Play size={14} color={colors.white} fill={colors.white}/></View>}
        {!!onBookmark && (
          <Pressable onPress={(event) => { event.stopPropagation(); onBookmark(); }} hitSlop={10} style={styles.bookmark}>
            <Bookmark size={16} color={colors.ink} fill={saved ? colors.red : "transparent"}/>
          </Pressable>
        )}
      </View>
      <View style={styles.meta}>
        <Text numberOfLines={1} style={styles.name}>{item.name}</Text>
        <Text numberOfLines={1} style={styles.category}>{item.category || (isVideo ? "MOVING MEME" : "IMGFLIP FORMAT")}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { flex: 1, minWidth: 0, marginBottom: 18 },
  compact: { marginBottom: 12 },
  pressed: { opacity: 0.78, transform: [{ scale: 0.985 }] },
  art: { height: 174, overflow: "hidden", borderRadius: radius.md, backgroundColor: "#DDD5C9", position: "relative" },
  play: { position: "absolute", right: 10, bottom: 10, width: 32, height: 32, borderRadius: 16, backgroundColor: "rgba(24,23,19,.78)", alignItems: "center", justifyContent: "center" },
  bookmark: { position: "absolute", top: 9, right: 9, backgroundColor: colors.surface, width: 32, height: 32, borderRadius: 16, alignItems: "center", justifyContent: "center" },
  meta: { paddingTop: 9, gap: 3 },
  name: { color: colors.ink, fontSize: 13, fontWeight: "700", letterSpacing: -0.2 },
  category: { color: colors.muted, fontSize: 9, letterSpacing: 1, fontWeight: "700", textTransform: "uppercase" },
});
