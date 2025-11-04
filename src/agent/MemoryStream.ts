// src/agent/MemoryStream.ts
/**
 * MemoryStream - Core memory storage system (Week 2, Day 1)
 *
 * Implements Stanford Generative Agents methodology (Park et al., 2023)
 * - Comprehensive record of agent experiences in natural language
 * - Three memory types: observations, reflections, plans
 * - Timestamp and importance scoring for retrieval
 * - Location-stamped for spatial reasoning
 *
 * Based on: https://arxiv.org/abs/2304.03442
 */

import { v4 as uuidv4 } from 'uuid';
import { Memory, Position } from '../types';

// Re-export Memory for convenience
export type { Memory };

export class MemoryStream {
  private memories: Memory[] = [];
  private maxMemories: number;

  constructor(maxMemories: number = 10000) {
    this.maxMemories = maxMemories;
    console.log(`🧠 MemoryStream initialized (max: ${maxMemories} memories)`);
  }

  /**
   * Add an observation memory
   * Observations are perceptions of the environment or internal states
   */
  addObservation(
    description: string,
    importance: number,
    tags: string[] = [],
    location?: Position
  ): Memory {
    const memory: Memory = {
      id: uuidv4(),
      description,
      timestamp: Date.now(),
      lastAccessed: Date.now(),
      memoryType: 'observation',
      importance: Math.max(1, Math.min(10, importance)), // Clamp 1-10
      tags,
      location,
    };

    this.addMemory(memory);
    return memory;
  }

  /**
   * Add a reflection memory
   * Reflections are higher-level insights synthesized from observations
   */
  addReflection(
    description: string,
    importance: number,
    tags: string[] = [],
    basedOnIds?: string[]
  ): Memory {
    const memory: Memory = {
      id: uuidv4(),
      description,
      timestamp: Date.now(),
      lastAccessed: Date.now(),
      memoryType: 'reflection',
      importance: Math.max(1, Math.min(10, importance)),
      tags: [...tags, 'reflection'],
    };

    // Store which memories this reflection is based on
    if (basedOnIds && basedOnIds.length > 0) {
      memory.tags.push(`based_on:${basedOnIds.join(',')}`);
    }

    this.addMemory(memory);
    return memory;
  }

  /**
   * Add a plan memory
   * Plans are future-oriented action sequences
   */
  addPlan(
    description: string,
    importance: number,
    tags: string[] = [],
    location?: Position
  ): Memory {
    const memory: Memory = {
      id: uuidv4(),
      description,
      timestamp: Date.now(),
      lastAccessed: Date.now(),
      memoryType: 'plan',
      importance: Math.max(1, Math.min(10, importance)),
      tags: [...tags, 'plan'],
      location,
    };

    this.addMemory(memory);
    return memory;
  }

  /**
   * Internal method to add memory and manage capacity
   */
  private addMemory(memory: Memory): void {
    this.memories.push(memory);

    // If over capacity, prune least important old memories
    if (this.memories.length > this.maxMemories) {
      this.pruneMemories();
    }
  }

  /**
   * Prune memories when over capacity
   * Keeps most important and most recent memories
   */
  private pruneMemories(): void {
    const removeCount = this.memories.length - this.maxMemories;

    // Sort by combined score (recency + importance)
    const scored = this.memories.map(mem => ({
      memory: mem,
      score: this.getMemoryRetentionScore(mem),
    }));

    scored.sort((a, b) => a.score - b.score);

    // Remove lowest scoring memories
    const toRemove = scored.slice(0, removeCount).map(s => s.memory.id);
    this.memories = this.memories.filter(m => !toRemove.includes(m.id));

    console.log(`🗑️  Pruned ${removeCount} memories (now: ${this.memories.length})`);
  }

  /**
   * Calculate retention score for pruning
   * Higher score = more likely to keep
   */
  private getMemoryRetentionScore(memory: Memory): number {
    const hoursSinceCreation = (Date.now() - memory.timestamp) / (1000 * 60 * 60);
    const recencyScore = Math.exp(-hoursSinceCreation / 24); // Decay over 24 hours
    const importanceScore = memory.importance / 10;

    return recencyScore * 0.4 + importanceScore * 0.6;
  }

  /**
   * Get all memories
   */
  getAllMemories(): Memory[] {
    return [...this.memories];
  }

  /**
   * Get memories by type
   */
  getMemoriesByType(type: 'observation' | 'reflection' | 'plan'): Memory[] {
    return this.memories.filter(m => m.memoryType === type);
  }

  /**
   * Get memories in time range
   * @param start - Start timestamp
   * @param end - End timestamp
   */
  getMemoriesInTimeRange(start: number, end: number): Memory[] {
    return this.memories.filter(m => m.timestamp >= start && m.timestamp <= end);
  }

  /**
   * Get recent memories
   * @param count - Number of recent memories to retrieve
   */
  getRecentMemories(count: number = 10): Memory[] {
    return [...this.memories]
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, count);
  }

  /**
   * Get memories near a location
   * @param location - Center position
   * @param radius - Search radius in tiles
   */
  getMemoriesAtLocation(location: Position, radius: number = 3): Memory[] {
    return this.memories.filter(m => {
      if (!m.location) return false;

      const dx = m.location.x - location.x;
      const dy = m.location.y - location.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      return distance <= radius;
    });
  }

  /**
   * Get memories by tag
   */
  getMemoriesByTag(tag: string): Memory[] {
    return this.memories.filter(m => m.tags.includes(tag));
  }

  /**
   * Get memory by ID
   */
  getMemoryById(id: string): Memory | undefined {
    return this.memories.find(m => m.id === id);
  }

  /**
   * Update memory's last accessed time
   * Important for recency scoring in retrieval
   */
  markMemoryAccessed(id: string): void {
    const memory = this.memories.find(m => m.id === id);
    if (memory) {
      memory.lastAccessed = Date.now();
    }
  }

  /**
   * Update memory embedding
   * Called after embedding generation
   */
  setMemoryEmbedding(id: string, embedding: number[]): void {
    const memory = this.memories.find(m => m.id === id);
    if (memory) {
      memory.embedding = embedding;
    }
  }

  /**
   * Get memories that need embeddings
   * Returns memories without embeddings
   */
  getMemoriesNeedingEmbeddings(): Memory[] {
    return this.memories.filter(m => !m.embedding || m.embedding.length === 0);
  }

  /**
   * Get memory count
   */
  getMemoryCount(): number {
    return this.memories.length;
  }

  /**
   * Get memory statistics
   */
  getStatistics(): {
    total: number;
    byType: Record<string, number>;
    withEmbeddings: number;
    avgImportance: number;
  } {
    const byType = {
      observation: this.getMemoriesByType('observation').length,
      reflection: this.getMemoriesByType('reflection').length,
      plan: this.getMemoriesByType('plan').length,
    };

    const withEmbeddings = this.memories.filter(
      m => m.embedding && m.embedding.length > 0
    ).length;

    const avgImportance =
      this.memories.length > 0
        ? this.memories.reduce((sum, m) => sum + m.importance, 0) / this.memories.length
        : 0;

    return {
      total: this.memories.length,
      byType,
      withEmbeddings,
      avgImportance: Math.round(avgImportance * 10) / 10,
    };
  }

  /**
   * Clear all memories (for testing)
   */
  clear(): void {
    this.memories = [];
    console.log('🗑️  Memory stream cleared');
  }

  /**
   * Export memories to JSON
   * Useful for analysis and replay
   */
  exportToJSON(): string {
    return JSON.stringify(this.memories, null, 2);
  }

  /**
   * Import memories from JSON
   */
  importFromJSON(json: string): void {
    try {
      const imported = JSON.parse(json) as Memory[];
      this.memories = imported;
      console.log(`📥 Imported ${imported.length} memories`);
    } catch (error) {
      console.error('❌ Failed to import memories:', error);
    }
  }
}
