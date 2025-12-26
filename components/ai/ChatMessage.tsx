/**
 * @file ChatMessage.tsx
 * @description Individual message bubble component for AI chat with markdown support
 * @author retrozenith <80767544+retrozenith@users.noreply.github.com>
 * @version 1.1.0
 * @since 2025-12-25
 */

import { Ionicons } from "@expo/vector-icons";
import React, { useCallback, useMemo } from "react";
import { Clipboard, Pressable, StyleSheet, View } from "react-native";
import Markdown from "react-native-markdown-display";
import { toast } from "sonner-native";
import { Text } from "@/components/common/Text";
import type { ChatMessage as ChatMessageType } from "@/hooks/useAIChat";

interface ChatMessageProps {
  message: ChatMessageType;
}

/**
 * Markdown styles for assistant messages.
 */
const markdownStyles = StyleSheet.create({
  body: {
    color: "#f5f5f5",
    fontSize: 15,
    lineHeight: 22,
  },
  heading1: {
    color: "#ffffff",
    fontSize: 20,
    fontWeight: "700",
    marginTop: 8,
    marginBottom: 4,
  },
  heading2: {
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "600",
    marginTop: 8,
    marginBottom: 4,
  },
  heading3: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
    marginTop: 6,
    marginBottom: 2,
  },
  strong: {
    color: "#ffffff",
    fontWeight: "600",
  },
  em: {
    color: "#e5e5e5",
    fontStyle: "italic",
  },
  bullet_list: {
    marginVertical: 4,
  },
  ordered_list: {
    marginVertical: 4,
  },
  list_item: {
    marginVertical: 2,
  },
  bullet_list_icon: {
    color: "#a855f7",
    marginRight: 8,
  },
  code_inline: {
    backgroundColor: "#374151",
    color: "#e879f9",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    fontFamily: "monospace",
    fontSize: 13,
  },
  code_block: {
    backgroundColor: "#1f2937",
    padding: 12,
    borderRadius: 8,
    marginVertical: 8,
  },
  fence: {
    backgroundColor: "#1f2937",
    padding: 12,
    borderRadius: 8,
    marginVertical: 8,
  },
  blockquote: {
    backgroundColor: "#1f2937",
    borderLeftColor: "#a855f7",
    borderLeftWidth: 3,
    paddingLeft: 12,
    paddingVertical: 4,
    marginVertical: 8,
  },
  link: {
    color: "#a855f7",
    textDecorationLine: "underline",
  },
  paragraph: {
    marginVertical: 4,
  },
  hr: {
    backgroundColor: "#374151",
    height: 1,
    marginVertical: 12,
  },
});

/**
 * Renders a single chat message bubble.
 * User messages are aligned right with purple background (plain text).
 * Assistant messages are aligned left with neutral background (markdown rendered).
 */
export const ChatMessage: React.FC<ChatMessageProps> = React.memo(
  ({ message }) => {
    const isUser = message.role === "user";
    const isError = message.isError;

    const copyToClipboard = useCallback(() => {
      Clipboard.setString(message.content);
      toast.success("Copied to clipboard");
    }, [message.content]);

    const renderContent = useMemo(() => {
      if (isUser || isError) {
        // User messages and errors: plain text
        return (
          <Text
            className={`text-base ${isUser ? "text-white" : "text-red-200"}`}
          >
            {message.content}
          </Text>
        );
      }

      // Assistant messages: render markdown with link handler
      return (
        <Markdown
          style={markdownStyles}
          onLinkPress={(url) => {
            const {
              handleChatLink,
              isChatLink,
            } = require("@/utils/ai-tools/chatLinkHandler");
            if (isChatLink(url)) {
              handleChatLink(url);
              return false; // Prevent default
            }
            return true; // Allow default for external links
          }}
        >
          {message.content}
        </Markdown>
      );
    }, [isUser, isError, message.content]);

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
          {renderContent}

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
