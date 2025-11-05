// src/types/reflection.ts
/**
 * Reflection Type Definitions (Week 8)
 *
 * Enhanced reflection system aligned with Park et al., 2023:
 * - Importance-sum triggering
 * - LLM-generated questions
 * - Recursive reflection trees
 * - Meta-reflections (reflections about reflections)
 */

/**
 * Node in the reflection tree hierarchy
 */
export interface ReflectionNode {
  id: string;
  content: string;
  level: number;              // 0 = observation, 1 = reflection, 2 = meta-reflection, 3 = higher-order
  parentIds: string[];        // Memory/reflection IDs this is based on
  childIds: string[];         // Reflection IDs derived from this
  importance: number;         // 1-10 importance score
  timestamp: number;          // Game time when created
  category: ReflectionCategory;
  confidence: number;         // 0-1 confidence in this reflection
  question?: string;          // Question that prompted this reflection
}

/**
 * Category of reflection
 */
export type ReflectionCategory =
  | 'strategy'      // Strategic insights (how to approach problems)
  | 'pattern'       // Behavioral or environmental patterns
  | 'emotional'     // Emotional states and reactions
  | 'learning'      // New knowledge or discoveries
  | 'social'        // Insights about relationships/interactions
  | 'meta';         // Meta-reflections about thinking itself

/**
 * Complete reflection tree structure
 */
export interface ReflectionTree {
  rootObservations: string[];           // Base observation IDs
  firstOrderReflections: ReflectionNode[];   // Level 1: reflections on observations
  secondOrderReflections: ReflectionNode[];  // Level 2: reflections on reflections (meta)
  higherOrderReflections: ReflectionNode[];  // Level 3+: deeper abstractions
  insights: string[];                   // Key takeaways (most important reflections)
  totalNodes: number;
  maxDepth: number;
}

/**
 * Generated question for reflection
 */
export interface ReflectionQuestion {
  question: string;
  category: ReflectionCategory;
  priority: number;           // 1-10, higher = more important
  targetMemoryCount: number;  // How many memories to consider when answering
}

/**
 * Result of answering a reflection question
 */
export interface ReflectionAnswer {
  question: string;
  answer: string;             // The actual reflection/insight
  relevantMemories: string[]; // Memory IDs used to answer
  confidence: number;         // 0-1 confidence in answer
  category: ReflectionCategory;
}

/**
 * Importance sum tracker for reflection triggering
 */
export interface ImportanceTracker {
  currentSum: number;         // Running sum of importance scores
  threshold: number;          // Threshold for triggering reflection (default: 150)
  lastReflectionTime: number; // Last time reflection occurred
  memoriesContributed: string[]; // IDs of memories counted in sum
}

/**
 * Statistics about reflection system performance
 */
export interface ReflectionStatistics {
  totalReflections: number;
  reflectionsByLevel: Map<number, number>;  // Count per reflection level
  reflectionsByCategory: Map<ReflectionCategory, number>;
  averageConfidence: number;
  questionsGenerated: number;
  questionsAnswered: number;
  importanceSumTriggers: number;  // Times triggered by importance sum
  timeTriggers: number;           // Times triggered by time interval
  lastReflectionTime: number;
  currentImportanceSum: number;
  nextTriggerAt: number;          // Predicted importance sum for next trigger
}

/**
 * Configuration for enhanced reflection system
 */
export interface EnhancedReflectionConfig {
  // Importance-sum triggering (from paper)
  importanceSumThreshold: number;      // Default: 150 (from paper)
  enableImportanceSumTrigger: boolean;  // Use importance-sum vs time-based

  // Question generation
  questionsPerReflection: number;       // Default: 3 (from paper)
  questionGenerationModel: 'llm' | 'heuristic';

  // Meta-reflections
  enableMetaReflections: boolean;       // Allow reflections on reflections
  minReflectionsForMeta: number;        // Min reflections needed for meta (default: 5)
  maxReflectionDepth: number;           // Max tree depth (default: 3)

  // Memory retrieval for reflection
  maxMemoriesPerQuestion: number;       // Memories to retrieve when answering (default: 100)
  importanceThreshold: number;          // Only use memories above this importance

  // Fallback to time-based
  enableTimeFallback: boolean;          // Still use time trigger as backup
  timeFallbackInterval: number;         // Seconds (default: 180)

  // Planning integration
  integratewithPlanning: boolean;       // Feed reflections to planning system
  maxReflectionsForPlanning: number;    // Top N reflections for planning (default: 5)
}

/**
 * Default configuration aligned with Park et al., 2023
 */
export const DEFAULT_ENHANCED_REFLECTION_CONFIG: EnhancedReflectionConfig = {
  importanceSumThreshold: 150,
  enableImportanceSumTrigger: true,
  questionsPerReflection: 3,
  questionGenerationModel: 'llm',
  enableMetaReflections: true,
  minReflectionsForMeta: 5,
  maxReflectionDepth: 3,
  maxMemoriesPerQuestion: 100,
  importanceThreshold: 5,
  enableTimeFallback: true,
  timeFallbackInterval: 180,
  integratewithPlanning: true,
  maxReflectionsForPlanning: 5,
};
