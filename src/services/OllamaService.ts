// src/services/OllamaService.ts
/**
 * OllamaService - Local LLM integration via Ollama
 *
 * Provides integration with locally-running Ollama models:
 * - Text generation for decision-making
 * - Embeddings generation (nomic-embed-text)
 * - Streaming responses (optional)
 * - Error handling and retries
 * - Compatible with Llama 3.2, Mistral, Phi-3, etc.
 *
 * Ollama API: http://localhost:11434
 * Recommended models for text generation:
 * - llama3.2:3b-instruct-q4_K_M (best balance)
 * - llama3.2:1b-instruct-q4_0 (best speed)
 * - llama3.1:8b-instruct-q4_K_M (best quality)
 *
 * Recommended embeddings model:
 * - nomic-embed-text (768 dimensions, free, local)
 */

export interface OllamaConfig {
  baseUrl: string;
  model: string;
  timeout: number;  // milliseconds
}

export interface OllamaGenerateRequest {
  model: string;
  prompt: string;
  stream?: boolean;
  options?: {
    temperature?: number;
    top_p?: number;
    top_k?: number;
    max_tokens?: number;
    stop?: string[];
  };
}

export interface OllamaGenerateResponse {
  model: string;
  created_at: string;
  response: string;
  done: boolean;
  context?: number[];
  total_duration?: number;
  load_duration?: number;
  prompt_eval_count?: number;
  prompt_eval_duration?: number;
  eval_count?: number;
  eval_duration?: number;
}

export class OllamaService {
  private config: OllamaConfig;
  private isAvailable: boolean = false;

  constructor(config: Partial<OllamaConfig> = {}) {
    this.config = {
      baseUrl: config.baseUrl || 'http://localhost:11434',
      model: config.model || 'llama3.2:3b-instruct-q4_K_M',
      timeout: config.timeout || 30000,  // 30 seconds
    };

    // Check availability on initialization
    this.checkAvailability().catch(() => {
      console.warn('⚠️  Ollama not available at', this.config.baseUrl);
    });
  }

  /**
   * Check if Ollama server is running and accessible
   */
  async checkAvailability(): Promise<boolean> {
    try {
      const response = await fetch(`${this.config.baseUrl}/api/tags`, {
        method: 'GET',
        signal: AbortSignal.timeout(5000),
      });

      if (response.ok) {
        const data = await response.json();
        this.isAvailable = true;

        // Check if our model is available
        const models = data.models || [];
        const hasModel = models.some((m: any) =>
          m.name === this.config.model ||
          m.name.startsWith(this.config.model.split(':')[0])
        );

        if (!hasModel) {
          console.warn(`⚠️  Model ${this.config.model} not found in Ollama`);
          console.log('   Available models:', models.map((m: any) => m.name).join(', '));
        } else {
          console.log(`✅ Ollama available with model: ${this.config.model}`);
        }

        return true;
      }

      this.isAvailable = false;
      return false;
    } catch (error) {
      this.isAvailable = false;
      return false;
    }
  }

  /**
   * Check if service is available and ready to use
   */
  isServiceAvailable(): boolean {
    return this.isAvailable;
  }

  /**
   * Generate text completion from prompt
   */
  async generate(
    prompt: string,
    options: {
      temperature?: number;
      max_tokens?: number;
      stop?: string[];
    } = {}
  ): Promise<string> {
    if (!this.isAvailable) {
      throw new Error('Ollama service is not available');
    }

    const request: OllamaGenerateRequest = {
      model: this.config.model,
      prompt,
      stream: false,
      options: {
        temperature: options.temperature ?? 0.7,
        top_p: 0.9,
        top_k: 40,
        max_tokens: options.max_tokens ?? 150,
        stop: options.stop,
      },
    };

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

      const response = await fetch(`${this.config.baseUrl}/api/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`Ollama API error: ${response.status} ${response.statusText}`);
      }

      const data: OllamaGenerateResponse = await response.json();

      // Log performance metrics
      if (data.total_duration && data.eval_count) {
        const totalSec = data.total_duration / 1_000_000_000;
        const tokensPerSec = data.eval_count / totalSec;
        console.log(`🤖 Ollama response: ${totalSec.toFixed(2)}s (${tokensPerSec.toFixed(1)} tok/s)`);
      }

      return data.response.trim();
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('Ollama request timed out');
      }
      throw error;
    }
  }

  /**
   * Generate with streaming (for future real-time display)
   */
  async *generateStream(
    prompt: string,
    options: {
      temperature?: number;
      max_tokens?: number;
      stop?: string[];
    } = {}
  ): AsyncGenerator<string, void, unknown> {
    if (!this.isAvailable) {
      throw new Error('Ollama service is not available');
    }

    const request: OllamaGenerateRequest = {
      model: this.config.model,
      prompt,
      stream: true,
      options: {
        temperature: options.temperature ?? 0.7,
        top_p: 0.9,
        top_k: 40,
        max_tokens: options.max_tokens ?? 150,
        stop: options.stop,
      },
    };

    const response = await fetch(`${this.config.baseUrl}/api/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      throw new Error(`Ollama API error: ${response.status}`);
    }

    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error('No response body');
    }

    const decoder = new TextDecoder();
    let buffer = '';

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.trim()) {
            try {
              const data: OllamaGenerateResponse = JSON.parse(line);
              if (data.response) {
                yield data.response;
              }
              if (data.done) {
                return;
              }
            } catch (e) {
              console.warn('Failed to parse streaming response:', e);
            }
          }
        }
      }
    } finally {
      reader.releaseLock();
    }
  }

  /**
   * Get list of available models
   */
  async getAvailableModels(): Promise<string[]> {
    try {
      const response = await fetch(`${this.config.baseUrl}/api/tags`);
      if (response.ok) {
        const data = await response.json();
        return (data.models || []).map((m: any) => m.name);
      }
      return [];
    } catch (error) {
      console.error('Failed to get models:', error);
      return [];
    }
  }

  /**
   * Set the model to use
   */
  setModel(model: string): void {
    this.config.model = model;
    console.log(`🔄 Switched to model: ${model}`);
  }

  /**
   * Get current model
   */
  getModel(): string {
    return this.config.model;
  }

  /**
   * Get configuration
   */
  getConfig(): OllamaConfig {
    return { ...this.config };
  }

  /**
   * Generate embedding using Ollama's embedding API
   * Recommended model: nomic-embed-text (768 dimensions)
   * Usage: Pull model first: `ollama pull nomic-embed-text`
   */
  async generateEmbedding(
    text: string,
    embeddingModel: string = 'nomic-embed-text'
  ): Promise<number[]> {
    if (!this.isAvailable) {
      throw new Error('Ollama service is not available');
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

      const response = await fetch(`${this.config.baseUrl}/api/embeddings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: embeddingModel,
          prompt: text,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`Ollama embedding API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();

      if (!data.embedding || !Array.isArray(data.embedding)) {
        throw new Error('Invalid embedding response from Ollama');
      }

      return data.embedding;
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('Ollama embedding request timed out');
      }
      throw error;
    }
  }

  /**
   * Generate embeddings for multiple texts in batch
   * More efficient than individual calls for large batches
   */
  async generateEmbeddingsBatch(
    texts: string[],
    embeddingModel: string = 'nomic-embed-text'
  ): Promise<number[][]> {
    if (!this.isAvailable) {
      throw new Error('Ollama service is not available');
    }

    console.log(`🔄 Ollama: Generating ${texts.length} embeddings locally (free!)...`);

    const embeddings: number[][] = [];
    const startTime = Date.now();

    // Process sequentially for local (no rate limits)
    for (let i = 0; i < texts.length; i++) {
      try {
        const embedding = await this.generateEmbedding(texts[i], embeddingModel);
        embeddings.push(embedding);

        // Log progress for large batches
        if (texts.length > 10 && (i + 1) % 10 === 0) {
          console.log(`   Progress: ${i + 1}/${texts.length} embeddings`);
        }
      } catch (error) {
        console.error(`❌ Failed to generate embedding for text ${i}:`, error);
        // Return zero vector as fallback
        embeddings.push(new Array(768).fill(0));
      }
    }

    const totalTime = Date.now() - startTime;
    const avgTime = totalTime / texts.length;

    console.log(`✅ Ollama batch complete: ${texts.length} embeddings in ${totalTime}ms (${avgTime.toFixed(0)}ms avg)`);

    return embeddings;
  }

  /**
   * Test embedding generation
   */
  async testEmbedding(embeddingModel: string = 'nomic-embed-text'): Promise<boolean> {
    if (!this.isAvailable) {
      console.error('❌ Ollama service not available');
      return false;
    }

    try {
      console.log(`🧪 Testing Ollama embeddings with ${embeddingModel}...`);
      const embedding = await this.generateEmbedding('Test embedding', embeddingModel);
      console.log(`✅ Test successful! Generated ${embedding.length}D embedding`);
      console.log(`   First 5 values: [${embedding.slice(0, 5).map(v => v.toFixed(4)).join(', ')}...]`);
      return true;
    } catch (error) {
      console.error('❌ Ollama embedding test failed:', error);
      console.log(`   Make sure you have pulled the model: ollama pull ${embeddingModel}`);
      return false;
    }
  }
}
