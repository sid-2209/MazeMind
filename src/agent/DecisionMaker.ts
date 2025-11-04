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

  // Decision tracking
  private lastDecisionTime: number = 0;
  private decisionInterval: number = 3000; // 3 seconds between decisions
  private consecutiveWaitCount: number = 0;

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
      // Check if LLM is available (not in heuristic mode)
      const provider = this.llmService.getCurrentProvider();

      if (provider === 'heuristic' || !this.llmService.isProviderAvailable()) {
        return this.makeHeuristicDecision();
      }

      // Gather context for LLM decision
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
  }> {
    const position = this.agent.getTilePosition();
    const stats = this.agent.getState();

    // Get surroundings description
    const surroundings = this.describeSurroundings();

    // Get recent memories
    const recentMems = this.agent.getRecentMemories(5);
    const recentMemories = recentMems.map(m => m.description);

    // Query for relevant memories
    const query = `I am at position (${position.x}, ${position.y}). ${surroundings}`;
    const relevant = await this.memoryRetrieval.retrieve(query, 5);
    const relevantMemories = relevant.map(r => r.memory.description);

    return {
      position,
      surroundings,
      recentMemories,
      relevantMemories,
      stats,
      goal: this.getCurrentGoal(),
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
}
