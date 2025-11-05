// src/agent/DecisionMaker.ts
/**
 * DecisionMaker - LLM-based autonomous decision making (Week 2, Days 3-4)
 *
 * Uses Claude API to make movement decisions based on:
 * - Current state and surroundings
 * - Retrieved relevant memories
 * - Character personality (Arth)
 * - Goal state (find exit, survive)
 *
 * Based on Stanford Generative Agents methodology
 */

import { Agent } from './Agent';
import { Maze, Position, TileType } from '../types';
import { LLMService } from '../services/LLMService';
import { MemoryRetrieval } from './MemoryRetrieval';
import { buildDecisionPrompt } from '../config/decision.prompts';
import { Item, ItemType } from '../entities/Item'; // Week 3
import { PlanStatus, ActionType, ActionPlan } from '../types/planning'; // Week 5

export interface Decision {
  action: 'move' | 'wait' | 'reflect';
  direction?: 'north' | 'south' | 'east' | 'west';
  reasoning: string;
  confidence: number; // 0-1
}

export class DecisionMaker {
  private agent: Agent;
  private maze: Maze;
  private llmService: LLMService;
  private memoryRetrieval: MemoryRetrieval;
  private itemGenerator: any = null; // Week 3

  // Decision tracking
  private lastDecisionTime: number = 0;
  private decisionInterval: number = 3000; // 3 seconds between decisions
  private consecutiveWaitCount: number = 0;

  // Game time (Week 5 - for planning)
  private gameTime: number = 0;

  constructor(
    agent: Agent,
    maze: Maze,
    llmService: LLMService,
    memoryRetrieval: MemoryRetrieval
  ) {
    this.agent = agent;
    this.maze = maze;
    this.llmService = llmService;
    this.memoryRetrieval = memoryRetrieval;

    console.log('🤖 DecisionMaker initialized');
  }

  /**
   * Set item generator reference (Week 3)
   */
  setItemGenerator(itemGenerator: any): void {
    this.itemGenerator = itemGenerator;
  }

  /**
   * Update game time (Week 5 - for planning)
   */
  updateGameTime(gameTime: number): void {
    this.gameTime = gameTime;
  }

  /**
   * Make a decision based on current state
   * This is the main entry point for autonomous behavior
   */
  async makeDecision(): Promise<Decision> {
    const now = Date.now();

    // Throttle decisions
    if (now - this.lastDecisionTime < this.decisionInterval) {
      return {
        action: 'wait',
        reasoning: 'Waiting for decision interval',
        confidence: 1.0,
      };
    }

    this.lastDecisionTime = now;

    try {
      // PRIORITY 0: Check if we have an active plan (Week 5 - NEW)
      const currentAction = this.agent.getCurrentPlannedAction(this.gameTime);
      if (currentAction && currentAction.status === PlanStatus.PENDING) {
        console.log(`📋 Following plan: ${currentAction.action}`);
        const decision = await this.executePlannedAction(currentAction);
        if (decision) {
          // Mark action as completed
          const planningSystem = this.agent.getPlanningSystem();
          if (planningSystem) {
            planningSystem.completeAction(currentAction.id);
          }
          return decision;
        }
      }

      // PRIORITY 1: Check for critical survival needs (Week 3)
      // These override plans
      const urgentNeed = this.agent.getResourceManager().getMostUrgentNeed();
      if (urgentNeed && this.itemGenerator) {
        const survivalDecision = this.makeSurvivalDecision(urgentNeed);
        if (survivalDecision) {
          console.log(`⚠️  SURVIVAL PRIORITY: ${urgentNeed} critical (overriding plan)`);
          // Trigger re-planning after addressing survival need
          this.agent.replan('Critical survival need', this.gameTime).catch(err => {
            console.error('Failed to replan:', err);
          });
          return survivalDecision;
        }
      }

      // PRIORITY 2: If no plan or plan failed, fall back to normal decision making
      console.log('🎲 No active plan, making reactive decision...');
      // Check if LLM is available (not in heuristic mode)
      const provider = this.llmService.getCurrentProvider();

      if (provider === 'heuristic' || !this.llmService.isProviderAvailable()) {
        return this.makeHeuristicDecision();
      }

      // Gather context for LLM decision (with stress modifier)
      const context = await this.gatherContext();
      const prompt = this.buildDecisionPrompt(context);

      // Generate LLM response
      const llmResponse = await this.llmService.generate(prompt, {
        temperature: 0.7,
        max_tokens: 150,
        stop: ['DECISION:', 'What should'],
      });

      // Parse LLM response
      const decision = this._parseDecision(llmResponse);

      console.log(`🤖 [${provider}] Decision: ${decision.action} ${decision.direction || ''}`);
      console.log(`   Reasoning: ${decision.reasoning}`);

      return decision;
    } catch (error) {
      console.error('❌ LLM decision making failed:', error);
      console.log('   Falling back to heuristic pathfinding');
      // Fallback to heuristic
      return this.makeHeuristicDecision();
    }
  }

  /**
   * Gather context for decision making
   */
  private async gatherContext(): Promise<{
    position: Position;
    surroundings: string;
    recentMemories: string[];
    relevantMemories: string[];
    stats: any;
    goal: string;
    stressLevel: number;
  }> {
    const position = this.agent.getTilePosition();
    const stats = this.agent.getState();

    // Get surroundings description
    const surroundings = this.describeSurroundings();

    // Get recent memories
    const recentMems = this.agent.getRecentMemories(5);
    const recentMemories = recentMems.map(m => m.description);

    // Get stress modifier for memory retrieval (Week 3)
    const stressModifier = this.agent.getStressManager().getStressModifier();
    const stressLevel = this.agent.getStressLevel();

    // Query for relevant memories with stress effects (Week 3)
    const query = `I am at position (${position.x}, ${position.y}). ${surroundings}`;
    const relevant = await this.memoryRetrieval.retrieve(query, 5, stressModifier);
    const relevantMemories = relevant.map(r => r.memory.description);

    return {
      position,
      surroundings,
      recentMemories,
      relevantMemories,
      stats,
      goal: this.getCurrentGoal(),
      stressLevel,
    };
  }

  /**
   * Build decision prompt for LLM
   */
  private buildDecisionPrompt(context: any): string {
    return buildDecisionPrompt({
      position: context.position,
      surroundings: context.surroundings,
      health: context.stats.health,
      energy: context.stats.energy,
      hunger: context.stats.hunger,
      thirst: context.stats.thirst,
      stress: context.stressLevel || 0, // Week 3
      goal: context.goal,
      recentMemories: context.recentMemories,
      relevantMemories: context.relevantMemories,
    });
  }

  /**
   * Describe current surroundings
   */
  private describeSurroundings(): string {
    const agentTile = this.agent.getTilePosition();
    const directions = [
      { dir: 'north', dx: 0, dy: -1, name: 'North' },
      { dir: 'east', dx: 1, dy: 0, name: 'East' },
      { dir: 'south', dx: 0, dy: 1, name: 'South' },
      { dir: 'west', dx: -1, dy: 0, name: 'West' },
    ];

    const openings: string[] = [];
    const walls: string[] = [];

    for (const { dx, dy, name } of directions) {
      const checkX = agentTile.x + dx;
      const checkY = agentTile.y + dy;

      // Check bounds
      if (checkX < 0 || checkX >= this.maze.width || checkY < 0 || checkY >= this.maze.height) {
        walls.push(name);
        continue;
      }

      const tile = this.maze.tiles[checkY][checkX];
      const currentTile = this.maze.tiles[agentTile.y][agentTile.x];

      // Check walls
      const dirLower = name.toLowerCase();
      const hasWall = this.checkWall(currentTile, dirLower);

      if (hasWall || tile.type === TileType.WALL) {
        walls.push(name);
      } else {
        openings.push(name);
      }
    }

    // Check if at exit
    if (agentTile.x === this.maze.exit.x && agentTile.y === this.maze.exit.y) {
      return "I'm at the EXIT! I found it!";
    }

    // Check if at entrance
    if (agentTile.x === this.maze.entrance.x && agentTile.y === this.maze.entrance.y) {
      return "I'm at the entrance where I started.";
    }

    if (openings.length === 0) {
      return "Dead end - walls on all sides.";
    } else if (openings.length === 1) {
      return `Corridor - path to ${openings[0]}.`;
    } else if (openings.length >= 3) {
      return `Junction - paths to ${openings.join(', ')}.`;
    } else {
      return `Paths open to ${openings.join(' and ')}.`;
    }
  }

  /**
   * Check if there's a wall in a direction
   */
  private checkWall(tile: any, direction: string): boolean {
    switch (direction) {
      case 'north':
        return tile.walls.north;
      case 'east':
        return tile.walls.east;
      case 'south':
        return tile.walls.south;
      case 'west':
        return tile.walls.west;
      default:
        return false;
    }
  }

  /**
   * Get current goal
   */
  private getCurrentGoal(): string {
    const position = this.agent.getTilePosition();
    const exit = this.maze.exit;

    // Calculate rough direction to exit
    const dx = exit.x - position.x;
    const dy = exit.y - position.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    let direction = '';
    if (Math.abs(dx) > Math.abs(dy)) {
      direction = dx > 0 ? 'east' : 'west';
    } else {
      direction = dy > 0 ? 'south' : 'north';
    }

    return `Find the exit at (${exit.x}, ${exit.y}). It's roughly ${Math.round(distance)} tiles to the ${direction}.`;
  }

  /**
   * Heuristic decision making (fallback when no LLM)
   * Uses simple pathfinding toward exit
   */
  private makeHeuristicDecision(): Decision {
    const position = this.agent.getTilePosition();
    const exit = this.maze.exit;

    // Calculate direction to exit
    const dx = exit.x - position.x;
    const dy = exit.y - position.y;

    // Try to move toward exit
    const directions: Array<{
      name: 'north' | 'south' | 'east' | 'west';
      score: number;
      dx: number;
      dy: number;
    }> = [
      { name: 'north', dx: 0, dy: -1, score: dy < 0 ? Math.abs(dy) : 0 },
      { name: 'south', dx: 0, dy: 1, score: dy > 0 ? Math.abs(dy) : 0 },
      { name: 'east', dx: 1, dy: 0, score: dx > 0 ? Math.abs(dx) : 0 },
      { name: 'west', dx: -1, dy: 0, score: dx < 0 ? Math.abs(dx) : 0 },
    ];

    // Sort by score (prefer directions toward exit)
    directions.sort((a, b) => b.score - a.score);

    // Try each direction
    for (const dir of directions) {
      const targetTile = {
        x: position.x + dir.dx,
        y: position.y + dir.dy,
      };

      if (this.agent.canMoveTo(targetTile)) {
        return {
          action: 'move',
          direction: dir.name,
          reasoning: `Moving ${dir.name} toward exit`,
          confidence: 0.7,
        };
      }
    }

    // If can't move toward exit, try any open direction
    for (const dir of directions) {
      const targetTile = {
        x: position.x + dir.dx,
        y: position.y + dir.dy,
      };

      if (this.agent.canMoveTo(targetTile)) {
        return {
          action: 'move',
          direction: dir.name,
          reasoning: `Exploring ${dir.name}`,
          confidence: 0.5,
        };
      }
    }

    // Stuck - wait
    this.consecutiveWaitCount++;

    return {
      action: 'wait',
      reasoning: 'No valid moves available',
      confidence: 0.3,
    };
  }

  /**
   * Parse LLM response to decision (for future use when LLM is integrated)
   */
  private _parseDecision(response: string): Decision {
    const actionMatch = response.match(/ACTION:\s*(MOVE\s+(NORTH|SOUTH|EAST|WEST)|WAIT)/i);
    const reasoningMatch = response.match(/REASONING:\s*(.+)/i);

    if (!actionMatch) {
      return this.makeHeuristicDecision();
    }

    const action = actionMatch[1].toLowerCase();
    const reasoning = reasoningMatch ? reasoningMatch[1].trim() : 'No reasoning provided';

    if (action.includes('move')) {
      const direction = action.split(' ')[1] as 'north' | 'south' | 'east' | 'west';
      return {
        action: 'move',
        direction,
        reasoning,
        confidence: 0.8,
      };
    }

    return {
      action: 'wait',
      reasoning,
      confidence: 0.5,
    };
  }

  /**
   * Set decision interval
   */
  setDecisionInterval(ms: number): void {
    this.decisionInterval = ms;
  }

  /**
   * Get decision interval
   */
  getDecisionInterval(): number {
    return this.decisionInterval;
  }

  // ============================================
  // Plan Execution (Week 5)
  // ============================================

  /**
   * Execute a planned action from the planning system
   */
  private async executePlannedAction(action: ActionPlan): Promise<Decision | null> {
    switch (action.actionType) {
      case ActionType.MOVE:
      case ActionType.EXPLORE:
        if (action.targetPosition) {
          return await this.moveTowardPosition(action.targetPosition, action.action);
        }
        // If no target position, infer from action description
        return this.inferDirectionFromAction(action.action);

      case ActionType.SEEK_ITEM:
        if (action.targetItem) {
          return await this.seekItemType(action.targetItem);
        }
        break;

      case ActionType.CONSUME_ITEM:
        // Check if there's an item at current position
        return this.tryConsumeNearbyItem();

      case ActionType.REST:
      case ActionType.WAIT:
        return {
          action: 'wait',
          reasoning: action.action,
          confidence: 1.0
        };

      case ActionType.REFLECT:
        // Trigger reflection by waiting - reflection system will run periodically
        return {
          action: 'wait',
          reasoning: 'Taking time to reflect on experiences',
          confidence: 1.0
        };
    }

    return null;
  }

  /**
   * Move toward a specific position
   */
  private async moveTowardPosition(target: Position, reasoning: string): Promise<Decision> {
    const current = this.agent.getTilePosition();
    const dx = target.x - current.x;
    const dy = target.y - current.y;

    // Simple pathfinding: prefer larger delta
    let direction: 'north' | 'south' | 'east' | 'west';

    if (Math.abs(dx) > Math.abs(dy)) {
      direction = dx > 0 ? 'east' : 'west';
    } else {
      direction = dy > 0 ? 'south' : 'north';
    }

    // Check if direction is valid, otherwise find alternative
    if (!this.isDirectionValid(direction)) {
      const alternatives = this.getAlternativeDirections(direction);
      if (alternatives.length > 0) {
        direction = alternatives[0];
      }
    }

    return {
      action: 'move',
      direction,
      reasoning: reasoning || `Moving toward planned position (${target.x}, ${target.y})`,
      confidence: 0.9
    };
  }

  /**
   * Infer direction from action description
   */
  private inferDirectionFromAction(actionDescription: string): Decision {
    const action = actionDescription.toLowerCase();

    let direction: 'north' | 'south' | 'east' | 'west' = 'north'; // default

    if (action.includes('north') || action.includes('up')) {
      direction = 'north';
    } else if (action.includes('south') || action.includes('down')) {
      direction = 'south';
    } else if (action.includes('east') || action.includes('right')) {
      direction = 'east';
    } else if (action.includes('west') || action.includes('left')) {
      direction = 'west';
    }

    // Check if direction is valid
    if (!this.isDirectionValid(direction)) {
      const alternatives = this.getAlternativeDirections(direction);
      if (alternatives.length > 0) {
        direction = alternatives[0];
      }
    }

    return {
      action: 'move',
      direction,
      reasoning: actionDescription,
      confidence: 0.7
    };
  }

  /**
   * Seek a specific type of item
   */
  private async seekItemType(itemType: string): Promise<Decision> {
    if (!this.itemGenerator) {
      return {
        action: 'wait',
        reasoning: 'No item generator available',
        confidence: 0.5
      };
    }

    // Map item type string to ItemType enum
    let targetType: ItemType;
    if (itemType.toLowerCase().includes('food')) {
      targetType = ItemType.FOOD;
    } else if (itemType.toLowerCase().includes('water')) {
      targetType = ItemType.WATER;
    } else if (itemType.toLowerCase().includes('energy')) {
      targetType = ItemType.ENERGY_DRINK;
    } else {
      // Unknown type, explore
      return {
        action: 'move',
        direction: 'north',
        reasoning: `Searching for ${itemType}`,
        confidence: 0.5
      };
    }

    // Find nearest item of type
    const nearestItem = this.findNearestItem(targetType);
    if (nearestItem) {
      return this.moveTowardPosition(nearestItem.position, `Seeking ${itemType}`);
    }

    // Item not found, explore
    return {
      action: 'move',
      direction: 'north',
      reasoning: `Searching for ${itemType}`,
      confidence: 0.5
    };
  }

  /**
   * Try to consume item at current position
   */
  private tryConsumeNearbyItem(): Decision {
    const tile = this.agent.getTilePosition();

    if (!this.itemGenerator) {
      return {
        action: 'wait',
        reasoning: 'No item generator available',
        confidence: 1.0
      };
    }

    const item = this.itemGenerator.getItemAtTile(tile.x, tile.y);

    if (item && !item.consumed) {
      // Item will be consumed by Agent's tryConsumeNearbyItem
      return {
        action: 'wait',
        reasoning: `Consuming ${item.type}`,
        confidence: 1.0
      };
    }

    return {
      action: 'wait',
      reasoning: 'No item to consume at current position',
      confidence: 1.0
    };
  }

  // ============================================
  // Survival Decision Making (Week 3)
  // ============================================

  /**
   * Make survival-focused decision when resources are critical
   * @param need - The urgent need (hunger, thirst, or energy)
   * @returns Decision to move toward item or null if no item found
   */
  private makeSurvivalDecision(need: 'hunger' | 'thirst' | 'energy'): Decision | null {
    // Map need to item type
    const targetType = need === 'hunger' ? ItemType.FOOD :
                      need === 'thirst' ? ItemType.WATER :
                      ItemType.ENERGY_DRINK;

    // Find nearest item of target type
    const nearestItem = this.findNearestItem(targetType);

    if (!nearestItem) {
      // No item found, return null to continue with normal decision
      return null;
    }

    // Calculate direction to item
    const agentPos = this.agent.getTilePosition();
    const itemPos = nearestItem.tilePosition;

    // Determine best direction (simple greedy approach)
    const dx = itemPos.x - agentPos.x;
    const dy = itemPos.y - agentPos.y;

    let direction: 'north' | 'south' | 'east' | 'west';

    // Prioritize axis with larger distance
    if (Math.abs(dx) > Math.abs(dy)) {
      direction = dx > 0 ? 'east' : 'west';
    } else {
      direction = dy > 0 ? 'south' : 'north';
    }

    // Check if direction is valid
    if (!this.isDirectionValid(direction)) {
      // Try other directions
      const alternatives = this.getAlternativeDirections(direction);
      const validDir = alternatives.find(dir => this.isDirectionValid(dir));

      if (!validDir) {
        return null; // No valid path, continue with normal decision
      }
      direction = validDir;
    }

    return {
      action: 'move',
      direction,
      reasoning: `Critical ${need}! Moving toward ${targetType} at (${itemPos.x}, ${itemPos.y})`,
      confidence: 0.9,
    };
  }

  /**
   * Find nearest item of specific type
   */
  private findNearestItem(type: ItemType): Item | null {
    if (!this.itemGenerator) return null;

    const agentPos = this.agent.getTilePosition();
    return this.itemGenerator.findNearestItem(agentPos, type);
  }

  /**
   * Check if direction is valid (not blocked by wall)
   */
  private isDirectionValid(direction: 'north' | 'south' | 'east' | 'west'): boolean {
    const agentTile = this.agent.getTilePosition();
    const dirMap = {
      north: { dx: 0, dy: -1 },
      south: { dx: 0, dy: 1 },
      east: { dx: 1, dy: 0 },
      west: { dx: -1, dy: 0 },
    };

    const { dx, dy } = dirMap[direction];
    const checkX = agentTile.x + dx;
    const checkY = agentTile.y + dy;

    // Check bounds
    if (checkX < 0 || checkX >= this.maze.width || checkY < 0 || checkY >= this.maze.height) {
      return false;
    }

    // Check if tile is walkable
    const tile = this.maze.tiles[checkY][checkX];
    const currentTile = this.maze.tiles[agentTile.y][agentTile.x];

    // Check wall
    const hasWall = this.checkWall(currentTile, direction);

    return !hasWall && tile.type !== TileType.WALL;
  }

  /**
   * Get alternative directions when primary direction is blocked
   */
  private getAlternativeDirections(blocked: 'north' | 'south' | 'east' | 'west'): ('north' | 'south' | 'east' | 'west')[] {
    const all: ('north' | 'south' | 'east' | 'west')[] = ['north', 'south', 'east', 'west'];
    return all.filter(dir => dir !== blocked);
  }
}
