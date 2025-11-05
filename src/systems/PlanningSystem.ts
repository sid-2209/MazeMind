import { v4 as uuidv4 } from 'uuid';
import type { Agent } from '../agent/Agent';
import type { LLMService } from '../services/LLMService';
import type { MemoryStream } from '../agent/MemoryStream';
import {
  DailyPlan,
  HourlyPlan,
  ActionPlan,
  PlanningContext,
  PlanStatus,
  PlanPriority,
  ActionType,
  DEFAULT_PLANNING_CONFIG,
  PlanningConfig
} from '../types/planning';
import { Position } from '../types';
import {
  buildDailyPlanPrompt,
  buildHourlyPlanPrompt,
  buildActionPlanPrompt,
  parseDailyPlanResponse,
  parseHourlyPlanResponse,
  parseActionPlanResponse,
  validatePriority,
  validateActionType
} from '../config/planning.prompts';

/**
 * PlanningSystem - Implements hierarchical planning from Park et al. (2023)
 *
 * Manages three levels of planning:
 * 1. Daily Plans - High-level goals for 24 game hours
 * 2. Hourly Plans - Specific objectives for each hour
 * 3. Action Plans - Concrete 5-minute actions
 */
export class PlanningSystem {
  private agent: Agent;
  private llmService: LLMService;
  private memoryStream: MemoryStream;
  private config: PlanningConfig;

  // Current plan hierarchy
  private currentDailyPlan: DailyPlan | null = null;
  private currentHourlyPlan: HourlyPlan | null = null;
  private currentActionPlan: ActionPlan | null = null;

  // For tracking divergence
  private lastDistanceToTarget: number = 0;

  constructor(
    agent: Agent,
    llmService: LLMService,
    memoryStream: MemoryStream,
    config: PlanningConfig = DEFAULT_PLANNING_CONFIG
  ) {
    this.agent = agent;
    this.llmService = llmService;
    this.memoryStream = memoryStream;
    this.config = config;

    // Suppress unused warnings - these will be used in later implementation days
    void this.agent;
    void this.llmService;
    void this.memoryStream;
    void this.lastDistanceToTarget;

    console.log('📋 PlanningSystem initialized');
  }

  // ============================================
  // Daily Plan Methods
  // ============================================

  /**
   * Generate a new daily plan based on current context
   */
  async generateDailyPlan(context: PlanningContext): Promise<DailyPlan> {
    console.log('📋 Generating daily plan...');

    let dailyPlan: DailyPlan;

    try {
      // Try to use LLM for planning (Day 11)
      const prompt = buildDailyPlanPrompt(context);
      const response = await this.llmService.generate(prompt, {
        temperature: this.config.planningTemperature,
        max_tokens: this.config.planningMaxTokens,
      });

      dailyPlan = this.parseDailyPlan(response, context);
      console.log('📋 Daily plan generated via LLM');
    } catch (error) {
      console.warn('⚠️  LLM planning failed, using fallback:', error);
      // Fallback to heuristic plan
      dailyPlan = this.generateFallbackDailyPlan(context);
    }

    this.currentDailyPlan = dailyPlan;

    // Store in memory (Week 5, Day 6)
    await this.storePlanInMemory(dailyPlan);

    console.log(`📋 Daily plan created: "${dailyPlan.goal}"`);
    return dailyPlan;
  }

  /**
   * Generate fallback daily plan using heuristics (Day 11)
   */
  private generateFallbackDailyPlan(context: PlanningContext): DailyPlan {
    const goal = this.generateStubGoal(context);
    const reasoning = this.generateStubReasoning(context);
    const priority = this.determinePriority(context);

    return {
      id: uuidv4(),
      createdAt: Date.now(),
      goal,
      reasoning,
      priority,
      hourlyPlans: [],
      status: PlanStatus.PENDING
    };
  }

  /**
   * Generate stub goal based on survival state
   */
  private generateStubGoal(context: PlanningContext): string {
    if (context.survivalState.hunger < 30) {
      return 'Find food sources to restore hunger levels';
    } else if (context.survivalState.thirst < 30) {
      return 'Locate water to restore hydration';
    } else if (context.survivalState.energy < 30) {
      return 'Find energy-restoring items and rest';
    } else if (context.explorationProgress < 0.5) {
      return 'Systematically explore the eastern section of the maze';
    } else {
      return 'Search for the maze exit in unexplored areas';
    }
  }

  /**
   * Generate stub reasoning
   */
  private generateStubReasoning(context: PlanningContext): string {
    if (context.survivalState.hunger < 30) {
      return 'Hunger is approaching critical levels. Must prioritize food finding before continuing exploration.';
    } else if (context.survivalState.thirst < 30) {
      return 'Thirst is becoming dangerous. Water must be the immediate priority.';
    } else {
      return 'Survival resources are stable. Time to focus on finding the exit.';
    }
  }

  /**
   * Determine priority based on context
   */
  private determinePriority(context: PlanningContext): PlanPriority {
    if (context.survivalState.hunger < this.config.criticalHungerThreshold ||
        context.survivalState.thirst < this.config.criticalThirstThreshold ||
        context.survivalState.energy < this.config.criticalEnergyThreshold) {
      return PlanPriority.CRITICAL;
    } else if (context.survivalState.hunger < 40 ||
               context.survivalState.thirst < 40) {
      return PlanPriority.HIGH;
    } else if (context.explorationProgress < 0.3) {
      return PlanPriority.MEDIUM;
    }
    return PlanPriority.HIGH;
  }

  // ============================================
  // Hourly Plan Methods
  // ============================================

  /**
   * Decompose daily plan into hourly plans
   */
  async decomposeIntoHourlyPlans(dailyPlan: DailyPlan, context: PlanningContext): Promise<void> {
    console.log('📋 Decomposing into hourly plans...');

    // Generate next 3 hours of detailed plans
    for (let hour = 0; hour < this.config.hourlyPlanCount; hour++) {
      const hourlyPlan = await this.generateHourlyPlan(dailyPlan, hour, context);
      dailyPlan.hourlyPlans.push(hourlyPlan);
    }

    console.log(`📋 Generated ${dailyPlan.hourlyPlans.length} hourly plans`);
  }

  /**
   * Generate a single hourly plan
   */
  async generateHourlyPlan(
    dailyPlan: DailyPlan,
    hour: number,
    context: PlanningContext
  ): Promise<HourlyPlan> {
    let hourlyPlan: HourlyPlan;

    try {
      // Try to use LLM for hourly planning (Day 11)
      const prompt = buildHourlyPlanPrompt(dailyPlan.goal, hour, context);
      const response = await this.llmService.generate(prompt, {
        temperature: this.config.planningTemperature,
        max_tokens: 200,
      });

      hourlyPlan = this.parseHourlyPlan(response, dailyPlan, hour, context);
      console.log(`📋 Hourly plan ${hour + 1} generated via LLM`);
    } catch (error) {
      console.warn(`⚠️  LLM hourly planning failed, using fallback:`, error);
      // Fallback to heuristic plan
      hourlyPlan = {
        id: uuidv4(),
        parentId: dailyPlan.id,
        startTime: context.gameTime + (hour * 3600),
        duration: 3600,
        objective: this.generateStubObjective(dailyPlan, hour),
        actions: [],
        status: PlanStatus.PENDING
      };
    }

    return hourlyPlan;
  }

  /**
   * Generate stub hourly objective
   */
  private generateStubObjective(dailyPlan: DailyPlan, hour: number): string {
    if (dailyPlan.goal.includes('food')) {
      return `Search corridors for food items (Hour ${hour + 1})`;
    } else if (dailyPlan.goal.includes('water')) {
      return `Search for water sources (Hour ${hour + 1})`;
    } else if (dailyPlan.goal.includes('eastern')) {
      return `Map eastern corridors and check for items (Hour ${hour + 1})`;
    } else {
      return `Continue exploration toward exit (Hour ${hour + 1})`;
    }
  }

  // ============================================
  // Action Plan Methods
  // ============================================

  /**
   * Decompose hourly plan into 5-minute action plans
   */
  async decomposeIntoActions(hourlyPlan: HourlyPlan, context: PlanningContext): Promise<void> {
    console.log('📋 Decomposing into actions...');

    // 1 hour = 12 five-minute chunks
    const actionCount = Math.floor(hourlyPlan.duration / this.config.actionDuration);

    for (let i = 0; i < actionCount; i++) {
      const actionPlan = await this.generateActionPlan(hourlyPlan, i, context);
      hourlyPlan.actions.push(actionPlan);
    }

    console.log(`📋 Generated ${hourlyPlan.actions.length} action plans`);
  }

  /**
   * Generate a single action plan
   */
  async generateActionPlan(
    hourlyPlan: HourlyPlan,
    actionIndex: number,
    context: PlanningContext
  ): Promise<ActionPlan> {
    let actionPlan: ActionPlan;

    try {
      // Try to use LLM for action planning (Day 11)
      const dailyPlan = this.currentDailyPlan;
      if (!dailyPlan) {
        throw new Error('No daily plan available');
      }

      const startTime = hourlyPlan.startTime + (actionIndex * this.config.actionDuration);
      const endTime = startTime + this.config.actionDuration;

      const prompt = buildActionPlanPrompt(
        hourlyPlan.objective,
        dailyPlan.goal,
        context,
        { start: startTime, end: endTime }
      );

      const response = await this.llmService.generate(prompt, {
        temperature: this.config.planningTemperature,
        max_tokens: 150,
      });

      actionPlan = this.parseActionPlan(response, hourlyPlan, actionIndex);
    } catch (error) {
      // Fallback to heuristic action
      actionPlan = {
        id: uuidv4(),
        parentId: hourlyPlan.id,
        startTime: hourlyPlan.startTime + (actionIndex * this.config.actionDuration),
        duration: this.config.actionDuration,
        action: this.generateStubAction(hourlyPlan, actionIndex),
        actionType: this.inferActionType(hourlyPlan),
        status: PlanStatus.PENDING
      };
    }

    return actionPlan;
  }

  /**
   * Generate stub action description
   */
  private generateStubAction(hourlyPlan: HourlyPlan, actionIndex: number): string {
    if (hourlyPlan.objective.includes('food')) {
      return `Search corridor segment ${actionIndex + 1} for food items`;
    } else if (hourlyPlan.objective.includes('water')) {
      return `Check area ${actionIndex + 1} for water sources`;
    } else {
      return `Explore and map corridor section ${actionIndex + 1}`;
    }
  }

  /**
   * Infer action type from hourly objective
   */
  private inferActionType(hourlyPlan: HourlyPlan): ActionType {
    const obj = hourlyPlan.objective.toLowerCase();
    if (obj.includes('food') || obj.includes('water')) {
      return ActionType.SEEK_ITEM;
    } else if (obj.includes('rest') || obj.includes('sleep')) {
      return ActionType.REST;
    } else if (obj.includes('reflect')) {
      return ActionType.REFLECT;
    } else {
      return ActionType.EXPLORE;
    }
  }

  // ============================================
  // Plan Retrieval Methods
  // ============================================

  /**
   * Get the current action plan for a given game time
   */
  getCurrentAction(gameTime: number): ActionPlan | null {
    if (!this.currentDailyPlan) return null;

    const hourlyPlan = this.findActiveHourlyPlan(gameTime);
    if (!hourlyPlan) return null;

    const action = this.findActiveAction(hourlyPlan, gameTime);
    if (action) {
      this.currentActionPlan = action;
    }

    return action;
  }

  /**
   * Find the hourly plan that is active at the given game time
   */
  private findActiveHourlyPlan(gameTime: number): HourlyPlan | null {
    if (!this.currentDailyPlan) return null;

    for (const hourlyPlan of this.currentDailyPlan.hourlyPlans) {
      const endTime = hourlyPlan.startTime + hourlyPlan.duration;
      if (gameTime >= hourlyPlan.startTime && gameTime < endTime) {
        if (this.currentHourlyPlan !== hourlyPlan) {
          this.currentHourlyPlan = hourlyPlan;
          console.log(`📋 Switched to new hourly plan: ${hourlyPlan.objective}`);
        }
        return hourlyPlan;
      }
    }

    return null;
  }

  /**
   * Find the action plan that is active at the given game time
   */
  private findActiveAction(hourlyPlan: HourlyPlan, gameTime: number): ActionPlan | null {
    for (const action of hourlyPlan.actions) {
      const endTime = action.startTime + action.duration;
      if (gameTime >= action.startTime && gameTime < endTime) {
        return action;
      }
    }

    return null;
  }

  // ============================================
  // Plan Completion Methods
  // ============================================

  /**
   * Mark an action as completed
   */
  completeAction(actionId: string): void {
    const action = this.findActionById(actionId);
    if (action && action.status !== PlanStatus.COMPLETED) {
      action.status = PlanStatus.COMPLETED;
      action.completedAt = Date.now();
      console.log(`✓ Completed: ${action.action}`);

      // Check if hourly plan is complete
      this.checkHourlyPlanCompletion();
    }
  }

  /**
   * Find an action by its ID
   */
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

  /**
   * Check if the current hourly plan is complete
   */
  private checkHourlyPlanCompletion(): void {
    if (!this.currentHourlyPlan) return;

    const allCompleted = this.currentHourlyPlan.actions.every(
      action => action.status === PlanStatus.COMPLETED
    );

    if (allCompleted) {
      this.currentHourlyPlan.status = PlanStatus.COMPLETED;
      this.currentHourlyPlan.completedAt = Date.now();
      console.log(`✅ Hourly plan completed: ${this.currentHourlyPlan.objective}`);

      // Check if daily plan is complete
      this.checkDailyPlanCompletion();
    }
  }

  /**
   * Check if the current daily plan is complete
   */
  private checkDailyPlanCompletion(): void {
    if (!this.currentDailyPlan) return;

    const allCompleted = this.currentDailyPlan.hourlyPlans.every(
      hourlyPlan => hourlyPlan.status === PlanStatus.COMPLETED
    );

    if (allCompleted) {
      this.currentDailyPlan.status = PlanStatus.COMPLETED;
      this.currentDailyPlan.completedAt = Date.now();
      console.log(`✅ Daily plan completed: ${this.currentDailyPlan.goal}`);
    }
  }

  // ============================================
  // Re-planning Methods
  // ============================================

  /**
   * Monitor for events that should trigger re-planning (Day 7)
   */
  monitorForReplanning(context: PlanningContext): string | null {
    // Critical survival needs
    if (context.survivalState.hunger < this.config.criticalHungerThreshold) {
      return 'Critical hunger level detected';
    }
    if (context.survivalState.thirst < this.config.criticalThirstThreshold) {
      return 'Critical thirst level detected';
    }
    if (context.survivalState.energy < this.config.criticalEnergyThreshold) {
      return 'Critical energy level detected';
    }

    // Unexpected high-value discovery
    const nearbyItems = context.knownItems.filter(item =>
      this.isNearby(item.position, context.currentPosition)
    );
    if (nearbyItems.length > 3 && this.currentDailyPlan?.goal.includes('explore')) {
      return 'Multiple items discovered, should gather before continuing exploration';
    }

    // Plan completion
    if (this.currentDailyPlan?.status === PlanStatus.COMPLETED) {
      return 'Daily plan completed';
    }

    // No active plan
    if (!this.currentDailyPlan) {
      return 'No active plan';
    }

    // Significant time divergence
    if (this.hasSignificantDivergence(context)) {
      return 'Plan execution significantly diverged from expected';
    }

    return null;
  }

  /**
   * Check if re-planning should be triggered (legacy method)
   */
  shouldReplan(context: PlanningContext): boolean {
    return this.monitorForReplanning(context) !== null;
  }

  /**
   * Perform re-planning with a given reason
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

    if (this.currentDailyPlan) {
      await this.decomposeIntoHourlyPlans(this.currentDailyPlan, context);

      // Decompose first hour immediately
      if (this.currentDailyPlan.hourlyPlans.length > 0) {
        await this.decomposeIntoActions(this.currentDailyPlan.hourlyPlans[0], context);
        this.currentHourlyPlan = this.currentDailyPlan.hourlyPlans[0];
      }
    }
  }

  /**
   * Initialize the first plan (called at game start)
   */
  async decomposeInitialPlans(context: PlanningContext): Promise<void> {
    if (!this.currentDailyPlan) return;

    // Generate first 3 hourly plans
    await this.decomposeIntoHourlyPlans(this.currentDailyPlan, context);

    // Decompose first hour into actions immediately
    if (this.currentDailyPlan.hourlyPlans.length > 0) {
      await this.decomposeIntoActions(this.currentDailyPlan.hourlyPlans[0], context);
      this.currentHourlyPlan = this.currentDailyPlan.hourlyPlans[0];

      // Mark first hourly plan as in progress
      this.currentHourlyPlan.status = PlanStatus.IN_PROGRESS;
      if (this.currentHourlyPlan.actions.length > 0) {
        this.currentHourlyPlan.actions[0].status = PlanStatus.IN_PROGRESS;
      }
    }

    // Mark daily plan as in progress
    this.currentDailyPlan.status = PlanStatus.IN_PROGRESS;

    console.log('✅ Initial plans decomposed and ready');
  }

  // ============================================
  // Helper Methods
  // ============================================

  /**
   * Check if there are critical survival needs
   */
  // @ts-ignore - Used in shouldReplan legacy method
  private hasCriticalNeed(survivalState: PlanningContext['survivalState']): boolean {
    return survivalState.hunger < this.config.criticalHungerThreshold ||
           survivalState.thirst < this.config.criticalThirstThreshold ||
           survivalState.energy < this.config.criticalEnergyThreshold;
  }

  /**
   * Detect significant divergence from plan (Day 7)
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
      if (this.lastDistanceToTarget > 0 && distance > this.lastDistanceToTarget * this.config.divergenceThreshold) {
        console.log(`📋 Divergence detected: distance ${distance} vs last ${this.lastDistanceToTarget}`);
        return true;
      }

      this.lastDistanceToTarget = distance;
    }

    // Check if action became impossible
    if (this.currentActionPlan.actionType === ActionType.CONSUME_ITEM) {
      const itemNearby = this.checkItemNearby(context);
      if (!itemNearby) {
        console.log('📋 Divergence detected: item no longer nearby');
        return true;
      }
    }

    // Check if been stuck on same action too long
    if (this.currentActionPlan.status === PlanStatus.IN_PROGRESS) {
      const timeSinceStart = context.gameTime - this.currentActionPlan.startTime;
      if (timeSinceStart > this.currentActionPlan.duration * 3) {
        console.log('📋 Divergence detected: action taking 3x expected duration');
        return true; // 3x expected duration
      }
    }

    return false;
  }

  /**
   * Check if exit detected nearby (Day 7)
   */
  // @ts-ignore - Will be used for exit detection in future enhancement
  private exitDetected(context: PlanningContext): boolean {
    // Check if exit tile is in visible range
    // This depends on fog of war system
    // For now, return false (can be enhanced later)
    void context; // Suppress unused warning
    return false;
  }

  /**
   * Check if item nearby (Day 7)
   */
  private checkItemNearby(context: PlanningContext): boolean {
    const nearbyItems = context.knownItems.filter(item =>
      this.isNearby(item.position, context.currentPosition, 2)
    );
    return nearbyItems.length > 0;
  }

  /**
   * Calculate Manhattan distance between two positions
   */
  private getDistance(pos1: Position, pos2: Position): number {
    return Math.abs(pos1.x - pos2.x) + Math.abs(pos1.y - pos2.y);
  }

  /**
   * Check if a position is nearby another
   */
  private isNearby(pos1: Position, pos2: Position, maxDistance: number = 5): boolean {
    return this.getDistance(pos1, pos2) <= maxDistance;
  }

  // ============================================
  // Memory Storage (Day 6)
  // ============================================

  /**
   * Store plan in memory stream
   */
  private async storePlanInMemory(plan: DailyPlan): Promise<void> {
    const memoryId = this.memoryStream.storeDailyPlan(plan);

    // Store hourly plans as well
    for (const hourlyPlan of plan.hourlyPlans) {
      this.memoryStream.storeHourlyPlan(hourlyPlan, plan.id);
    }

    console.log(`💾 Plan stored in memory (ID: ${memoryId})`);
  }

  // ============================================
  // LLM Response Parsing (Day 3)
  // ============================================

  /**
   * Parse LLM response into DailyPlan
   * Will be used when real LLM calls are integrated on Day 11
   */
  parseDailyPlan(llmResponse: string, context: PlanningContext): DailyPlan {
    void context; // Will be used for fallback plans
    const parsed = parseDailyPlanResponse(llmResponse);

    const priorityMap: Record<string, PlanPriority> = {
      'CRITICAL': PlanPriority.CRITICAL,
      'HIGH': PlanPriority.HIGH,
      'MEDIUM': PlanPriority.MEDIUM,
      'LOW': PlanPriority.LOW
    };

    const validPriority = validatePriority(parsed.priority);

    return {
      id: uuidv4(),
      createdAt: Date.now(),
      goal: parsed.goal,
      reasoning: parsed.reasoning,
      priority: priorityMap[validPriority] || PlanPriority.MEDIUM,
      hourlyPlans: [],
      status: PlanStatus.PENDING
    };
  }

  /**
   * Parse LLM response into HourlyPlan
   */
  parseHourlyPlan(llmResponse: string, dailyPlan: DailyPlan, hour: number, context: PlanningContext): HourlyPlan {
    const parsed = parseHourlyPlanResponse(llmResponse);

    return {
      id: uuidv4(),
      parentId: dailyPlan.id,
      startTime: context.gameTime + (hour * 3600),
      duration: 3600,
      objective: parsed.objective,
      actions: [],
      status: PlanStatus.PENDING
    };
  }

  /**
   * Parse LLM response into ActionPlan
   */
  parseActionPlan(
    llmResponse: string,
    hourlyPlan: HourlyPlan,
    actionIndex: number
  ): ActionPlan {
    const parsed = parseActionPlanResponse(llmResponse);

    const typeMap: Record<string, ActionType> = {
      'MOVE': ActionType.MOVE,
      'EXPLORE': ActionType.EXPLORE,
      'CONSUME_ITEM': ActionType.CONSUME_ITEM,
      'SEEK_ITEM': ActionType.SEEK_ITEM,
      'REST': ActionType.REST,
      'REFLECT': ActionType.REFLECT,
      'WAIT': ActionType.WAIT
    };

    const validType = validateActionType(parsed.type);

    return {
      id: uuidv4(),
      parentId: hourlyPlan.id,
      startTime: hourlyPlan.startTime + (actionIndex * this.config.actionDuration),
      duration: this.config.actionDuration,
      action: parsed.action,
      actionType: typeMap[validType] || ActionType.EXPLORE,
      status: PlanStatus.PENDING
    };
  }

  /**
   * Build prompt for daily planning
   * Exposed for testing and debugging
   */
  buildDailyPrompt(context: PlanningContext): string {
    return buildDailyPlanPrompt(context);
  }

  /**
   * Build prompt for hourly planning
   */
  buildHourlyPrompt(dailyGoal: string, hour: number, context: PlanningContext): string {
    return buildHourlyPlanPrompt(dailyGoal, hour, context);
  }

  /**
   * Build prompt for action planning
   */
  buildActionPrompt(
    hourlyObjective: string,
    dailyGoal: string,
    context: PlanningContext,
    timeSlot: { start: number; end: number }
  ): string {
    return buildActionPlanPrompt(hourlyObjective, dailyGoal, context, timeSlot);
  }

  // ============================================
  // Accessors
  // ============================================

  /**
   * Get the current daily plan
   */
  getCurrentDailyPlan(): DailyPlan | null {
    return this.currentDailyPlan;
  }

  /**
   * Get the current hourly plan
   */
  getCurrentHourlyPlan(): HourlyPlan | null {
    return this.currentHourlyPlan;
  }

  /**
   * Get the current action plan
   */
  getCurrentActionPlan(): ActionPlan | null {
    return this.currentActionPlan;
  }

  /**
   * Get planning configuration
   */
  getConfig(): PlanningConfig {
    return this.config;
  }
}
