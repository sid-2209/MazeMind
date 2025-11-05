import { PlanningContext } from '../types/planning';

// ============================================
// Daily Planning Prompt
// ============================================

export const DAILY_PLANNING_PROMPT = `You are planning a full day for an agent named Arth who is trapped in a maze.

AGENT'S SITUATION:
- Trapped in a maze, trying to find the exit
- Must manage survival resources (hunger, thirst, energy)
- Can explore, collect items (food, water, energy drinks), and search for exit
- Has memory of past experiences and reflections

CURRENT STATE:
Hunger: {hunger}%
Thirst: {thirst}%
Energy: {energy}%
Stress: {stress}%
Position: ({x}, {y})
Exploration Progress: {exploration}%

RECENT MEMORIES:
{recent_memories}

RECENT REFLECTIONS:
{recent_reflections}

Create a high-level daily plan (one main goal for the next 24 hours of game time).
Consider:
1. Survival needs (if hunger/thirst/energy low, prioritize finding items)
2. Exploration progress (systematically explore unmapped areas)
3. Exit search (if survival stable, focus on finding exit)
4. Past failures (learn from previous attempts)

Respond in this format:
GOAL: [One clear, specific daily goal]
REASONING: [2-3 sentences explaining why this goal makes sense]
PRIORITY: [CRITICAL/HIGH/MEDIUM/LOW]

Example:
GOAL: Systematically explore the eastern section of the maze to find the exit
REASONING: The western areas have been thoroughly explored without finding the exit. Survival resources are currently stable (hunger 75%, thirst 80%). It's time to push exploration eastward where the map shows unexplored corridors.
PRIORITY: HIGH`;

// ============================================
// Hourly Planning Prompt
// ============================================

export const HOURLY_PLANNING_PROMPT = `Break down this daily goal into a specific objective for the next hour.

DAILY GOAL: {daily_goal}

CURRENT TIME: {current_time}
HOUR TO PLAN: Hour {hour_number}

CURRENT SITUATION:
Hunger: {hunger}%
Thirst: {thirst}%
Energy: {energy}%
Position: ({x}, {y})

What specific objective should the agent accomplish in this hour to work toward the daily goal?

Respond with:
OBJECTIVE: [Specific, actionable objective for this hour]

Example:
OBJECTIVE: Map the eastern corridor by exploring all branches and noting dead ends`;

// ============================================
// Action Planning Prompt
// ============================================

export const ACTION_PLANNING_PROMPT = `Break down this hourly objective into a specific 5-minute action.

HOURLY OBJECTIVE: {hourly_objective}
DAILY GOAL: {daily_goal}

CURRENT POSITION: ({x}, {y})
CURRENT TIME: {current_time}
TIME SLOT: {start_time} - {end_time}

SURROUNDING AREA:
{surroundings}

KNOWN NEARBY ITEMS:
{nearby_items}

What specific action should the agent take in this 5-minute window?

Respond with:
ACTION: [Specific action to take]
TYPE: [MOVE/EXPLORE/CONSUME_ITEM/SEEK_ITEM/REST/REFLECT/WAIT]

Example:
ACTION: Move east through the corridor, checking for items or exit markers
TYPE: EXPLORE`;

// ============================================
// Prompt Building Functions
// ============================================

/**
 * Build daily planning prompt with context
 */
export function buildDailyPlanPrompt(context: PlanningContext): string {
  let prompt = DAILY_PLANNING_PROMPT;

  // Replace placeholders with actual values
  prompt = prompt.replace('{hunger}', context.survivalState.hunger.toFixed(0));
  prompt = prompt.replace('{thirst}', context.survivalState.thirst.toFixed(0));
  prompt = prompt.replace('{energy}', context.survivalState.energy.toFixed(0));
  prompt = prompt.replace('{stress}', context.survivalState.stress.toFixed(0));
  prompt = prompt.replace('{x}', context.currentPosition.x.toString());
  prompt = prompt.replace('{y}', context.currentPosition.y.toString());
  prompt = prompt.replace('{exploration}', (context.explorationProgress * 100).toFixed(0));

  // Format recent memories
  const memoriesText = context.recentMemories.length > 0
    ? context.recentMemories.slice(0, 5).map((m, i) => `${i + 1}. ${m}`).join('\n')
    : 'No recent memories';
  prompt = prompt.replace('{recent_memories}', memoriesText);

  // Format recent reflections
  const reflectionsText = context.recentReflections.length > 0
    ? context.recentReflections.slice(0, 3).map((r, i) => `${i + 1}. ${r}`).join('\n')
    : 'No recent reflections';
  prompt = prompt.replace('{recent_reflections}', reflectionsText);

  return prompt;
}

/**
 * Build hourly planning prompt with context
 */
export function buildHourlyPlanPrompt(
  dailyGoal: string,
  hour: number,
  context: PlanningContext
): string {
  let prompt = HOURLY_PLANNING_PROMPT;

  prompt = prompt.replace('{daily_goal}', dailyGoal);
  prompt = prompt.replace('{hour_number}', (hour + 1).toString());
  prompt = prompt.replace('{current_time}', formatGameTime(context.gameTime));
  prompt = prompt.replace('{hunger}', context.survivalState.hunger.toFixed(0));
  prompt = prompt.replace('{thirst}', context.survivalState.thirst.toFixed(0));
  prompt = prompt.replace('{energy}', context.survivalState.energy.toFixed(0));
  prompt = prompt.replace('{x}', context.currentPosition.x.toString());
  prompt = prompt.replace('{y}', context.currentPosition.y.toString());

  return prompt;
}

/**
 * Build action planning prompt with context
 */
export function buildActionPlanPrompt(
  hourlyObjective: string,
  dailyGoal: string,
  context: PlanningContext,
  timeSlot: { start: number; end: number }
): string {
  let prompt = ACTION_PLANNING_PROMPT;

  prompt = prompt.replace('{hourly_objective}', hourlyObjective);
  prompt = prompt.replace('{daily_goal}', dailyGoal);
  prompt = prompt.replace('{x}', context.currentPosition.x.toString());
  prompt = prompt.replace('{y}', context.currentPosition.y.toString());
  prompt = prompt.replace('{current_time}', formatGameTime(context.gameTime));
  prompt = prompt.replace('{start_time}', formatGameTime(timeSlot.start));
  prompt = prompt.replace('{end_time}', formatGameTime(timeSlot.end));

  // Format surroundings (stub for now - will be enhanced with actual perception)
  const surroundings = 'Corridor with walls to north and south, open paths to east and west';
  prompt = prompt.replace('{surroundings}', surroundings);

  // Format nearby items
  const nearbyItems = context.knownItems.length > 0
    ? context.knownItems.slice(0, 3).map(item => `${item.type} at (${item.position.x}, ${item.position.y})`).join(', ')
    : 'None visible';
  prompt = prompt.replace('{nearby_items}', nearbyItems);

  return prompt;
}

// ============================================
// Response Parsing Functions
// ============================================

/**
 * Parse daily plan response from LLM
 */
export interface ParsedDailyPlan {
  goal: string;
  reasoning: string;
  priority: string;
}

export function parseDailyPlanResponse(llmResponse: string): ParsedDailyPlan {
  // Extract goal
  const goalMatch = llmResponse.match(/GOAL:\s*(.+?)(?:\n|$)/i);
  const goal = goalMatch?.[1]?.trim() || 'Survive and find exit';

  // Extract reasoning (may span multiple lines)
  const reasoningMatch = llmResponse.match(/REASONING:\s*(.+?)(?=\nPRIORITY:|$)/is);
  const reasoning = reasoningMatch?.[1]?.trim() || 'Default survival plan';

  // Extract priority
  const priorityMatch = llmResponse.match(/PRIORITY:\s*(\w+)/i);
  const priority = priorityMatch?.[1]?.toUpperCase().trim() || 'MEDIUM';

  return {
    goal,
    reasoning,
    priority
  };
}

/**
 * Parse hourly plan response from LLM
 */
export interface ParsedHourlyPlan {
  objective: string;
}

export function parseHourlyPlanResponse(llmResponse: string): ParsedHourlyPlan {
  // Extract objective
  const objectiveMatch = llmResponse.match(/OBJECTIVE:\s*(.+?)(?:\n|$)/i);
  const objective = objectiveMatch?.[1]?.trim() || 'Continue with daily goal';

  return {
    objective
  };
}

/**
 * Parse action plan response from LLM
 */
export interface ParsedActionPlan {
  action: string;
  type: string;
}

export function parseActionPlanResponse(llmResponse: string): ParsedActionPlan {
  // Extract action
  const actionMatch = llmResponse.match(/ACTION:\s*(.+?)(?=\nTYPE:|$)/is);
  const action = actionMatch?.[1]?.trim() || 'Continue exploring';

  // Extract type
  const typeMatch = llmResponse.match(/TYPE:\s*(\w+)/i);
  const type = typeMatch?.[1]?.toUpperCase().trim() || 'EXPLORE';

  return {
    action,
    type
  };
}

// ============================================
// Utility Functions
// ============================================

/**
 * Format game time in seconds to readable format
 */
function formatGameTime(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Validate priority string
 */
export function validatePriority(priority: string): 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' {
  const upper = priority.toUpperCase();
  if (upper === 'CRITICAL' || upper === 'HIGH' || upper === 'MEDIUM' || upper === 'LOW') {
    return upper as 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  }
  return 'MEDIUM';
}

/**
 * Validate action type string
 */
export function validateActionType(type: string): string {
  const upper = type.toUpperCase();
  const validTypes = ['MOVE', 'EXPLORE', 'CONSUME_ITEM', 'SEEK_ITEM', 'REST', 'REFLECT', 'WAIT'];

  if (validTypes.includes(upper)) {
    return upper;
  }

  return 'EXPLORE';
}
