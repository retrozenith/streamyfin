/**
 * @file toolDefinitions.ts
 * @description OpenAI-compatible tool definitions for TMDB and TVDB APIs
 * @author retrozenith <80767544+retrozenith@users.noreply.github.com>
 * @version 2.0.0
 * @since 2025-12-25
 */

import { jellyfinTools } from "./providers/jellyfin";
import { tmdbTools } from "./providers/tmdb";
import { tvdbTools } from "./providers/tvdb";
import { ToolDefinition } from "./types";

export type { ToolDefinition };

/**
 * Get all available tools based on which API keys are configured.
 * TVDB tools are always available (no API key required).
 * TMDB tools require an API key.
 * Jellyfin tools are always available if the user is logged in (handled by context).
 */
export function getAvailableTools(tmdbApiKey?: string): ToolDefinition[] {
  const tools: ToolDefinition[] = [];

  if (tmdbApiKey) {
    tools.push(...tmdbTools);
  }

  // TVDB tools are always available (no API key required)
  tools.push(...tvdbTools);

  // Jellyfin tools
  tools.push(...jellyfinTools);

  return tools;
}
