import { Tabs } from "expo-router";
import { Camera, Crown, House, Layers3, Sticker } from "lucide-react-native";
import { colors } from "../../src/theme";

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.red,
        tabBarInactiveTintColor: colors.muted,
        tabBarHideOnKeyboard: true,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.line,
          borderTopWidth: 1,
          height: 82,
          paddingTop: 9,
          paddingBottom: 20,
          elevation: 0,
        },
        tabBarItemStyle: { marginHorizontal: 3, borderRadius: 14 },
        tabBarLabelStyle: { fontSize: 9, fontWeight: "800", letterSpacing: 0.1, marginTop: 2 },
      }}
    >
      <Tabs.Screen name="index" options={{ title: "For you", tabBarAccessibilityLabel: "For you home", tabBarIcon: ({ color, size }) => <House color={color} size={size} /> }} />
      <Tabs.Screen name="battle" options={{ title: "Battle", tabBarAccessibilityLabel: "Daily Meme Battle", tabBarIcon: ({ color, size }) => <Crown color={color} size={size} /> }} />
      <Tabs.Screen name="memecam" options={{ title: "MemeCam", tabBarAccessibilityLabel: "Open MemeCam", tabBarIcon: ({ color, size }) => <Camera color={color} size={size} /> }} />
      <Tabs.Screen name="vault" options={{ title: "MemeVault", tabBarAccessibilityLabel: "Open sticker vault", tabBarIcon: ({ color, size }) => <Sticker color={color} size={size} /> }} />
      <Tabs.Screen name="studio" options={{ title: "Studio", tabBarAccessibilityLabel: "Your saved projects", tabBarIcon: ({ color, size }) => <Layers3 color={color} size={size} /> }} />
      <Tabs.Screen name="explore" options={{ href: null }} />
      <Tabs.Screen name="videos" options={{ href: null }} />
      <Tabs.Screen name="profile" options={{ href: null }} />
    </Tabs>
  );
}
