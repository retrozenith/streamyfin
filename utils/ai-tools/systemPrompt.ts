/**
 * @file systemPrompt.ts
 * @description System prompt builder for AI chat with tool usage instructions
 * @author retrozenith <80767544+retrozenith@users.noreply.github.com>
 * @version 1.0.0
 * @since 2025-12-26
 */

/**
 * Media context information for content-aware AI responses.
 */
export interface MediaContext {
  type: string;
  name: string;
  seriesName?: string;
  seasonNumber?: number;
  episodeNumber?: number;
  year?: number;
  genres?: string[];
  cast?: string[];
  studios?: string[];
  officialRating?: string;
  communityRating?: number;
  overview?: string;
}

/**
 * Builds a comprehensive system prompt with media context and tool usage instructions.
 *
 * @param basePrompt - The base system prompt from user settings
 * @param context - Optional media context to include
 * @returns Complete system prompt with context and tool instructions
 */
export function buildSystemPrompt(
  basePrompt: string,
  context?: MediaContext,
): string {
  if (!context) {
    return basePrompt;
  }

  const contextParts: string[] = [];

  // Add current media context
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

  // Add comprehensive tool usage instructions
  contextParts.push(
    `\n\n=== TOOL USAGE IS MANDATORY ===`,
    `\nYou MUST use tools for ANY query that could benefit from real data. DO NOT answer from memory alone.`,
    `\n**Jellyfin Tools** (User's Personal Library) - USE FIRST:`,
    `- jellyfin_search: Search the user's library - USE THIS for "Do I have...", "Find...", "Show me..."`,
    `- jellyfin_recent: Get recent additions - USE THIS for "What did I add...", "Recent items..."`,
    `- jellyfin_get_counts: Library statistics - USE THIS for "How many...", "Total..."`,
    `- jellyfin_play: Prepare playback - USE THIS for "Play..."`,
    `\n**TMDB Tools** (Global Database) - USE WHEN NEEDED:`,
    `- tmdb_search_movies/tmdb_search_tv: Global search - USE when jellyfin_search finds nothing`,
    `- tmdb_discover: Find by genre/criteria - USE for "Best action movies", "Top rated..."`,
    `- tmdb_trending: Current trends - USE for "What's popular..."`,
    `\n**DEFAULT BEHAVIOR:**`,
    `- ANY question about content → Use jellyfin_search FIRST`,
    `- If not found → Use tmdb_search to offer Jellyseerr request`,
    `- ALWAYS use tools unless the question is purely conversational`,
    `\n**IMPORTANT - Tool results formatting:**`,
    `- When tools return a "summary" field, COPY IT DIRECTLY into your response`,
    `- The summary already has formatted markdown links - don't recreate them`,
    `- For TMDB results with "jellyseerr_link", suggest: "Not in your library? [Request it](jellyseerr_link)"`,
  );

  return basePrompt + contextParts.join("\n");
}
