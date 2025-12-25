/**
 * @file page.tsx
 * @description AI Chat tab page for bottom navigation
 * @author retrozenith <80767544+retrozenith@users.noreply.github.com>
 * @version 1.0.0
 * @since 2025-12-25
 */

import { Stack } from "expo-router";
import { View } from "react-native";
import { AIChat } from "@/components/ai/AIChat";

export default function AIChatTabPage() {
  return (
    <View className='flex-1 bg-black'>
      <Stack.Screen
        options={{
          headerShown: false,
        }}
      />
      <AIChat />
    </View>
  );
}
