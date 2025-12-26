/**
 * @file toolExecutor.ts
 * @description Executes AI tool calls by making real API requests to TMDB and TVDB
 * @author retrozenith <80767544+retrozenith@users.noreply.github.com>
 * @version 2.0.0
 * @since 2025-12-25
 */

import { executeTmdbTool } from "./providers/tmdb";
import { executeTvdbTool } from "./providers/tvdb";
import { ToolCall, ToolResult } from "./types";

export type { ToolCall, ToolResult };

/**
 * Execution context for tools.
 */
export interface ToolExecutionContext {
  tmdbApiKey?: string;
  // Add other context properties here as needed (e.g., jellyfin)
}

/**
 * Execute a tool call and return the result.
 */
export async function executeTool(
  toolCall: ToolCall,
  context: ToolExecutionContext | string, // Backwards compatibility for string apiKey
): Promise<ToolResult> {
  const { name, arguments: argsString } = toolCall.function;

  // Normalize context
  const toolContext: ToolExecutionContext =
    typeof context === "string" ? { tmdbApiKey: context } : context || {};

  try {
    const args = JSON.parse(argsString);
    let result: unknown;

    if (name.startsWith("tmdb_")) {
      result = await executeTmdbTool(name, args, toolContext);
    } else if (name.startsWith("tvdb_")) {
      result = await executeTvdbTool(name, args, toolContext);
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
  context: ToolExecutionContext | string,
): Promise<ToolResult[]> {
  return Promise.all(toolCalls.map((tc) => executeTool(tc, context)));
}
