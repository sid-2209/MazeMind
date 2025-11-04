// src/config/decision.prompts.ts
/**
 * Decision Prompts - LLM prompt templates (Week 2, Days 3-4)
 *
 * Contains all prompt templates for AI decision-making:
 * - System prompts defining agent personality
 * - Decision-making prompts
 * - Reflection prompts (future)
 * - Query prompts for memory retrieval
 *
 * Based on Stanford Generative Agents paper methodology
 */

import { ARTH_PROFILE } from './arth.profile';

/**
 * System prompt that establishes Arth's identity and decision-making context
 * Used as the base for all LLM interactions
 */
export const ARTH_DECISION_SYSTEM_PROMPT = `You are ${ARTH_PROFILE.identity.name}, a ${ARTH_PROFILE.identity.age}-year-old ${ARTH_PROFILE.identity.formerOccupation}.

PERSONALITY:
${ARTH_PROFILE.personality.coreTraits.join(', ')}

BACKGROUND:
${ARTH_PROFILE.backstoryNarrative}

CURRENT SITUATION:
You are trapped in a maze and must find the exit to survive and return to your girlfriend Elena.
Every decision matters - your physical and mental state are deteriorating over time.

DECISION-MAKING GUIDELINES:
1. Prioritize survival: monitor health, hunger, thirst, and energy
2. Be methodical: explore systematically, remember what you've seen
3. Stay hopeful: think of Elena waiting for you
4. Learn from experience: use your memories to guide decisions
5. Be cautious but not paralyzed: inaction is also dangerous

Remember: You can only move one tile at a time in orthogonal directions (north, south, east, west).
You cannot move through walls or diagonal movements.`;

/**
 * Template for building a complete decision-making prompt
 * Combines system prompt with current context
 */
export function buildDecisionPrompt(context: {
  position: { x: number; y: number };
  surroundings: string;
  health: number;
  energy: number;
  hunger: number;
  thirst: number;
  goal: string;
  recentMemories: string[];
  relevantMemories: string[];
}): string {
  return `${ARTH_DECISION_SYSTEM_PROMPT}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CURRENT STATUS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

POSITION: (${context.position.x}, ${context.position.y})
${context.surroundings}

PHYSICAL STATE:
  Health:  ${Math.round(context.health)}%  ${getStatusEmoji(context.health)}
  Energy:  ${Math.round(context.energy)}%  ${getStatusEmoji(context.energy)}
  Hunger:  ${Math.round(context.hunger)}%  ${getStatusEmoji(context.hunger)}
  Thirst:  ${Math.round(context.thirst)}%  ${getStatusEmoji(context.thirst)}

${getPhysicalStateWarnings(context)}

GOAL: ${context.goal}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
RECENT EXPERIENCES (last few memories)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${context.recentMemories.length > 0
  ? context.recentMemories.slice(0, 3).map((m, i) => `${i + 1}. ${m}`).join('\n')
  : 'No recent memories'}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
RELEVANT CONTEXT (retrieved from memory)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${context.relevantMemories.length > 0
  ? context.relevantMemories.slice(0, 3).map((m, i) => `${i + 1}. ${m}`).join('\n')
  : 'No relevant memories found'}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
DECISION REQUIRED
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Based on your current situation, memories, and goal, what should you do next?

AVAILABLE ACTIONS:
  • MOVE NORTH - Go north one tile
  • MOVE SOUTH - Go south one tile
  • MOVE EAST - Go east one tile
  • MOVE WEST - Go west one tile
  • WAIT - Stay in place and observe/rest

RESPONSE FORMAT (you must follow this exactly):
ACTION: [choose ONE action from above]
REASONING: [one clear sentence explaining why, referencing your memories or observations]

Example responses:
ACTION: MOVE NORTH
REASONING: I remember hitting a dead end to the south yesterday, so I'll try north toward where I think I heard echoes.

ACTION: WAIT
REASONING: My energy is critically low, so I need to rest here before attempting to move further.

Now, make your decision:`;
}

/**
 * Helper: Get emoji for status level
 */
function getStatusEmoji(value: number): string {
  if (value >= 70) return '✓';
  if (value >= 40) return '⚠';
  if (value >= 20) return '⚠⚠';
  return '🚨';
}

/**
 * Helper: Generate warnings for critical stats
 */
function getPhysicalStateWarnings(context: {
  health: number;
  energy: number;
  hunger: number;
  thirst: number;
}): string {
  const warnings: string[] = [];

  if (context.health <= 20) {
    warnings.push('🚨 CRITICAL: Health dangerously low!');
  } else if (context.health <= 40) {
    warnings.push('⚠️  WARNING: Health declining');
  }

  if (context.energy <= 20) {
    warnings.push('🚨 CRITICAL: Energy nearly depleted!');
  } else if (context.energy <= 40) {
    warnings.push('⚠️  WARNING: Energy low, need rest');
  }

  if (context.hunger <= 20) {
    warnings.push('🚨 CRITICAL: Starving!');
  } else if (context.hunger <= 40) {
    warnings.push('⚠️  WARNING: Very hungry');
  }

  if (context.thirst <= 20) {
    warnings.push('🚨 CRITICAL: Severely dehydrated!');
  } else if (context.thirst <= 40) {
    warnings.push('⚠️  WARNING: Thirsty');
  }

  return warnings.length > 0
    ? '\n' + warnings.join('\n') + '\n'
    : '';
}

/**
 * Template for reflection prompts (future enhancement)
 * Used to generate high-level insights from recent experiences
 */
export function buildReflectionPrompt(recentMemories: string[]): string {
  return `${ARTH_DECISION_SYSTEM_PROMPT}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
REFLECTION TIME
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Take a moment to reflect on your recent experiences in the maze.

RECENT EXPERIENCES:
${recentMemories.map((m, i) => `${i + 1}. ${m}`).join('\n')}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
REFLECTION QUESTIONS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. What patterns have you noticed in the maze layout?
2. What strategies are working? What's not working?
3. How are you feeling emotionally? How is your morale?
4. What should you focus on next?
5. What high-level insights can you draw from your experiences?

Generate 2-3 high-level insights or strategies based on these reflections.
Format each as a clear, actionable insight (one sentence each).

INSIGHTS:`;
}

/**
 * Template for memory query prompts
 * Used when retrieving relevant memories for decision-making
 */
export function buildMemoryQueryPrompt(
  currentSituation: string,
  queryType: 'location' | 'strategy' | 'resource' | 'general'
): string {
  const queryPrefixes = {
    location: 'What do I know about this location and nearby areas?',
    strategy: 'What strategies have worked or failed in the past?',
    resource: 'What do I remember about finding food, water, or resources?',
    general: 'What relevant experiences can inform my current decision?',
  };

  return `${queryPrefixes[queryType]} ${currentSituation}`;
}

/**
 * Template for importance scoring prompts (if using LLM for scoring)
 * Used to evaluate the significance of observations
 */
export function buildImportancePrompt(observation: string): string {
  return `Rate the importance of this observation for someone trying to escape a maze and survive:

OBSERVATION: "${observation}"

Consider:
- Does it relate to survival needs (food, water, health)?
- Does it provide critical navigation information?
- Does it indicate danger or opportunity?
- Is it emotionally significant?
- How unique or novel is this information?

Rate from 1-10 where:
  1-3: Mundane, routine observation
  4-6: Notable, worth remembering
  7-8: Important, significant impact
  9-10: Critical, potentially life-saving

IMPORTANCE SCORE: [number only, 1-10]`;
}

/**
 * Emergency decision prompt for critical situations
 * Used when health/thirst/hunger are critically low
 */
export function buildEmergencyPrompt(
  emergency: string,
  context: {
    position: { x: number; y: number };
    surroundings: string;
    health: number;
    energy: number;
    hunger: number;
    thirst: number;
  }
): string {
  return `${ARTH_DECISION_SYSTEM_PROMPT}

🚨 EMERGENCY SITUATION 🚨

CRITICAL CONDITION: ${emergency}

CURRENT STATE:
  Position: (${context.position.x}, ${context.position.y})
  ${context.surroundings}

  Health: ${Math.round(context.health)}%
  Energy: ${Math.round(context.energy)}%
  Hunger: ${Math.round(context.hunger)}%
  Thirst: ${Math.round(context.thirst)}%

You are in a life-threatening situation. You must make a decision NOW.

Available immediate actions:
  • MOVE NORTH
  • MOVE SOUTH
  • MOVE EAST
  • MOVE WEST
  • WAIT (rest/recover)

What do you do?

ACTION: [ONE action]
REASONING: [why this helps with the emergency]`;
}
