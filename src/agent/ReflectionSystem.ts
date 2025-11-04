// src/agent/ReflectionSystem.ts
/**
 * ReflectionSystem - High-level insight generation (Week 2, Days 3-4)
 *
 * Implements reflection from Stanford Generative Agents paper:
 * - Periodically generates high-level insights from recent experiences
 * - Identifies patterns, strategies, and lessons learned
 * - Stores reflections as special memory entries with high importance
 * - Used to inform future decision-making
 *
 * Reflection triggers:
 * - Time-based (every N minutes of game time)
 * - Event-based (significant events like finding exit, critical state)
 * - Memory-based (when N important observations accumulate)
 */

import { Agent } from './Agent';
import { MemoryStream, Memory } from './MemoryStream';
import { LLMService } from '../services/LLMService';
import { buildReflectionPrompt } from '../config/decision.prompts';

export interface ReflectionConfig {
  minMemoriesForReflection: number;  // Minimum memories before reflecting
  reflectionInterval: number;  // Seconds between reflections
  importanceThreshold: number;  // Only consider memories above this importance
  maxMemoriesPerReflection: number;  // Max memories to reflect on at once
}

export interface Reflection {
  insight: string;
  category: 'strategy' | 'pattern' | 'emotional' | 'learning';
  confidence: number;
  basedOnMemories: string[];  // IDs of memories used
}

export class ReflectionSystem {
  private agent: Agent;
  private memoryStream: MemoryStream;
  private llmService: LLMService;
  private config: ReflectionConfig;

  // Tracking
  private lastReflectionTime: number = 0;
  private totalReflections: number = 0;
  private lastReflectedMemoryCount: number = 0;

  constructor(
    agent: Agent,
    memoryStream: MemoryStream,
    llmService: LLMService,
    config: Partial<ReflectionConfig> = {}
  ) {
    this.agent = agent;
    this.memoryStream = memoryStream;
    this.llmService = llmService;

    // Default configuration
    this.config = {
      minMemoriesForReflection: 20,
      reflectionInterval: 120,  // 2 minutes
      importanceThreshold: 5,  // Only reflect on important memories
      maxMemoriesPerReflection: 30,
      ...config,
    };

    console.log('💭 ReflectionSystem initialized');
    console.log(`   Min memories: ${this.config.minMemoriesForReflection}`);
    console.log(`   Interval: ${this.config.reflectionInterval}s`);
  }

  /**
   * Update reflection system (called each frame)
   */
  update(deltaTime: number): void {
    this.lastReflectionTime += deltaTime;

    // Check if it's time to reflect
    if (this.shouldReflect()) {
      this.performReflection().catch(err => {
        console.error('❌ Reflection failed:', err);
      });
    }
  }

  /**
   * Check if agent should reflect now
   */
  private shouldReflect(): boolean {
    const currentMemoryCount = this.memoryStream.getMemoryCount();

    // Need minimum memories
    if (currentMemoryCount < this.config.minMemoriesForReflection) {
      return false;
    }

    // Check if enough new memories since last reflection
    const newMemories = currentMemoryCount - this.lastReflectedMemoryCount;
    const hasEnoughNewMemories = newMemories >= this.config.minMemoriesForReflection;

    // Check if enough time has passed
    const hasEnoughTimePassed = this.lastReflectionTime >= this.config.reflectionInterval;

    return hasEnoughNewMemories && hasEnoughTimePassed;
  }

  /**
   * Perform reflection on recent experiences
   */
  private async performReflection(): Promise<void> {
    console.log('💭 Starting reflection...');

    try {
      // Get recent important memories
      const recentMemories = this.getMemoriesForReflection();

      if (recentMemories.length === 0) {
        console.log('   No important memories to reflect on');
        return;
      }

      // Generate reflections
      const reflections = await this.generateReflections(recentMemories);

      // Store reflections as new memories
      for (const reflection of reflections) {
        this.storeReflection(reflection);
      }

      // Update tracking
      this.lastReflectionTime = 0;
      this.lastReflectedMemoryCount = this.memoryStream.getMemoryCount();
      this.totalReflections++;

      console.log(`💭 Reflection complete: ${reflections.length} insights generated`);
    } catch (error) {
      console.error('❌ Error during reflection:', error);
    }
  }

  /**
   * Get memories that should be reflected upon
   */
  private getMemoriesForReflection(): Memory[] {
    const allMemories = this.memoryStream.getAllMemories();

    // Filter: only observations and reflections (not plans)
    // Only important ones (above threshold)
    // Only new ones since last reflection
    const filtered = allMemories.filter(m => {
      const isRightType = m.memoryType === 'observation' || m.memoryType === 'reflection';
      const isImportant = m.importance >= this.config.importanceThreshold;
      const isNew = m.timestamp > (this.lastReflectedMemoryCount * 1000); // Rough approximation

      return isRightType && isImportant && isNew;
    });

    // Sort by importance and recency
    filtered.sort((a, b) => {
      const importanceDiff = b.importance - a.importance;
      if (Math.abs(importanceDiff) > 2) return importanceDiff;
      return b.timestamp - a.timestamp;  // Tie-breaker: more recent
    });

    // Take top N
    return filtered.slice(0, this.config.maxMemoriesPerReflection);
  }

  /**
   * Generate reflections from memories
   */
  private async generateReflections(memories: Memory[]): Promise<Reflection[]> {
    const provider = this.llmService.getCurrentProvider();

    if (provider === 'heuristic' || !this.llmService.isProviderAvailable()) {
      // Use heuristic reflections if no LLM
      return this.generateHeuristicReflections(memories);
    }

    try {
      // Use LLM to generate reflections
      const descriptions = memories.map(m => m.description);
      const prompt = buildReflectionPrompt(descriptions);

      const llmResponse = await this.llmService.generate(prompt, {
        temperature: 0.8,  // Higher temperature for creative insights
        max_tokens: 300,
      });

      // Parse LLM response into structured reflections
      const reflections = this.parseLLMReflections(llmResponse, memories);

      if (reflections.length > 0) {
        console.log(`💭 [${provider}] Generated ${reflections.length} LLM-based reflections`);
        return reflections;
      }

      // Fallback to heuristic if parsing failed
      console.warn('⚠️  Failed to parse LLM reflections, using heuristic');
      return this.generateHeuristicReflections(memories);
    } catch (error) {
      console.error('❌ LLM reflection generation failed:', error);
      return this.generateHeuristicReflections(memories);
    }
  }

  /**
   * Parse LLM response into structured reflections
   */
  private parseLLMReflections(llmResponse: string, memories: Memory[]): Reflection[] {
    const reflections: Reflection[] = [];

    // Split response into individual insights
    const lines = llmResponse.split('\n').filter(line => line.trim());

    for (const line of lines) {
      // Look for insight patterns (numbered or bulleted)
      const match = line.match(/^(?:\d+\.|\-|\*)\s*(.+)$/);
      if (match) {
        const insight = match[1].trim();

        // Categorize insight based on keywords
        let category: 'strategy' | 'pattern' | 'emotional' | 'learning' = 'learning';
        if (insight.toLowerCase().includes('strategy') || insight.toLowerCase().includes('should')) {
          category = 'strategy';
        } else if (insight.toLowerCase().includes('pattern') || insight.toLowerCase().includes('always') || insight.toLowerCase().includes('whenever')) {
          category = 'pattern';
        } else if (insight.toLowerCase().includes('feel') || insight.toLowerCase().includes('stress') || insight.toLowerCase().includes('hope')) {
          category = 'emotional';
        }

        reflections.push({
          insight,
          category,
          confidence: 0.8,
          basedOnMemories: memories.slice(0, 5).map(m => m.id),
        });
      }
    }

    return reflections;
  }

  /**
   * Generate reflections using heuristics (fallback)
   */
  private generateHeuristicReflections(memories: Memory[]): Reflection[] {
    const reflections: Reflection[] = [];
    const descriptions = memories.map(m => m.description);

    // Pattern detection: dead ends
    const deadEndCount = descriptions.filter(d =>
      d.toLowerCase().includes('dead end')
    ).length;

    if (deadEndCount >= 3) {
      reflections.push({
        insight: `I've encountered ${deadEndCount} dead ends recently. I should mark these areas mentally and try different paths.`,
        category: 'pattern',
        confidence: 0.8,
        basedOnMemories: memories
          .filter(m => m.description.toLowerCase().includes('dead end'))
          .map(m => m.id),
      });
    }

    // Pattern detection: junctions
    const junctionCount = descriptions.filter(d =>
      d.toLowerCase().includes('junction')
    ).length;

    if (junctionCount >= 2) {
      reflections.push({
        insight: 'The maze has multiple junctions. I need a systematic exploration strategy to avoid going in circles.',
        category: 'strategy',
        confidence: 0.7,
        basedOnMemories: memories
          .filter(m => m.description.toLowerCase().includes('junction'))
          .map(m => m.id),
      });
    }

    // Emotional state: stress and hope
    const hasLowStats = memories.some(m =>
      m.description.toLowerCase().includes('low') ||
      m.description.toLowerCase().includes('critical')
    );

    if (hasLowStats) {
      reflections.push({
        insight: 'My physical state is deteriorating. I need to balance exploration with rest and resource management.',
        category: 'emotional',
        confidence: 0.9,
        basedOnMemories: memories
          .filter(m =>
            m.description.toLowerCase().includes('low') ||
            m.description.toLowerCase().includes('critical')
          )
          .map(m => m.id),
      });
    }

    // Learning: navigation patterns
    const hasMovement = memories.some(m =>
      m.description.toLowerCase().includes('moved') ||
      m.description.toLowerCase().includes('heading')
    );

    if (hasMovement) {
      const agentPos = this.agent.getTilePosition();
      reflections.push({
        insight: `I'm currently at position (${agentPos.x}, ${agentPos.y}). I should keep track of where I've been to avoid redundant exploration.`,
        category: 'learning',
        confidence: 0.6,
        basedOnMemories: memories
          .filter(m =>
            m.description.toLowerCase().includes('moved') ||
            m.description.toLowerCase().includes('heading')
          )
          .slice(0, 5)
          .map(m => m.id),
      });
    }

    return reflections;
  }

  /**
   * Store a reflection as a special high-importance memory
   */
  private storeReflection(reflection: Reflection): void {
    const importance = 7 + (reflection.confidence * 2);  // 7-9 importance

    this.memoryStream.addReflection(
      reflection.insight,
      Math.round(importance),
      [reflection.category, 'reflection', 'insight'],
      reflection.basedOnMemories
    );

    console.log(`   💡 ${reflection.category}: ${reflection.insight}`);
  }

  /**
   * Force an immediate reflection (for testing or significant events)
   */
  async forceReflection(): Promise<void> {
    console.log('💭 Forcing immediate reflection...');
    await this.performReflection();
  }

  /**
   * Generate reflection on a specific topic/query
   */
  async reflectOn(topic: string): Promise<Reflection[]> {
    console.log(`💭 Reflecting on: ${topic}`);

    // Get relevant memories for this topic
    const memoryRetrieval = this.agent.getMemoryRetrieval();
    if (!memoryRetrieval) {
      console.warn('⚠️  Memory retrieval not available');
      return [];
    }

    const relevantResults = await memoryRetrieval.retrieve(topic, 20);
    const relevantMemories = relevantResults.map(r => r.memory);

    // Generate reflections
    return this.generateReflections(relevantMemories);
  }

  /**
   * Get reflection statistics
   */
  getStatistics() {
    return {
      totalReflections: this.totalReflections,
      lastReflectionTime: this.lastReflectionTime,
      nextReflectionIn: Math.max(0, this.config.reflectionInterval - this.lastReflectionTime),
      memoriesSinceLastReflection: this.memoryStream.getMemoryCount() - this.lastReflectedMemoryCount,
      reflectionThreshold: this.config.minMemoriesForReflection,
    };
  }

  /**
   * Get debug info
   */
  getDebugInfo(): string {
    const stats = this.getStatistics();

    return `Reflection System:
Total Reflections: ${stats.totalReflections}
Next Reflection In: ${stats.nextReflectionIn.toFixed(1)}s
New Memories Since Last: ${stats.memoriesSinceLastReflection}
Threshold: ${stats.reflectionThreshold} memories

Config:
  Interval: ${this.config.reflectionInterval}s
  Min Memories: ${this.config.minMemoriesForReflection}
  Importance Threshold: ${this.config.importanceThreshold}
  Max Memories Per: ${this.config.maxMemoriesPerReflection}`;
  }
}
