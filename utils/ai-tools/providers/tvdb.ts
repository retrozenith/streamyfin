/**
 * @file tvdb.ts
 * @description TVDB tool definitions and execution logic
 */

import { ToolDefinition } from "../types";

const TVDB_BASE_URL = "https://api4.thetvdb.com/v4";

/**
 * TVDB tool definitions for TV show information.
 */
export const tvdbTools: ToolDefinition[] = [
  {
    type: "function",
    function: {
      name: "tvdb_search_series",
      description:
        "Search for TV series on TVDB. Returns detailed show information.",
      parameters: {
        type: "object",
        properties: {
          query: {
            type: "string",
            description: "The TV series title to search for",
          },
        },
        required: ["query"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "tvdb_series_details",
      description: "Get detailed information about a TV series from TVDB.",
      parameters: {
        type: "object",
        properties: {
          series_id: {
            type: "number",
            description: "The TVDB series ID",
          },
        },
        required: ["series_id"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "tvdb_episodes",
      description:
        "Get episodes for a TV series, optionally filtered by season.",
      parameters: {
        type: "object",
        properties: {
          series_id: {
            type: "number",
            description: "The TVDB series ID",
          },
          season_number: {
            type: "number",
            description: "Optional season number to filter episodes",
          },
        },
        required: ["series_id"],
      },
    },
  },
];

/**
 * Execute a TVDB API call (no auth required).
 */
export async function executeTvdbTool(
  name: string,
  args: Record<string, unknown>,
  /* context is unused for TVDB but kept for consistency */
  _context?: unknown,
): Promise<unknown> {
  const headers = { "Content-Type": "application/json" };

  switch (name) {
    case "tvdb_search_series": {
      const res = await fetch(
        `${TVDB_BASE_URL}/search?query=${encodeURIComponent(args.query as string)}&type=series`,
        { headers },
      );
      const data = await res.json();
      return data.data?.slice(0, 5).map((s: Record<string, unknown>) => ({
        tvdb_id: s.tvdb_id,
        name: s.name,
        year: s.year,
        overview: s.overview?.toString().slice(0, 200),
        status: s.status,
      }));
    }

    case "tvdb_series_details": {
      const res = await fetch(
        `${TVDB_BASE_URL}/series/${args.series_id}/extended`,
        { headers },
      );
      const data = await res.json();
      const s = data.data;
      return {
        id: s.id,
        name: s.name,
        overview: s.overview,
        year: s.year,
        status: s.status?.name,
        genres: s.genres?.map((g: { name: string }) => g.name),
        seasons: s.seasons?.length,
        episodes: s.episodes?.length,
        network: s.originalNetwork?.name,
      };
    }

    case "tvdb_episodes": {
      const res = await fetch(
        `${TVDB_BASE_URL}/series/${args.series_id}/episodes/default`,
        { headers },
      );
      const data = await res.json();
      let episodes = data.data?.episodes || [];
      if (args.season_number) {
        episodes = episodes.filter(
          (e: { seasonNumber: number }) =>
            e.seasonNumber === args.season_number,
        );
      }
      return episodes.slice(0, 10).map((e: Record<string, unknown>) => ({
        name: e.name,
        season: e.seasonNumber,
        episode: e.number,
        overview: e.overview?.toString().slice(0, 150),
        aired: e.aired,
      }));
    }

    default:
      throw new Error(`Unknown TVDB tool: ${name}`);
  }
}
