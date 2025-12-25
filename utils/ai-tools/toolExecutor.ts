/**
 * @file toolExecutor.ts
 * @description Executes AI tool calls by making real API requests to TMDB and TVDB
 * @author retrozenith <80767544+retrozenith@users.noreply.github.com>
 * @version 1.0.0
 * @since 2025-12-25
 */

const TMDB_BASE_URL = "https://api.themoviedb.org/3";
const TVDB_BASE_URL = "https://api4.thetvdb.com/v4";

/**
 * Tool call from the AI model.
 */
export interface ToolCall {
  id: string;
  type: "function";
  function: {
    name: string;
    arguments: string;
  };
}

/**
 * Result of executing a tool.
 */
export interface ToolResult {
  tool_call_id: string;
  role: "tool";
  content: string;
}

// TVDB token cache
let tvdbToken: string | null = null;
let tvdbTokenExpiry: number = 0;

/**
 * Get TVDB authentication token.
 */
async function getTvdbToken(apiKey: string): Promise<string> {
  if (tvdbToken && Date.now() < tvdbTokenExpiry) {
    return tvdbToken;
  }

  const response = await fetch(`${TVDB_BASE_URL}/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ apikey: apiKey }),
  });

  if (!response.ok) {
    throw new Error("TVDB authentication failed");
  }

  const data = await response.json();
  tvdbToken = data.data.token;
  tvdbTokenExpiry = Date.now() + 23 * 60 * 60 * 1000; // 23 hours

  return tvdbToken!;
}

/**
 * Execute a TMDB API call.
 */
async function executeTmdbTool(
  name: string,
  args: Record<string, unknown>,
  apiKey: string,
): Promise<unknown> {
  const params = new URLSearchParams({ api_key: apiKey });

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

/**
 * Execute a TVDB API call.
 */
async function executeTvdbTool(
  name: string,
  args: Record<string, unknown>,
  apiKey: string,
): Promise<unknown> {
  const token = await getTvdbToken(apiKey);
  const headers = { Authorization: `Bearer ${token}` };

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

/**
 * Execute a tool call and return the result.
 */
export async function executeTool(
  toolCall: ToolCall,
  tmdbApiKey?: string,
  tvdbApiKey?: string,
): Promise<ToolResult> {
  const { name, arguments: argsString } = toolCall.function;

  try {
    const args = JSON.parse(argsString);
    let result: unknown;

    if (name.startsWith("tmdb_")) {
      if (!tmdbApiKey) {
        throw new Error("TMDB API key not configured");
      }
      result = await executeTmdbTool(name, args, tmdbApiKey);
    } else if (name.startsWith("tvdb_")) {
      if (!tvdbApiKey) {
        throw new Error("TVDB API key not configured");
      }
      result = await executeTvdbTool(name, args, tvdbApiKey);
    } else {
      throw new Error(`Unknown tool: ${name}`);
    }

    return {
      tool_call_id: toolCall.id,
      role: "tool",
      content: JSON.stringify(result, null, 2),
    };
  } catch (error) {
    return {
      tool_call_id: toolCall.id,
      role: "tool",
      content: JSON.stringify({
        error: error instanceof Error ? error.message : "Tool execution failed",
      }),
    };
  }
}

/**
 * Execute multiple tool calls in parallel.
 */
export async function executeTools(
  toolCalls: ToolCall[],
  tmdbApiKey?: string,
  tvdbApiKey?: string,
): Promise<ToolResult[]> {
  return Promise.all(
    toolCalls.map((tc) => executeTool(tc, tmdbApiKey, tvdbApiKey)),
  );
}
