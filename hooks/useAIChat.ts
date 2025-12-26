/**
 * @file useAIChat.ts
 * @description Hook for managing AI chat state and interactions with media context
 * @author retrozenith <80767544+retrozenith@users.noreply.github.com>
 * @version 1.0.0
 * @since 2025-12-25
 */

import type { BaseItemDto } from "@jellyfin/sdk/lib/generated-client/models";
import { useAtomValue } from "jotai";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  apiAtom,
  getOrSetDeviceId,
  userAtom,
} from "@/providers/JellyfinProvider";
import {
  clearChatMessages,
  loadChatMessages,
  saveChatMessages,
} from "@/utils/ai-tools/chatStorage";
import { useSettings } from "@/utils/atoms/settings";
import {
  OpenRouterService,
  type ChatMessage as ServiceChatMessage,
} from "@/utils/openrouter/OpenRouterService";

/**
 * Represents a message in the chat UI with additional metadata.
 */
export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  isError?: boolean;
}

/**
 * Media context extracted from a Jellyfin item for AI awareness.
 */
export interface MediaContext {
  type: string;
  name: string;
  overview?: string;
  genres?: string[];
  year?: number;
  cast?: string[];
  seriesName?: string;
  seasonNumber?: number;
  episodeNumber?: number;
  studios?: string[];
  officialRating?: string;
  communityRating?: number;
}

/**
 * Return type for useAIChat hook.
 */
export interface UseAIChatReturn {
  messages: ChatMessage[];
  isLoading: boolean;
  error: string | null;
  isEnabled: boolean;
  isConfigured: boolean;
  sendMessage: (content: string) => Promise<void>;
  clearChat: () => void;
  retryLastMessage: () => Promise<void>;
}

/**
 * Generates a unique ID for messages.
 */
function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Extracts media context from a Jellyfin BaseItemDto.
 *
 * @param item - The Jellyfin item to extract context from
 * @returns MediaContext object with relevant information
 */
export function extractMediaContext(item: BaseItemDto): MediaContext {
  return {
    type: item.Type ?? "Unknown",
    name: item.Name ?? "Unknown",
    overview: item.Overview ?? undefined,
    genres: item.Genres ?? undefined,
    year: item.ProductionYear ?? undefined,
    cast:
      item.People?.slice(0, 5)
        .map((p) => p.Name ?? "")
        .filter(Boolean) ?? undefined,
    seriesName: item.SeriesName ?? undefined,
    seasonNumber: item.ParentIndexNumber ?? undefined,
    episodeNumber: item.IndexNumber ?? undefined,
    studios:
      item.Studios?.map((s) => s.Name ?? "").filter(Boolean) ?? undefined,
    officialRating: item.OfficialRating ?? undefined,
    communityRating: item.CommunityRating ?? undefined,
  };
}

/**
 * Builds a system prompt with media context for content-aware AI responses.
 *
 * @param basePrompt - The base system prompt
 * @param context - Optional media context to include
 * @returns Complete system prompt with context
 */
function buildSystemPrompt(basePrompt: string, context?: MediaContext): string {
  if (!context) {
    return basePrompt;
  }

  const contextParts: string[] = [];

  contextParts.push(`\n\nCurrent media context:`);
  contextParts.push(`- Type: ${context.type}`);
  contextParts.push(`- Title: ${context.name}`);

  if (context.seriesName) {
    contextParts.push(`- Series: ${context.seriesName}`);
    if (context.seasonNumber !== undefined) {
      contextParts.push(`- Season: ${context.seasonNumber}`);
    }
    if (context.episodeNumber !== undefined) {
      contextParts.push(`- Episode: ${context.episodeNumber}`);
    }
  }

  if (context.year) {
    contextParts.push(`- Year: ${context.year}`);
  }

  if (context.genres && context.genres.length > 0) {
    contextParts.push(`- Genres: ${context.genres.join(", ")}`);
  }

  if (context.cast && context.cast.length > 0) {
    contextParts.push(`- Cast: ${context.cast.join(", ")}`);
  }

  if (context.studios && context.studios.length > 0) {
    contextParts.push(`- Studios: ${context.studios.join(", ")}`);
  }

  if (context.officialRating) {
    contextParts.push(`- Rating: ${context.officialRating}`);
  }

  if (context.communityRating) {
    contextParts.push(
      `- Community Rating: ${context.communityRating.toFixed(1)}/10`,
    );
  }

  if (context.overview) {
    contextParts.push(`- Overview: ${context.overview}`);
  }

  contextParts.push(
    `\nUse this context to provide relevant information, recommendations, and insights about this content.`,
  );

  contextParts.push(
    `\n\n=== AVAILABLE TOOLS - USE PROACTIVELY ===`,
    `\nYou have access to powerful tools. Use them automatically when relevant:`,
    `\n**Jellyfin Tools** (User's Personal Library):`,
    `- jellyfin_search: Search the user's Jellyfin library for movies, shows, episodes`,
    `- jellyfin_recent: Get recently added content from their library`,
    `- jellyfin_get_counts: Get library statistics (movie count, series count, etc.)`,
    `- jellyfin_play: Prepare an item for playback`,
    `\n**TMDB Tools** (Global Movie Database):`,
    `- tmdb_search_movies/tmdb_search_tv: Search for any movie or show globally`,
    `- tmdb_discover: Discover content by genre, rating, year, etc.`,
    `- tmdb_trending: Find what's popular right now`,
    `\n**When to use which:**`,
    `- User asks "Do I have X?" → Use jellyfin_search`,
    `- User asks "Find me action movies" → Use tmdb_discover (global) OR jellyfin_search (their library)`,
    `- User asks "What did I add recently?" → Use jellyfin_recent`,
    `- User asks "How many movies do I have?" → Use jellyfin_get_counts`,
    `- User asks about a specific movie/show → Search their library first (jellyfin_search), then TMDB if not found`,
    `\n**IMPORTANT - Tool results formatting:**`,
    `- When tools return a "summary" field, USE IT DIRECTLY - it has pre-formatted markdown links`,
    `- Just copy the summary into your response, don't recreate it`,
    `- For TMDB results with "jellyseerr_link", suggest: "Not in your library? [Request it](jellyseerr_link)"`,
  );

  return basePrompt + contextParts.join("\n");
}

/**
 * Hook for managing AI chat interactions with content awareness.
 *
 * @param mediaContext - Optional media context for content-aware responses
 * @returns Chat state and control functions
 *
 * @example
 * const { messages, sendMessage, isLoading } = useAIChat(extractMediaContext(item));
 *
 * await sendMessage("What is this movie about?");
 */
export function useAIChat(mediaContext?: MediaContext): UseAIChatReturn {
  const { settings } = useSettings();
  const api = useAtomValue(apiAtom);
  const user = useAtomValue(userAtom);
  const deviceId = getOrSetDeviceId();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUserMessage, setLastUserMessage] = useState<string | null>(null);
  const isInitialized = useRef(false);

  const isEnabled = settings.enableAIChat ?? false;
  const isConfigured = Boolean(settings.openRouterApiKey);
  const retentionDays = settings.chatRetentionDays ?? 0;

  // Load saved messages on mount
  useEffect(() => {
    if (!isInitialized.current && retentionDays > 0) {
      const savedMessages = loadChatMessages(retentionDays);
      if (savedMessages.length > 0) {
        setMessages(savedMessages);
      }
      isInitialized.current = true;
    }
  }, [retentionDays]);

  // Save messages when they change (only if retention is enabled)
  useEffect(() => {
    if (isInitialized.current && messages.length > 0) {
      saveChatMessages(messages, retentionDays);
    }
  }, [messages, retentionDays]);

  const service = useMemo(() => {
    if (!settings.openRouterApiKey) {
      return null;
    }

    // Import tools dynamically to avoid circular deps
    const { getAvailableTools } = require("@/utils/ai-tools/toolDefinitions");
    const tools = settings.enableAITools
      ? getAvailableTools(settings.tmdbApiKey)
      : [];

    return new OpenRouterService({
      apiKey: settings.openRouterApiKey,
      model: settings.openRouterModel,
      enableTools: settings.enableAITools ?? false,
      tools,
      toolContext: {
        tmdbApiKey: settings.tmdbApiKey,
        api: api || undefined,
        userId: user?.Id,
        deviceId: deviceId,
      },
    });
  }, [
    settings.openRouterApiKey,
    settings.openRouterModel,
    settings.enableAITools,
    settings.tmdbApiKey,
    api,
    user?.Id,
    deviceId,
  ]);

  const sendMessage = useCallback(
    async (content: string): Promise<void> => {
      if (!service) {
        setError(
          "AI is not configured. Please add your OpenRouter API key in settings.",
        );
        return;
      }

      if (!content.trim()) {
        return;
      }

      setError(null);
      setIsLoading(true);
      setLastUserMessage(content);

      const userMessage: ChatMessage = {
        id: generateId(),
        role: "user",
        content: content.trim(),
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, userMessage]);

      try {
        const systemPrompt = buildSystemPrompt(
          settings.aiSystemPrompt ?? "You are a helpful media assistant.",
          mediaContext,
        );

        const conversationMessages: ServiceChatMessage[] = [
          { role: "system", content: systemPrompt },
          ...messages.map((m) => ({
            role: m.role as "user" | "assistant",
            content: m.content,
          })),
          { role: "user", content: content.trim() },
        ];

        const response = await service.chat(conversationMessages);

        const assistantMessage: ChatMessage = {
          id: generateId(),
          role: "assistant",
          content: response,
          timestamp: new Date(),
        };

        setMessages((prev) => [...prev, assistantMessage]);
      } catch (err) {
        console.error("[AIChat] Error:", err);
        const errorMessage =
          err instanceof Error ? err.message : "Failed to get response";
        setError(errorMessage);

        const errorChatMessage: ChatMessage = {
          id: generateId(),
          role: "assistant",
          content: `Sorry, I encountered an error: ${errorMessage}`,
          timestamp: new Date(),
          isError: true,
        };

        setMessages((prev) => [...prev, errorChatMessage]);
      } finally {
        setIsLoading(false);
      }
    },
    [service, messages, mediaContext, settings.aiSystemPrompt],
  );

  const clearChat = useCallback(() => {
    setMessages([]);
    setError(null);
    setLastUserMessage(null);
    clearChatMessages();
  }, []);

  const retryLastMessage = useCallback(async () => {
    if (lastUserMessage) {
      // Remove the last error message and user message
      setMessages((prev) => prev.slice(0, -2));
      await sendMessage(lastUserMessage);
    }
  }, [lastUserMessage, sendMessage]);

  return {
    messages,
    isLoading,
    error,
    isEnabled,
    isConfigured,
    sendMessage,
    clearChat,
    retryLastMessage,
  };
}
