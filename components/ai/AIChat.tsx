/**
 * @file AIChat.tsx
 * @description Main AI chat container component with message list and input
 * @author retrozenith <80767544+retrozenith@users.noreply.github.com>
 * @version 1.0.0
 * @since 2025-12-25
 */

import { Ionicons } from "@expo/vector-icons";
import type { BaseItemDto } from "@jellyfin/sdk/lib/generated-client/models";
import React, { useCallback, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Text } from "@/components/common/Text";
import { extractMediaContext, useAIChat } from "@/hooks/useAIChat";
import { ChatMessage } from "./ChatMessage";

interface AIChatProps {
  item?: BaseItemDto;
  onClose?: () => void;
}

/**
 * Main AI chat component with message history and input.
 * Provides content-aware responses based on the current media item.
 */
export const AIChat: React.FC<AIChatProps> = ({ item, onClose }) => {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const scrollViewRef = useRef<ScrollView>(null);
  const [inputText, setInputText] = useState("");

  const mediaContext = item ? extractMediaContext(item) : undefined;
  const {
    messages,
    isLoading,
    isEnabled,
    isConfigured,
    sendMessage,
    clearChat,
  } = useAIChat(mediaContext);

  const handleSend = useCallback(async () => {
    if (!inputText.trim() || isLoading) return;

    const text = inputText.trim();
    setInputText("");
    await sendMessage(text);

    // Scroll to bottom after sending
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  }, [inputText, isLoading, sendMessage]);

  const handleClear = useCallback(() => {
    clearChat();
  }, [clearChat]);

  if (!isEnabled || !isConfigured) {
    return (
      <View className='flex-1 items-center justify-center p-4'>
        <Ionicons
          name='chatbubble-ellipses-outline'
          size={48}
          color='#6b7280'
        />
        <Text className='text-neutral-400 text-center mt-4'>
          {!isConfigured
            ? t("home.settings.plugins.ai.not_configured")
            : t("home.settings.plugins.ai.disabled")}
        </Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      className='flex-1 bg-black'
      keyboardVerticalOffset={Platform.OS === "ios" ? 50 : 0}
    >
      {/* Header */}
      <View
        className='flex flex-row items-center justify-between px-4 py-3 border-b border-neutral-800'
        style={{ paddingTop: insets.top + 12 }}
      >
        <View className='flex flex-row items-center'>
          <Ionicons name='sparkles' size={20} color='#a855f7' />
          <Text className='text-lg font-semibold ml-2'>
            {t("home.settings.plugins.ai.title")}
          </Text>
        </View>
        <View className='flex flex-row items-center'>
          {messages.length > 0 && (
            <Pressable
              onPress={handleClear}
              className='mr-4'
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name='trash-outline' size={22} color='#6b7280' />
            </Pressable>
          )}
          {onClose && (
            <Pressable
              onPress={onClose}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name='close' size={24} color='#6b7280' />
            </Pressable>
          )}
        </View>
      </View>

      {/* Messages */}
      <ScrollView
        ref={scrollViewRef}
        className='flex-1 px-4'
        contentContainerStyle={{
          paddingTop: 16,
          paddingBottom: 16,
        }}
        onContentSizeChange={() =>
          scrollViewRef.current?.scrollToEnd({ animated: true })
        }
      >
        {messages.length === 0 ? (
          <View className='items-center py-8'>
            <Ionicons name='chatbubbles-outline' size={40} color='#4b5563' />
            <Text className='text-neutral-500 text-center mt-3 px-4'>
              {item
                ? t("home.settings.plugins.ai.chat.welcome", {
                    title: item.Name,
                  })
                : t("home.settings.plugins.ai.chat.welcome_generic")}
            </Text>
            {item && (
              <View className='flex flex-row flex-wrap justify-center mt-4 gap-2'>
                <Pressable
                  onPress={() => sendMessage("What is this about?")}
                  className='bg-neutral-800 px-3 py-2 rounded-full'
                >
                  <Text className='text-sm text-neutral-300'>
                    What is this about?
                  </Text>
                </Pressable>
                <Pressable
                  onPress={() => sendMessage("Suggest similar content")}
                  className='bg-neutral-800 px-3 py-2 rounded-full'
                >
                  <Text className='text-sm text-neutral-300'>
                    Similar content
                  </Text>
                </Pressable>
                <Pressable
                  onPress={() => sendMessage("Tell me some trivia")}
                  className='bg-neutral-800 px-3 py-2 rounded-full'
                >
                  <Text className='text-sm text-neutral-300'>Trivia</Text>
                </Pressable>
              </View>
            )}
          </View>
        ) : (
          messages.map((message) => (
            <ChatMessage key={message.id} message={message} />
          ))
        )}

        {isLoading && (
          <View className='flex flex-row items-center py-2'>
            <ActivityIndicator size='small' color='#a855f7' />
            <Text className='text-neutral-400 ml-2'>
              {t("home.settings.plugins.ai.chat.loading")}
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Input */}
      <View
        className='flex flex-row items-end px-4 py-3 border-t border-neutral-800'
        style={{ paddingBottom: Math.max(insets.bottom + 60, 72) }}
      >
        <TextInput
          className='flex-1 bg-neutral-800 rounded-2xl px-4 py-3 text-white text-base mr-3'
          placeholder={t("home.settings.plugins.ai.chat.placeholder")}
          placeholderTextColor='#6b7280'
          value={inputText}
          onChangeText={setInputText}
          onSubmitEditing={handleSend}
          returnKeyType='send'
          multiline
          maxLength={2000}
          editable={!isLoading}
          style={{ maxHeight: 120 }}
        />
        <Pressable
          onPress={handleSend}
          disabled={!inputText.trim() || isLoading}
          className={`w-11 h-11 rounded-full items-center justify-center ${
            inputText.trim() && !isLoading ? "bg-purple-600" : "bg-neutral-700"
          }`}
        >
          <Ionicons
            name='send'
            size={18}
            color={inputText.trim() && !isLoading ? "#ffffff" : "#6b7280"}
          />
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
};
