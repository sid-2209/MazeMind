// src/agent/MemoryRetrieval.ts
/**
 * MemoryRetrieval - Three-factor memory retrieval (Week 2, Day 2)
 *
 * Implements Stanford Generative Agents retrieval methodology:
 * 1. Recency: Recent memories weighted higher (exponential decay)
 * 2. Importance: Manually scored 1-10 during creation
 * 3. Relevance: Semantic similarity via embeddings (cosine similarity)
 *
 * Combined score: α×recency + β×importance + γ×relevance
 *
 * Based on: https://arxiv.org/abs/2304.03442
 */

import { Memory, RetrievalResult } from '../types';
import { MemoryStream } from './MemoryStream';
import { AnthropicService } from '../services/AnthropicService';
import { MEMORY_CONFIG } from '../config/game.config';

export class MemoryRetrieval {
  private memoryStream: MemoryStream;
  private anthropicService: AnthropicService;

  // Retrieval weights (α, β, γ)
  private recencyWeight: number;
  private importanceWeight: number;
  private relevanceWeight: number;

  constructor(memoryStream: MemoryStream, anthropicService: AnthropicService) {
    this.memoryStream = memoryStream;
    this.anthropicService = anthropicService;

    // Initialize weights from config
    this.recencyWeight = MEMORY_CONFIG.recencyWeight;
    this.importanceWeight = MEMORY_CONFIG.importanceWeight;
    this.relevanceWeight = MEMORY_CONFIG.relevanceWeight;

    console.log('🔍 MemoryRetrieval initialized');
    console.log(`   Weights: recency=${this.recencyWeight}, importance=${this.importanceWeight}, relevance=${this.relevanceWeight}`);
  }

  /**
   * Retrieve top-K most relevant memories for a query
   * @param query - Natural language query (e.g., "Where did I see food?")
   * @param k - Number of memories to retrieve (default: 10)
   * @param stressModifier - Stress modifier (0.5-1.0) affects retrieval quality (Week 3)
   * @returns Sorted array of retrieval results with scores
   */
  async retrieve(query: string, k: number = MEMORY_CONFIG.retrievalTopK, stressModifier: number = 1.0): Promise<RetrievalResult[]> {
    const memories = this.memoryStream.getAllMemories();

    if (memories.length === 0) {
      return [];
    }

    // Generate embedding for query
    const queryEmbedding = await this.anthropicService.generateEmbedding(query);

    // Score all memories
    const scoredMemories: RetrievalResult[] = [];

    for (const memory of memories) {
      // Calculate three factor scores
      const recencyScore = this.calculateRecencyScore(memory);
      const importanceScore = this.calculateImportanceScore(memory);
      const relevanceScore = await this.calculateRelevanceScore(memory, queryEmbedding);

      // Combined score
      let combinedScore =
        this.recencyWeight * recencyScore +
        this.importanceWeight * importanceScore +
        this.relevanceWeight * relevanceScore;

      // Apply stress modifier (Week 3)
      // High stress degrades retrieval quality
      combinedScore *= stressModifier;

      // Under high stress (modifier < 0.8), add noise to simulate cognitive degradation
      if (stressModifier < 0.8) {
        const noiseLevel = (1 - stressModifier) * 0.3; // 0-0.15 range
        const noise = (Math.random() - 0.5) * noiseLevel;
        combinedScore += noise;
      }

      scoredMemories.push({
        memory,
        score: combinedScore,
        recencyScore,
        importanceScore,
        relevanceScore,
      });

      // Mark memory as accessed (updates lastAccessed timestamp)
      this.memoryStream.markMemoryAccessed(memory.id);
    }

    // Sort by combined score (descending) and return top-K
    scoredMemories.sort((a, b) => b.score - a.score);
    return scoredMemories.slice(0, k);
  }

  /**
   * Calculate recency score
   * Uses exponential decay: score = decay_factor ^ hours_since_access
   *
   * More recent memories score higher
   * @param memory - Memory to score
   * @returns Recency score (0-1)
   */
  private calculateRecencyScore(memory: Memory): number {
    const now = Date.now();
    const hoursSinceAccess = (now - memory.lastAccessed) / (1000 * 60 * 60);

    // Exponential decay
    const decayFactor = MEMORY_CONFIG.recencyDecayFactor;
    const score = Math.pow(decayFactor, hoursSinceAccess);

    return Math.max(0, Math.min(1, score)); // Clamp to [0, 1]
  }

  /**
   * Calculate importance score
   * Normalizes the 1-10 importance to 0-1 scale
   *
   * @param memory - Memory to score
   * @returns Importance score (0-1)
   */
  private calculateImportanceScore(memory: Memory): number {
    return memory.importance / 10; // Normalize 1-10 to 0.1-1.0
  }

  /**
   * Calculate relevance score via semantic similarity
   * Uses cosine similarity between query embedding and memory embedding
   *
   * @param memory - Memory to score
   * @param queryEmbedding - Query embedding vector
   * @returns Relevance score (0-1)
   */
  private async calculateRelevanceScore(
    memory: Memory,
    queryEmbedding: number[]
  ): Promise<number> {
    // Generate embedding for memory if not already present
    if (!memory.embedding || memory.embedding.length === 0) {
      const embedding = await this.anthropicService.generateEmbedding(memory.description);
      this.memoryStream.setMemoryEmbedding(memory.id, embedding);
      memory.embedding = embedding; // Update local reference
    }

    // Calculate cosine similarity
    const similarity = this.anthropicService.cosineSimilarity(
      queryEmbedding,
      memory.embedding
    );

    // Normalize from [-1, 1] to [0, 1]
    return (similarity + 1) / 2;
  }

  /**
   * Retrieve memories by type with scoring
   * @param type - Memory type to filter
   * @param query - Optional query for relevance scoring
   * @param k - Number to retrieve
   */
  async retrieveByType(
    type: 'observation' | 'reflection' | 'plan',
    query?: string,
    k: number = MEMORY_CONFIG.retrievalTopK
  ): Promise<RetrievalResult[]> {
    const memories = this.memoryStream.getMemoriesByType(type);

    if (memories.length === 0) {
      return [];
    }

    if (!query) {
      // No query - just sort by recency and importance
      const scoredMemories: RetrievalResult[] = memories.map(memory => ({
        memory,
        score: this.calculateRecencyScore(memory) + this.calculateImportanceScore(memory),
        recencyScore: this.calculateRecencyScore(memory),
        importanceScore: this.calculateImportanceScore(memory),
        relevanceScore: 0,
      }));

      scoredMemories.sort((a, b) => b.score - a.score);
      return scoredMemories.slice(0, k);
    }

    // With query - use full three-factor scoring
    return this.retrieve(query, k).then(results =>
      results.filter(r => r.memory.memoryType === type)
    );
  }

  /**
   * Retrieve memories near a location
   * @param location - Center position
   * @param radius - Search radius in tiles
   * @param query - Optional query for relevance
   * @param k - Number to retrieve
   */
  async retrieveByLocation(
    location: { x: number; y: number },
    radius: number = 3,
    query?: string,
    k: number = MEMORY_CONFIG.retrievalTopK
  ): Promise<RetrievalResult[]> {
    const memories = this.memoryStream.getMemoriesAtLocation(location, radius);

    if (memories.length === 0) {
      return [];
    }

    if (!query) {
      // No query - sort by recency and importance
      const scoredMemories: RetrievalResult[] = memories.map(memory => ({
        memory,
        score: this.calculateRecencyScore(memory) + this.calculateImportanceScore(memory),
        recencyScore: this.calculateRecencyScore(memory),
        importanceScore: this.calculateImportanceScore(memory),
        relevanceScore: 0,
      }));

      scoredMemories.sort((a, b) => b.score - a.score);
      return scoredMemories.slice(0, k);
    }

    // Filter full retrieval results by location
    const queryEmbedding = await this.anthropicService.generateEmbedding(query);
    const scoredMemories: RetrievalResult[] = [];

    for (const memory of memories) {
      const recencyScore = this.calculateRecencyScore(memory);
      const importanceScore = this.calculateImportanceScore(memory);
      const relevanceScore = await this.calculateRelevanceScore(memory, queryEmbedding);

      const combinedScore =
        this.recencyWeight * recencyScore +
        this.importanceWeight * importanceScore +
        this.relevanceWeight * relevanceScore;

      scoredMemories.push({
        memory,
        score: combinedScore,
        recencyScore,
        importanceScore,
        relevanceScore,
      });
    }

    scoredMemories.sort((a, b) => b.score - a.score);
    return scoredMemories.slice(0, k);
  }

  /**
   * Generate embeddings for all memories that don't have them
   * Useful for batch processing after loading saved memories
   */
  async generateMissingEmbeddings(): Promise<number> {
    const memoriesNeedingEmbeddings = this.memoryStream.getMemoriesNeedingEmbeddings();

    if (memoriesNeedingEmbeddings.length === 0) {
      console.log('✅ All memories have embeddings');
      return 0;
    }

    console.log(`🔄 Generating embeddings for ${memoriesNeedingEmbeddings.length} memories...`);

    // Extract descriptions
    const descriptions = memoriesNeedingEmbeddings.map(m => m.description);

    // Generate embeddings in batch
    const embeddings = await this.anthropicService.generateEmbeddingsBatch(descriptions);

    // Update memories with embeddings
    for (let i = 0; i < memoriesNeedingEmbeddings.length; i++) {
      const memory = memoriesNeedingEmbeddings[i];
      const embedding = embeddings[i];
      this.memoryStream.setMemoryEmbedding(memory.id, embedding);
    }

    console.log(`✅ Generated ${embeddings.length} embeddings`);
    return embeddings.length;
  }

  /**
   * Update retrieval weights
   * Useful for experimentation and tuning
   */
  setWeights(recency: number, importance: number, relevance: number): void {
    this.recencyWeight = recency;
    this.importanceWeight = importance;
    this.relevanceWeight = relevance;

    console.log(`🔧 Weights updated: recency=${recency}, importance=${importance}, relevance=${relevance}`);
  }

  /**
   * Get current weights
   */
  getWeights(): { recency: number; importance: number; relevance: number } {
    return {
      recency: this.recencyWeight,
      importance: this.importanceWeight,
      relevance: this.relevanceWeight,
    };
  }

  /**
   * Get retrieval statistics
   */
  getStatistics(): {
    totalMemories: number;
    withEmbeddings: number;
    withoutEmbeddings: number;
    cacheStats: { size: number; maxSize: number };
  } {
    const stats = this.memoryStream.getStatistics();
    const needingEmbeddings = this.memoryStream.getMemoriesNeedingEmbeddings().length;

    return {
      totalMemories: stats.total,
      withEmbeddings: stats.withEmbeddings,
      withoutEmbeddings: needingEmbeddings,
      cacheStats: this.anthropicService.getCacheStats(),
    };
  }
}
