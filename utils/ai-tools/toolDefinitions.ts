/**
 * @file toolDefinitions.ts
 * @description OpenAI-compatible tool definitions for TMDB and TVDB APIs
 * @author retrozenith <80767544+retrozenith@users.noreply.github.com>
 * @version 1.0.0
 * @since 2025-12-25
 */

/**
 * OpenAI function calling tool definition format.
 */
export interface ToolDefinition {
  type: "function";
  function: {
    name: string;
    description: string;
    parameters: {
      type: "object";
      properties: Record<
        string,
        {
          type: string;
          description: string;
          enum?: string[];
        }
      >;
      required: string[];
    };
  };
}

/**
 * TMDB tool definitions for movie and TV show discovery.
 */
export const tmdbTools: ToolDefinition[] = [
  {
    type: "function",
    function: {
      name: "tmdb_search_movies",
      description:
        "Search for movies on TMDB by title or keywords. Returns movie titles, IDs, release dates, and overviews.",
      parameters: {
        type: "object",
        properties: {
          query: {
            type: "string",
            description: "The movie title or keywords to search for",
          },
          page: {
            type: "number",
            description: "Page number for pagination (default: 1)",
          },
          year: {
            type: "number",
            description: "Filter by release year",
          },
        },
        required: ["query"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "tmdb_search_tv",
      description:
        "Search for TV shows on TMDB by title or keywords. Returns show titles, IDs, first air dates, and overviews.",
      parameters: {
        type: "object",
        properties: {
          query: {
            type: "string",
            description: "The TV show title or keywords to search for",
          },
          page: {
            type: "number",
            description: "Page number for pagination (default: 1)",
          },
          year: {
            type: "number",
            description: "Filter by first air date year",
          },
        },
        required: ["query"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "tmdb_movie_details",
      description:
        "Get detailed information about a specific movie including cast, crew, runtime, budget, and more.",
      parameters: {
        type: "object",
        properties: {
          movie_id: {
            type: "number",
            description: "The TMDB movie ID",
          },
        },
        required: ["movie_id"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "tmdb_tv_details",
      description:
        "Get detailed information about a specific TV show including seasons, episodes, creators, and more.",
      parameters: {
        type: "object",
        properties: {
          tv_id: {
            type: "number",
            description: "The TMDB TV show ID",
          },
        },
        required: ["tv_id"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "tmdb_trending",
      description:
        "Get trending movies or TV shows. Great for finding what's popular right now.",
      parameters: {
        type: "object",
        properties: {
          media_type: {
            type: "string",
            description: "Type of media to get trending",
            enum: ["movie", "tv", "all"],
          },
          time_window: {
            type: "string",
            description: "Time window for trending",
            enum: ["day", "week"],
          },
        },
        required: [],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "tmdb_discover",
      description:
        "Discover movies or TV shows with advanced filtering by genre, year, rating, and more.",
      parameters: {
        type: "object",
        properties: {
          media_type: {
            type: "string",
            description: "Type of media to discover",
            enum: ["movie", "tv"],
          },
          page: {
            type: "number",
            description: "Page number (default: 1)",
          },
          sort_by: {
            type: "string",
            description:
              "Sort order (e.g., popularity.desc, vote_average.desc, release_date.desc)",
          },
          year: {
            type: "number",
            description: "Filter by release/air year",
          },
          with_genres: {
            type: "string",
            description: "Comma-separated genre IDs to include",
          },
          vote_average_gte: {
            type: "number",
            description: "Minimum vote average (0-10)",
          },
        },
        required: ["media_type"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "tmdb_person_search",
      description:
        "Search for actors, directors, and other people in the entertainment industry.",
      parameters: {
        type: "object",
        properties: {
          query: {
            type: "string",
            description: "Person name to search for",
          },
          page: {
            type: "number",
            description: "Page number (default: 1)",
          },
        },
        required: ["query"],
      },
    },
  },
];

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
 * Get all available tools based on which API keys are configured.
 */
export function getAvailableTools(
  tmdbApiKey?: string,
  tvdbApiKey?: string,
): ToolDefinition[] {
  const tools: ToolDefinition[] = [];

  if (tmdbApiKey) {
    tools.push(...tmdbTools);
  }

  if (tvdbApiKey) {
    tools.push(...tvdbTools);
  }

  return tools;
}
