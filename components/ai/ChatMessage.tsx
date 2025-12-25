/**
 * @file ChatMessage.tsx
 * @description Individual message bubble component for AI chat
 * @author retrozenith <80767544+retrozenith@users.noreply.github.com>
 * @version 1.0.0
 * @since 2025-12-25
 */

import { Ionicons } from "@expo/vector-icons";
import React, { useCallback } from "react";
import { Clipboard, Pressable, View } from "react-native";
import { toast } from "sonner-native";
import { Text } from "@/components/common/Text";
import type { ChatMessage as ChatMessageType } from "@/hooks/useAIChat";

interface ChatMessageProps {
  message: ChatMessageType;
}

/**
 * Renders a single chat message bubble.
 * User messages are aligned right with purple background.
 * Assistant messages are aligned left with neutral background.
 */
export const ChatMessage: React.FC<ChatMessageProps> = React.memo(
  ({ message }) => {
    const isUser = message.role === "user";
    const isError = message.isError;

    const copyToClipboard = useCallback(() => {
      Clipboard.setString(message.content);
      toast.success("Copied to clipboard");
    }, [message.content]);

    return (
      <View
        className={`flex flex-row ${isUser ? "justify-end" : "justify-start"} mb-3`}
      >
        <View
          className={`max-w-[85%] rounded-2xl px-4 py-3 ${
            isUser
              ? "bg-purple-600 rounded-br-sm"
              : isError
                ? "bg-red-900/50 rounded-bl-sm"
                : "bg-neutral-800 rounded-bl-sm"
          }`}
        >
          <Text
            className={`text-base ${isUser ? "text-white" : isError ? "text-red-200" : "text-neutral-100"}`}
          >
            {message.content}
          </Text>

          {!isUser && !isError && (
            <Pressable
              onPress={copyToClipboard}
              className='flex flex-row items-center mt-2 opacity-60'
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name='copy-outline' size={14} color='#a3a3a3' />
              <Text className='text-xs text-neutral-400 ml-1'>Copy</Text>
            </Pressable>
          )}
        </View>
      </View>
    );
  },
);

ChatMessage.displayName = "ChatMessage";
