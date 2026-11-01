import { Tabs } from "expo-router";
import { Compass, Film, House, Layers3, UserRound } from "lucide-react-native";
import { colors } from "../../src/theme";

export default function TabLayout() {
  return (
    <Tabs screenOptions={{
      headerShown: false,
      tabBarActiveTintColor: colors.red,
      tabBarInactiveTintColor: colors.muted,
      tabBarStyle: { backgroundColor: colors.surface, borderTopColor: colors.line, height: 84, paddingTop: 10, paddingBottom: 22, elevation: 0 },
      tabBarLabelStyle: { fontSize: 10, fontWeight: "700", letterSpacing: 0.2 },
    }}>
      <Tabs.Screen name="index" options={{ title: "For you", tabBarIcon: ({ color, size }) => <House color={color} size={size}/> }}/>
      <Tabs.Screen name="explore" options={{ title: "Explore", tabBarIcon: ({ color, size }) => <Compass color={color} size={size}/> }}/>
      <Tabs.Screen name="videos" options={{ title: "Motion", tabBarIcon: ({ color, size }) => <Film color={color} size={size}/> }}/>
      <Tabs.Screen name="studio" options={{ title: "Studio", tabBarIcon: ({ color, size }) => <Layers3 color={color} size={size}/> }}/>
      <Tabs.Screen name="profile" options={{ title: "You", tabBarIcon: ({ color, size }) => <UserRound color={color} size={size}/> }}/>
    </Tabs>
  );
}