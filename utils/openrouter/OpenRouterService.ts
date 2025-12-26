import type { ToolDefinition } from "@/utils/ai-tools/toolDefinitions";
import {
  executeTools,
  type ToolCall,
  type ToolExecutionContext,
} from "@/utils/ai-tools/toolExecutor";

/**
 * Represents a single message in a chat conversation.
 */
export interface ChatMessage {
  role: "system" | "user" | "assistant" | "tool";
  content: string;
  tool_calls?: ToolCall[];
  tool_call_id?: string;
}

/**
 * Response structure from OpenRouter API.
 */
interface OpenRouterResponse {
  id: string;
  choices: Array<{
    index: number;
    message: {
      role: string;
      content: string | null;
      tool_calls?: ToolCall[];
      // Reasoning models may put content in 'reasoning' field
      reasoning?: string;
    };
    finish_reason: string;
  }>;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

/**
 * Error response from OpenRouter API.
 */
interface OpenRouterErrorResponse {
  error: {
    message: string;
    type: string;
    code: string;
  };
}

/**
 * Configuration options for OpenRouterService.
 */
export interface OpenRouterConfig {
  apiKey: string;
  model?: string;
  maxTokens?: number;
  temperature?: number;
  // Tool calling options
  enableTools?: boolean;
  tools?: ToolDefinition[];
  toolContext?: ToolExecutionContext;
}

/**
 * Custom error class for OpenRouter API errors.
 */
export class OpenRouterError extends Error {
  public readonly code: string;
  public readonly type: string;

  constructor(
    message: string,
    code: string = "UNKNOWN",
    type: string = "api_error",
  ) {
    super(message);
    this.name = "OpenRouterError";
    this.code = code;
    this.type = type;
  }
}

/**
 * Service class for interacting with OpenRouter AI API with tool support.
 *
 * @example
 * const service = new OpenRouterService({ apiKey: 'your-key', enableTools: true });
 * const response = await service.chat([
 *   { role: 'user', content: 'Search for sci-fi movies' }
 * ]);
 */
export class OpenRouterService {
  private readonly apiKey: string;
  private readonly model: string;
  private readonly maxTokens: number;
  private readonly temperature: number;
  private readonly enableTools: boolean;
  private readonly tools: ToolDefinition[];
  private readonly toolContext?: ToolExecutionContext;
  private readonly baseUrl = "https://openrouter.ai/api/v1/chat/completions";
  private readonly maxToolIterations = 5;

  /**
   * Creates a new OpenRouterService instance.
   *
   * @param config - Configuration options for the service
   * @throws {OpenRouterError} If apiKey is not provided
   */
  constructor(config: OpenRouterConfig) {
    if (!config.apiKey) {
      throw new OpenRouterError(
        "API key is required",
        "MISSING_API_KEY",
        "configuration_error",
      );
    }

    this.apiKey = config.apiKey;
    this.model = config.model ?? "google/gemini-2.0-flash-001";
    this.maxTokens = config.maxTokens ?? 1024;
    this.temperature = config.temperature ?? 0.7;
    this.enableTools = config.enableTools ?? false;
    this.tools = config.tools ?? [];
    this.toolContext = config.toolContext;
  }

  /**
   * Makes a single API call to OpenRouter.
   */
  private async makeRequest(
    messages: ChatMessage[],
    includeTools: boolean = false,
  ): Promise<OpenRouterResponse> {
    const body: Record<string, unknown> = {
      model: this.model,
      messages,
      max_tokens: this.maxTokens,
      temperature: this.temperature,
    };

    // Only include tools if enabled and available
    if (includeTools && this.enableTools && this.tools.length > 0) {
      body.tools = this.tools;
      body.tool_choice = "auto";
    }

    console.log(
      `[OpenRouter] Request: model=${this.model}, messages=${messages.length}, tools=${includeTools ? this.tools.length : 0}`,
    );

    const response = await fetch(this.baseUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://github.com/fredrikburmern/streamyfin",
        "X-Title": "Streamyfin",
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      const errorMessage =
        (errorData as OpenRouterErrorResponse)?.error?.message ??
        `HTTP ${response.status}`;
      throw new OpenRouterError(
        `OpenRouter API error: ${errorMessage}`,
        response.status.toString(),
        "api_error",
      );
    }

    const data = await response.json();
    console.log(
      `[OpenRouter] Response: finish_reason=${data.choices?.[0]?.finish_reason}, tool_calls=${data.choices?.[0]?.message?.tool_calls?.length ?? 0}`,
    );
    return data;
  }

  /**
   * Sends a chat completion request to OpenRouter API with automatic tool handling.
   *
   * @param messages - Array of chat messages forming the conversation
   * @returns The assistant's response content
   * @throws {OpenRouterError} If the API request fails
   */
  async chat(messages: ChatMessage[]): Promise<string> {
    if (!messages || messages.length === 0) {
      throw new OpenRouterError(
        "Messages array cannot be empty",
        "INVALID_INPUT",
        "validation_error",
      );
    }

    try {
      const currentMessages = [...messages];
      let iterations = 0;

      // Tool calling loop
      while (iterations < this.maxToolIterations) {
        iterations++;

        const data = await this.makeRequest(
          currentMessages,
          this.enableTools && this.tools.length > 0,
        );

        const choice = data.choices[0];
        const assistantMessage = choice?.message;

        // If the model wants to call tools
        if (
          assistantMessage?.tool_calls &&
          assistantMessage.tool_calls.length > 0
        ) {
          // Add assistant message with tool calls to conversation
          currentMessages.push({
            role: "assistant",
            content: assistantMessage.content ?? "",
            tool_calls: assistantMessage.tool_calls,
          });

          // Execute all tool calls
          console.log(
            `[OpenRouter] Executing ${assistantMessage.tool_calls.length} tool call(s):`,
            assistantMessage.tool_calls
              .map((tc) => tc.function.name)
              .join(", "),
          );

          const toolResults = await executeTools(
            assistantMessage.tool_calls,
            this.toolContext || {},
          );

          // Add tool results to conversation
          for (const result of toolResults) {
            currentMessages.push({
              role: "tool",
              content: result.content,
              tool_call_id: result.tool_call_id,
            });
          }

          // Continue the loop to get the final response
          continue;
        }

        // No tool calls, extract the content
        // Some reasoning models put their response in 'reasoning' instead of 'content'
        const content =
          assistantMessage?.content || assistantMessage?.reasoning;

        // Log for debugging if we had to use reasoning fallback
        if (!assistantMessage?.content && assistantMessage?.reasoning) {
          console.log(
            "[OpenRouter] Using 'reasoning' field as content (reasoning model)",
          );
        }

        if (!content) {
          console.log(
            "[OpenRouter] Empty content, full message:",
            JSON.stringify(assistantMessage, null, 2),
          );
          throw new OpenRouterError(
            "No response content received",
            "EMPTY_RESPONSE",
            "api_error",
          );
        }

        return content;
      }

      throw new OpenRouterError(
        "Maximum tool iterations exceeded",
        "MAX_ITERATIONS",
        "tool_error",
      );
    } catch (error) {
      if (error instanceof OpenRouterError) {
        throw error;
      }

      if (error instanceof TypeError && error.message.includes("fetch")) {
        throw new OpenRouterError(
          "Network error: Unable to reach OpenRouter API",
          "NETWORK_ERROR",
          "network_error",
        );
      }

      throw new OpenRouterError(
        `Unexpected error: ${error instanceof Error ? error.message : "Unknown error"}`,
        "UNKNOWN",
        "unknown_error",
      );
    }
  }

  /**
   * Tests the connection to OpenRouter API.
   *
   * @returns True if connection is successful, false otherwise
   */
  async testConnection(): Promise<boolean> {
    try {
      // Use simple chat without tools for connection test
      const response = await fetch(this.baseUrl, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
          "HTTP-Referer": "https://github.com/fredrikburmern/streamyfin",
          "X-Title": "Streamyfin",
        },
        body: JSON.stringify({
          model: this.model,
          messages: [{ role: "user", content: "Hello" }],
          max_tokens: 10,
        }),
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  /**
   * Gets the current model being used.
   *
   * @returns The model identifier string
   */
  getModel(): string {
    return this.model;
  }

  /**
   * Checks if tools are enabled for this service instance.
   */
  hasToolsEnabled(): boolean {
    return this.enableTools && this.tools.length > 0;
  }
}

/**
 * Creates an OpenRouterService instance with the provided configuration.
 * Utility function for cleaner instantiation.
 *
 * @param config - Configuration options
 * @returns A new OpenRouterService instance
 */
export function createOpenRouterService(
  config: OpenRouterConfig,
): OpenRouterService {
  return new OpenRouterService(config);
}
