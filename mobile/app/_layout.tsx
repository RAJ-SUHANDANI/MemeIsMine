import { Stack } from "expo-router";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { View } from "react-native";
import { colors } from "../src/theme";

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <View style={{ flex: 1, backgroundColor: colors.paper }}>
          <StatusBar style="dark" />
          <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.paper }, animation: "fade_from_bottom" }}>
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="editor/[id]" options={{ animation: "slide_from_right" }} />
            <Stack.Screen name="video/[id]" options={{ animation: "slide_from_right" }} />
            <Stack.Screen name="video-editor/[id]" options={{ animation: "slide_from_right" }} />
            <Stack.Screen name="upload" options={{ presentation: "modal", animation: "slide_from_bottom" }} />
          </Stack>
        </View>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}