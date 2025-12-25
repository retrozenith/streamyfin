/**
 * @file AIChatButton.tsx
 * @description Button component to open AI chat from item pages
 * @author retrozenith <80767544+retrozenith@users.noreply.github.com>
 * @version 1.0.0
 * @since 2025-12-25
 */

import { Ionicons } from "@expo/vector-icons";
import type { BaseItemDto } from "@jellyfin/sdk/lib/generated-client/models";
import { useRouter } from "expo-router";
import React from "react";
import { Pressable } from "react-native";
import { useSettings } from "@/utils/atoms/settings";

interface AIChatButtonProps {
  item: BaseItemDto;
  size?: "small" | "large";
}

/**
 * Button to open AI chat with current item context.
 * Only visible when AI is enabled and configured.
 */
export const AIChatButton: React.FC<AIChatButtonProps> = ({
  item,
  size = "large",
}) => {
  const router = useRouter();
  const { settings } = useSettings();

  const isEnabled = settings.enableAIChat;
  const isConfigured = Boolean(settings.openRouterApiKey);

  if (!isEnabled || !isConfigured) {
    return null;
  }

  const iconSize = size === "large" ? 22 : 18;

  const handlePress = () => {
    router.push({
      pathname: "/ai-chat" as any,
      params: { itemId: item.Id },
    });
  };

  return (
    <Pressable
      onPress={handlePress}
      className='ml-2'
      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
    >
      <Ionicons name='sparkles' size={iconSize} color='#a855f7' />
    </Pressable>
  );
};
