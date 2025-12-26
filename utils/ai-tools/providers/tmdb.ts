/**
 * @file tmdb.ts
 * @description TMDB tool definitions and execution logic
 */

import { ToolDefinition } from "../types";

const TMDB_BASE_URL = "https://api.themoviedb.org/3";

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
 * Context for TMDB tools.
 */
export interface TmdbToolContext {
  tmdbApiKey?: string;
}

/**
 * Execute a TMDB API call.
 */
export async function executeTmdbTool(
  name: string,
  args: Record<string, unknown>,
  context: TmdbToolContext,
): Promise<unknown> {
  const { tmdbApiKey } = context;
  if (!tmdbApiKey) {
    throw new Error("TMDB API key not configured");
  }

  const params = new URLSearchParams({ api_key: tmdbApiKey });

  switch (name) {
    case "tmdb_search_movies": {
      params.append("query", args.query as string);
      if (args.page) params.append("page", String(args.page));
      if (args.year) params.append("year", String(args.year));
      const res = await fetch(`${TMDB_BASE_URL}/search/movie?${params}`);
      const data = await res.json();
      return data.results?.slice(0, 5).map((m: Record<string, unknown>) => ({
        id: m.id,
        title: m.title,
        year: m.release_date?.toString().slice(0, 4),
        overview: m.overview?.toString().slice(0, 200),
        vote_average: m.vote_average,
      }));
    }

    case "tmdb_search_tv": {
      params.append("query", args.query as string);
      if (args.page) params.append("page", String(args.page));
      if (args.year) params.append("first_air_date_year", String(args.year));
      const res = await fetch(`${TMDB_BASE_URL}/search/tv?${params}`);
      const data = await res.json();
      return data.results?.slice(0, 5).map((s: Record<string, unknown>) => ({
        id: s.id,
        name: s.name,
        first_air_date: s.first_air_date,
        overview: s.overview?.toString().slice(0, 200),
        vote_average: s.vote_average,
      }));
    }

    case "tmdb_movie_details": {
      params.append("append_to_response", "credits");
      const res = await fetch(
        `${TMDB_BASE_URL}/movie/${args.movie_id}?${params}`,
      );
      const m = await res.json();
      return {
        id: m.id,
        title: m.title,
        tagline: m.tagline,
        overview: m.overview,
        release_date: m.release_date,
        runtime: m.runtime,
        genres: m.genres?.map((g: { name: string }) => g.name),
        vote_average: m.vote_average,
        budget: m.budget,
        revenue: m.revenue,
        cast: m.credits?.cast
          ?.slice(0, 10)
          .map((c: { name: string; character: string }) => ({
            name: c.name,
            character: c.character,
          })),
        directors: m.credits?.crew
          ?.filter((c: { job: string }) => c.job === "Director")
          .map((c: { name: string }) => c.name),
      };
    }

    case "tmdb_tv_details": {
      params.append("append_to_response", "credits");
      const res = await fetch(`${TMDB_BASE_URL}/tv/${args.tv_id}?${params}`);
      const s = await res.json();
      return {
        id: s.id,
        name: s.name,
        overview: s.overview,
        first_air_date: s.first_air_date,
        last_air_date: s.last_air_date,
        number_of_seasons: s.number_of_seasons,
        number_of_episodes: s.number_of_episodes,
        genres: s.genres?.map((g: { name: string }) => g.name),
        vote_average: s.vote_average,
        status: s.status,
        created_by: s.created_by?.map((c: { name: string }) => c.name),
        cast: s.credits?.cast
          ?.slice(0, 10)
          .map((c: { name: string; character: string }) => ({
            name: c.name,
            character: c.character,
          })),
      };
    }

    case "tmdb_trending": {
      const mediaType = (args.media_type as string) || "all";
      const timeWindow = (args.time_window as string) || "week";
      const res = await fetch(
        `${TMDB_BASE_URL}/trending/${mediaType}/${timeWindow}?${params}`,
      );
      const data = await res.json();
      return data.results?.slice(0, 8).map((item: Record<string, unknown>) => ({
        id: item.id,
        title: item.title || item.name,
        media_type: item.media_type,
        overview: item.overview?.toString().slice(0, 150),
        vote_average: item.vote_average,
      }));
    }

    case "tmdb_discover": {
      const mediaType = args.media_type as string;
      if (args.page) params.append("page", String(args.page));
      if (args.sort_by) params.append("sort_by", args.sort_by as string);
      if (args.year) {
        if (mediaType === "movie") params.append("year", String(args.year));
        else params.append("first_air_date_year", String(args.year));
      }
      if (args.with_genres)
        params.append("with_genres", args.with_genres as string);
      if (args.vote_average_gte)
        params.append("vote_average.gte", String(args.vote_average_gte));
      const res = await fetch(
        `${TMDB_BASE_URL}/discover/${mediaType}?${params}`,
      );
      const data = await res.json();
      return data.results?.slice(0, 8).map((item: Record<string, unknown>) => ({
        id: item.id,
        title: item.title || item.name,
        release_date: item.release_date || item.first_air_date,
        overview: item.overview?.toString().slice(0, 150),
        vote_average: item.vote_average,
      }));
    }

    case "tmdb_person_search": {
      params.append("query", args.query as string);
      if (args.page) params.append("page", String(args.page));
      const res = await fetch(`${TMDB_BASE_URL}/search/person?${params}`);
      const data = await res.json();
      return data.results?.slice(0, 5).map((p: Record<string, unknown>) => ({
        id: p.id,
        name: p.name,
        known_for_department: p.known_for_department,
        known_for: (p.known_for as Array<{ title?: string; name?: string }>)
          ?.slice(0, 3)
          .map((k) => k.title || k.name),
      }));
    }

    default:
      throw new Error(`Unknown TMDB tool: ${name}`);
  }
}
