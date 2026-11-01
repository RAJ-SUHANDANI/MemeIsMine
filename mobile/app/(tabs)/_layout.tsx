import { Tabs } from "expo-router";
import { Camera, Crown, House, Layers3, Sticker } from "lucide-react-native";
import { colors } from "../../src/theme";

export default function TabLayout() {
  return (
    <Tabs screenOptions={{
      headerShown: false,
      tabBarActiveTintColor: colors.red,
      tabBarInactiveTintColor: colors.muted,
      tabBarStyle: { backgroundColor: colors.surface, borderTopColor: colors.line, height: 84, paddingTop: 10, paddingBottom: 22, elevation: 0 },
      tabBarLabelStyle: { fontSize: 9, fontWeight: "800", letterSpacing: 0.1 },
    }}>
      <Tabs.Screen name="index" options={{ title: "For you", tabBarIcon: ({ color, size }) => <House color={color} size={size}/> }}/>
      <Tabs.Screen name="battle" options={{ title: "Battle", tabBarIcon: ({ color, size }) => <Crown color={color} size={size}/> }}/>
      <Tabs.Screen name="memecam" options={{ title: "MemeCam", tabBarIcon: ({ color, size }) => <Camera color={color} size={size}/> }}/>
      <Tabs.Screen name="vault" options={{ title: "MemeVault", tabBarIcon: ({ color, size }) => <Sticker color={color} size={size}/> }}/>
      <Tabs.Screen name="studio" options={{ title: "Studio", tabBarIcon: ({ color, size }) => <Layers3 color={color} size={size}/> }}/>
      <Tabs.Screen name="explore" options={{ href: null }}/>
      <Tabs.Screen name="videos" options={{ href: null }}/>
      <Tabs.Screen name="profile" options={{ href: null }}/>
    </Tabs>
  );
}