/**
 * @file chatLinkHandler.ts
 * @description Utility for handling custom navigation links in AI chat
 */

import { router } from "expo-router";

/**
 * Handles navigation for custom URL schemes in chat
 * Supports: jellyfin://item/{id} and jellyseerr://movie/{tmdbId} or jellyseerr://tv/{tmdbId}
 */
export function handleChatLink(url: string): boolean {
  try {
    if (url.startsWith("jellyfin://item/")) {
      const itemId = url.replace("jellyfin://item/", "");
      router.push(`/(auth)/items/page?id=${itemId}` as any);
      return true;
    }

    if (url.startsWith("jellyseerr://")) {
      const match = url.match(/jellyseerr:\/\/(movie|tv)\/(\d+)/);
      if (match) {
        const [, mediaType, tmdbId] = match;
        // Navigate to Jellyseerr page with TMDB ID
        // This will need proper params based on app's routing
        router.push({
          pathname: "/(auth)/(tabs)/(home)/jellyseerr/page",
          params: {
            tmdbId,
            mediaType: mediaType === "movie" ? "movie" : "tv",
          },
        } as any);
        return true;
      }
    }

    return false;
  } catch (error) {
    console.error("[ChatLinkHandler] Error handling link:", error);
    return false;
  }
}

/**
 * Checks if a URL is a custom chat link
 */
export function isChatLink(url: string): boolean {
  return url.startsWith("jellyfin://") || url.startsWith("jellyseerr://");
}
