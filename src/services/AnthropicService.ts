// src/services/AnthropicService.ts
/**
 * AnthropicService - Anthropic API integration (Week 2, Day 2)
 *
 * Provides:
 * - Real semantic embeddings via EmbeddingService (OpenAI/Voyage/Ollama)
 * - LLM-based importance scoring (future)
 * - Decision-making prompts (Week 2, Days 3-4)
 *
 * Uses:
 * - @anthropic-ai/sdk for Claude API
 * - EmbeddingService for real semantic embeddings
 *
 * Requires: VITE_ANTHROPIC_API_KEY in .env
 */

import Anthropic from '@anthropic-ai/sdk';
import { MEMORY_CONFIG } from '../config/game.config';
import { EmbeddingService, EmbeddingConfig } from './EmbeddingService';

export class AnthropicService {
  private _client: Anthropic | null = null; // Will be used in future for LLM calls
  private embeddingCache: Map<string, number[]> = new Map();
  private isEnabled: boolean = false;
  private embeddingService: EmbeddingService | null = null;  // NEW: Real embeddings
  private useRealEmbeddings: boolean = false;

  constructor(apiKey?: string, embeddingConfig?: EmbeddingConfig) {
    // Initialize Anthropic client for future LLM use
    if (apiKey && apiKey !== 'sk-ant-your-key-here') {
      try {
        this._client = new Anthropic({ apiKey });
        this.isEnabled = true;
        console.log('🤖 AnthropicService initialized (Claude API)');
      } catch (error) {
        console.error('❌ Failed to initialize Anthropic client:', error);
        this.isEnabled = false;
        this._client = null;
      }
    } else {
      console.warn('⚠️  No Anthropic API key provided. Claude features disabled.');
      this.isEnabled = false;
    }

    // Initialize EmbeddingService for real semantic embeddings
    if (embeddingConfig) {
      try {
        this.embeddingService = new EmbeddingService(embeddingConfig);
        this.useRealEmbeddings = true;
        console.log('✅ Real embeddings enabled via EmbeddingService');
      } catch (error) {
        console.error('❌ Failed to initialize EmbeddingService:', error);
        this.useRealEmbeddings = false;
        console.warn('⚠️  Falling back to fake embeddings');
      }
    } else {
      console.warn('⚠️  No embedding config provided. Using fake embeddings.');
      this.useRealEmbeddings = false;
    }
  }

  /**
   * Check if service is enabled (has valid API key)
   */
  isServiceEnabled(): boolean {
    return this.isEnabled;
  }

  /**
   * Get client (for future use)
   */
  getClient(): Anthropic | null {
    return this._client;
  }

  /**
   * Get EmbeddingService instance (for direct access if needed)
   */
  getEmbeddingService(): EmbeddingService | null {
    return this.embeddingService;
  }

  /**
   * Check if using real embeddings
   */
  isUsingRealEmbeddings(): boolean {
    return this.useRealEmbeddings;
  }

  /**
   * Generate embedding for text using REAL semantic embeddings
   *
   * Now uses EmbeddingService with OpenAI/Voyage/Ollama for true semantic similarity!
   * Falls back to fake embeddings only if real embeddings unavailable.
   */
  async generateEmbedding(text: string): Promise<number[]> {
    // Check cache first
    const cached = this.embeddingCache.get(text);
    if (cached) {
      return cached;
    }

    try {
      let embedding: number[];

      // Use real embeddings if available
      if (this.useRealEmbeddings && this.embeddingService) {
        embedding = await this.embeddingService.generateEmbedding(text);
      } else {
        // Fallback to fake embeddings
        console.warn('⚠️  Using fake embeddings (no EmbeddingService configured)');
        embedding = await this.generateSimpleEmbedding(text);
      }

      // Cache the result
      if (MEMORY_CONFIG.enableEmbeddingCache) {
        this.cacheEmbedding(text, embedding);
      }

      return embedding;
    } catch (error) {
      console.error('❌ Failed to generate embedding:', error);
      // Return fake embedding as last resort
      return this.generateSimpleEmbedding(text);
    }
  }

  /**
   * Generate embeddings for multiple texts in batch
   * More efficient than individual calls - uses EmbeddingService batch API
   */
  async generateEmbeddingsBatch(texts: string[]): Promise<number[][]> {
    try {
      // Use real embeddings batch API if available
      if (this.useRealEmbeddings && this.embeddingService) {
        return await this.embeddingService.generateEmbeddingsBatch(texts);
      } else {
        // Fallback to individual fake embeddings
        console.warn('⚠️  Using fake embeddings batch (no EmbeddingService)');
        return await Promise.all(texts.map(text => this.generateEmbedding(text)));
      }
    } catch (error) {
      console.error('❌ Batch embedding generation failed:', error);
      // Fallback to fake embeddings
      return texts.map(() => this.generateRandomEmbedding());
    }
  }

  /**
   * Generate simple embedding using text characteristics
   * This is a TEMPORARY solution until proper embedding API is available
   *
   * Creates a vector based on:
   * - Word frequencies
   * - Character n-grams
   * - Length and structure features
   */
  private async generateSimpleEmbedding(text: string): Promise<number[]> {
    const dimension = MEMORY_CONFIG.embeddingDimension;
    const embedding = new Array(dimension).fill(0);

    // Normalize text
    const normalized = text.toLowerCase().trim();
    const words = normalized.split(/\s+/);

    // Feature 1: Word-based features (first 1/3 of dimensions)
    const wordFeatures = Math.floor(dimension / 3);
    for (let i = 0; i < wordFeatures; i++) {
      const wordIndex = i % words.length;
      const word = words[wordIndex];

      // Hash word to create feature value
      let hash = 0;
      for (let j = 0; j < word.length; j++) {
        hash = ((hash << 5) - hash) + word.charCodeAt(j);
        hash = hash & hash; // Convert to 32bit integer
      }

      embedding[i] = (Math.sin(hash + i) + 1) / 2; // Normalize to [0, 1]
    }

    // Feature 2: Character n-gram features (middle 1/3)
    const ngramFeatures = Math.floor(dimension / 3);
    for (let i = 0; i < ngramFeatures; i++) {
      const ngramSize = 2 + (i % 3); // 2-grams, 3-grams, 4-grams
      let ngramHash = 0;

      for (let j = 0; j < normalized.length - ngramSize; j++) {
        const ngram = normalized.substr(j, ngramSize);
        for (let k = 0; k < ngram.length; k++) {
          ngramHash = ((ngramHash << 5) - ngramHash) + ngram.charCodeAt(k);
        }
      }

      embedding[wordFeatures + i] = (Math.sin(ngramHash + i) + 1) / 2;
    }

    // Feature 3: Structural features (last 1/3)
    const structFeatures = dimension - wordFeatures - ngramFeatures;
    for (let i = 0; i < structFeatures; i++) {
      const feature = i % 5;
      switch (feature) {
        case 0: // Length feature
          embedding[wordFeatures + ngramFeatures + i] = Math.min(text.length / 200, 1);
          break;
        case 1: // Word count feature
          embedding[wordFeatures + ngramFeatures + i] = Math.min(words.length / 50, 1);
          break;
        case 2: // Average word length
          const avgLen = words.reduce((s, w) => s + w.length, 0) / words.length;
          embedding[wordFeatures + ngramFeatures + i] = Math.min(avgLen / 10, 1);
          break;
        case 3: // Punctuation ratio
          const punctCount = (text.match(/[.,!?;:]/g) || []).length;
          embedding[wordFeatures + ngramFeatures + i] = Math.min(punctCount / words.length, 1);
          break;
        case 4: // Number presence
          const hasNumbers = /\d/.test(text) ? 1 : 0;
          embedding[wordFeatures + ngramFeatures + i] = hasNumbers;
          break;
      }
    }

    // Normalize embedding vector to unit length
    const magnitude = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
    return embedding.map(val => val / magnitude);
  }

  /**
   * Generate random embedding (fallback for testing)
   */
  private generateRandomEmbedding(): number[] {
    const dimension = MEMORY_CONFIG.embeddingDimension;
    const embedding = new Array(dimension);

    for (let i = 0; i < dimension; i++) {
      embedding[i] = Math.random();
    }

    // Normalize to unit length
    const magnitude = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
    return embedding.map(val => val / magnitude);
  }

  /**
   * Cache embedding to avoid regenerating
   */
  private cacheEmbedding(text: string, embedding: number[]): void {
    // Implement LRU-style cache eviction
    if (this.embeddingCache.size >= MEMORY_CONFIG.maxCachedEmbeddings) {
      // Remove oldest entry (first key)
      const firstKey = this.embeddingCache.keys().next().value;
      this.embeddingCache.delete(firstKey);
    }

    this.embeddingCache.set(text, embedding);
  }

  /**
   * Calculate cosine similarity between two embeddings
   * Returns value between -1 and 1 (higher = more similar)
   */
  cosineSimilarity(embedding1: number[], embedding2: number[]): number {
    if (embedding1.length !== embedding2.length) {
      console.error('❌ Embedding dimensions do not match');
      return 0;
    }

    let dotProduct = 0;
    let magnitude1 = 0;
    let magnitude2 = 0;

    for (let i = 0; i < embedding1.length; i++) {
      dotProduct += embedding1[i] * embedding2[i];
      magnitude1 += embedding1[i] * embedding1[i];
      magnitude2 += embedding2[i] * embedding2[i];
    }

    magnitude1 = Math.sqrt(magnitude1);
    magnitude2 = Math.sqrt(magnitude2);

    if (magnitude1 === 0 || magnitude2 === 0) {
      return 0;
    }

    return dotProduct / (magnitude1 * magnitude2);
  }

  /**
   * Score importance of an observation using LLM
   * Returns score 1-10 (future enhancement)
   */
  async scoreImportance(observation: string): Promise<number> {
    if (!this.isEnabled) {
      // Use heuristic scoring if service is disabled
      return this.heuristicImportanceScore(observation);
    }

    // TODO: Implement LLM-based importance scoring in future
    // For now, use heuristic
    return this.heuristicImportanceScore(observation);
  }

  /**
   * Heuristic importance scoring based on keywords
   */
  private heuristicImportanceScore(observation: string): number {
    const text = observation.toLowerCase();

    // Critical keywords (9-10)
    if (
      text.includes('exit') ||
      text.includes('dying') ||
      text.includes('critical') ||
      text.includes('danger')
    ) {
      return 9;
    }

    // Important keywords (7-8)
    if (
      text.includes('food') ||
      text.includes('water') ||
      text.includes('resource') ||
      text.includes('found') ||
      text.includes('discovered')
    ) {
      return 7;
    }

    // Notable keywords (5-6)
    if (
      text.includes('junction') ||
      text.includes('decision') ||
      text.includes('dead end') ||
      text.includes('new area')
    ) {
      return 5;
    }

    // Mundane (3-4)
    return 3;
  }

  /**
   * Clear embedding cache
   */
  clearCache(): void {
    this.embeddingCache.clear();
    console.log('🗑️  Embedding cache cleared');
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): { size: number; maxSize: number } {
    return {
      size: this.embeddingCache.size,
      maxSize: MEMORY_CONFIG.maxCachedEmbeddings,
    };
  }
}
