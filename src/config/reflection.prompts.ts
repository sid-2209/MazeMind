// src/config/reflection.prompts.ts
/**
 * Reflection Prompt Templates (Week 8)
 *
 * LLM prompts for enhanced reflection system:
 * - Question generation from recent experiences
 * - Answering reflection questions with retrieved memories
 * - Meta-reflection generation
 */

import { Memory } from '../agent/MemoryStream';
import { ReflectionCategory } from '../types/reflection';

/**
 * Generate high-level questions from recent experiences
 */
export function buildQuestionGenerationPrompt(recentMemories: Memory[]): string {
  const memoryDescriptions = recentMemories
    .slice(0, 20)
    .map((m, i) => `${i + 1}. ${m.description}`)
    .join('\n');

  return `You are an introspective AI agent exploring a maze environment. Based on your recent experiences, generate 3 high-level questions that would help you synthesize these observations into deeper insights.

RECENT EXPERIENCES:
${memoryDescriptions}

Your questions should:
- Ask about patterns, themes, or underlying meanings
- Be open-ended and thought-provoking
- Help identify strategies, learnings, or behavioral patterns
- Not be simple factual questions (avoid "what" questions about specific events)

EXAMPLES OF GOOD QUESTIONS:
- "What does my recent behavior reveal about my priorities?"
- "What patterns am I noticing in how I navigate challenges?"
- "What have I learned about this environment that could inform future decisions?"
- "How has my emotional state influenced my decision-making?"
- "What strategies have proven most effective, and why?"

FORMAT YOUR RESPONSE AS:
QUESTION_1: [your first question]
QUESTION_2: [your second question]
QUESTION_3: [your third question]

Now generate 3 insightful questions based on the experiences above:`;
}

/**
 * Generate reflection by answering a specific question
 */
export function buildReflectionAnswerPrompt(
  question: string,
  relevantMemories: Memory[]
): string {
  const memoryDescriptions = relevantMemories
    .slice(0, 10)
    .map(m => `- ${m.description}`)
    .join('\n');

  return `You are an introspective AI agent reflecting on your experiences. Answer the following question thoughtfully based on your relevant memories.

QUESTION: ${question}

RELEVANT EXPERIENCES:
${memoryDescriptions}

Provide a thoughtful, abstract insight that answers this question. Your response should:
- Be 1-2 sentences (concise but meaningful)
- Synthesize patterns across multiple experiences
- Draw a high-level conclusion or learning
- Be actionable or informative for future decisions

EXAMPLES:
- "I've learned that water scarcity is my biggest survival challenge, and I should prioritize finding water sources over exploration."
- "My stress levels increase dramatically when my energy drops below 30%, suggesting I need to rest more frequently."
- "The maze appears to have a pattern: dead ends are often preceded by long corridors, so I should be cautious when navigating straight paths."

Now answer the question above:
INSIGHT:`;
}

/**
 * Generate meta-reflection from existing reflections
 */
export function buildMetaReflectionPrompt(recentReflections: string[]): string {
  const reflectionList = recentReflections
    .map((r, i) => `${i + 1}. ${r}`)
    .join('\n');

  return `You are an AI agent reflecting on your own reflections. Review your recent insights and identify broader patterns or meta-insights.

YOUR RECENT REFLECTIONS:
${reflectionList}

Based on these reflections, what higher-order pattern or insight emerges? Consider:
- What do these reflections collectively say about your thinking process?
- Are there meta-patterns in how you approach problems?
- What broader principle or strategy connects these insights?
- How has your understanding evolved over time?

Provide a meta-reflection that synthesizes these insights into a deeper understanding (1-2 sentences):

META-INSIGHT:`;
}

/**
 * Categorize a reflection into a category
 */
export function buildCategorizationPrompt(reflection: string): string {
  return `Categorize the following reflection into ONE category:

REFLECTION: "${reflection}"

CATEGORIES:
- strategy: Strategic insights about how to approach problems or make decisions
- pattern: Observed patterns in behavior, environment, or events
- emotional: Insights about emotional states, feelings, or psychological reactions
- learning: New knowledge, discoveries, or factual understanding
- social: Insights about relationships, interactions, or social dynamics
- meta: Meta-reflections about thinking, reasoning, or the reflection process itself

Respond with ONLY the category name (one word):
CATEGORY:`;
}

/**
 * Build prompt for integrating reflections into planning
 */
export function buildPlanningIntegrationPrompt(
  goal: string,
  recentReflections: string[],
  currentContext: string
): string {
  const reflectionList = recentReflections
    .map((r, i) => `${i + 1}. ${r}`)
    .join('\n');

  return `You are an AI agent planning your next actions. Use your recent reflections to inform your plan.

CURRENT GOAL: ${goal}

RECENT REFLECTIONS:
${reflectionList}

CURRENT CONTEXT: ${currentContext}

Based on your reflections and current situation, what should be your next strategic action? Consider:
- Which reflections are most relevant to your current goal?
- How do your learnings influence your approach?
- What patterns or strategies should you apply?

Provide a concrete, actionable plan (2-3 sentences):
PLAN:`;
}

/**
 * Parse generated questions from LLM response
 */
export function parseGeneratedQuestions(llmResponse: string): string[] {
  const questions: string[] = [];

  // Look for QUESTION_N: format
  const questionRegex = /QUESTION_\d+:\s*(.+?)(?=QUESTION_\d+:|$)/gs;
  const matches = llmResponse.matchAll(questionRegex);

  for (const match of matches) {
    const question = match[1].trim();
    if (question && question.length > 10) {
      questions.push(question);
    }
  }

  // Fallback: look for numbered list
  if (questions.length === 0) {
    const lines = llmResponse.split('\n');
    for (const line of lines) {
      const numbered = line.match(/^\d+\.\s*(.+)$/);
      if (numbered && numbered[1].trim().length > 10) {
        questions.push(numbered[1].trim());
      }
    }
  }

  return questions.slice(0, 3); // Max 3 questions
}

/**
 * Parse reflection answer from LLM response
 */
export function parseReflectionAnswer(llmResponse: string): string {
  // Look for INSIGHT: marker
  const insightMatch = llmResponse.match(/INSIGHT:\s*(.+?)(?=\n\n|$)/s);
  if (insightMatch) {
    return insightMatch[1].trim();
  }

  // Look for META-INSIGHT: marker
  const metaMatch = llmResponse.match(/META-INSIGHT:\s*(.+?)(?=\n\n|$)/s);
  if (metaMatch) {
    return metaMatch[1].trim();
  }

  // Fallback: return first substantial line
  const lines = llmResponse.split('\n').filter(l => l.trim().length > 20);
  return lines[0]?.trim() || llmResponse.trim();
}

/**
 * Parse category from LLM response
 */
export function parseCategory(llmResponse: string): ReflectionCategory {
  const categoryMatch = llmResponse.match(/CATEGORY:\s*(\w+)/i);
  if (categoryMatch) {
    const cat = categoryMatch[1].toLowerCase();
    if (['strategy', 'pattern', 'emotional', 'learning', 'social', 'meta'].includes(cat)) {
      return cat as ReflectionCategory;
    }
  }

  // Fallback: keyword detection
  const text = llmResponse.toLowerCase();
  if (text.includes('strategy') || text.includes('should')) return 'strategy';
  if (text.includes('pattern') || text.includes('always') || text.includes('whenever')) return 'pattern';
  if (text.includes('feel') || text.includes('stress') || text.includes('emotion')) return 'emotional';
  if (text.includes('social') || text.includes('relationship') || text.includes('interact')) return 'social';
  if (text.includes('meta') || text.includes('thinking') || text.includes('reflect')) return 'meta';

  return 'learning'; // Default
}

/**
 * Estimate importance score for a reflection based on content
 */
export function estimateReflectionImportance(reflection: string): number {
  let importance = 7; // Base importance for reflections

  // High-impact keywords
  if (reflection.match(/critical|essential|crucial|vital/i)) importance += 2;
  if (reflection.match(/pattern|strategy|learned/i)) importance += 1;
  if (reflection.match(/always|never|whenever/i)) importance += 1;

  // Meta-reflections are typically more important
  if (reflection.match(/reflection|insight|understanding|realize/i)) importance += 1;

  return Math.min(10, importance);
}
