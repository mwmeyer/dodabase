import OpenAI from 'openai';
import type { Message } from './types';

interface LLMConfig {
  provider: 'openai' | 'anthropic' | 'openai-compatible' | 'ollama';
  apiKey?: string;
  model: string;
  maxTokens?: number;
  temperature?: number;
  baseURL?: string;
  extraParams?: Record<string, any>;
}

class LLMWrapper {
  private provider: LLMConfig['provider'];
  private model: string;
  private maxTokens: number;
  private temperature: number;
  private conversationHistory: Message[];
  private extraParams: Record<string, any>;
  private client: OpenAI;
  private availableModels: string[] | null = null;
  private baseURL: string;

  // Default values
  private static readonly DEFAULT_MAX_TOKENS = 1000;
  private static readonly DEFAULT_TEMPERATURE = 0.7;

  constructor(config: LLMConfig) {
    this.provider = config.provider;
    this.model = config.model;
    this.maxTokens = config.maxTokens ?? LLMWrapper.DEFAULT_MAX_TOKENS;
    this.temperature = config.temperature ?? LLMWrapper.DEFAULT_TEMPERATURE;
    this.conversationHistory = [];
    this.extraParams = config.extraParams || {};
    this.baseURL = config.baseURL || '';

    // Initialize OpenAI client with appropriate configuration
    this.client = new OpenAI({
      apiKey: config.apiKey || 'not-needed',
      baseURL: this.baseURL,
      dangerouslyAllowBrowser: true,
      fetch: this.provider === 'openai-compatible' ? this.customFetch : undefined
    });
  }

  private async customFetch(
    url: RequestInfo | URL,
    init?: RequestInit
  ): Promise<Response> {
    // FIXME
    // Remove problematic headers for OpenAI-compatible providers
    if (init?.headers) {
      const headers = new Headers(init.headers);
      headers.delete('x-stainless-retry-count');
      init.headers = headers;
    }
    return fetch(url, init);
  }

  async sendMessage(message: string, systemContext?: string): Promise<string> {
    try {
      // Add system context if provided
      if (systemContext) {
        this.conversationHistory.push({ 
          role: "system", 
          content: systemContext 
        });
      }

      this.conversationHistory.push({ role: "user", content: message });

      if (this.provider === 'anthropic') {
        return this.sendAnthropic(message);
      }

      // Use OpenAI SDK for both OpenAI and OpenAI-compatible providers
      const completion = await this.client.chat.completions.create({
        model: this.model,
        messages: this.conversationHistory,
        max_tokens: this.maxTokens,
        temperature: this.temperature,
        ...this.extraParams
      });

      const assistantMessage = completion.choices[0].message.content || '';
      this.conversationHistory.push({ role: "assistant", content: assistantMessage });
      return assistantMessage;
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  private async sendAnthropic(message: string): Promise<string> {
    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.client.apiKey,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: this.model,
          max_tokens: this.maxTokens,
          messages: [{ role: "user", content: message }],
          temperature: this.temperature,
          ...this.extraParams
        })
      });

      if (!response.ok) {
        throw new Error(`Anthropic API Error: ${response.status}`);
      }

      const data = await response.json();
      const assistantMessage = data.content[0].text;
      this.conversationHistory.push({ role: "assistant", content: assistantMessage });
      return assistantMessage;
    } catch (error) {
      console.error('Anthropic API Error:', error);
      throw error;
    }
  }

  async fetchAvailableModels(): Promise<string[]> {
    try {
      if (this.provider === 'ollama') {
        const response = await fetch(`${this.baseURL}/api/tags`);
        if (!response.ok) throw new Error('Failed to fetch Ollama models');
        const data = await response.json();
        // Ollama returns an array of model objects, extract just the names
        this.availableModels = data.models.map((model: { name: string }) => model.name);
        return this.availableModels || [];
      } else if (this.provider === 'openai' || this.provider === 'openai-compatible') {
        const models = await this.client.models.list();
        this.availableModels = models.data.map(model => model.id);
        return this.availableModels;
      }
      return [];
    } catch (error) {
      console.error('Error fetching models:', error);
      throw error;
    }
  }

  getAvailableModels(): string[] | null {
    return this.availableModels;
  }

  getHistory(): Message[] {
    return this.conversationHistory;
  }

  clearHistory(): void {
    this.conversationHistory = [];
  }
}

export type { LLMConfig };
export { LLMWrapper };
