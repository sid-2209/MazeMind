# Week 5 Implementation: Hierarchical Planning System

## Overview & Research Paper Alignment

### Connection to Paper (Park et al., 2023)
**Section 4.3: Planning and Reacting**

The Generative Agents paper describes planning as the third pillar of agent cognition (alongside Memory and Reflection). The planning system creates a **hierarchical tree of plans** that guide agent behavior:

> "Agents begin their day by creating a rough sketch of their day... These high-level plans are recursively decomposed into finer-grained actions."

**Current Implementation Gap**:
- ❌ No hierarchical planning (only reactive single-move decisions)
- ❌ Plans exist in MemoryStream structure but are never created
- ❌ No goal decomposition or plan execution tracking
- ❌ No re-planning mechanism for unexpected events

**Paper Alignment**: Currently 15% → Target 85% after Week 5

### Week 5 Objectives

1. ✅ Implement hierarchical plan generation (daily → hourly → 5-minute)
2. ✅ Store plans in MemoryStream with proper structure
3. ✅ Integrate planning with DecisionMaker for coherent behavior
4. ✅ Add plan re-planning on unexpected events
5. ✅ Create PlanningPanel UI for visualization
6. ✅ Enable long-term goal-oriented behavior

### Expected Outcomes

After Week 5, the agent will:
- Generate coherent daily plans based on current situation
- Decompose high-level goals into actionable steps
- Follow planned sequences rather than purely reactive decisions
- Adapt plans when environment changes
- Display current plan and progress in UI

---

## Architecture & Design

### System Overview

```
┌─────────────────────────────────────────────────────────────┐
│                         AGENT                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │ MemoryStream │  │ Reflection   │  │ Planning     │     │
│  │              │  │ System       │  │ System       │     │
│  │ - Obs        │  │              │  │              │     │
│  │ - Reflections│◄─┤ Synthesize   │◄─┤ Generate     │     │
│  │ - Plans      │  │ Insights     │  │ Plans        │     │
│  └──────┬───────┘  └──────────────┘  └──────┬───────┘     │
│         │                                    │              │
│         │        ┌──────────────┐           │              │
│         └───────►│ Decision     │◄──────────┘              │
│                  │ Maker        │                          │
│                  │              │                          │
│                  │ 1. Check Plan│                          │
│                  │ 2. Execute   │                          │
│                  │ 3. Fallback  │                          │
│                  └──────┬───────┘                          │
│                         │                                  │
│                         ▼                                  │
│                  ┌──────────────┐                          │
│                  │ Autonomous   │                          │
│                  │ Controller   │                          │
│                  └──────────────┘                          │
└─────────────────────────────────────────────────────────────┘
```

### Hierarchical Plan Structure

```
DailyPlan (24 hours)
├─ Goal: "Explore eastern section and find exit"
├─ HourlyPlan (Hour 1: 00:00-01:00)
│  ├─ Objective: "Map eastern corridors"
│  ├─ ActionPlan (00:00-00:05)
│  │  └─ Action: "Move east to unexplored area"
│  ├─ ActionPlan (00:05-00:10)
│  │  └─ Action: "Check for items while exploring"
│  └─ ActionPlan (00:10-00:15)
│     └─ Action: "Continue east if clear path"
├─ HourlyPlan (Hour 2: 01:00-02:00)
│  ├─ Objective: "Identify dead ends and mark them"
│  └─ ...
└─ HourlyPlan (Hour 3: 02:00-03:00)
   ├─ Objective: "Gather resources if found"
   └─ ...
```

### Data Flow

1. **Plan Generation Trigger**
   - Agent starts day (game initialization)
   - Previous plan completed
   - Major event causes re-planning

2. **Daily Plan Creation**
   - LLM generates high-level daily goal
   - Considers: memories, survival needs, exploration progress
   - Stored in MemoryStream as 'plan' type

3. **Hourly Decomposition**
   - Daily plan broken into 3-hour chunks
   - Each chunk has specific objective
   - Recursive LLM calls for decomposition

4. **5-Minute Actions**
   - Hourly objectives → specific actions
   - Granular enough for execution
   - Current action tracked

5. **Plan Execution**
   - DecisionMaker checks current plan
   - Executes next action if available
   - Falls back to reactive if no plan

6. **Re-planning**
   - Monitors plan divergence
   - Triggers on: critical needs, unexpected items, danger
   - Preserves completed portions, regenerates rest

---

## Implementation Details

### Phase 1: Core Planning System (Days 1-3)

#### File 1: `src/types/planning.ts` (NEW - ~200 lines)

```typescript
/**
 * Planning Types - Hierarchical plan structures
 */

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

#### File 2: `src/systems/PlanningSystem.ts` (NEW - ~500 lines)

**Key Methods**:

```typescript
export class PlanningSystem {
  private agent: Agent;
  private llmService: LLMService;
  private currentDailyPlan: DailyPlan | null = null;
  private currentHourlyPlan: HourlyPlan | null = null;
  private currentActionPlan: ActionPlan | null = null;

  /**
   * Generate new daily plan
   */
  async generateDailyPlan(context: PlanningContext): Promise<DailyPlan> {
    // 1. Build prompt for daily planning
    const prompt = this.buildDailyPlanPrompt(context);

    // 2. Get LLM response
    const response = await this.llmService.generateText(prompt);

    // 3. Parse into DailyPlan structure
    const dailyPlan = this.parseDailyPlan(response, context);

    // 4. Store in memory stream
    await this.storePlanInMemory(dailyPlan);

    // 5. Set as current
    this.currentDailyPlan = dailyPlan;

    console.log(`📋 Daily plan created: "${dailyPlan.goal}"`);
    return dailyPlan;
  }

  /**
   * Decompose daily plan into hourly chunks (recursive)
   */
  async decomposeIntoHourlyPlans(dailyPlan: DailyPlan): Promise<void> {
    // Generate next 3 hours of detailed plans
    for (let hour = 0; hour < 3; hour++) {
      const hourlyPlan = await this.generateHourlyPlan(
        dailyPlan,
        hour,
        this.getCurrentContext()
      );

      dailyPlan.hourlyPlans.push(hourlyPlan);
    }
  }

  /**
   * Decompose hourly plan into 5-minute actions
   */
  async decomposeIntoActions(hourlyPlan: HourlyPlan): Promise<void> {
    // 1 hour = 12 five-minute chunks
    const numActions = 12;

    for (let i = 0; i < numActions; i++) {
      const actionPlan = await this.generateActionPlan(
        hourlyPlan,
        i,
        this.getCurrentContext()
      );

      hourlyPlan.actions.push(actionPlan);
    }
  }

  /**
   * Get current action to execute
   */
  getCurrentAction(gameTime: number): ActionPlan | null {
    if (!this.currentDailyPlan) return null;

    // Find active hourly plan
    const hourlyPlan = this.findActiveHourlyPlan(gameTime);
    if (!hourlyPlan) return null;

    // Find active action
    const action = this.findActiveAction(hourlyPlan, gameTime);
    return action;
  }

  /**
   * Check if plan needs regeneration
   */
  shouldReplan(context: PlanningContext): boolean {
    // Critical survival need
    if (this.hasCriticalNeed(context.survivalState)) {
      return true;
    }

    // Plan completed
    if (this.currentDailyPlan?.status === PlanStatus.COMPLETED) {
      return true;
    }

    // Major divergence from plan
    if (this.hasSignificantDivergence(context)) {
      return true;
    }

    return false;
  }

  /**
   * Re-plan from current point
   */
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

  /**
   * Mark action as completed
   */
  completeAction(actionId: string): void {
    const action = this.findActionById(actionId);
    if (action) {
      action.status = PlanStatus.COMPLETED;
      action.completedAt = Date.now();

      console.log(`✓ Completed: ${action.action}`);
    }
  }
}
```

#### File 3: `src/config/planning.prompts.ts` (NEW - ~300 lines)

**Daily Plan Prompt**:

```typescript
export const DAILY_PLANNING_PROMPT = `You are planning a full day for an agent named Arth who is trapped in a maze.

AGENT'S SITUATION:
- Trapped in a maze, trying to find the exit
- Must manage survival resources (hunger, thirst, energy)
- Can explore, collect items (food, water, energy drinks), and search for exit
- Has memory of past experiences and reflections

CURRENT STATE:
{current_state}

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
{current_state}

What specific objective should the agent accomplish in this hour to work toward the daily goal?

Respond with:
OBJECTIVE: [Specific, actionable objective for this hour]

Example:
OBJECTIVE: Map the eastern corridor by exploring all branches and noting dead ends`;

export const ACTION_PLANNING_PROMPT = `Break down this hourly objective into a specific 5-minute action.

HOURLY OBJECTIVE: {hourly_objective}
DAILY GOAL: {daily_goal}

CURRENT POSITION: {position}
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
```

### Phase 2: Integration with Agent (Days 4-5)

#### Modify: `src/agent/Agent.ts`

**Add PlanningSystem**:

```typescript
import { PlanningSystem } from '../systems/PlanningSystem';
import { PlanningContext, DailyPlan, ActionPlan } from '../types/planning';

export class Agent {
  // ... existing properties ...
  private planningSystem!: PlanningSystem;

  constructor(maze: Maze, startPosition: Position) {
    // ... existing initialization ...

    // Initialize planning system (after memory and reflection)
    this.planningSystem = new PlanningSystem(
      this,
      this.llmService,
      this.memoryStream
    );
  }

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
}
```

#### Modify: `src/agent/DecisionMaker.ts`

**Integrate Planning into Decision Flow**:

```typescript
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

/**
 * Execute action from plan
 */
private async executePlannedAction(action: ActionPlan): Promise<Decision | null> {
  switch (action.actionType) {
    case ActionType.MOVE:
    case ActionType.EXPLORE:
      if (action.targetPosition) {
        return await this.moveTowardPosition(action.targetPosition);
      }
      break;

    case ActionType.SEEK_ITEM:
      if (action.targetItem) {
        return await this.seekItemType(action.targetItem);
      }
      break;

    case ActionType.CONSUME_ITEM:
      return this.tryConsumeNearbyItem();

    case ActionType.REST:
    case ActionType.WAIT:
      return { action: 'wait', reasoning: action.action };

    case ActionType.REFLECT:
      // Trigger reflection
      await this.agent.getReflectionSystem().generateReflections();
      return { action: 'wait', reasoning: 'Reflecting on experiences' };
  }

  return null;
}
```

#### Modify: `src/agent/MemoryStream.ts`

**Enhanced Plan Storage**:

```typescript
/**
 * Store plan in memory with hierarchical structure
 */
storePlan(plan: DailyPlan): string {
  const memory: Memory = {
    id: uuidv4(),
    type: 'plan',
    content: `Daily Plan: ${plan.goal}`,
    timestamp: Date.now(),
    importance: this.calculatePlanImportance(plan),
    location: this.agent.getTilePosition(),
    tags: ['plan', 'daily', `priority_${plan.priority}`],
    metadata: {
      planId: plan.id,
      planType: 'daily',
      goal: plan.goal,
      reasoning: plan.reasoning,
      priority: plan.priority,
      hourlyPlansCount: plan.hourlyPlans.length
    },
    citations: [], // Will link to hourly plans
    embedding: undefined
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
    m.metadata?.status !== PlanStatus.COMPLETED &&
    m.metadata?.status !== PlanStatus.ABANDONED
  );
}

/**
 * Calculate plan importance based on priority and survival needs
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

### Phase 3: Plan Re-planning & Adaptation (Days 6-7)

**Implement in PlanningSystem.ts**:

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

  // Exit found
  if (this.exitDetected(context)) {
    return 'Exit detected nearby';
  }

  // Plan completion
  if (this.currentDailyPlan?.status === PlanStatus.COMPLETED) {
    return 'Daily plan completed';
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
  }

  // Check if action became impossible (e.g., planned to consume item but it's gone)
  if (this.currentActionPlan.actionType === ActionType.CONSUME_ITEM) {
    const itemNearby = this.checkItemNearby(context);
    if (!itemNearby) return true;
  }

  return false;
}
```

### Phase 4: UI & Visualization (Days 8-9)

#### File 4: `src/ui/PlanningPanel.ts` (NEW - ~350 lines)

```typescript
/**
 * Planning Panel - Display current plans and progress (Week 5)
 *
 * Shows:
 * - Daily goal
 * - Current hourly objective
 * - Next 3-4 upcoming actions
 * - Plan progress bar
 * - Re-planning indicator
 */

import { Graphics, Text, Container } from 'pixi.js';
import { Agent } from '../agent/Agent';
import { DailyPlan, HourlyPlan, ActionPlan, PlanStatus } from '../types/planning';

export class PlanningPanel {
  private container: Container;
  private agent: Agent;
  private visible: boolean = false; // Hidden by default

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

    // Start hidden
    this.container.visible = false;
  }

  /**
   * Initialize panel
   */
  async init(): Promise<void> {
    console.log('📋 Initializing Planning Panel...');

    this.createBackground();
    this.createTitle();
    this.createPlanDisplay();
    this.createProgressBar();
    this.createStatusIndicator();

    console.log('✅ Planning Panel initialized');
  }

  /**
   * Update panel (called every frame)
   */
  update(deltaTime: number, gameTime: number): void {
    if (!this.visible) return;

    const plan = this.agent.getCurrentPlan();

    if (!plan) {
      this.showNoPlanMessage();
      return;
    }

    // Update daily goal
    this.dailyGoalText.text = `Goal: ${this.truncate(plan.goal, 40)}`;

    // Update hourly objective
    const currentHourly = this.getCurrentHourlyPlan(plan, gameTime);
    if (currentHourly) {
      this.hourlyObjectiveText.text = `Now: ${this.truncate(currentHourly.objective, 35)}`;
    }

    // Update upcoming actions
    this.updateActionList(currentHourly, gameTime);

    // Update progress
    this.updateProgressBar(plan, gameTime);

    // Update status
    this.updateStatus(plan);
  }

  /**
   * Update action list
   */
  private updateActionList(hourlyPlan: HourlyPlan | null, gameTime: number): void {
    // Clear old texts
    this.actionTexts.forEach(t => t.destroy());
    this.actionTexts = [];

    if (!hourlyPlan) return;

    const startY = 120;
    const lineHeight = 18;

    // Show next 4 actions
    const upcomingActions = hourlyPlan.actions
      .filter(a => a.startTime >= gameTime)
      .slice(0, 4);

    upcomingActions.forEach((action, i) => {
      const minutes = Math.floor((action.startTime - gameTime) / 60);
      const prefix = i === 0 ? '▶' : '  ';
      const text = new Text(
        `${prefix} ${this.truncate(action.action, 32)}`,
        {
          fontFamily: 'monospace',
          fontSize: 10,
          fill: i === 0 ? 0x4CAF50 : 0xcccccc
        }
      );
      text.x = this.padding;
      text.y = startY + i * lineHeight;
      this.container.addChild(text);
      this.actionTexts.push(text);
    });
  }

  /**
   * Update progress bar
   */
  private updateProgressBar(plan: DailyPlan, gameTime: number): void {
    const totalActions = plan.hourlyPlans.reduce(
      (sum, hp) => sum + hp.actions.length,
      0
    );

    const completedActions = plan.hourlyPlans.reduce(
      (sum, hp) => sum + hp.actions.filter(
        a => a.status === PlanStatus.COMPLETED
      ).length,
      0
    );

    const progress = totalActions > 0 ? completedActions / totalActions : 0;

    // Update fill
    this.progressFill.clear();
    this.progressFill.beginFill(0x4CAF50, 0.8);
    this.progressFill.drawRect(
      this.padding + 2,
      this.panelHeight - 52,
      (this.panelWidth - this.padding * 2 - 4) * progress,
      16
    );
    this.progressFill.endFill();
  }

  /**
   * Show/hide panel
   */
  toggle(): void {
    this.visible = !this.visible;
    this.container.visible = this.visible;
    console.log(`📋 Planning Panel: ${this.visible ? 'visible' : 'hidden'}`);
  }

  // ... other helper methods ...
}
```

#### Modify: `src/ui/UIManager.ts`

```typescript
import { PlanningPanel } from './PlanningPanel'; // Week 5

export class UIManager {
  // ... existing properties ...
  private planningPanel!: PlanningPanel; // Week 5

  async init(): Promise<void> {
    // ... existing panels ...

    // Create planning panel (Week 5)
    this.planningPanel = new PlanningPanel(this.uiContainer, this.agent);
    await this.planningPanel.init();

    // Position panels
    this.positionUIElements();

    // Setup keyboard
    this.setupKeyboardControls();
  }

  private positionUIElements(): void {
    // ... existing positioning ...

    // Planning Panel - Left Center (below survival panel)
    const planningX = padding;
    const planningY = this.screenHeight - this.survivalPanel.getHeight() -
                      this.planningPanel.getHeight() - padding * 2;
    this.planningPanel.setPosition(planningX, planningY);
  }

  private setupKeyboardControls(): void {
    this.keyboardListener = (e: KeyboardEvent) => {
      switch (e.key.toLowerCase()) {
        // ... existing keys ...

        case 'p':
          // Toggle planning panel (Week 5)
          this.planningPanel.toggle();
          break;
      }
    };

    console.log('   UI keyboard controls registered (...P: planning, ...)');
  }

  update(deltaTime: number, gameTime: number = 0): void {
    // ... existing updates ...

    // Update planning panel (Week 5)
    if (this.planningPanel.isVisible()) {
      this.planningPanel.update(deltaTime, gameTime);
    }
  }
}
```

### Phase 5: Game Integration (Day 10)

#### Modify: `src/core/Game.ts`

```typescript
private async initAgent(): Promise<void> {
  // ... existing agent initialization ...

  // Initialize daily plan (Week 5)
  if (this.agent) {
    await this.agent.initializePlan(this.gameTime);
    console.log('📋 Initial daily plan created');
  }
}

private update(deltaTime: number): void {
  // ... existing updates ...

  // Check for re-planning triggers (Week 5)
  if (this.agent && this.agent.getPlanningSystem()) {
    const context = this.agent.getPlanningContext();
    context.gameTime = this.gameTime;

    const replanReason = this.agent.getPlanningSystem().monitorForReplanning(context);
    if (replanReason) {
      this.agent.replan(replanReason, this.gameTime);
    }
  }
}
```

---

## Testing Strategy

### Unit Tests

1. **PlanningSystem.ts**
   - ✅ Daily plan generation with various contexts
   - ✅ Hourly decomposition creates 3 hourly plans
   - ✅ Action decomposition creates 12 actions per hour
   - ✅ getCurrentAction returns correct action for given time
   - ✅ Re-planning triggers on critical needs
   - ✅ Plan completion tracking

2. **DecisionMaker.ts Integration**
   - ✅ Plans override reactive decisions
   - ✅ Critical survival overrides plan
   - ✅ Fallback to reactive when no plan
   - ✅ Plan actions execute correctly

3. **MemoryStream.ts**
   - ✅ Plans stored with correct structure
   - ✅ Plan retrieval by status
   - ✅ Hierarchical plan linking

### Integration Tests

1. **Full Planning Cycle**
   - Generate daily plan
   - Decompose into hourly plans
   - Decompose first hour into actions
   - Execute first 3 actions
   - Verify completion tracking

2. **Re-planning Scenarios**
   - Critical hunger triggers re-plan
   - Item discovery triggers re-plan
   - Plan completion triggers new plan
   - Re-plan preserves context

3. **UI Display**
   - Planning panel shows current plan
   - Progress bar updates correctly
   - Action list updates in real-time
   - Toggle works properly

### Success Criteria

✅ Agent generates coherent daily plans
✅ Plans decompose into 3-level hierarchy
✅ Agent follows plan execution
✅ Re-planning works on triggers
✅ Plans stored in memory
✅ UI displays plan correctly
✅ Performance: <100ms for plan generation
✅ LLM cost: <$0.05 per daily plan

---

## Timeline

### Day 1: Foundation
- ✅ Create `planning.ts` types
- ✅ Create `planning.prompts.ts`
- ✅ Start `PlanningSystem.ts` skeleton

### Day 2: Core Implementation
- ✅ Complete `PlanningSystem.ts`
- ✅ Implement daily plan generation
- ✅ Implement hourly decomposition

### Day 3: Action Generation
- ✅ Implement action decomposition
- ✅ Add plan execution tracking
- ✅ Add completion methods

### Day 4: Agent Integration
- ✅ Modify `Agent.ts` with planning
- ✅ Add planning context generation
- ✅ Add re-planning triggers

### Day 5: Decision Integration
- ✅ Modify `DecisionMaker.ts`
- ✅ Integrate plan execution
- ✅ Add plan fallback logic

### Day 6: Re-planning Logic
- ✅ Implement monitoring
- ✅ Implement divergence detection
- ✅ Test re-planning scenarios

### Day 7: Memory Integration
- ✅ Modify `MemoryStream.ts`
- ✅ Plan storage and retrieval
- ✅ Test plan queries

### Day 8: UI Creation
- ✅ Create `PlanningPanel.ts`
- ✅ Implement display logic
- ✅ Add progress visualization

### Day 9: UI Integration
- ✅ Modify `UIManager.ts`
- ✅ Add keyboard controls
- ✅ Position and style panel

### Day 10: Testing & Polish
- ✅ Integration testing
- ✅ Performance optimization
- ✅ Prompt refinement
- ✅ Documentation

### Day 11: Buffer & Documentation
- ✅ Fix any issues
- ✅ Write WEEK5_COMPLETE.md
- ✅ Update README with new features

---

## Research Paper Alignment

### Sections Addressed

- ✅ **Section 4.3**: Planning and Reacting
- ✅ **Section 4.3.1**: Plan decomposition and execution
- ✅ **Section 5.2.1**: Reflection trees (plan as memory)

### Alignment Improvement

**Before Week 5**: 15% planning alignment
**After Week 5**: 85% planning alignment

**Overall Paper Alignment**: 65% → 78%

### Remaining Gaps

- ❌ Still missing multi-agent coordination
- ❌ No dialogue generation
- ⚠️ Plans are self-contained (no social coordination)

---

## Future Considerations

### What Week 5 Enables

1. **Week 6 Multi-Agent**: Agents can coordinate plans
2. **Week 7 Dialogue**: Agents can discuss plans with each other
3. **Better Decision Quality**: Long-term coherence improves behavior
4. **Research Opportunities**: Study planning vs. reactive strategies

### Potential Extensions

1. **Collaborative Planning**: Multiple agents plan together
2. **Plan Sharing**: Agents share successful plans via dialogue
3. **Meta-Planning**: Plans about improving planning
4. **Adaptive Decomposition**: Vary granularity based on uncertainty

### Research Questions

1. How does planning affect survival rate vs. reactive strategies?
2. What's the optimal planning horizon (1 day vs. 12 hours vs. 3 hours)?
3. How often should agents re-plan vs. commit to plans?
4. Does stress affect planning quality?

---

## Configuration Parameters

```typescript
// src/config/planning.config.ts
export const PLANNING_CONFIG = {
  // Plan generation
  dailyPlanHorizon: 24 * 3600, // 24 hours in seconds
  hourlyPlanCount: 3,          // Generate 3 hours ahead
  actionDuration: 5 * 60,      // 5 minutes per action

  // Re-planning triggers
  criticalHungerThreshold: 20,
  criticalThirstThreshold: 15,
  criticalEnergyThreshold: 10,
  divergenceThreshold: 1.5,    // 50% worse than expected

  // LLM parameters
  planningTemperature: 0.7,     // Moderate creativity
  planningMaxTokens: 300,

  // Performance
  planCacheEnabled: true,
  planCacheDuration: 300,       // 5 minutes

  // UI
  maxDisplayedActions: 4,
  truncateLength: 40
};
```

---

## Deliverables

### New Files (4)
1. ✅ `src/types/planning.ts` (~200 lines)
2. ✅ `src/systems/PlanningSystem.ts` (~500 lines)
3. ✅ `src/config/planning.prompts.ts` (~300 lines)
4. ✅ `src/ui/PlanningPanel.ts` (~350 lines)

### Modified Files (4)
1. ✅ `src/agent/Agent.ts` (+80 lines)
2. ✅ `src/agent/DecisionMaker.ts` (+120 lines)
3. ✅ `src/agent/MemoryStream.ts` (+40 lines)
4. ✅ `src/ui/UIManager.ts` (+25 lines)

### Total Code
- **New**: ~1,350 lines
- **Modified**: ~265 lines
- **Total**: ~1,615 lines

---

## Expected Impact

### Behavioral Changes

**Before Week 5**:
```
Agent: Move north
Agent: Move east
Agent: Wait
Agent: Move south
Agent: Consume food
Agent: Move west
// Random, reactive, no coherence
```

**After Week 5**:
```
Daily Plan: "Systematically explore eastern section to find exit"
├─ Hour 1: Map eastern corridors
│  ├─ 00:00 - Move east to unexplored area
│  ├─ 00:05 - Check for items while exploring
│  ├─ 00:10 - Continue east if clear
│  └─ 00:15 - Mark dead end if encountered
└─ Hour 2: Explore northern branches...

Agent follows coherent sequence toward goal!
```

### Metrics to Track

1. **Plan Adherence**: % of actions from plan vs. reactive
2. **Plan Completion**: % of plans completed vs. abandoned
3. **Re-planning Frequency**: How often plans are regenerated
4. **Survival Improvement**: Does planning improve survival?
5. **Exploration Efficiency**: Planned vs. random exploration
6. **LLM Costs**: Cost of planning vs. reactive decisions

---

## Notes for Developers

1. **Start Small**: Implement daily planning first, then add decomposition
2. **Test Prompts**: Spend time refining prompts for quality plans
3. **Cache Plans**: Don't regenerate unnecessarily (expensive)
4. **Monitor Costs**: Planning uses more LLM tokens
5. **Gradual Rollout**: Make planning optional initially (toggle)
6. **Visualize**: Planning panel is crucial for debugging

---

## Conclusion

Week 5 implements the **missing third pillar** of the Generative Agents architecture. With hierarchical planning, the agent transitions from reactive behavior to goal-oriented, coherent action sequences that span hours and days.

This is the foundation for Week 6's multi-agent system, where agents will coordinate their plans and achieve emergent social behaviors.

**Paper Quote**:
> "Planning converts these reflections and environment information into **action plans** for the agent, which occupy the agent's **plan tree**." - Park et al., 2023
