/**
 * @file jellyfin.ts
 * @description Jellyfin tool definitions and execution logic
 */

import { Api } from "@jellyfin/sdk";
import {
  BaseItemDto,
  BaseItemKind,
  ItemFields,
} from "@jellyfin/sdk/lib/generated-client/models";
import { getItemsApi, getUserLibraryApi } from "@jellyfin/sdk/lib/utils/api";
import { ToolDefinition } from "../types";

// We'll define a subset of the Jellyfin context we need
export interface JellyfinToolContext {
  api?: Api;
  userId?: string;
  deviceId?: string;
}

/**
 * Jellyfin tool definitions.
 */
export const jellyfinTools: ToolDefinition[] = [
  {
    type: "function",
    function: {
      name: "jellyfin_search",
      description: "Search for media content on your Jellyfin server.",
      parameters: {
        type: "object",
        properties: {
          query: {
            type: "string",
            description: "The search term",
          },
          include_types: {
            type: "string",
            description:
              "Comma-separated list of types to include (Movie,Series,Episode,Audio,etc.)",
          },
          limit: {
            type: "number",
            description: "Max number of results (default: 10)",
          },
        },
        required: ["query"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "jellyfin_play",
      description:
        "Play a specific item on the current device (if supported) or just return the playback info.",
      parameters: {
        type: "object",
        properties: {
          item_id: {
            type: "string",
            description: "The ID of the item to play",
          },
        },
        required: ["item_id"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "jellyfin_recent",
      description: "Get recently added media from your Jellyfin server.",
      parameters: {
        type: "object",
        properties: {
          item_types: {
            type: "string",
            description: "Comma-separated list of types (Movie,Series,Episode)",
          },
          limit: {
            type: "number",
            description: "Max number of results (default: 10)",
          },
        },
        required: [],
      },
    },
  },
];

/**
 * Execute a Jellyfin API call.
 */
export async function executeJellyfinTool(
  name: string,
  args: Record<string, unknown>,
  context: JellyfinToolContext,
): Promise<unknown> {
  const { api, userId } = context;

  if (!api || !userId) {
    throw new Error("Jellyfin API or User ID not available in context");
  }

  const itemsApi = getItemsApi(api);
  const userLibraryApi = getUserLibraryApi(api);

  switch (name) {
    case "jellyfin_search": {
      const searchTerm = args.query as string;
      const includeItemTypes = ((args.include_types as string)?.split(
        ",",
      ) as BaseItemKind[]) || [
        BaseItemKind.Movie,
        BaseItemKind.Series,
        BaseItemKind.Episode,
      ];
      const limit = (args.limit as number) || 10;

      const response = await itemsApi.getItems({
        userId,
        searchTerm,
        includeItemTypes,
        limit,
        recursive: true,
        fields: [
          ItemFields.Overview,
          "ProductionYear" as ItemFields,
          "OfficialRating" as ItemFields,
        ],
      });

      return response.data.Items?.map((item: BaseItemDto) => ({
        id: item.Id,
        name: item.Name,
        type: item.Type,
        year: item.ProductionYear,
        rating: item.OfficialRating,
        overview: item.Overview?.substring(0, 100),
      }));
    }

    case "jellyfin_recent": {
      const includeItemTypes = ((args.item_types as string)?.split(
        ",",
      ) as BaseItemKind[]) || [BaseItemKind.Movie, BaseItemKind.Series];
      const limit = (args.limit as number) || 10;

      const response = await userLibraryApi.getLatestMedia({
        userId,
        includeItemTypes,
        limit,
        fields: [ItemFields.Overview, "ProductionYear" as ItemFields],
      });

      return response.data.map((item: BaseItemDto) => ({
        id: item.Id,
        name: item.Name,
        type: item.Type,
        year: item.ProductionYear,
        overview: item.Overview?.substring(0, 100),
      }));
    }

    case "jellyfin_play": {
      // For now, this just returns info. In a real scenario, this might trigger a player or remote control.
      const itemId = args.item_id as string;
      const response = await itemsApi.getItems({
        ids: [itemId],
        userId,
      });

      const item = response.data.Items?.[0];
      if (!item) return "Item not found";

      return {
        action: "play",
        item: {
          id: item.Id,
          name: item.Name,
          type: item.Type,
        },
        message: `Ready to play ${item.Name}. (Client-side implementation required to start actual playback)`,
      };
    }

    default:
      throw new Error(`Unknown Jellyfin tool: ${name}`);
  }
}
