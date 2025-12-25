/**
 * @file ai-chat.tsx
 * @description AI chat screen/modal for content-aware conversations
 * @author retrozenith <80767544+retrozenith@users.noreply.github.com>
 * @version 1.0.0
 * @since 2025-12-25
 */

import { ItemFields } from "@jellyfin/sdk/lib/generated-client";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { View } from "react-native";
import { AIChat } from "@/components/ai/AIChat";
import { useItemQuery } from "@/hooks/useItemQuery";

export default function AIChatScreen() {
  const router = useRouter();
  const { itemId } = useLocalSearchParams<{ itemId?: string }>();

  const { data: item } = useItemQuery(itemId ?? "", !itemId, undefined, [
    ItemFields.Overview,
    ItemFields.Genres,
    ItemFields.People,
  ]);

  const handleClose = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace("/");
    }
  };

  return (
    <View className='flex-1 bg-black'>
      <Stack.Screen
        options={{
          headerShown: false,
          presentation: "modal",
          animation: "slide_from_bottom",
        }}
      />
      <AIChat item={item ?? undefined} onClose={handleClose} />
    </View>
  );
}
