/**
 * @file chatStorage.ts
 * @description Persistent storage for AI chat messages using MMKV
 * @author retrozenith <80767544+retrozenith@users.noreply.github.com>
 * @version 1.0.0
 * @since 2025-12-25
 */

import type { ChatMessage } from "@/hooks/useAIChat";
import { storage } from "@/utils/mmkv";

const CHAT_STORAGE_KEY = "ai_chat_messages";

/**
 * Stored message format with serializable timestamp.
 */
interface StoredMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string; // ISO string for serialization
  isError?: boolean;
}

/**
 * Converts ChatMessage to StoredMessage for serialization.
 */
function toStoredMessage(msg: ChatMessage): StoredMessage {
  return {
    id: msg.id,
    role: msg.role,
    content: msg.content,
    timestamp: msg.timestamp.toISOString(),
    isError: msg.isError,
  };
}

/**
 * Converts StoredMessage back to ChatMessage.
 */
function fromStoredMessage(stored: StoredMessage): ChatMessage {
  return {
    id: stored.id,
    role: stored.role,
    content: stored.content,
    timestamp: new Date(stored.timestamp),
    isError: stored.isError,
  };
}

/**
 * Loads chat messages from storage.
 * Automatically prunes messages older than retentionDays.
 *
 * @param retentionDays - Number of days to retain messages (0 = no retention)
 * @returns Array of ChatMessage
 */
export function loadChatMessages(retentionDays: number): ChatMessage[] {
  try {
    const stored = storage.getString(CHAT_STORAGE_KEY);
    if (!stored) {
      return [];
    }

    const messages: StoredMessage[] = JSON.parse(stored);

    // If retention is 0, don't load any saved messages
    if (retentionDays === 0) {
      return [];
    }

    // Filter out messages older than retention period
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

    const validMessages = messages.filter((msg) => {
      const msgDate = new Date(msg.timestamp);
      return msgDate >= cutoffDate;
    });

    console.log(
      `[ChatStorage] Loaded ${validMessages.length} messages (pruned ${messages.length - validMessages.length} old)`,
    );

    return validMessages.map(fromStoredMessage);
  } catch (error) {
    console.error("[ChatStorage] Error loading messages:", error);
    return [];
  }
}

/**
 * Saves chat messages to storage.
 * Only saves if retentionDays > 0.
 *
 * @param messages - Array of ChatMessage to save
 * @param retentionDays - Number of days to retain messages (0 = no retention)
 */
export function saveChatMessages(
  messages: ChatMessage[],
  retentionDays: number,
): void {
  try {
    // If retention is 0, clear stored messages and don't save
    if (retentionDays === 0) {
      storage.set(CHAT_STORAGE_KEY, "[]");
      return;
    }

    const storedMessages = messages.map(toStoredMessage);
    storage.set(CHAT_STORAGE_KEY, JSON.stringify(storedMessages));
    console.log(`[ChatStorage] Saved ${messages.length} messages`);
  } catch (error) {
    console.error("[ChatStorage] Error saving messages:", error);
  }
}

/**
 * Clears all stored chat messages.
 */
export function clearChatMessages(): void {
  try {
    storage.set(CHAT_STORAGE_KEY, "[]");
    console.log("[ChatStorage] Cleared all messages");
  } catch (error) {
    console.error("[ChatStorage] Error clearing messages:", error);
  }
}
