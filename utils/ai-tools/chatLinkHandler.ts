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

    // Support both jellyseerr:// and jellyseer:// (typo tolerance)
    if (url.startsWith("jellyseerr://") || url.startsWith("jellyseer://")) {
      // Handle both formats:
      // jellyseerr://movie/603 or jellyseer://request/movie/603
      const cleanUrl = url.replace(/^jellyseerr?:\/\//, "");

      // Extract media type and ID
      const movieMatch = cleanUrl.match(/(?:request\/)?movie\/(\d+)/);
      const tvMatch = cleanUrl.match(/(?:request\/)?tv\/(\d+)/);

      if (movieMatch || tvMatch) {
        const tmdbId = movieMatch ? movieMatch[1] : tvMatch![1];
        const mediaType = movieMatch ? "movie" : "tv";

        console.log("[ChatLinkHandler] Opening Jellyseerr:", {
          mediaType,
          tmdbId,
        });

        // Navigate to Jellyseerr page
        router.push({
          pathname: "/(auth)/(tabs)/(home)/jellyseerr/page",
          params: {
            tmdbId,
            mediaType,
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
  return (
    url.startsWith("jellyfin://") ||
    url.startsWith("jellyseerr://") ||
    url.startsWith("jellyseer://")
  );
}
