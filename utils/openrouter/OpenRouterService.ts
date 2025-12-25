/**
 * @file OpenRouterService.ts
 * @description Service for interacting with OpenRouter AI API for chat completions
 * @author retrozenith <80767544+retrozenith@users.noreply.github.com>
 * @version 1.0.0
 * @since 2025-12-25
 */

/**
 * Represents a single message in a chat conversation.
 */
export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
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
      content: string;
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
 * Service class for interacting with OpenRouter AI API.
 *
 * @example
 * const service = new OpenRouterService({ apiKey: 'your-key' });
 * const response = await service.chat([
 *   { role: 'user', content: 'Hello!' }
 * ]);
 */
export class OpenRouterService {
  private readonly apiKey: string;
  private readonly model: string;
  private readonly maxTokens: number;
  private readonly temperature: number;
  private readonly baseUrl = "https://openrouter.ai/api/v1/chat/completions";

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
  }

  /**
   * Sends a chat completion request to OpenRouter API.
   *
   * @param messages - Array of chat messages forming the conversation
   * @returns The assistant's response content
   * @throws {OpenRouterError} If the API request fails
   *
   * @example
   * const response = await service.chat([
   *   { role: 'system', content: 'You are a helpful assistant.' },
   *   { role: 'user', content: 'Tell me about this movie.' }
   * ]);
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
          messages,
          max_tokens: this.maxTokens,
          temperature: this.temperature,
        }),
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

      const data: OpenRouterResponse = await response.json();
      const content = data.choices[0]?.message?.content;

      if (!content) {
        throw new OpenRouterError(
          "No response content received",
          "EMPTY_RESPONSE",
          "api_error",
        );
      }

      return content;
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
      await this.chat([{ role: "user", content: "Hello" }]);
      return true;
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
