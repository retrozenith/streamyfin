/**
 * @file types.ts
 * @description Shared types for AI tools and executors
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
