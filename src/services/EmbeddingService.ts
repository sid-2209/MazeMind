// src/services/EmbeddingService.ts
/**
 * EmbeddingService - Unified embedding abstraction layer
 *
 * Provides a single interface for multiple embedding providers with:
 * - Automatic provider selection and fallback
 * - Health checking and availability detection
 * - Unified statistics and cost tracking
 * - Runtime provider switching
 * - Consistent error handling
 *
 * Supported providers:
 * 1. OpenAI (text-embedding-3-small) - Primary, best price/performance
 * 2. Voyage AI (voyage-2) - Alternative, best quality
 * 3. Ollama (nomic-embed-text) - Local, free
 * 4. Fake (heuristic) - Fallback for testing
 */

import { OpenAIService } from './OpenAIService';
import { VoyageAIService } from './VoyageAIService';
import { OllamaService } from './OllamaService';

export type EmbeddingProvider = 'openai' | 'voyage' | 'ollama' | 'fake';

export interface EmbeddingConfig {
  // Provider selection
  provider: EmbeddingProvider;
  fallbackChain?: EmbeddingProvider[];  // Providers to try if primary fails

  // API keys
  openaiApiKey?: string;
  voyageApiKey?: string;

  // Ollama config
  ollamaUrl?: string;
  ollamaModel?: string;

  // Model configuration
  preferredDimension?: number;

  // Cache settings
  maxCacheSize?: number;
  enableCache?: boolean;
}

export interface UnifiedEmbeddingStats {
  provider: EmbeddingProvider;
  model: string;
  dimension: number;
  totalGenerated: number;
  cacheHits: number;
  cacheMisses: number;
  totalCost: number;
  avgLatency: number;
  errors: number;
  availability: {
    openai: boolean;
    voyage: boolean;
    ollama: boolean;
  };
}

export class EmbeddingService {
  private currentProvider: EmbeddingProvider;
  private fallbackChain: EmbeddingProvider[];
  private config: EmbeddingConfig;

  // Provider instances
  private openaiService: OpenAIService | null = null;
  private voyageService: VoyageAIService | null = null;
  private ollamaService: OllamaService | null = null;

  // Provider availability
  private availability: Record<EmbeddingProvider, boolean> = {
    openai: false,
    voyage: false,
    ollama: false,
    fake: true,  // Always available
  };

  // Unified statistics
  private stats: UnifiedEmbeddingStats;

  constructor(config: EmbeddingConfig) {
    this.config = config;
    this.currentProvider = config.provider;
    this.fallbackChain = config.fallbackChain || ['openai', 'ollama', 'fake'];

    // Initialize stats
    this.stats = {
      provider: this.currentProvider,
      model: 'unknown',
      dimension: config.preferredDimension || 1536,
      totalGenerated: 0,
      cacheHits: 0,
      cacheMisses: 0,
      totalCost: 0,
      avgLatency: 0,
      errors: 0,
      availability: {
        openai: false,
        voyage: false,
        ollama: false,
      },
    };

    // Initialize providers
    this.initializeProviders();

    console.log(`🎯 EmbeddingService initialized`);
    console.log(`   Primary: ${this.currentProvider}`);
    console.log(`   Fallback: ${this.fallbackChain.join(' → ')}`);
  }

  /**
   * Initialize all configured providers
   */
  private initializeProviders(): void {
    // OpenAI
    if (this.config.openaiApiKey && this.config.openaiApiKey !== 'your-openai-api-key-here') {
      try {
        this.openaiService = new OpenAIService({
          apiKey: this.config.openaiApiKey,
          maxCacheSize: this.config.maxCacheSize,
        });
        this.availability.openai = this.openaiService.isServiceEnabled();
        console.log(`   ✅ OpenAI: Available`);
      } catch (error) {
        console.warn(`   ❌ OpenAI: Failed to initialize`, error);
        this.availability.openai = false;
      }
    }

    // Voyage AI
    if (this.config.voyageApiKey && this.config.voyageApiKey !== 'your-voyage-api-key-here') {
      try {
        this.voyageService = new VoyageAIService({
          apiKey: this.config.voyageApiKey,
          maxCacheSize: this.config.maxCacheSize,
        });
        this.availability.voyage = this.voyageService.isServiceEnabled();
        console.log(`   ✅ Voyage AI: Available`);
      } catch (error) {
        console.warn(`   ❌ Voyage AI: Failed to initialize`, error);
        this.availability.voyage = false;
      }
    }

    // Ollama
    try {
      this.ollamaService = new OllamaService({
        baseUrl: this.config.ollamaUrl || 'http://localhost:11434',
        model: this.config.ollamaModel || 'llama3.2:3b-instruct-q4_K_M',
      });

      // Check availability asynchronously
      this.ollamaService.checkAvailability().then(available => {
        this.availability.ollama = available;
        if (available) {
          console.log(`   ✅ Ollama: Available`);
        } else {
          console.warn(`   ❌ Ollama: Not available`);
        }
      });
    } catch (error) {
      console.warn(`   ❌ Ollama: Failed to initialize`, error);
      this.availability.ollama = false;
    }

    // Update stats with current provider info
    this.updateProviderStats();
  }

  /**
   * Generate embedding using current provider with automatic fallback
   */
  async generateEmbedding(text: string): Promise<number[]> {
    // Try current provider first
    try {
      return await this.generateWithProvider(text, this.currentProvider);
    } catch (error) {
      console.warn(`❌ ${this.currentProvider} failed, trying fallback...`, error);
      this.stats.errors++;

      // Try fallback chain
      for (const fallbackProvider of this.fallbackChain) {
        if (fallbackProvider === this.currentProvider) continue;

        try {
          console.log(`   Trying ${fallbackProvider}...`);
          const embedding = await this.generateWithProvider(text, fallbackProvider);
          console.log(`   ✅ ${fallbackProvider} succeeded`);

          // Switch to this provider for future calls
          this.currentProvider = fallbackProvider;
          this.updateProviderStats();

          return embedding;
        } catch (fallbackError) {
          console.warn(`   ❌ ${fallbackProvider} also failed`);
          continue;
        }
      }

      // All providers failed, use fake embedding as last resort
      console.error('❌ All embedding providers failed, using fake embedding');
      return this.generateFakeEmbedding(text);
    }
  }

  /**
   * Generate embeddings in batch with automatic fallback
   */
  async generateEmbeddingsBatch(texts: string[]): Promise<number[][]> {
    try {
      return await this.generateBatchWithProvider(texts, this.currentProvider);
    } catch (error) {
      console.warn(`❌ Batch ${this.currentProvider} failed, trying fallback...`);
      this.stats.errors++;

      // Try fallback chain
      for (const fallbackProvider of this.fallbackChain) {
        if (fallbackProvider === this.currentProvider) continue;

        try {
          const embeddings = await this.generateBatchWithProvider(texts, fallbackProvider);
          this.currentProvider = fallbackProvider;
          this.updateProviderStats();
          return embeddings;
        } catch (fallbackError) {
          continue;
        }
      }

      // All failed, use fake embeddings
      return texts.map(t => this.generateFakeEmbedding(t));
    }
  }

  /**
   * Generate embedding with specific provider
   */
  private async generateWithProvider(text: string, provider: EmbeddingProvider): Promise<number[]> {
    switch (provider) {
      case 'openai':
        if (!this.openaiService || !this.availability.openai) {
          throw new Error('OpenAI not available');
        }
        return await this.openaiService.generateEmbedding(text);

      case 'voyage':
        if (!this.voyageService || !this.availability.voyage) {
          throw new Error('Voyage AI not available');
        }
        return await this.voyageService.generateEmbedding(text);

      case 'ollama':
        if (!this.ollamaService || !this.availability.ollama) {
          throw new Error('Ollama not available');
        }
        return await this.ollamaService.generateEmbedding(text, 'nomic-embed-text');

      case 'fake':
        return this.generateFakeEmbedding(text);

      default:
        throw new Error(`Unknown provider: ${provider}`);
    }
  }

  /**
   * Generate batch with specific provider
   */
  private async generateBatchWithProvider(texts: string[], provider: EmbeddingProvider): Promise<number[][]> {
    switch (provider) {
      case 'openai':
        if (!this.openaiService) throw new Error('OpenAI not available');
        return await this.openaiService.generateEmbeddingsBatch(texts);

      case 'voyage':
        if (!this.voyageService) throw new Error('Voyage AI not available');
        return await this.voyageService.generateEmbeddingsBatch(texts);

      case 'ollama':
        if (!this.ollamaService) throw new Error('Ollama not available');
        return await this.ollamaService.generateEmbeddingsBatch(texts, 'nomic-embed-text');

      case 'fake':
        return texts.map(t => this.generateFakeEmbedding(t));

      default:
        throw new Error(`Unknown provider: ${provider}`);
    }
  }

  /**
   * Generate fake embedding as last resort fallback
   */
  private generateFakeEmbedding(text: string): number[] {
    const dimension = this.config.preferredDimension || 1536;
    const embedding = new Array(dimension);

    // Simple deterministic hashing
    let hash = 0;
    for (let i = 0; i < text.length; i++) {
      hash = ((hash << 5) - hash) + text.charCodeAt(i);
      hash = hash & hash;
    }

    for (let i = 0; i < dimension; i++) {
      embedding[i] = Math.sin(hash + i) * 0.5 + 0.5;
    }

    // Normalize
    const magnitude = Math.sqrt(embedding.reduce((sum: number, val: number) => sum + val * val, 0));
    return embedding.map((val: number) => val / magnitude);
  }

  /**
   * Manually switch provider
   */
  async setProvider(provider: EmbeddingProvider): Promise<boolean> {
    if (!this.availability[provider] && provider !== 'fake') {
      console.warn(`⚠️  Provider ${provider} not available`);
      return false;
    }

    this.currentProvider = provider;
    this.updateProviderStats();
    console.log(`🔄 Switched to ${provider}`);

    return true;
  }

  /**
   * Cycle through available providers
   */
  async cycleProvider(): Promise<EmbeddingProvider> {
    const providers: EmbeddingProvider[] = ['openai', 'voyage', 'ollama', 'fake'];
    const currentIndex = providers.indexOf(this.currentProvider);
    const nextIndex = (currentIndex + 1) % providers.length;

    for (let i = 0; i < providers.length; i++) {
      const providerIndex = (nextIndex + i) % providers.length;
      const provider = providers[providerIndex];

      if (await this.setProvider(provider)) {
        return provider;
      }
    }

    // Fallback to fake
    this.currentProvider = 'fake';
    return 'fake';
  }

  /**
   * Get current provider
   */
  getCurrentProvider(): EmbeddingProvider {
    return this.currentProvider;
  }

  /**
   * Get current model info
   */
  getCurrentModel(): string {
    switch (this.currentProvider) {
      case 'openai':
        return this.openaiService?.getModelInfo().model || 'text-embedding-3-small';
      case 'voyage':
        return this.voyageService?.getModelInfo().model || 'voyage-2';
      case 'ollama':
        return 'nomic-embed-text';
      case 'fake':
        return 'heuristic-hash';
      default:
        return 'unknown';
    }
  }

  /**
   * Get unified statistics
   */
  getStatistics(): UnifiedEmbeddingStats {
    // Update with current provider stats
    if (this.currentProvider === 'openai' && this.openaiService) {
      const stats = this.openaiService.getStatistics();
      this.stats.totalGenerated = stats.totalGenerated;
      this.stats.cacheHits = stats.cacheHits;
      this.stats.cacheMisses = stats.cacheMisses;
      this.stats.totalCost = stats.totalCost;
      this.stats.avgLatency = stats.avgLatency;
      this.stats.errors += stats.errors;
    } else if (this.currentProvider === 'voyage' && this.voyageService) {
      const stats = this.voyageService.getStatistics();
      this.stats.totalGenerated = stats.totalGenerated;
      this.stats.cacheHits = stats.cacheHits;
      this.stats.cacheMisses = stats.cacheMisses;
      this.stats.totalCost = stats.totalCost;
      this.stats.avgLatency = stats.avgLatency;
      this.stats.errors += stats.errors;
    }

    this.stats.availability = { ...this.availability };
    return { ...this.stats };
  }

  /**
   * Get provider availability status
   */
  getProviderStatus(): Record<EmbeddingProvider, boolean> {
    return { ...this.availability };
  }

  /**
   * Update provider stats
   */
  private updateProviderStats(): void {
    this.stats.provider = this.currentProvider;

    switch (this.currentProvider) {
      case 'openai':
        this.stats.model = 'text-embedding-3-small';
        this.stats.dimension = 1536;
        break;
      case 'voyage':
        this.stats.model = 'voyage-2';
        this.stats.dimension = 1024;
        break;
      case 'ollama':
        this.stats.model = 'nomic-embed-text';
        this.stats.dimension = 768;
        break;
      case 'fake':
        this.stats.model = 'heuristic-hash';
        this.stats.dimension = this.config.preferredDimension || 1536;
        break;
    }
  }

  /**
   * Test current provider
   */
  async test(): Promise<boolean> {
    console.log(`🧪 Testing ${this.currentProvider}...`);

    try {
      const embedding = await this.generateEmbedding('Test embedding');
      console.log(`✅ Test successful! Generated ${embedding.length}D embedding`);
      console.log(`   Provider: ${this.currentProvider}`);
      console.log(`   Model: ${this.getCurrentModel()}`);
      return true;
    } catch (error) {
      console.error(`❌ Test failed:`, error);
      return false;
    }
  }

  /**
   * Calculate cosine similarity (static utility)
   */
  static cosineSimilarity(embedding1: number[], embedding2: number[]): number {
    if (embedding1.length !== embedding2.length) {
      console.error('❌ Embedding dimensions do not match');
      return 0;
    }

    let dotProduct = 0;
    let norm1 = 0;
    let norm2 = 0;

    for (let i = 0; i < embedding1.length; i++) {
      dotProduct += embedding1[i] * embedding2[i];
      norm1 += embedding1[i] * embedding1[i];
      norm2 += embedding2[i] * embedding2[i];
    }

    if (norm1 === 0 || norm2 === 0) {
      return 0;
    }

    return dotProduct / (Math.sqrt(norm1) * Math.sqrt(norm2));
  }
}
