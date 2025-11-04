// src/services/VoyageAIService.ts
/**
 * VoyageAIService - Voyage AI embeddings (Week 2, Days 1-2)
 *
 * Voyage AI specializes in retrieval-optimized embeddings
 * Best quality for semantic search, but more expensive than OpenAI
 *
 * Model: voyage-2
 * - Dimension: 1024
 * - Cost: $0.12 per 1M tokens (~$0.00024 per 100 observations)
 * - Quality: Excellent for retrieval tasks (best-in-class)
 *
 * Requires: VITE_VOYAGE_API_KEY in .env
 */

export interface VoyageConfig {
  apiKey: string;
  model?: string;
  dimension?: number;
  maxCacheSize?: number;
  maxRetries?: number;
  batchSize?: number;
}

export interface VoyageEmbeddingStats {
  totalGenerated: number;
  cacheHits: number;
  cacheMisses: number;
  totalTokens: number;
  totalCost: number;
  avgLatency: number;
  errors: number;
}

export class VoyageAIService {
  private isEnabled: boolean = false;
  private config: Required<VoyageConfig>;
  private baseUrl: string = 'https://api.voyageai.com/v1';

  // Caching
  private embeddingCache: Map<string, number[]> = new Map();
  private cacheOrder: string[] = [];

  // Statistics
  private stats: VoyageEmbeddingStats = {
    totalGenerated: 0,
    cacheHits: 0,
    cacheMisses: 0,
    totalTokens: 0,
    totalCost: 0,
    avgLatency: 0,
    errors: 0,
  };

  private readonly COST_PER_TOKEN = 0.00000012; // $0.12 per 1M tokens

  constructor(config: VoyageConfig) {
    this.config = {
      apiKey: config.apiKey,
      model: config.model || 'voyage-2',
      dimension: config.dimension || 1024,
      maxCacheSize: config.maxCacheSize || 10000,
      maxRetries: config.maxRetries || 3,
      batchSize: config.batchSize || 100,
    };

    if (!config.apiKey || config.apiKey === 'your-voyage-api-key-here') {
      console.warn('⚠️  No Voyage AI API key provided. Embeddings disabled.');
      this.isEnabled = false;
      return;
    }

    this.isEnabled = true;
    console.log(`🚢 VoyageAIService initialized (${this.config.model}, ${this.config.dimension}D)`);
  }

  isServiceEnabled(): boolean {
    return this.isEnabled;
  }

  /**
   * Generate embedding using Voyage AI API
   */
  async generateEmbedding(text: string): Promise<number[]> {
    if (!this.isEnabled) {
      throw new Error('Voyage AI service not enabled. Check API key.');
    }

    // Check cache
    const cached = this.embeddingCache.get(text);
    if (cached) {
      this.stats.cacheHits++;
      return cached;
    }

    this.stats.cacheMisses++;

    const startTime = Date.now();
    let lastError: Error | null = null;

    for (let attempt = 0; attempt < this.config.maxRetries; attempt++) {
      try {
        const response = await fetch(`${this.baseUrl}/embeddings`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.config.apiKey}`,
          },
          body: JSON.stringify({
            model: this.config.model,
            input: text,
          }),
        });

        if (!response.ok) {
          throw new Error(`Voyage AI API error: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        const embedding = data.data[0].embedding;
        const tokens = text.split(/\s+/).length; // Approximate
        const latency = Date.now() - startTime;

        // Update stats
        this.stats.totalGenerated++;
        this.stats.totalTokens += tokens;
        this.stats.totalCost += tokens * this.COST_PER_TOKEN;
        this.stats.avgLatency =
          (this.stats.avgLatency * (this.stats.totalGenerated - 1) + latency) /
          this.stats.totalGenerated;

        // Cache
        this.cacheEmbedding(text, embedding);

        if (this.stats.totalGenerated <= 5) {
          console.log(`✅ Voyage embedding: ${tokens} tokens, ${latency}ms, $${(tokens * this.COST_PER_TOKEN).toFixed(6)}`);
        }

        return embedding;

      } catch (error) {
        lastError = error as Error;
        this.stats.errors++;
        console.error(`❌ Voyage embedding error (attempt ${attempt + 1}):`, error);

        if (attempt < this.config.maxRetries - 1) {
          const delay = Math.pow(2, attempt) * 1000;
          await this.sleep(delay);
        }
      }
    }

    throw new Error(`Failed after ${this.config.maxRetries} attempts: ${lastError?.message}`);
  }

  /**
   * Batch embedding generation
   */
  async generateEmbeddingsBatch(texts: string[]): Promise<number[][]> {
    if (!this.isEnabled) {
      throw new Error('Voyage AI service not enabled.');
    }

    const results: number[][] = new Array(texts.length);
    const uncachedIndices: number[] = [];
    const uncachedTexts: string[] = [];

    for (let i = 0; i < texts.length; i++) {
      const cached = this.embeddingCache.get(texts[i]);
      if (cached) {
        results[i] = cached;
        this.stats.cacheHits++;
      } else {
        uncachedIndices.push(i);
        uncachedTexts.push(texts[i]);
        this.stats.cacheMisses++;
      }
    }

    if (uncachedTexts.length === 0) {
      return results;
    }

    console.log(`🔄 Voyage: Generating ${uncachedTexts.length}/${texts.length} embeddings`);

    const batchSize = this.config.batchSize;
    const startTime = Date.now();

    for (let i = 0; i < uncachedTexts.length; i += batchSize) {
      const batch = uncachedTexts.slice(i, i + batchSize);
      const batchIndices = uncachedIndices.slice(i, i + batchSize);

      try {
        const response = await fetch(`${this.baseUrl}/embeddings`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.config.apiKey}`,
          },
          body: JSON.stringify({
            model: this.config.model,
            input: batch,
          }),
        });

        if (!response.ok) {
          throw new Error(`Voyage API error: ${response.status}`);
        }

        const data = await response.json();

        for (let j = 0; j < data.data.length; j++) {
          const embedding = data.data[j].embedding;
          const originalIndex = batchIndices[j];
          results[originalIndex] = embedding;
          this.cacheEmbedding(texts[originalIndex], embedding);
        }

        const tokens = batch.reduce((sum, t) => sum + t.split(/\s+/).length, 0);
        this.stats.totalGenerated += batch.length;
        this.stats.totalTokens += tokens;
        this.stats.totalCost += tokens * this.COST_PER_TOKEN;

        if (i + batchSize < uncachedTexts.length) {
          await this.sleep(100);
        }

      } catch (error) {
        this.stats.errors++;
        console.error(`❌ Voyage batch error:`, error);

        for (const idx of batchIndices) {
          if (!results[idx]) {
            results[idx] = new Array(this.config.dimension).fill(0);
          }
        }
      }
    }

    const totalTime = Date.now() - startTime;
    console.log(`✅ Voyage batch complete: ${totalTime}ms, $${this.stats.totalCost.toFixed(6)}`);

    return results;
  }

  private cacheEmbedding(text: string, embedding: number[]): void {
    if (this.embeddingCache.has(text)) {
      const index = this.cacheOrder.indexOf(text);
      if (index > -1) {
        this.cacheOrder.splice(index, 1);
      }
      this.cacheOrder.push(text);
      return;
    }

    if (this.embeddingCache.size >= this.config.maxCacheSize) {
      const oldest = this.cacheOrder.shift();
      if (oldest) {
        this.embeddingCache.delete(oldest);
      }
    }

    this.embeddingCache.set(text, embedding);
    this.cacheOrder.push(text);
  }

  getStatistics(): VoyageEmbeddingStats {
    return { ...this.stats };
  }

  getCacheHitRate(): number {
    const total = this.stats.cacheHits + this.stats.cacheMisses;
    return total === 0 ? 0 : (this.stats.cacheHits / total) * 100;
  }

  getCacheSize(): number {
    return this.embeddingCache.size;
  }

  clearCache(): void {
    this.embeddingCache.clear();
    this.cacheOrder = [];
  }

  resetStatistics(): void {
    this.stats = {
      totalGenerated: 0,
      cacheHits: 0,
      cacheMisses: 0,
      totalTokens: 0,
      totalCost: 0,
      avgLatency: 0,
      errors: 0,
    };
  }

  getModelInfo(): { model: string; dimension: number } {
    return {
      model: this.config.model,
      dimension: this.config.dimension,
    };
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async test(): Promise<boolean> {
    if (!this.isEnabled) {
      console.error('❌ Voyage AI service not enabled');
      return false;
    }

    try {
      console.log('🧪 Testing Voyage AI embeddings...');
      const embedding = await this.generateEmbedding('Test embedding');
      console.log(`✅ Test successful! ${embedding.length}D embedding`);
      return true;
    } catch (error) {
      console.error('❌ Test failed:', error);
      return false;
    }
  }
}
