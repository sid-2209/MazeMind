// src/services/LLMService.ts
/**
 * LLMService - Unified LLM provider abstraction
 *
 * Provides a single interface for multiple LLM providers:
 * - Anthropic Claude (cloud API)
 * - Ollama (local models)
 * - Heuristic (fallback, no LLM)
 *
 * Allows runtime switching between providers for experimentation
 */

import { AnthropicService } from './AnthropicService';
import { OllamaService } from './OllamaService';

export type LLMProvider = 'anthropic' | 'ollama' | 'heuristic';

export interface LLMServiceConfig {
  provider: LLMProvider;
  anthropicApiKey?: string;
  ollamaUrl?: string;
  ollamaModel?: string;
}

export interface LLMGenerateOptions {
  temperature?: number;
  max_tokens?: number;
  stop?: string[];
}

export class LLMService {
  private currentProvider: LLMProvider;
  private anthropicService: AnthropicService | null = null;
  private ollamaService: OllamaService | null = null;

  constructor(config: LLMServiceConfig) {
    this.currentProvider = config.provider;

    // Initialize Anthropic if API key provided
    if (config.anthropicApiKey) {
      this.anthropicService = new AnthropicService(config.anthropicApiKey);
    }

    // Initialize Ollama if URL provided
    if (config.ollamaUrl || config.provider === 'ollama') {
      this.ollamaService = new OllamaService({
        baseUrl: config.ollamaUrl,
        model: config.ollamaModel,
      });
    }

    console.log(`🤖 LLMService initialized with provider: ${this.currentProvider}`);
  }

  /**
   * Generate text completion from prompt
   */
  async generate(prompt: string, options: LLMGenerateOptions = {}): Promise<string> {
    switch (this.currentProvider) {
      case 'anthropic':
        return this.generateWithAnthropic(prompt, options);

      case 'ollama':
        return this.generateWithOllama(prompt, options);

      case 'heuristic':
      default:
        throw new Error('Heuristic mode does not support text generation');
    }
  }

  /**
   * Generate with Anthropic Claude
   */
  private async generateWithAnthropic(
    prompt: string,
    options: LLMGenerateOptions
  ): Promise<string> {
    if (!this.anthropicService || !this.anthropicService.isServiceEnabled()) {
      throw new Error('Anthropic service not available');
    }

    const client = this.anthropicService.getClient();
    if (!client) {
      throw new Error('Anthropic client not initialized');
    }

    try {
      const response = await client.messages.create({
        model: 'claude-3-haiku-20240307',
        max_tokens: options.max_tokens || 150,
        temperature: options.temperature || 0.7,
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
        stop_sequences: options.stop,
      });

      const textContent = response.content.find(c => c.type === 'text');
      if (textContent && textContent.type === 'text') {
        return textContent.text;
      }

      throw new Error('No text content in Anthropic response');
    } catch (error) {
      console.error('Anthropic generation error:', error);
      throw error;
    }
  }

  /**
   * Generate with Ollama
   */
  private async generateWithOllama(
    prompt: string,
    options: LLMGenerateOptions
  ): Promise<string> {
    if (!this.ollamaService || !this.ollamaService.isServiceAvailable()) {
      throw new Error('Ollama service not available');
    }

    try {
      return await this.ollamaService.generate(prompt, options);
    } catch (error) {
      console.error('Ollama generation error:', error);
      throw error;
    }
  }

  /**
   * Check if current provider is available
   */
  isProviderAvailable(): boolean {
    switch (this.currentProvider) {
      case 'anthropic':
        return this.anthropicService?.isServiceEnabled() || false;

      case 'ollama':
        return this.ollamaService?.isServiceAvailable() || false;

      case 'heuristic':
        return true;

      default:
        return false;
    }
  }

  /**
   * Get current provider
   */
  getCurrentProvider(): LLMProvider {
    return this.currentProvider;
  }

  /**
   * Set provider (switch at runtime)
   */
  async setProvider(provider: LLMProvider): Promise<boolean> {
    // Check if new provider is available
    switch (provider) {
      case 'anthropic':
        if (!this.anthropicService?.isServiceEnabled()) {
          console.warn('⚠️  Anthropic service not available');
          return false;
        }
        break;

      case 'ollama':
        if (!this.ollamaService) {
          console.warn('⚠️  Ollama service not initialized');
          return false;
        }
        // Check availability
        const available = await this.ollamaService.checkAvailability();
        if (!available) {
          console.warn('⚠️  Ollama service not available');
          return false;
        }
        break;

      case 'heuristic':
        // Always available
        break;
    }

    this.currentProvider = provider;
    console.log(`🔄 Switched to provider: ${provider}`);
    return true;
  }

  /**
   * Get next available provider (for cycling)
   */
  async cycleProvider(): Promise<LLMProvider> {
    const providers: LLMProvider[] = ['heuristic', 'ollama', 'anthropic'];
    const currentIndex = providers.indexOf(this.currentProvider);
    const nextIndex = (currentIndex + 1) % providers.length;

    let attempts = 0;
    while (attempts < providers.length) {
      const nextProvider = providers[(nextIndex + attempts) % providers.length];
      const success = await this.setProvider(nextProvider);

      if (success) {
        return nextProvider;
      }

      attempts++;
    }

    // Fallback to heuristic
    this.currentProvider = 'heuristic';
    return 'heuristic';
  }

  /**
   * Get provider status information
   */
  getProviderStatus(): {
    current: LLMProvider;
    available: boolean;
    anthropic: boolean;
    ollama: boolean;
    heuristic: boolean;
  } {
    return {
      current: this.currentProvider,
      available: this.isProviderAvailable(),
      anthropic: this.anthropicService?.isServiceEnabled() || false,
      ollama: this.ollamaService?.isServiceAvailable() || false,
      heuristic: true,
    };
  }

  /**
   * Get current model name (for display)
   */
  getCurrentModel(): string {
    switch (this.currentProvider) {
      case 'anthropic':
        return 'Claude 3 Haiku';

      case 'ollama':
        return this.ollamaService?.getModel() || 'Unknown Ollama Model';

      case 'heuristic':
        return 'Heuristic Pathfinding';

      default:
        return 'Unknown';
    }
  }

  /**
   * Get Anthropic service (for embeddings)
   */
  getAnthropicService(): AnthropicService | null {
    return this.anthropicService;
  }

  /**
   * Get Ollama service
   */
  getOllamaService(): OllamaService | null {
    return this.ollamaService;
  }
}
