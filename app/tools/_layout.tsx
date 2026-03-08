import { Stack } from "expo-router";
import { Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import Colors from "@/constants/colors";

const C = Colors.dark;

export default function ToolsLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: C.background },
        headerTintColor: C.text,
        headerTitleStyle: { fontFamily: "Inter_600SemiBold", fontSize: 17 },
        headerLeft: () => (
          <Pressable onPress={() => router.back()} style={{ padding: 4 }}>
            <Ionicons name="arrow-back" size={24} color={C.text} />
          </Pressable>
        ),
        contentStyle: { backgroundColor: C.background },
      }}
    >
      <Stack.Screen name="code-analyzer" options={{ title: "Code Analyzer" }} />
      <Stack.Screen name="coding-feedback" options={{ title: "Coding Interview" }} />
      <Stack.Screen name="interview" options={{ title: "Interview Simulator" }} />
      <Stack.Screen name="resume" options={{ title: "Resume Analyzer" }} />
      <Stack.Screen name="career" options={{ title: "Career Advisor" }} />
      <Stack.Screen name="github" options={{ title: "GitHub Analyzer" }} />
    </Stack>
  );
}
