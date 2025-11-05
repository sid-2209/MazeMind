// src/agent/ReflectionSystem.ts
/**
 * ReflectionSystem - High-level insight generation (Week 2, Enhanced Week 8)
 *
 * Implements reflection from Stanford Generative Agents paper (Park et al., 2023):
 * - Week 2: Basic time-based reflection with heuristics
 * - Week 8: Importance-sum triggering, LLM question generation, meta-reflections
 *
 * Enhanced features (Week 8):
 * - ✅ Importance-sum triggering (matches paper Section 4.2)
 * - ✅ LLM-generated questions (3 per reflection cycle)
 * - ✅ Recursive reflection trees (meta-reflections)
 * - ✅ Integration with planning system
 *
 * Reflection triggers:
 * - PRIMARY: Importance-sum threshold (∑importance ≥ 150)
 * - FALLBACK: Time-based (every N minutes if importance sum not reached)
 * - MANUAL: Force reflection via forceReflection()
 */

import { Agent } from './Agent';
import { MemoryStream, Memory } from './MemoryStream';
import { LLMService } from '../services/LLMService';
import { buildReflectionPrompt } from '../config/decision.prompts';
import {
  ReflectionNode,
  ReflectionTree,
  ReflectionQuestion,
  ReflectionAnswer,
  ImportanceTracker,
  ReflectionStatistics,
  EnhancedReflectionConfig,
  DEFAULT_ENHANCED_REFLECTION_CONFIG,
} from '../types/reflection';
import {
  buildQuestionGenerationPrompt,
  buildReflectionAnswerPrompt,
  buildMetaReflectionPrompt,
  parseGeneratedQuestions,
  parseReflectionAnswer,
  estimateReflectionImportance,
} from '../config/reflection.prompts';

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
  private enhancedConfig: EnhancedReflectionConfig;

  // Tracking
  private lastReflectionTime: number = 0;
  private totalReflections: number = 0;
  private lastReflectedMemoryCount: number = 0;

  // Week 8: Importance-sum tracking (from paper)
  private importanceTracker: ImportanceTracker;

  // Week 8: Reflection tree structure
  private reflectionNodes: Map<string, ReflectionNode> = new Map();
  private reflectionTree: ReflectionTree = {
    rootObservations: [],
    firstOrderReflections: [],
    secondOrderReflections: [],
    higherOrderReflections: [],
    insights: [],
    totalNodes: 0,
    maxDepth: 0,
  };

  // Week 8: Statistics
  private stats: ReflectionStatistics = {
    totalReflections: 0,
    reflectionsByLevel: new Map(),
    reflectionsByCategory: new Map(),
    averageConfidence: 0,
    questionsGenerated: 0,
    questionsAnswered: 0,
    importanceSumTriggers: 0,
    timeTriggers: 0,
    lastReflectionTime: 0,
    currentImportanceSum: 0,
    nextTriggerAt: 150,
  };

  constructor(
    agent: Agent,
    memoryStream: MemoryStream,
    llmService: LLMService,
    config: Partial<ReflectionConfig> = {},
    enhancedConfig: Partial<EnhancedReflectionConfig> = {}
  ) {
    this.agent = agent;
    this.memoryStream = memoryStream;
    this.llmService = llmService;

    // Default configuration (Week 2)
    this.config = {
      minMemoriesForReflection: 20,
      reflectionInterval: 120,  // 2 minutes
      importanceThreshold: 5,  // Only reflect on important memories
      maxMemoriesPerReflection: 30,
      ...config,
    };

    // Enhanced configuration (Week 8)
    this.enhancedConfig = {
      ...DEFAULT_ENHANCED_REFLECTION_CONFIG,
      ...enhancedConfig,
    };

    // Initialize importance tracker
    this.importanceTracker = {
      currentSum: 0,
      threshold: this.enhancedConfig.importanceSumThreshold,
      lastReflectionTime: 0,
      memoriesContributed: [],
    };

    console.log('💭 ReflectionSystem initialized (Enhanced Week 8)');
    console.log(`   Min memories: ${this.config.minMemoriesForReflection}`);
    console.log(`   Time interval: ${this.config.reflectionInterval}s`);
    console.log(`   ✨ Importance-sum threshold: ${this.importanceTracker.threshold}`);
    console.log(`   ✨ Questions per reflection: ${this.enhancedConfig.questionsPerReflection}`);
    console.log(`   ✨ Meta-reflections enabled: ${this.enhancedConfig.enableMetaReflections}`);
  }

  /**
   * WEEK 8: Track importance as memories are created
   * This is the core importance-sum triggering mechanism from the paper
   */
  onMemoryCreated(memory: Memory): void {
    // Only count observations and reflections (not plans)
    if (memory.memoryType !== 'observation' && memory.memoryType !== 'reflection') {
      return;
    }

    // Add to importance sum
    this.importanceTracker.currentSum += memory.importance;
    this.importanceTracker.memoriesContributed.push(memory.id);

    // Update statistics
    this.stats.currentImportanceSum = this.importanceTracker.currentSum;

    console.log(`💭 Importance tracker: ${this.importanceTracker.currentSum}/${this.importanceTracker.threshold} (+${memory.importance})`);

    // Check if threshold exceeded
    if (
      this.enhancedConfig.enableImportanceSumTrigger &&
      this.importanceTracker.currentSum >= this.importanceTracker.threshold
    ) {
      console.log(`🎯 Importance-sum threshold reached! Triggering reflection...`);
      this.stats.importanceSumTriggers++;
      this.performEnhancedReflection().catch(err => {
        console.error('❌ Enhanced reflection failed:', err);
      });
    }
  }

  /**
   * Update reflection system (called each frame)
   */
  update(deltaTime: number): void {
    this.lastReflectionTime += deltaTime;

    // Check if it's time to reflect (time-based fallback)
    if (this.shouldReflect()) {
      if (this.enhancedConfig.enableImportanceSumTrigger) {
        // Use enhanced reflection if enabled
        this.performEnhancedReflection().catch(err => {
          console.error('❌ Enhanced reflection failed:', err);
        });
      } else {
        // Use original reflection system
        this.performReflection().catch(err => {
          console.error('❌ Reflection failed:', err);
        });
      }
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
   * WEEK 8: Enhanced reflection with question generation
   * Implements the full reflection cycle from the paper:
   * 1. Generate high-level questions from recent experiences
   * 2. Retrieve relevant memories for each question
   * 3. Generate reflections by answering questions
   * 4. Store reflections in tree structure
   * 5. Check for meta-reflection opportunities
   */
  private async performEnhancedReflection(): Promise<void> {
    console.log('✨ Starting enhanced reflection (Week 8)...');
    const startTime = Date.now();

    try {
      // Reset importance tracker
      const importanceSum = this.importanceTracker.currentSum;
      this.importanceTracker.currentSum = 0;
      this.importanceTracker.memoriesContributed = [];
      this.importanceTracker.lastReflectionTime = Date.now();

      // Get recent memories for question generation
      const recentMemories = this.getMemoriesForReflection();
      if (recentMemories.length === 0) {
        console.log('   No memories to reflect on');
        return;
      }

      // Step 1: Generate questions using LLM
      const questions = await this.generateReflectionQuestions(recentMemories);
      this.stats.questionsGenerated += questions.length;
      console.log(`   📝 Generated ${questions.length} reflection questions`);

      // Step 2: Answer each question
      const answers: ReflectionAnswer[] = [];
      for (const question of questions) {
        const answer = await this.answerReflectionQuestion(question, recentMemories);
        if (answer) {
          answers.push(answer);
          this.stats.questionsAnswered++;
        }
      }

      console.log(`   💡 Generated ${answers.length} reflections`);

      // Step 3: Store reflections as nodes in tree
      for (const answer of answers) {
        this.storeReflectionNode(answer, 1); // Level 1 = first-order reflection
      }

      // Step 4: Check for meta-reflection opportunity
      if (this.enhancedConfig.enableMetaReflections) {
        await this.checkMetaReflectionOpportunity();
      }

      // Update tracking
      this.lastReflectionTime = 0;
      this.lastReflectedMemoryCount = this.memoryStream.getMemoryCount();
      this.totalReflections++;
      this.stats.totalReflections++;
      this.stats.lastReflectionTime = Date.now();

      const duration = Date.now() - startTime;
      console.log(`✨ Enhanced reflection complete in ${duration}ms (importance sum: ${importanceSum})`);
    } catch (error) {
      console.error('❌ Enhanced reflection failed:', error);
      // Fallback to original reflection
      await this.performReflection();
    }
  }

  /**
   * WEEK 8: Generate reflection questions using LLM
   */
  private async generateReflectionQuestions(memories: Memory[]): Promise<ReflectionQuestion[]> {
    const provider = this.llmService.getCurrentProvider();

    if (provider === 'heuristic' || !this.llmService.isProviderAvailable()) {
      // Fallback to heuristic questions
      return this.generateHeuristicQuestions(memories);
    }

    try {
      const prompt = buildQuestionGenerationPrompt(memories);
      const llmResponse = await this.llmService.generate(prompt, {
        temperature: 0.7,
        max_tokens: 200,
      });

      const questionTexts = parseGeneratedQuestions(llmResponse);
      const questions: ReflectionQuestion[] = questionTexts.map(q => ({
        question: q,
        category: 'learning',
        priority: 8,
        targetMemoryCount: this.enhancedConfig.maxMemoriesPerQuestion,
      }));

      console.log(`   [${provider}] Generated ${questions.length} LLM questions`);
      return questions.slice(0, this.enhancedConfig.questionsPerReflection);
    } catch (error) {
      console.error('❌ LLM question generation failed:', error);
      return this.generateHeuristicQuestions(memories);
    }
  }

  /**
   * WEEK 8: Generate heuristic questions (fallback)
   */
  private generateHeuristicQuestions(_memories: Memory[]): ReflectionQuestion[] {
    return [
      {
        question: 'What patterns am I noticing in my recent experiences?',
        category: 'pattern',
        priority: 7,
        targetMemoryCount: 20,
      },
      {
        question: 'What have I learned that could inform my future decisions?',
        category: 'learning',
        priority: 8,
        targetMemoryCount: 15,
      },
      {
        question: 'What strategies have proven effective or ineffective?',
        category: 'strategy',
        priority: 9,
        targetMemoryCount: 10,
      },
    ];
  }

  /**
   * WEEK 8: Answer a reflection question using retrieved memories
   */
  private async answerReflectionQuestion(
    question: ReflectionQuestion,
    fallbackMemories: Memory[]
  ): Promise<ReflectionAnswer | null> {
    // Retrieve relevant memories using memory retrieval system
    const memoryRetrieval = this.agent.getMemoryRetrieval();
    let relevantMemories: Memory[];

    if (memoryRetrieval) {
      const results = await memoryRetrieval.retrieve(question.question, question.targetMemoryCount);
      relevantMemories = results.map(r => r.memory);
    } else {
      relevantMemories = fallbackMemories;
    }

    if (relevantMemories.length === 0) {
      return null;
    }

    const provider = this.llmService.getCurrentProvider();

    if (provider === 'heuristic' || !this.llmService.isProviderAvailable()) {
      // Generate heuristic answer
      return {
        question: question.question,
        answer: `Based on ${relevantMemories.length} experiences, I observe patterns in navigation and resource management.`,
        relevantMemories: relevantMemories.slice(0, 5).map(m => m.id),
        confidence: 0.6,
        category: question.category,
      };
    }

    try {
      const prompt = buildReflectionAnswerPrompt(question.question, relevantMemories);
      const llmResponse = await this.llmService.generate(prompt, {
        temperature: 0.8,
        max_tokens: 150,
      });

      const answer = parseReflectionAnswer(llmResponse);

      return {
        question: question.question,
        answer,
        relevantMemories: relevantMemories.slice(0, 10).map(m => m.id),
        confidence: 0.8,
        category: question.category,
      };
    } catch (error) {
      console.error('❌ LLM answer generation failed:', error);
      return null;
    }
  }

  /**
   * WEEK 8: Store reflection as a node in the reflection tree
   */
  private storeReflectionNode(answer: ReflectionAnswer, level: number): void {
    const nodeId = `reflection_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const importance = estimateReflectionImportance(answer.answer);

    const node: ReflectionNode = {
      id: nodeId,
      content: answer.answer,
      level,
      parentIds: answer.relevantMemories,
      childIds: [],
      importance,
      timestamp: Date.now(),
      category: answer.category,
      confidence: answer.confidence,
      question: answer.question,
    };

    // Add to tree structure
    this.reflectionNodes.set(nodeId, node);

    if (level === 1) {
      this.reflectionTree.firstOrderReflections.push(node);
    } else if (level === 2) {
      this.reflectionTree.secondOrderReflections.push(node);
    } else {
      this.reflectionTree.higherOrderReflections.push(node);
    }

    this.reflectionTree.totalNodes++;
    this.reflectionTree.maxDepth = Math.max(this.reflectionTree.maxDepth, level);

    // Update statistics
    const levelCount = this.stats.reflectionsByLevel.get(level) || 0;
    this.stats.reflectionsByLevel.set(level, levelCount + 1);

    const catCount = this.stats.reflectionsByCategory.get(answer.category) || 0;
    this.stats.reflectionsByCategory.set(answer.category, catCount + 1);

    // Store in memory stream (original format for compatibility)
    this.memoryStream.addReflection(
      answer.answer,
      importance,
      [answer.category, 'reflection', 'enhanced', `level-${level}`],
      answer.relevantMemories
    );

    console.log(`   💡 [Level ${level}] ${answer.category}: ${answer.answer}`);
  }

  /**
   * WEEK 8: Check if meta-reflection should be generated
   */
  private async checkMetaReflectionOpportunity(): Promise<void> {
    const recentFirstOrderReflections = this.reflectionTree.firstOrderReflections
      .slice(-this.enhancedConfig.minReflectionsForMeta);

    if (recentFirstOrderReflections.length < this.enhancedConfig.minReflectionsForMeta) {
      return; // Not enough reflections yet
    }

    console.log('   🔄 Generating meta-reflection...');

    try {
      const reflectionContents = recentFirstOrderReflections.map(r => r.content);
      const prompt = buildMetaReflectionPrompt(reflectionContents);

      const llmResponse = await this.llmService.generate(prompt, {
        temperature: 0.9,
        max_tokens: 150,
      });

      const metaInsight = parseReflectionAnswer(llmResponse);

      if (metaInsight) {
        const metaAnswer: ReflectionAnswer = {
          question: 'What broader patterns emerge from my recent reflections?',
          answer: metaInsight,
          relevantMemories: recentFirstOrderReflections.map(r => r.id),
          confidence: 0.9,
          category: 'meta',
        };

        this.storeReflectionNode(metaAnswer, 2); // Level 2 = meta-reflection
        console.log(`   🔄 Meta-reflection generated: ${metaInsight}`);
      }
    } catch (error) {
      console.error('❌ Meta-reflection generation failed:', error);
    }
  }

  /**
   * Force an immediate reflection (for testing or significant events)
   */
  async forceReflection(): Promise<void> {
    console.log('💭 Forcing immediate reflection...');
    if (this.enhancedConfig.enableImportanceSumTrigger) {
      await this.performEnhancedReflection();
    } else {
      await this.performReflection();
    }
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
   * WEEK 8: Get reflection tree
   */
  getReflectionTree(): ReflectionTree {
    return this.reflectionTree;
  }

  /**
   * WEEK 8: Get enhanced reflection statistics
   */
  getEnhancedStatistics(): ReflectionStatistics {
    return {
      ...this.stats,
      currentImportanceSum: this.importanceTracker.currentSum,
      nextTriggerAt: this.importanceTracker.threshold,
    };
  }

  /**
   * WEEK 8: Get recent reflections for planning integration
   */
  getRecentReflectionsForPlanning(): ReflectionNode[] {
    const allReflections = [
      ...this.reflectionTree.firstOrderReflections,
      ...this.reflectionTree.secondOrderReflections,
      ...this.reflectionTree.higherOrderReflections,
    ];

    // Sort by importance and recency
    allReflections.sort((a, b) => {
      const importanceDiff = b.importance - a.importance;
      if (Math.abs(importanceDiff) > 1) return importanceDiff;
      return b.timestamp - a.timestamp;
    });

    return allReflections.slice(0, this.enhancedConfig.maxReflectionsForPlanning);
  }

  /**
   * Get debug info
   */
  getDebugInfo(): string {
    const stats = this.getStatistics();
    const enhanced = this.getEnhancedStatistics();

    return `Reflection System (Enhanced Week 8):
Total Reflections: ${stats.totalReflections}
Next Reflection In: ${stats.nextReflectionIn.toFixed(1)}s
New Memories Since Last: ${stats.memoriesSinceLastReflection}
Threshold: ${stats.reflectionThreshold} memories

Week 8 Enhancements:
  Importance Sum: ${enhanced.currentImportanceSum}/${enhanced.nextTriggerAt}
  Questions Generated: ${enhanced.questionsGenerated}
  Questions Answered: ${enhanced.questionsAnswered}
  Importance Triggers: ${enhanced.importanceSumTriggers}
  Time Triggers: ${enhanced.timeTriggers}
  Reflection Tree Depth: ${this.reflectionTree.maxDepth}
  Total Tree Nodes: ${this.reflectionTree.totalNodes}

Config:
  Interval: ${this.config.reflectionInterval}s
  Min Memories: ${this.config.minMemoriesForReflection}
  Importance Threshold: ${this.config.importanceThreshold}
  Max Memories Per: ${this.config.maxMemoriesPerReflection}`;
  }
}
