# Week 5 Detailed Implementation Plan: Hierarchical Planning System

## Executive Summary

**Objective**: Implement the hierarchical planning architecture from Park et al. (2023) to transform the agent from reactive to goal-oriented behavior.

**Current State**: Agent makes single reactive decisions every 3 seconds with no long-term coherence.

**Target State**: Agent follows coherent multi-hour plans (Daily → Hourly → 5-minute actions) that adapt to changing conditions.

**Duration**: 11 days (80-100 hours)
**Complexity**: High - Hierarchical structures, LLM orchestration, state management
**Paper Alignment**: Planning component 15% → 85% | Overall project 65% → 78%

**Total Code**: ~2,190 lines (4 new files, 5 modified files)

---

## Table of Contents

1. [Dependencies Analysis](#dependencies-analysis)
2. [Day-by-Day Implementation Plan](#day-by-day-implementation-plan)
3. [Files to Create](#files-to-create)
4. [Files to Modify](#files-to-modify)
5. [Testing Strategy](#testing-strategy)
6. [Success Criteria](#success-criteria)
7. [Risk Mitigation](#risk-mitigation)

---

## Dependencies Analysis

### Existing Systems Required (Week 2-4 Complete)
✅ **MemoryStream** - Plans will be stored here with 'plan' type
✅ **DecisionMaker** - Will be modified to check plans before reactive decisions
✅ **Agent** - Will gain planning context and plan execution methods
✅ **LLMService** - Will generate all plan levels via LLM calls
✅ **MemoryRetrieval** - Used to gather context for planning
✅ **ReflectionSystem** - Provides insights for planning
✅ **ResourceManager** - Survival state influences plan priorities
✅ **StressManager** - Stress affects plan re-planning triggers

### Files to Read Before Implementation
1. `src/agent/Agent.ts` (full file)
2. `src/agent/DecisionMaker.ts` (full file)
3. `src/agent/MemoryStream.ts` (full file)
4. `src/core/Game.ts` (for integration points)
5. `src/ui/UIManager.ts` (for UI integration)
6. `src/types/index.ts` (to understand existing types)

---

## Day-by-Day Implementation Plan

### **DAY 1: Foundation - Type Definitions**
**Duration**: 6-8 hours
**Goal**: Create all planning-related type definitions

#### Tasks

**1. Create `src/types/planning.ts` (~220 lines)**

**Enums (lines 1-30)**:
```typescript
export enum PlanStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  ABANDONED = 'abandoned',
  FAILED = 'failed'
}

export enum PlanPriority {
  CRITICAL = 'critical',    // Survival-related
  HIGH = 'high',           // Important goals
  MEDIUM = 'medium',       // Normal activities
  LOW = 'low'              // Optional exploration
}

export enum ActionType {
  MOVE = 'move',
  EXPLORE = 'explore',
  CONSUME_ITEM = 'consume_item',
  SEEK_ITEM = 'seek_item',
  REST = 'rest',
  REFLECT = 'reflect',
  WAIT = 'wait'
}
```

**Core Interfaces (lines 31-150)**:
```typescript
export interface ActionPlan {
  id: string;
  parentId: string;        // ID of HourlyPlan
  startTime: number;       // Game time in seconds
  duration: number;        // Duration in seconds (typically 300 = 5 min)
  action: string;          // Natural language action
  actionType: ActionType;  // Categorized action
  targetPosition?: Position; // Where to move
  targetItem?: string;     // Item to seek/consume
  status: PlanStatus;
  completedAt?: number;
  memoryId?: string;       // Reference to memory storage
}

export interface HourlyPlan {
  id: string;
  parentId: string;        // ID of DailyPlan
  startTime: number;
  duration: number;        // 3600 seconds (1 hour)
  objective: string;       // What to accomplish this hour
  actions: ActionPlan[];
  status: PlanStatus;
  completedAt?: number;
}

export interface DailyPlan {
  id: string;
  createdAt: number;
  goal: string;            // High-level daily goal
  reasoning: string;       // Why this goal (from LLM)
  priority: PlanPriority;
  hourlyPlans: HourlyPlan[];
  status: PlanStatus;
  completedAt?: number;
  abandonedReason?: string;
}
```

**Context Interface (lines 151-220)**:
```typescript
export interface PlanningContext {
  // Current state
  survivalState: {
    hunger: number;
    thirst: number;
    energy: number;
    stress: number;
  };

  // Environment
  currentPosition: Position;
  explorationProgress: number;
  knownItems: Array<{type: string; position: Position}>;

  // Memory
  recentMemories: string[];
  recentReflections: string[];

  // Time
  gameTime: number;
  timeOfDay: string;
}
```

**2. Add exports to `src/types/index.ts`**
```typescript
export * from './planning';
```

#### Testing Checkpoint
- [ ] TypeScript compiles successfully
- [ ] No type errors in project
- [ ] Types importable in other files

---

### **DAY 2: Core Planning System - Part 1**
**Duration**: 8-10 hours
**Goal**: Create PlanningSystem class with core methods (no LLM yet)

#### Tasks

**1. Create `src/systems/PlanningSystem.ts` (~500 lines initially)**

**Class Structure**:
```typescript
import { Agent } from '../agent/Agent';
import { LLMService } from '../services/LLMService';
import { MemoryStream } from '../agent/MemoryStream';
import { DailyPlan, HourlyPlan, ActionPlan, PlanningContext, PlanStatus } from '../types/planning';
import { v4 as uuidv4 } from 'uuid';

export class PlanningSystem {
  private agent: Agent;
  private llmService: LLMService;
  private memoryStream: MemoryStream;
  private currentDailyPlan: DailyPlan | null = null;
  private currentHourlyPlan: HourlyPlan | null = null;
  private currentActionPlan: ActionPlan | null = null;
  private lastDistanceToTarget: number = 0;

  constructor(agent: Agent, llmService: LLMService, memoryStream: MemoryStream) {
    this.agent = agent;
    this.llmService = llmService;
    this.memoryStream = memoryStream;
    console.log('📋 PlanningSystem initialized');
  }

  // Daily Plan Methods
  async generateDailyPlan(context: PlanningContext): Promise<DailyPlan> {
    console.log('📋 Generating daily plan...');

    // STUB - Replace with real LLM call on Day 11
    const dailyPlan: DailyPlan = {
      id: uuidv4(),
      createdAt: Date.now(),
      goal: 'Explore eastern section and find exit',
      reasoning: 'Survival resources stable, time to focus on finding exit',
      priority: PlanPriority.HIGH,
      hourlyPlans: [],
      status: PlanStatus.PENDING
    };

    this.currentDailyPlan = dailyPlan;
    console.log(`📋 Daily plan created: "${dailyPlan.goal}"`);
    return dailyPlan;
  }

  // Hourly Plan Methods
  async decomposeIntoHourlyPlans(dailyPlan: DailyPlan): Promise<void> {
    console.log('📋 Decomposing into hourly plans...');

    // Generate next 3 hours of detailed plans
    for (let hour = 0; hour < 3; hour++) {
      const hourlyPlan = await this.generateHourlyPlan(dailyPlan, hour, this.getCurrentContext());
      dailyPlan.hourlyPlans.push(hourlyPlan);
    }
  }

  async generateHourlyPlan(
    dailyPlan: DailyPlan,
    hour: number,
    context: PlanningContext
  ): Promise<HourlyPlan> {
    // STUB - Replace with real LLM call on Day 11
    const hourlyPlan: HourlyPlan = {
      id: uuidv4(),
      parentId: dailyPlan.id,
      startTime: context.gameTime + (hour * 3600),
      duration: 3600,
      objective: `Map eastern corridors (Hour ${hour + 1})`,
      actions: [],
      status: PlanStatus.PENDING
    };

    return hourlyPlan;
  }

  // Action Plan Methods
  async decomposeIntoActions(hourlyPlan: HourlyPlan): Promise<void> {
    console.log('📋 Decomposing into actions...');

    // 1 hour = 12 five-minute chunks
    for (let i = 0; i < 12; i++) {
      const actionPlan = await this.generateActionPlan(hourlyPlan, i, this.getCurrentContext());
      hourlyPlan.actions.push(actionPlan);
    }
  }

  async generateActionPlan(
    hourlyPlan: HourlyPlan,
    actionIndex: number,
    context: PlanningContext
  ): Promise<ActionPlan> {
    // STUB - Replace with real LLM call on Day 11
    const actionPlan: ActionPlan = {
      id: uuidv4(),
      parentId: hourlyPlan.id,
      startTime: hourlyPlan.startTime + (actionIndex * 300),
      duration: 300,
      action: 'Move east to explore corridor',
      actionType: ActionType.EXPLORE,
      status: PlanStatus.PENDING
    };

    return actionPlan;
  }

  // Retrieval Methods
  getCurrentAction(gameTime: number): ActionPlan | null {
    if (!this.currentDailyPlan) return null;

    const hourlyPlan = this.findActiveHourlyPlan(gameTime);
    if (!hourlyPlan) return null;

    const action = this.findActiveAction(hourlyPlan, gameTime);
    return action;
  }

  private findActiveHourlyPlan(gameTime: number): HourlyPlan | null {
    if (!this.currentDailyPlan) return null;

    for (const hourlyPlan of this.currentDailyPlan.hourlyPlans) {
      const endTime = hourlyPlan.startTime + hourlyPlan.duration;
      if (gameTime >= hourlyPlan.startTime && gameTime < endTime) {
        return hourlyPlan;
      }
    }

    return null;
  }

  private findActiveAction(hourlyPlan: HourlyPlan, gameTime: number): ActionPlan | null {
    for (const action of hourlyPlan.actions) {
      const endTime = action.startTime + action.duration;
      if (gameTime >= action.startTime && gameTime < endTime) {
        return action;
      }
    }

    return null;
  }

  // Completion Methods
  completeAction(actionId: string): void {
    const action = this.findActionById(actionId);
    if (action) {
      action.status = PlanStatus.COMPLETED;
      action.completedAt = Date.now();
      console.log(`✓ Completed: ${action.action}`);
    }
  }

  private findActionById(actionId: string): ActionPlan | null {
    if (!this.currentDailyPlan) return null;

    for (const hourlyPlan of this.currentDailyPlan.hourlyPlans) {
      for (const action of hourlyPlan.actions) {
        if (action.id === actionId) {
          return action;
        }
      }
    }

    return null;
  }

  // Re-planning Methods (basic structure)
  shouldReplan(context: PlanningContext): boolean {
    // Critical survival need
    if (this.hasCriticalNeed(context.survivalState)) {
      return true;
    }

    // Plan completed
    if (this.currentDailyPlan?.status === PlanStatus.COMPLETED) {
      return true;
    }

    return false;
  }

  async replan(reason: string, context: PlanningContext): Promise<void> {
    console.log(`🔄 Re-planning due to: ${reason}`);

    // Abandon current plan
    if (this.currentDailyPlan) {
      this.currentDailyPlan.status = PlanStatus.ABANDONED;
      this.currentDailyPlan.abandonedReason = reason;
    }

    // Generate new plan
    await this.generateDailyPlan(context);
    await this.decomposeIntoHourlyPlans(this.currentDailyPlan!);

    // Decompose first hour immediately
    if (this.currentDailyPlan!.hourlyPlans.length > 0) {
      await this.decomposeIntoActions(this.currentDailyPlan!.hourlyPlans[0]);
    }
  }

  // Helper Methods
  private hasCriticalNeed(survivalState: any): boolean {
    return survivalState.hunger < 20 ||
           survivalState.thirst < 15 ||
           survivalState.energy < 10;
  }

  private getCurrentContext(): PlanningContext {
    // Stub - will be implemented properly with Agent integration
    return {
      survivalState: { hunger: 100, thirst: 100, energy: 100, stress: 0 },
      currentPosition: { x: 0, y: 0 },
      explorationProgress: 0,
      knownItems: [],
      recentMemories: [],
      recentReflections: [],
      gameTime: 0,
      timeOfDay: 'morning'
    };
  }

  getCurrentDailyPlan(): DailyPlan | null {
    return this.currentDailyPlan;
  }
}
```

#### Testing Checkpoint
- [ ] PlanningSystem instantiates successfully
- [ ] Mock plans generate correctly
- [ ] getCurrentAction returns correct action based on time
- [ ] Re-planning triggers detected

---

### **DAY 3: LLM Prompts and Parsing**
**Duration**: 8-10 hours
**Goal**: Create comprehensive prompts and response parsers

#### Tasks

**1. Create `src/config/planning.prompts.ts` (~350 lines)**

**Daily Planning Prompt Template**:
```typescript
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

// Prompt Building Functions
export function buildDailyPlanPrompt(context: PlanningContext): string {
  let prompt = DAILY_PLANNING_PROMPT;

  prompt = prompt.replace('{hunger}', context.survivalState.hunger.toString());
  prompt = prompt.replace('{thirst}', context.survivalState.thirst.toString());
  prompt = prompt.replace('{energy}', context.survivalState.energy.toString());
  prompt = prompt.replace('{stress}', context.survivalState.stress.toString());
  prompt = prompt.replace('{x}', context.currentPosition.x.toString());
  prompt = prompt.replace('{y}', context.currentPosition.y.toString());
  prompt = prompt.replace('{exploration}', (context.explorationProgress * 100).toFixed(0));

  const memoriesText = context.recentMemories.length > 0
    ? context.recentMemories.slice(0, 5).map((m, i) => `${i + 1}. ${m}`).join('\n')
    : 'No recent memories';
  prompt = prompt.replace('{recent_memories}', memoriesText);

  const reflectionsText = context.recentReflections.length > 0
    ? context.recentReflections.slice(0, 3).map((r, i) => `${i + 1}. ${r}`).join('\n')
    : 'No recent reflections';
  prompt = prompt.replace('{recent_reflections}', reflectionsText);

  return prompt;
}

export function buildHourlyPlanPrompt(
  dailyGoal: string,
  hour: number,
  context: PlanningContext
): string {
  let prompt = HOURLY_PLANNING_PROMPT;

  prompt = prompt.replace('{daily_goal}', dailyGoal);
  prompt = prompt.replace('{hour_number}', (hour + 1).toString());
  prompt = prompt.replace('{current_time}', new Date(context.gameTime * 1000).toISOString());
  prompt = prompt.replace('{hunger}', context.survivalState.hunger.toString());
  prompt = prompt.replace('{thirst}', context.survivalState.thirst.toString());
  prompt = prompt.replace('{energy}', context.survivalState.energy.toString());
  prompt = prompt.replace('{x}', context.currentPosition.x.toString());
  prompt = prompt.replace('{y}', context.currentPosition.y.toString());

  return prompt;
}

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
  prompt = prompt.replace('{current_time}', new Date(context.gameTime * 1000).toISOString());
  prompt = prompt.replace('{start_time}', formatTime(timeSlot.start));
  prompt = prompt.replace('{end_time}', formatTime(timeSlot.end));

  // Surroundings and items would come from agent's perception
  prompt = prompt.replace('{surroundings}', 'Corridor with walls to north and south');
  prompt = prompt.replace('{nearby_items}', context.knownItems.length > 0 ? 'None visible' : 'None visible');

  return prompt;
}

function formatTime(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}
```

**2. Add parsing functions to PlanningSystem.ts**:
```typescript
// Add these methods to PlanningSystem class

private parseDailyPlan(llmResponse: string, context: PlanningContext): DailyPlan {
  const goalMatch = llmResponse.match(/GOAL:\s*(.+)/i);
  const reasoningMatch = llmResponse.match(/REASONING:\s*(.+)/i);
  const priorityMatch = llmResponse.match(/PRIORITY:\s*(\w+)/i);

  const goal = goalMatch?.[1]?.trim() || 'Survive and find exit';
  const reasoning = reasoningMatch?.[1]?.trim() || 'Default plan';
  const priorityStr = priorityMatch?.[1]?.toUpperCase() || 'MEDIUM';

  const priorityMap: Record<string, PlanPriority> = {
    'CRITICAL': PlanPriority.CRITICAL,
    'HIGH': PlanPriority.HIGH,
    'MEDIUM': PlanPriority.MEDIUM,
    'LOW': PlanPriority.LOW
  };

  return {
    id: uuidv4(),
    createdAt: Date.now(),
    goal,
    reasoning,
    priority: priorityMap[priorityStr] || PlanPriority.MEDIUM,
    hourlyPlans: [],
    status: PlanStatus.PENDING
  };
}

private parseHourlyPlan(llmResponse: string, dailyPlan: DailyPlan, hour: number): HourlyPlan {
  const objectiveMatch = llmResponse.match(/OBJECTIVE:\s*(.+)/i);
  const objective = objectiveMatch?.[1]?.trim() || 'Continue with daily goal';

  return {
    id: uuidv4(),
    parentId: dailyPlan.id,
    startTime: this.getCurrentContext().gameTime + (hour * 3600),
    duration: 3600,
    objective,
    actions: [],
    status: PlanStatus.PENDING
  };
}

private parseActionPlan(
  llmResponse: string,
  hourlyPlan: HourlyPlan,
  actionIndex: number
): ActionPlan {
  const actionMatch = llmResponse.match(/ACTION:\s*(.+)/i);
  const typeMatch = llmResponse.match(/TYPE:\s*(\w+)/i);

  const action = actionMatch?.[1]?.trim() || 'Continue exploring';
  const typeStr = typeMatch?.[1]?.toUpperCase() || 'EXPLORE';

  const typeMap: Record<string, ActionType> = {
    'MOVE': ActionType.MOVE,
    'EXPLORE': ActionType.EXPLORE,
    'CONSUME_ITEM': ActionType.CONSUME_ITEM,
    'SEEK_ITEM': ActionType.SEEK_ITEM,
    'REST': ActionType.REST,
    'REFLECT': ActionType.REFLECT,
    'WAIT': ActionType.WAIT
  };

  return {
    id: uuidv4(),
    parentId: hourlyPlan.id,
    startTime: hourlyPlan.startTime + (actionIndex * 300),
    duration: 300,
    action,
    actionType: typeMap[typeStr] || ActionType.EXPLORE,
    status: PlanStatus.PENDING
  };
}
```

#### Testing Checkpoint
- [ ] Prompts compile correctly
- [ ] Mock LLM responses parse successfully
- [ ] All three plan levels parse correctly
- [ ] Error handling works for malformed responses

---

### **DAY 4: Agent Integration - Part 1**
**Duration**: 6-8 hours
**Goal**: Integrate PlanningSystem into Agent class

#### Tasks

**1. Modify `src/agent/Agent.ts` (+100 lines)**

Add after ReflectionSystem initialization:

```typescript
// Add imports (around line 30)
import { PlanningSystem } from '../systems/PlanningSystem';
import { PlanningContext, DailyPlan, ActionPlan } from '../types/planning';

// Add property (around line 60)
private planningSystem!: PlanningSystem;

// In async init() method or constructor (around line 180)
// After reflection system init
this.planningSystem = new PlanningSystem(
  this,
  this.llmService,
  this.memoryStream
);
console.log('📋 Planning system initialized');

// Add new method (around line 450)
/**
 * Get current planning context
 */
getPlanningContext(): PlanningContext {
  const survivalState = this.resourceManager.getState();
  const recentMemories = this.memoryStream
    .getMemoriesByType('observation')
    .slice(-5)
    .map(m => m.content);

  const recentReflections = this.memoryStream
    .getMemoriesByType('reflection')
    .slice(-3)
    .map(m => m.content);

  return {
    survivalState: {
      hunger: survivalState.hunger,
      thirst: survivalState.thirst,
      energy: survivalState.energy,
      stress: this.state.stress
    },
    currentPosition: this.getTilePosition(),
    explorationProgress: this.fogOfWar?.getExplorationProgress() || 0,
    knownItems: this.itemGenerator?.getAllItems() || [],
    recentMemories,
    recentReflections,
    gameTime: 0, // Will be passed from Game
    timeOfDay: this.getTimeOfDay()
  };
}

/**
 * Get current plan
 */
getCurrentPlan(): DailyPlan | null {
  return this.planningSystem.getCurrentDailyPlan();
}

/**
 * Get current action from plan
 */
getCurrentPlannedAction(gameTime: number): ActionPlan | null {
  return this.planningSystem.getCurrentAction(gameTime);
}

/**
 * Trigger re-planning
 */
async replan(reason: string, gameTime: number): Promise<void> {
  const context = this.getPlanningContext();
  context.gameTime = gameTime;
  await this.planningSystem.replan(reason, context);
}

/**
 * Initialize daily plan (called at game start)
 */
async initializePlan(gameTime: number): Promise<void> {
  console.log('📋 Initializing daily plan...');
  const context = this.getPlanningContext();
  context.gameTime = gameTime;

  await this.planningSystem.generateDailyPlan(context);
  await this.planningSystem.decomposeInitialPlans();
}

/**
 * Get planning system
 */
getPlanningSystem(): PlanningSystem {
  return this.planningSystem;
}

/**
 * Add decomposeInitialPlans to PlanningSystem
 */
// In PlanningSystem.ts, add:
async decomposeInitialPlans(): Promise<void> {
  if (!this.currentDailyPlan) return;

  // Generate first 3 hourly plans
  await this.decomposeIntoHourlyPlans(this.currentDailyPlan);

  // Decompose first hour into actions immediately
  if (this.currentDailyPlan.hourlyPlans.length > 0) {
    await this.decomposeIntoActions(this.currentDailyPlan.hourlyPlans[0]);
    this.currentHourlyPlan = this.currentDailyPlan.hourlyPlans[0];
  }

  console.log('✅ Initial plans decomposed');
}
```

#### Testing Checkpoint
- [ ] Agent initializes with PlanningSystem
- [ ] getPlanningContext returns valid context
- [ ] Plan generation can be triggered
- [ ] No compilation errors

---

### **DAY 5: DecisionMaker Integration**
**Duration**: 8-10 hours
**Goal**: Integrate planning into decision-making flow

#### Tasks

**1. Modify `src/agent/DecisionMaker.ts` (+150 lines)**

Restructure the `makeDecision()` method:

```typescript
// Add imports
import { PlanStatus, ActionType, ActionPlan } from '../types/planning';

// Modify makeDecision() method
async makeDecision(): Promise<Decision> {
  console.log('\n🤔 Making decision...');

  // PRIORITY 0: Check if we have an active plan (NEW - Week 5)
  const currentAction = this.agent.getCurrentPlannedAction(this.gameTime);
  if (currentAction && currentAction.status === PlanStatus.PENDING) {
    console.log(`📋 Following plan: ${currentAction.action}`);
    const decision = await this.executePlannedAction(currentAction);
    if (decision) {
      this.agent.getPlanningSystem().completeAction(currentAction.id);
      return decision;
    }
  }

  // PRIORITY 1: Critical survival needs (overrides plan)
  const urgentNeed = this.agent.getResourceManager().getMostUrgentNeed();
  if (urgentNeed && this.itemGenerator) {
    const survivalDecision = this.makeSurvivalDecision(urgentNeed);
    if (survivalDecision) {
      console.log(`⚠️ SURVIVAL PRIORITY: ${urgentNeed} critical (abandoning plan)`);
      // Trigger re-planning after addressing need
      await this.agent.replan('Critical survival need', this.gameTime);
      return survivalDecision;
    }
  }

  // PRIORITY 2: If no plan or plan failed, fall back to reactive decision
  console.log('🎲 No active plan, making reactive decision...');
  return await this.makeReactiveDecision();
}

// Add new method
private async executePlannedAction(action: ActionPlan): Promise<Decision | null> {
  switch (action.actionType) {
    case ActionType.MOVE:
    case ActionType.EXPLORE:
      if (action.targetPosition) {
        return await this.moveTowardPosition(action.targetPosition);
      }
      // If no target, use action description to infer direction
      return this.inferDirectionFromAction(action.action);

    case ActionType.SEEK_ITEM:
      if (action.targetItem) {
        return await this.seekItemType(action.targetItem);
      }
      break;

    case ActionType.CONSUME_ITEM:
      return this.tryConsumeNearbyItem();

    case ActionType.REST:
    case ActionType.WAIT:
      return {
        action: 'wait',
        reasoning: action.action,
        confidence: 1.0
      };

    case ActionType.REFLECT:
      // Trigger reflection
      await this.agent.getReflectionSystem().generateReflections();
      return {
        action: 'wait',
        reasoning: 'Reflecting on experiences',
        confidence: 1.0
      };
  }

  return null;
}

// Add helper methods
private async moveTowardPosition(target: Position): Promise<Decision> {
  const current = this.agent.getTilePosition();
  const dx = target.x - current.x;
  const dy = target.y - current.y;

  // Simple pathfinding: prefer larger delta
  if (Math.abs(dx) > Math.abs(dy)) {
    return {
      action: 'move',
      direction: dx > 0 ? 'east' : 'west',
      reasoning: `Moving toward planned position (${target.x}, ${target.y})`,
      confidence: 0.9
    };
  } else {
    return {
      action: 'move',
      direction: dy > 0 ? 'south' : 'north',
      reasoning: `Moving toward planned position (${target.x}, ${target.y})`,
      confidence: 0.9
    };
  }
}

private inferDirectionFromAction(actionDescription: string): Decision {
  // Parse action string for directional keywords
  const action = actionDescription.toLowerCase();
  if (action.includes('north') || action.includes('up')) {
    return { action: 'move', direction: 'north', reasoning: actionDescription, confidence: 0.7 };
  } else if (action.includes('south') || action.includes('down')) {
    return { action: 'move', direction: 'south', reasoning: actionDescription, confidence: 0.7 };
  } else if (action.includes('east') || action.includes('right')) {
    return { action: 'move', direction: 'east', reasoning: actionDescription, confidence: 0.7 };
  } else if (action.includes('west') || action.includes('left')) {
    return { action: 'move', direction: 'west', reasoning: actionDescription, confidence: 0.7 };
  }

  // Default to exploring
  return { action: 'move', direction: 'north', reasoning: 'Exploring', confidence: 0.5 };
}

private async seekItemType(itemType: string): Promise<Decision> {
  // Find nearest item of type
  const items = this.itemGenerator.getAllItems();
  const agentPos = this.agent.getTilePosition();

  let nearest = null;
  let minDist = Infinity;

  for (const item of items) {
    if (!item.consumed && item.type === itemType) {
      const dist = Math.abs(item.position.x - agentPos.x) +
                   Math.abs(item.position.y - agentPos.y);
      if (dist < minDist) {
        minDist = dist;
        nearest = item;
      }
    }
  }

  if (nearest) {
    return this.moveTowardPosition(nearest.position);
  }

  // Item not found, explore
  return { action: 'move', direction: 'north', reasoning: `Searching for ${itemType}`, confidence: 0.5 };
}

private tryConsumeNearbyItem(): Decision {
  const tile = this.agent.getTilePosition();
  const item = this.itemGenerator.getItemAtTile(tile.x, tile.y);

  if (item && !item.consumed) {
    this.agent.consumeItem(item);
    return {
      action: 'wait',
      reasoning: `Consumed ${item.type}`,
      confidence: 1.0
    };
  }

  return {
    action: 'wait',
    reasoning: 'No item to consume',
    confidence: 1.0
  };
}
```

#### Testing Checkpoint
- [ ] DecisionMaker checks for plans first
- [ ] Plan actions execute correctly
- [ ] Survival needs override plans
- [ ] Fallback to reactive works when no plan

---

### **DAY 6: Memory Integration**
**Duration**: 4-6 hours
**Goal**: Store and retrieve plans from MemoryStream

#### Tasks

**1. Modify `src/agent/MemoryStream.ts` (+60 lines)**

Add these methods:

```typescript
// Add imports
import { DailyPlan, HourlyPlan, PlanPriority, PlanStatus } from '../types/planning';

/**
 * Store daily plan in memory with full hierarchy
 */
storeDailyPlan(plan: DailyPlan): string {
  const memory: Memory = {
    id: uuidv4(),
    content: `Daily Plan: ${plan.goal}`,
    timestamp: Date.now(),
    lastAccessed: Date.now(),
    type: 'plan',
    importance: this.calculatePlanImportance(plan),
    location: undefined, // Plans are non-spatial
    tags: ['plan', 'daily', `priority_${plan.priority}`],
    embedding: undefined,
    citations: []
  };

  // Store metadata about plan structure
  (memory as any).metadata = {
    planId: plan.id,
    planType: 'daily',
    goal: plan.goal,
    reasoning: plan.reasoning,
    priority: plan.priority,
    hourlyPlansCount: plan.hourlyPlans.length,
    createdAt: plan.createdAt,
    status: plan.status
  };

  this.memories.push(memory);
  return memory.id;
}

/**
 * Store hourly plan in memory
 */
storeHourlyPlan(plan: HourlyPlan, dailyPlanId: string): string {
  const memory: Memory = {
    id: uuidv4(),
    content: `Hourly Plan: ${plan.objective}`,
    timestamp: Date.now(),
    lastAccessed: Date.now(),
    type: 'plan',
    importance: 7, // High importance
    location: undefined,
    tags: ['plan', 'hourly', `daily_${dailyPlanId}`],
    embedding: undefined,
    citations: []
  };

  (memory as any).metadata = {
    planId: plan.id,
    planType: 'hourly',
    parentId: dailyPlanId,
    objective: plan.objective,
    actionsCount: plan.actions.length,
    status: plan.status
  };

  this.memories.push(memory);
  return memory.id;
}

/**
 * Get active plans
 */
getActivePlans(): Memory[] {
  return this.memories.filter(m =>
    m.type === 'plan' &&
    (m as any).metadata?.status !== PlanStatus.COMPLETED &&
    (m as any).metadata?.status !== PlanStatus.ABANDONED
  );
}

/**
 * Calculate plan importance based on priority
 */
private calculatePlanImportance(plan: DailyPlan): number {
  const priorityScores = {
    [PlanPriority.CRITICAL]: 10,
    [PlanPriority.HIGH]: 8,
    [PlanPriority.MEDIUM]: 6,
    [PlanPriority.LOW]: 4
  };

  return priorityScores[plan.priority] || 6;
}
```

**2. Update PlanningSystem to use memory storage**:

```typescript
// In PlanningSystem.ts, modify generateDailyPlan()
async generateDailyPlan(context: PlanningContext): Promise<DailyPlan> {
  // ... existing generation code ...

  // Store in memory
  await this.storePlanInMemory(dailyPlan);

  return dailyPlan;
}

private async storePlanInMemory(plan: DailyPlan): Promise<void> {
  const memoryId = this.memoryStream.storeDailyPlan(plan);

  // Store hourly plans as well
  for (const hourlyPlan of plan.hourlyPlans) {
    this.memoryStream.storeHourlyPlan(hourlyPlan, plan.id);
  }

  console.log(`📋 Plan stored in memory (ID: ${memoryId})`);
}
```

#### Testing Checkpoint
- [ ] Plans stored in MemoryStream
- [ ] Plan memories retrievable by type
- [ ] Metadata preserved correctly
- [ ] getActivePlans returns current plans

---

### **DAY 7: Re-planning Logic**
**Duration**: 6-8 hours
**Goal**: Implement comprehensive re-planning triggers and logic

#### Tasks

**1. Enhance PlanningSystem re-planning methods (~150 lines)**

Add to `src/systems/PlanningSystem.ts`:

```typescript
/**
 * Monitor for events that should trigger re-planning
 */
monitorForReplanning(context: PlanningContext): string | null {
  // Critical survival needs
  if (context.survivalState.hunger < 20) {
    return 'Critical hunger level detected';
  }
  if (context.survivalState.thirst < 15) {
    return 'Critical thirst level detected';
  }
  if (context.survivalState.energy < 10) {
    return 'Critical energy level detected';
  }

  // Unexpected high-value discovery
  const nearbyItems = context.knownItems.filter(item =>
    this.isNearby(item.position, context.currentPosition)
  );
  if (nearbyItems.length > 3 && this.currentDailyPlan?.goal.includes('explore')) {
    return 'Multiple items discovered, should gather before continuing exploration';
  }

  // Exit found (if exists in maze)
  if (this.exitDetected(context)) {
    return 'Exit detected nearby';
  }

  // Plan completion
  if (this.currentDailyPlan?.status === PlanStatus.COMPLETED) {
    return 'Daily plan completed';
  }

  // Significant time divergence
  if (this.hasSignificantDivergence(context)) {
    return 'Plan execution significantly diverged from expected';
  }

  return null;
}

/**
 * Detect significant divergence from plan
 */
private hasSignificantDivergence(context: PlanningContext): boolean {
  if (!this.currentActionPlan) return false;

  // Check position divergence
  if (this.currentActionPlan.targetPosition) {
    const distance = this.getDistance(
      context.currentPosition,
      this.currentActionPlan.targetPosition
    );

    // If we're getting further from target instead of closer
    if (distance > this.lastDistanceToTarget * 1.5) {
      return true;
    }

    this.lastDistanceToTarget = distance;
  }

  // Check if action became impossible
  if (this.currentActionPlan.actionType === ActionType.CONSUME_ITEM) {
    const itemNearby = this.checkItemNearby(context);
    if (!itemNearby) return true;
  }

  // Check if been stuck on same action too long
  if (this.currentActionPlan.status === PlanStatus.IN_PROGRESS) {
    const timeSinceStart = context.gameTime - this.currentActionPlan.startTime;
    if (timeSinceStart > this.currentActionPlan.duration * 3) {
      return true; // 3x expected duration
    }
  }

  return false;
}

/**
 * Helper: Check if position is nearby
 */
private isNearby(pos1: Position, pos2: Position, maxDistance: number = 5): boolean {
  const distance = Math.abs(pos1.x - pos2.x) + Math.abs(pos1.y - pos2.y);
  return distance <= maxDistance;
}

/**
 * Helper: Calculate Manhattan distance
 */
private getDistance(pos1: Position, pos2: Position): number {
  return Math.abs(pos1.x - pos2.x) + Math.abs(pos1.y - pos2.y);
}

/**
 * Helper: Check if exit detected
 */
private exitDetected(context: PlanningContext): boolean {
  // Check if exit tile is in visible range
  // This depends on fog of war system
  // For now, return false (can be enhanced later)
  return false;
}

/**
 * Helper: Check if item nearby
 */
private checkItemNearby(context: PlanningContext): boolean {
  const nearbyItems = context.knownItems.filter(item =>
    this.isNearby(item.position, context.currentPosition, 2)
  );
  return nearbyItems.length > 0;
}
```

#### Testing Checkpoint
- [ ] Re-planning triggers detect correctly
- [ ] Divergence detection works
- [ ] Critical needs trigger re-plan
- [ ] Plan completion triggers new plan

---

### **DAY 8: UI - Planning Panel Creation**
**Duration**: 8-10 hours
**Goal**: Create comprehensive planning visualization UI

#### Tasks

**1. Create `src/ui/PlanningPanel.ts` (~400 lines)**

Full implementation in the file. Key components:

```typescript
import { Graphics, Text, Container } from 'pixi.js';
import { Agent } from '../agent/Agent';
import { DailyPlan, HourlyPlan, ActionPlan, PlanStatus } from '../types/planning';

export class PlanningPanel {
  private container: Container;
  private agent: Agent;
  private visible: boolean = false;

  // UI elements
  private panelBg!: Graphics;
  private titleText!: Text;
  private dailyGoalText!: Text;
  private hourlyObjectiveText!: Text;
  private actionTexts: Text[] = [];
  private progressBar!: Graphics;
  private progressFill!: Graphics;
  private statusText!: Text;

  // Configuration
  private panelWidth = 320;
  private panelHeight = 280;
  private padding = 16;

  constructor(container: Container, agent: Agent) {
    this.container = new Container();
    this.agent = agent;
    container.addChild(this.container);
    this.container.visible = false;
  }

  async init(): Promise<void> {
    console.log('📋 Initializing Planning Panel...');
    this.createBackground();
    this.createTitle();
    this.createPlanDisplay();
    this.createProgressBar();
    this.createStatusIndicator();
    console.log('✅ Planning Panel initialized');
  }

  private createBackground(): void {
    this.panelBg = new Graphics();
    this.panelBg.beginFill(0x000000, 0.8);
    this.panelBg.drawRoundedRect(0, 0, this.panelWidth, this.panelHeight, 8);
    this.panelBg.endFill();
    this.panelBg.lineStyle(2, 0x4CAF50, 0.8);
    this.panelBg.drawRoundedRect(0, 0, this.panelWidth, this.panelHeight, 8);
    this.container.addChild(this.panelBg);
  }

  private createTitle(): void {
    this.titleText = new Text('PLANNING SYSTEM', {
      fontFamily: 'monospace',
      fontSize: 12,
      fontWeight: 'bold',
      fill: 0x4CAF50,
    });
    this.titleText.x = this.padding;
    this.titleText.y = this.padding;
    this.container.addChild(this.titleText);
  }

  private createPlanDisplay(): void {
    // Daily goal
    this.dailyGoalText = new Text('Goal: --', {
      fontFamily: 'monospace',
      fontSize: 10,
      fill: 0xffffff,
    });
    this.dailyGoalText.x = this.padding;
    this.dailyGoalText.y = 40;
    this.container.addChild(this.dailyGoalText);

    // Hourly objective
    this.hourlyObjectiveText = new Text('Now: --', {
      fontFamily: 'monospace',
      fontSize: 10,
      fill: 0xcccccc,
    });
    this.hourlyObjectiveText.x = this.padding;
    this.hourlyObjectiveText.y = 65;
    this.container.addChild(this.hourlyObjectiveText);
  }

  private createProgressBar(): void {
    const y = this.panelHeight - 50;

    // Background
    this.progressBar = new Graphics();
    this.progressBar.beginFill(0x333333, 0.8);
    this.progressBar.drawRect(this.padding, y, this.panelWidth - this.padding * 2, 18);
    this.progressBar.endFill();
    this.container.addChild(this.progressBar);

    // Fill
    this.progressFill = new Graphics();
    this.container.addChild(this.progressFill);
  }

  private createStatusIndicator(): void {
    this.statusText = new Text('Status: Inactive', {
      fontFamily: 'monospace',
      fontSize: 10,
      fill: 0x888888,
    });
    this.statusText.x = this.padding;
    this.statusText.y = this.panelHeight - 25;
    this.container.addChild(this.statusText);
  }

  update(_deltaTime: number, gameTime: number): void {
    if (!this.visible) return;

    const plan = this.agent.getCurrentPlan();
    if (!plan) {
      this.showNoPlanMessage();
      return;
    }

    // Update displays
    this.dailyGoalText.text = `Goal: ${this.truncate(plan.goal, 40)}`;

    const currentHourly = this.getCurrentHourlyPlan(plan, gameTime);
    if (currentHourly) {
      this.hourlyObjectiveText.text = `Now: ${this.truncate(currentHourly.objective, 35)}`;
      this.updateActionList(currentHourly, gameTime);
    }

    this.updateProgressBar(plan, gameTime);
    this.updateStatus(plan);
  }

  private updateActionList(hourlyPlan: HourlyPlan | null, gameTime: number): void {
    this.actionTexts.forEach(t => t.destroy());
    this.actionTexts = [];

    if (!hourlyPlan) return;

    const startY = 100;
    const lineHeight = 18;
    const upcomingActions = hourlyPlan.actions
      .filter(a => a.startTime >= gameTime)
      .slice(0, 4);

    upcomingActions.forEach((action, i) => {
      const prefix = i === 0 ? '▶' : '  ';
      const text = new Text(`${prefix} ${this.truncate(action.action, 32)}`, {
        fontFamily: 'monospace',
        fontSize: 10,
        fill: i === 0 ? 0x4CAF50 : 0xcccccc
      });
      text.x = this.padding;
      text.y = startY + i * lineHeight;
      this.container.addChild(text);
      this.actionTexts.push(text);
    });
  }

  private updateProgressBar(plan: DailyPlan, _gameTime: number): void {
    const totalActions = plan.hourlyPlans.reduce((sum, hp) => sum + hp.actions.length, 0);
    const completedActions = plan.hourlyPlans.reduce(
      (sum, hp) => sum + hp.actions.filter(a => a.status === PlanStatus.COMPLETED).length,
      0
    );

    const progress = totalActions > 0 ? completedActions / totalActions : 0;
    const y = this.panelHeight - 50;

    this.progressFill.clear();
    this.progressFill.beginFill(0x4CAF50, 0.8);
    this.progressFill.drawRect(
      this.padding + 2,
      y + 2,
      (this.panelWidth - this.padding * 2 - 4) * progress,
      14
    );
    this.progressFill.endFill();
  }

  private updateStatus(plan: DailyPlan): void {
    const statusMap = {
      [PlanStatus.PENDING]: { text: 'Pending', color: 0xffa500 },
      [PlanStatus.IN_PROGRESS]: { text: 'Active ✓', color: 0x4CAF50 },
      [PlanStatus.COMPLETED]: { text: 'Completed', color: 0x00ff00 },
      [PlanStatus.ABANDONED]: { text: 'Abandoned', color: 0xff0000 },
      [PlanStatus.FAILED]: { text: 'Failed', color: 0xff0000 }
    };

    const status = statusMap[plan.status] || statusMap[PlanStatus.PENDING];
    this.statusText.text = `Status: ${status.text}`;
    this.statusText.style.fill = status.color;
  }

  private showNoPlanMessage(): void {
    this.dailyGoalText.text = 'Goal: No active plan';
    this.hourlyObjectiveText.text = 'Now: --';
  }

  private getCurrentHourlyPlan(plan: DailyPlan, gameTime: number): HourlyPlan | null {
    for (const hp of plan.hourlyPlans) {
      if (gameTime >= hp.startTime && gameTime < hp.startTime + hp.duration) {
        return hp;
      }
    }
    return null;
  }

  private truncate(text: string, maxLength: number): string {
    return text.length > maxLength ? text.substring(0, maxLength - 3) + '...' : text;
  }

  toggle(): void {
    this.visible = !this.visible;
    this.container.visible = this.visible;
    console.log(`📋 Planning Panel: ${this.visible ? 'visible' : 'hidden'}`);
  }

  setPosition(x: number, y: number): void {
    this.container.x = x;
    this.container.y = y;
  }

  isVisible(): boolean {
    return this.visible;
  }

  getHeight(): number {
    return this.panelHeight;
  }

  getWidth(): number {
    return this.panelWidth;
  }

  destroy(): void {
    this.container.destroy({ children: true });
  }
}
```

#### Testing Checkpoint
- [ ] Panel renders correctly
- [ ] Daily goal displays
- [ ] Hourly objectives show
- [ ] Action list updates
- [ ] Progress bar animates
- [ ] Toggle works

---

### **DAY 9: UI Integration**
**Duration**: 4-6 hours
**Goal**: Integrate PlanningPanel into UIManager

#### Tasks

**1. Modify `src/ui/UIManager.ts` (+50 lines)**

```typescript
// Add import
import { PlanningPanel } from './PlanningPanel';

// Add property
private planningPanel!: PlanningPanel;

// In async init()
this.planningPanel = new PlanningPanel(this.uiContainer, this.agent);
await this.planningPanel.init();
console.log('✅ Planning panel initialized');

// In positionUIElements()
const planningX = padding;
const planningY = this.screenHeight -
                 this.survivalPanel.getHeight() -
                 this.planningPanel.getHeight() -
                 padding * 2;
this.planningPanel.setPosition(planningX, planningY);

// In setupKeyboardControls()
case 'p':
case 'P':
  this.planningPanel.toggle();
  break;

// In update()
if (this.planningPanel.isVisible()) {
  this.planningPanel.update(deltaTime, gameTime);
}

// Update console.log for controls
console.log('   UI keyboard controls registered (...P: planning, ...)');
```

#### Testing Checkpoint
- [ ] Panel appears in correct position
- [ ] P key toggles visibility
- [ ] Panel updates in real-time
- [ ] No performance impact

---

### **DAY 10: Game Integration and Testing**
**Duration**: 6-8 hours
**Goal**: Integrate planning into main game loop and test end-to-end

#### Tasks

**1. Modify `src/core/Game.ts` (+60 lines)**

```typescript
// In async initAgent() - after agent initialization
if (this.agent) {
  await this.agent.initializePlan(this.gameTime);
  console.log('📋 Initial daily plan created');
}

// In update() method - after agent update
if (this.agent && this.agent.getPlanningSystem()) {
  const context = this.agent.getPlanningContext();
  context.gameTime = this.gameTime;

  const replanReason = this.agent.getPlanningSystem().monitorForReplanning(context);
  if (replanReason) {
    console.log(`🔄 Re-planning: ${replanReason}`);
    await this.agent.replan(replanReason, this.gameTime);
  }
}
```

**2. End-to-end testing protocol**:

1. Start game
2. Observe plan generation (should see console logs)
3. Press P to view planning panel
4. Watch agent follow first action
5. Verify action completes and next begins
6. Deplete hunger to <20 by waiting
7. Verify re-planning triggered
8. Observe new survival-focused plan
9. Let plan complete naturally
10. Verify new plan generated

#### Testing Checkpoint
- [ ] Plans generate on game start
- [ ] Agent follows plans autonomously
- [ ] Re-planning triggers work
- [ ] UI shows correct state
- [ ] No errors or crashes

---

### **DAY 11: LLM Integration, Testing & Polish**
**Duration**: 8-10 hours
**Goal**: Replace mocks with real LLM calls, comprehensive testing

#### Tasks

**1. Replace mock LLM calls in PlanningSystem**

```typescript
// In generateDailyPlan()
const prompt = buildDailyPlanPrompt(context);
const response = await this.llmService.generateText(prompt, {
  temperature: 0.7,
  maxTokens: 300
});
const dailyPlan = this.parseDailyPlan(response, context);

// In generateHourlyPlan()
const prompt = buildHourlyPlanPrompt(dailyPlan.goal, hour, context);
const response = await this.llmService.generateText(prompt, {
  temperature: 0.7,
  maxTokens: 200
});
const hourlyPlan = this.parseHourlyPlan(response, dailyPlan, hour);

// In generateActionPlan()
const prompt = buildActionPlanPrompt(
  hourlyPlan.objective,
  dailyPlan.goal,
  context,
  { start: startTime, end: endTime }
);
const response = await this.llmService.generateText(prompt, {
  temperature: 0.7,
  maxTokens: 150
});
const actionPlan = this.parseActionPlan(response, hourlyPlan, actionIndex);
```

**2. Add error handling**

```typescript
try {
  const response = await this.llmService.generateText(prompt);
  return this.parseDailyPlan(response, context);
} catch (error) {
  console.error('❌ Failed to generate plan:', error);
  return this.generateFallbackPlan(context);
}

private generateFallbackPlan(context: PlanningContext): DailyPlan {
  // Simple heuristic plan based on survival state
  let goal = 'Survive and explore the maze';
  let priority = PlanPriority.MEDIUM;

  if (context.survivalState.hunger < 30) {
    goal = 'Find food to restore hunger';
    priority = PlanPriority.CRITICAL;
  } else if (context.survivalState.thirst < 30) {
    goal = 'Find water to restore thirst';
    priority = PlanPriority.CRITICAL;
  }

  return {
    id: uuidv4(),
    createdAt: Date.now(),
    goal,
    reasoning: 'Fallback plan due to LLM failure',
    priority,
    hourlyPlans: [],
    status: PlanStatus.PENDING
  };
}
```

**3. Create configuration file**

Create `src/config/planning.config.ts`:

```typescript
export const PLANNING_CONFIG = {
  // Plan generation
  dailyPlanHorizon: 24 * 3600,     // 24 hours in seconds
  hourlyPlanCount: 3,               // Generate 3 hours ahead
  actionDuration: 5 * 60,           // 5 minutes per action

  // Re-planning triggers
  criticalHungerThreshold: 20,
  criticalThirstThreshold: 15,
  criticalEnergyThreshold: 10,
  divergenceThreshold: 1.5,         // 50% worse than expected

  // LLM parameters
  planningTemperature: 0.7,
  planningMaxTokens: 300,

  // Performance
  planCacheEnabled: true,
  planCacheDuration: 300,           // 5 minutes

  // UI
  maxDisplayedActions: 4,
  truncateLength: 40
};
```

**4. Comprehensive testing**

- Unit tests for PlanningSystem methods
- Integration tests for Agent + Planning
- UI tests for PlanningPanel
- Performance tests (plan generation <5s, 60 FPS)
- Cost tests (<$0.05 per daily plan)

**5. Performance optimization**

- Profile plan generation time
- Optimize prompt templates
- Cache plan results where possible
- Minimize unnecessary re-planning

**6. Documentation**

- Add JSDoc comments to all methods
- Update README with planning features
- Create developer guide for extending planning

#### Testing Checkpoint
- [ ] Real LLM calls work correctly
- [ ] Plans are coherent and sensible
- [ ] Performance acceptable (<5s for plan generation)
- [ ] LLM costs reasonable (<$0.05 per daily plan)
- [ ] All error cases handled
- [ ] No memory leaks
- [ ] 60 FPS maintained

---

## Files to Create

### 1. `src/types/planning.ts` (~220 lines)
- All planning-related type definitions
- Enums, interfaces for hierarchical plans
- Planning context interface

### 2. `src/systems/PlanningSystem.ts` (~800 lines)
- Core planning logic
- Plan generation, decomposition, execution
- Re-planning triggers and logic
- Memory storage integration

### 3. `src/config/planning.prompts.ts` (~350 lines)
- LLM prompt templates
- Prompt building functions
- Response parsing logic

### 4. `src/ui/PlanningPanel.ts` (~400 lines)
- PixiJS-based visualization
- Real-time plan display
- Progress tracking

---

## Files to Modify

### 1. `src/agent/Agent.ts` (+100 lines)
- Add PlanningSystem property
- Add planning context generation
- Add plan accessors and control methods

### 2. `src/agent/DecisionMaker.ts` (+150 lines)
- Restructure decision priority
- Add plan execution logic
- Handle all ActionType cases

### 3. `src/agent/MemoryStream.ts` (+60 lines)
- Add plan storage methods
- Add plan retrieval methods
- Add importance calculation

### 4. `src/ui/UIManager.ts` (+50 lines)
- Add PlanningPanel integration
- Position and update panel
- Add keyboard toggle

### 5. `src/core/Game.ts` (+60 lines)
- Initialize plans on game start
- Monitor for re-planning triggers
- Wire to main game loop

---

## Testing Strategy

### Unit Tests

Create test files:
- `tests/PlanningSystem.test.ts`
- `tests/PlanningPrompts.test.ts`
- `tests/PlanningPanel.test.ts`

Key test cases:
1. Daily plan generation with various contexts
2. Hourly decomposition creates 3 plans
3. Action decomposition creates 12 actions
4. getCurrentAction returns correct action
5. Re-planning triggers on critical needs
6. Plan completion tracking
7. Memory storage and retrieval
8. UI rendering without errors

### Integration Tests

1. **Full Planning Cycle**: Generate → Decompose → Execute → Complete
2. **Re-planning Scenarios**: Trigger each condition, verify new plan
3. **Decision Flow**: Plan overrides reactive, survival overrides plan

### Manual Testing Protocol

1. Start game with fresh state
2. Observe initial plan generation (5-10s)
3. Press P to view planning panel
4. Watch agent follow first action
5. Verify action completes and next begins
6. Deplete hunger to <20
7. Verify re-planning triggered
8. Observe new survival-focused plan
9. Let plan complete naturally
10. Verify new plan generated

---

## Success Criteria

### Functional Requirements
- [ ] Agent generates daily plans on initialization
- [ ] Daily plans decompose into 3 hourly plans
- [ ] Hourly plans decompose into 12 action plans
- [ ] Agent follows action plans in sequence
- [ ] Plans stored in MemoryStream with metadata
- [ ] Re-planning triggers on critical needs
- [ ] Re-planning triggers on plan completion
- [ ] Re-planning triggers on divergence
- [ ] DecisionMaker checks plans before reactive decisions
- [ ] Survival needs override plans
- [ ] Planning UI displays current plan
- [ ] Planning UI shows progress
- [ ] Planning UI toggles with P key

### Quality Requirements
- [ ] Plan generation <5 seconds
- [ ] LLM cost <$0.05 per daily plan
- [ ] No TypeScript errors
- [ ] No runtime errors
- [ ] 60 FPS maintained
- [ ] No memory leaks
- [ ] Plans are coherent and contextually appropriate
- [ ] Plans adapt to survival state
- [ ] Plans leverage past memories

### Paper Alignment
- [ ] Planning component: 15% → 85%
- [ ] Overall project: 65% → 78%

---

## Risk Mitigation

### Challenge 1: LLM Response Parsing Fragility
**Problem**: LLM may not follow exact format
**Solution**:
- Flexible regex patterns
- Fallback parsing strategies
- Graceful degradation to heuristics
- Retry with clarified prompts

### Challenge 2: Plan-Reality Mismatch
**Problem**: Plans may be impossible to execute
**Solution**:
- Validate plans against maze structure
- Check item availability before planning
- Implement fallback actions
- Quick re-planning on impossibility

### Challenge 3: Performance Impact
**Problem**: LLM calls add latency
**Solution**:
- Generate plans asynchronously
- Cache plans aggressively
- Pre-generate next hour while executing current
- Use faster LLM models (Sonnet vs Opus)

### Challenge 4: Cost Management
**Problem**: Frequent re-planning expensive
**Solution**:
- Rate-limit re-planning (max 1 per 2 minutes)
- Only re-plan on significant triggers
- Use heuristics for minor adjustments
- Batch multiple checks before LLM call

### Challenge 5: UI Performance
**Problem**: Complex UI may drop FPS
**Solution**:
- Update UI at 10 FPS (not 60)
- Use sprite caching
- Minimize text recreations
- Hide panel when not in use

---

## Expected Behavioral Changes

### Before Week 5:
- Agent makes reactive decisions every 3 seconds
- Decisions independent of each other
- No long-term coherence
- Random exploration patterns

### After Week 5:
- Agent follows coherent multi-hour plans
- Actions build toward specific objectives
- Systematic exploration strategies
- Plans adapt to changing survival needs
- Progress tracked and visible

---

## Post-Implementation Tasks

1. **Documentation**:
   - Update README with planning features
   - Create WEEK5_COMPLETE.md
   - Document API for planning system
   - Add planning examples

2. **Optimization**:
   - Profile planning system
   - Identify bottlenecks
   - Optimize hot paths
   - Reduce LLM calls if possible

3. **Research Evaluation**:
   - Compare planned vs reactive strategies
   - Measure survival time improvements
   - Analyze plan quality metrics
   - Document findings

4. **Future Extensions**:
   - Collaborative planning (multi-agent)
   - Plan sharing via dialogue
   - Meta-planning (planning about planning)
   - Adaptive granularity

---

## Summary

This comprehensive 11-day implementation plan provides:
- **Clear daily objectives** with specific hour estimates
- **Detailed code examples** for every component
- **Testing checkpoints** at each stage
- **Risk mitigation strategies** for common challenges
- **Success criteria** for validation

The implementation follows a **bottom-up approach**: types → core system → integration → UI → testing → polish. Each day builds on the previous, with testing checkpoints to catch issues early.

**Total Code Impact**: ~2,190 lines (1,770 new, 420 modified)

**Expected Outcome**: Agent with goal-oriented, coherent behavior spanning hours and days, transforming from reactive to truly intelligent planning.
