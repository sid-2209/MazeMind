// src/services/OpenAIService.ts
/**
 * OpenAIService - OpenAI API integration for embeddings (Week 2, Days 1-2)
 *
 * Provides REAL semantic embeddings using OpenAI's text-embedding-3-small model
 *
 * Features:
 * - True semantic similarity (unlike fake embeddings in AnthropicService)
 * - Batch embedding generation (up to 2048 texts per request)
 * - LRU caching with configurable size
 * - Cost tracking and logging
 * - Exponential backoff retry logic
 * - Error handling with fallbacks
 *
 * Model: text-embedding-3-small
 * - Dimension: 1536
 * - Cost: $0.02 per 1M tokens (~$0.00004 per 100 observations)
 * - Quality: Excellent for semantic search
 *
 * Requires: VITE_OPENAI_API_KEY in .env
 */

import OpenAI from 'openai';

export interface OpenAIConfig {
  apiKey: string;
  model?: string;
  dimension?: number;
  maxCacheSize?: number;
  maxRetries?: number;
  batchSize?: number;
}

export interface EmbeddingStats {
  totalGenerated: number;
  cacheHits: number;
  cacheMisses: number;
  totalTokens: number;
  totalCost: number; // USD
  avgLatency: number; // ms
  errors: number;
}

export class OpenAIService {
  private client: OpenAI | null = null;
  private isEnabled: boolean = false;
  private config: Required<OpenAIConfig>;

  // Caching
  private embeddingCache: Map<string, number[]> = new Map();
  private cacheOrder: string[] = []; // For LRU eviction

  // Statistics
  private stats: EmbeddingStats = {
    totalGenerated: 0,
    cacheHits: 0,
    cacheMisses: 0,
    totalTokens: 0,
    totalCost: 0,
    avgLatency: 0,
    errors: 0,
  };

  // Cost constants
  private readonly COST_PER_TOKEN = 0.00000002; // $0.02 per 1M tokens

  constructor(config: OpenAIConfig) {
    this.config = {
      apiKey: config.apiKey,
      model: config.model || 'text-embedding-3-small',
      dimension: config.dimension || 1536,
      maxCacheSize: config.maxCacheSize || 10000,
      maxRetries: config.maxRetries || 3,
      batchSize: config.batchSize || 100,
    };

    if (!config.apiKey || config.apiKey === 'your-openai-api-key-here') {
      console.warn('⚠️  No OpenAI API key provided. Embeddings disabled.');
      this.isEnabled = false;
      return;
    }

    try {
      this.client = new OpenAI({
        apiKey: config.apiKey,
        dangerouslyAllowBrowser: true, // Required for browser usage
      });
      this.isEnabled = true;
      console.log(`🤖 OpenAIService initialized (${this.config.model}, ${this.config.dimension}D)`);
    } catch (error) {
      console.error('❌ Failed to initialize OpenAI client:', error);
      this.isEnabled = false;
      this.client = null;
    }
  }

  /**
   * Check if service is enabled (has valid API key)
   */
  isServiceEnabled(): boolean {
    return this.isEnabled && this.client !== null;
  }

  /**
   * Generate embedding for a single text using OpenAI
   * Returns real semantic embedding (1536 dimensions)
   */
  async generateEmbedding(text: string): Promise<number[]> {
    if (!this.isEnabled || !this.client) {
      throw new Error('OpenAI service not enabled. Check API key.');
    }

    // Check cache first
    const cached = this.embeddingCache.get(text);
    if (cached) {
      this.stats.cacheHits++;
      return cached;
    }

    this.stats.cacheMisses++;

    // Generate new embedding with retry logic
    const startTime = Date.now();
    let lastError: Error | null = null;

    for (let attempt = 0; attempt < this.config.maxRetries; attempt++) {
      try {
        const response = await this.client.embeddings.create({
          model: this.config.model,
          input: text,
          dimensions: this.config.dimension,
        });

        const embedding = response.data[0].embedding;
        const tokens = response.usage.total_tokens;
        const latency = Date.now() - startTime;

        // Update statistics
        this.stats.totalGenerated++;
        this.stats.totalTokens += tokens;
        this.stats.totalCost += tokens * this.COST_PER_TOKEN;
        this.stats.avgLatency =
          (this.stats.avgLatency * (this.stats.totalGenerated - 1) + latency) /
          this.stats.totalGenerated;

        // Cache the result
        this.cacheEmbedding(text, embedding);

        // Log success (only for first few to avoid spam)
        if (this.stats.totalGenerated <= 5) {
          console.log(`✅ Generated embedding: ${tokens} tokens, ${latency}ms, $${(tokens * this.COST_PER_TOKEN).toFixed(6)}`);
        }

        return embedding;

      } catch (error) {
        lastError = error as Error;
        this.stats.errors++;

        console.error(`❌ OpenAI embedding error (attempt ${attempt + 1}/${this.config.maxRetries}):`, error);

        // Exponential backoff
        if (attempt < this.config.maxRetries - 1) {
          const delay = Math.pow(2, attempt) * 1000; // 1s, 2s, 4s
          console.log(`   Retrying in ${delay}ms...`);
          await this.sleep(delay);
        }
      }
    }

    // All retries failed
    throw new Error(`Failed to generate embedding after ${this.config.maxRetries} attempts: ${lastError?.message}`);
  }

  /**
   * Generate embeddings for multiple texts in batch
   * Much more efficient than individual calls (up to 2048 texts)
   */
  async generateEmbeddingsBatch(texts: string[]): Promise<number[][]> {
    if (!this.isEnabled || !this.client) {
      throw new Error('OpenAI service not enabled. Check API key.');
    }

    // Check which texts are already cached
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

    // If all cached, return immediately
    if (uncachedTexts.length === 0) {
      console.log(`✅ All ${texts.length} embeddings retrieved from cache`);
      return results;
    }

    console.log(`🔄 Generating ${uncachedTexts.length}/${texts.length} embeddings (${texts.length - uncachedTexts.length} cached)`);

    // Process uncached texts in batches
    const batchSize = this.config.batchSize;
    const startTime = Date.now();

    for (let i = 0; i < uncachedTexts.length; i += batchSize) {
      const batch = uncachedTexts.slice(i, i + batchSize);
      const batchIndices = uncachedIndices.slice(i, i + batchSize);

      try {
        const response = await this.client.embeddings.create({
          model: this.config.model,
          input: batch,
          dimensions: this.config.dimension,
        });

        // Process results
        for (let j = 0; j < response.data.length; j++) {
          const embedding = response.data[j].embedding;
          const originalIndex = batchIndices[j];
          const originalText = texts[originalIndex];

          results[originalIndex] = embedding;
          this.cacheEmbedding(originalText, embedding);
        }

        // Update statistics
        const tokens = response.usage.total_tokens;
        this.stats.totalGenerated += batch.length;
        this.stats.totalTokens += tokens;
        this.stats.totalCost += tokens * this.COST_PER_TOKEN;

        console.log(`   Batch ${Math.floor(i / batchSize) + 1}: ${batch.length} embeddings, ${tokens} tokens, $${(tokens * this.COST_PER_TOKEN).toFixed(6)}`);

        // Small delay between batches to avoid rate limits
        if (i + batchSize < uncachedTexts.length) {
          await this.sleep(100);
        }

      } catch (error) {
        this.stats.errors++;
        console.error(`❌ Batch embedding error:`, error);

        // Fill remaining with zeros (fallback)
        for (const idx of batchIndices) {
          if (!results[idx]) {
            results[idx] = new Array(this.config.dimension).fill(0);
          }
        }
      }
    }

    const totalTime = Date.now() - startTime;
    this.stats.avgLatency = totalTime / uncachedTexts.length;

    console.log(`✅ Batch complete: ${uncachedTexts.length} embeddings in ${totalTime}ms`);
    console.log(`   Total cost: $${this.stats.totalCost.toFixed(6)}, Cache hit rate: ${this.getCacheHitRate().toFixed(1)}%`);

    return results;
  }

  /**
   * Cache embedding with LRU eviction
   */
  private cacheEmbedding(text: string, embedding: number[]): void {
    // Check if already exists (update LRU order)
    if (this.embeddingCache.has(text)) {
      const index = this.cacheOrder.indexOf(text);
      if (index > -1) {
        this.cacheOrder.splice(index, 1);
      }
      this.cacheOrder.push(text);
      return;
    }

    // Evict oldest if cache full
    if (this.embeddingCache.size >= this.config.maxCacheSize) {
      const oldest = this.cacheOrder.shift();
      if (oldest) {
        this.embeddingCache.delete(oldest);
      }
    }

    // Add new entry
    this.embeddingCache.set(text, embedding);
    this.cacheOrder.push(text);
  }

  /**
   * Get embedding statistics
   */
  getStatistics(): EmbeddingStats {
    return { ...this.stats };
  }

  /**
   * Get cache hit rate percentage
   */
  getCacheHitRate(): number {
    const total = this.stats.cacheHits + this.stats.cacheMisses;
    return total === 0 ? 0 : (this.stats.cacheHits / total) * 100;
  }

  /**
   * Get cache size
   */
  getCacheSize(): number {
    return this.embeddingCache.size;
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.embeddingCache.clear();
    this.cacheOrder = [];
    console.log('🗑️  OpenAI embedding cache cleared');
  }

  /**
   * Reset statistics
   */
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
    console.log('📊 OpenAI statistics reset');
  }

  /**
   * Get model information
   */
  getModelInfo(): { model: string; dimension: number } {
    return {
      model: this.config.model,
      dimension: this.config.dimension,
    };
  }

  /**
   * Utility: Sleep for ms milliseconds
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Calculate cosine similarity between two embeddings
   * Returns value between -1 and 1 (higher = more similar)
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

  /**
   * Test the service with a simple embedding generation
   * Useful for validating API key and connectivity
   */
  async test(): Promise<boolean> {
    if (!this.isEnabled) {
      console.error('❌ OpenAI service not enabled');
      return false;
    }

    try {
      console.log('🧪 Testing OpenAI embeddings...');
      const testText = 'Hello, this is a test embedding.';
      const embedding = await this.generateEmbedding(testText);

      console.log(`✅ Test successful! Generated ${embedding.length}D embedding`);
      console.log(`   First 5 values: [${embedding.slice(0, 5).map(v => v.toFixed(4)).join(', ')}...]`);

      return true;
    } catch (error) {
      console.error('❌ Test failed:', error);
      return false;
    }
  }
}
