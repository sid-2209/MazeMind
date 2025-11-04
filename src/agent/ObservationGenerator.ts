// src/agent/ObservationGenerator.ts
/**
 * ObservationGenerator - Converts agent perceptions to natural language (Week 2, Day 1)
 *
 * Generates contextual observations from:
 * - Visual perception (what Arth sees around him)
 * - Internal states (hunger, thirst, energy, stress)
 * - Events (finding resources, hitting walls, discoveries)
 *
 * Importance scoring heuristics:
 * - Mundane observations (3-4): Normal movement, empty corridors
 * - Notable observations (5-6): New areas, direction changes
 * - Important observations (7-8): Resources found, critical states
 * - Critical observations (9-10): Life-threatening situations, major discoveries
 */

import { Agent } from './Agent';
import { Maze, TileType, Direction, Position } from '../types';
import { FogOfWar } from '../rendering/FogOfWar';

interface ObservationContext {
  agent: Agent;
  maze: Maze;
  fogOfWar?: FogOfWar | null;
  deltaTime: number;
}

export class ObservationGenerator {
  // Debouncing - don't generate identical observations too frequently
  private lastObservations: Map<string, number> = new Map();
  private observationCooldown: number = 2000; // 2 seconds between similar observations

  // Track previous state for change detection
  private lastPosition?: Position;
  private lastDirection?: Direction;
  private lastHealth?: number;

  constructor() {
    console.log('👁️  ObservationGenerator initialized');
  }

  /**
   * Generate all observations for current frame
   * Returns array of [description, importance, tags, location?]
   */
  generateObservations(context: ObservationContext): Array<{
    description: string;
    importance: number;
    tags: string[];
    location?: Position;
  }> {
    const observations: Array<{
      description: string;
      importance: number;
      tags: string[];
      location?: Position;
    }> = [];

    // Generate visual perceptions (what Arth sees)
    const visualObs = this.generateVisualObservations(context);
    observations.push(...visualObs);

    // Generate internal state observations
    const internalObs = this.generateInternalStateObservations(context);
    observations.push(...internalObs);

    // Generate movement observations
    const movementObs = this.generateMovementObservations(context);
    observations.push(...movementObs);

    // Update tracking state
    this.updateTrackingState(context.agent);

    return observations.filter(obs => this.shouldRecordObservation(obs.description));
  }

  /**
   * Generate visual perception observations
   * What does Arth see around him?
   */
  private generateVisualObservations(context: ObservationContext): Array<{
    description: string;
    importance: number;
    tags: string[];
    location: Position;
  }> {
    const observations: Array<{
      description: string;
      importance: number;
      tags: string[];
      location: Position;
    }> = [];

    const agentTile = context.agent.getTilePosition();
    const location = context.agent.getPosition();

    // Check surrounding tiles
    const directions = [
      { dir: 'north', dx: 0, dy: -1 },
      { dir: 'east', dx: 1, dy: 0 },
      { dir: 'south', dx: 0, dy: 1 },
      { dir: 'west', dx: -1, dy: 0 },
    ];

    const openings: string[] = [];
    const walls: string[] = [];

    for (const { dir, dx, dy } of directions) {
      const checkX = agentTile.x + dx;
      const checkY = agentTile.y + dy;

      // Check bounds
      if (checkX < 0 || checkX >= context.maze.width || checkY < 0 || checkY >= context.maze.height) {
        walls.push(dir);
        continue;
      }

      const tile = context.maze.tiles[checkY][checkX];
      const currentTile = context.maze.tiles[agentTile.y][agentTile.x];

      // Check if there's a wall between current tile and target tile
      const hasWall = this.checkWallBetween(currentTile, dir);

      if (hasWall || tile.type === TileType.WALL) {
        walls.push(dir);
      } else {
        openings.push(dir);
      }
    }

    // Generate description based on surroundings
    if (openings.length === 0) {
      observations.push({
        description: `I'm in a dead end with walls on all sides. I need to turn back.`,
        importance: 6, // Dead ends are notable
        tags: ['perception', 'dead-end', 'navigation'],
        location,
      });
    } else if (openings.length === 1) {
      observations.push({
        description: `I'm in a corridor with a path to the ${openings[0]}. Walls block the other directions.`,
        importance: 4, // Simple corridor
        tags: ['perception', 'corridor', 'navigation'],
        location,
      });
    } else if (openings.length >= 3) {
      const dirs = openings.join(', ');
      observations.push({
        description: `I'm at a junction with openings to the ${dirs}. This is a decision point.`,
        importance: 6, // Junctions are important for navigation
        tags: ['perception', 'junction', 'navigation', 'choice'],
        location,
      });
    }

    // Check if at entrance or exit
    if (agentTile.x === context.maze.entrance.x && agentTile.y === context.maze.entrance.y) {
      observations.push({
        description: `I'm at the entrance where I started. This is position (${agentTile.x}, ${agentTile.y}).`,
        importance: 7,
        tags: ['perception', 'entrance', 'landmark'],
        location,
      });
    }

    if (agentTile.x === context.maze.exit.x && agentTile.y === context.maze.exit.y) {
      observations.push({
        description: `I found the exit at position (${agentTile.x}, ${agentTile.y})! This is the way out!`,
        importance: 10, // Finding exit is critical!
        tags: ['perception', 'exit', 'landmark', 'success', 'critical'],
        location,
      });
    }

    return observations;
  }

  /**
   * Check if there's a wall in a given direction from a tile
   */
  private checkWallBetween(tile: any, direction: string): boolean {
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
   * Generate internal state observations
   * How is Arth feeling?
   */
  private generateInternalStateObservations(context: ObservationContext): Array<{
    description: string;
    importance: number;
    tags: string[];
    location?: Position;
  }> {
    const observations: Array<{
      description: string;
      importance: number;
      tags: string[];
      location?: Position;
    }> = [];

    const state = context.agent.getState();
    const location = context.agent.getPosition();

    // Check for critical health states
    if (state.health < 20 && (!this.lastHealth || state.health < this.lastHealth)) {
      observations.push({
        description: `My health is critically low at ${Math.round(state.health)}%. I'm in serious danger.`,
        importance: 10,
        tags: ['internal', 'health', 'critical', 'danger'],
        location,
      });
    } else if (state.health < 40 && (!this.lastHealth || Math.abs(state.health - this.lastHealth) > 10)) {
      observations.push({
        description: `My health has dropped to ${Math.round(state.health)}%. I need to be careful.`,
        importance: 7,
        tags: ['internal', 'health', 'warning'],
        location,
      });
    }

    // Check hunger (Week 2+ will actually deplete these)
    if (state.hunger < 30) {
      observations.push({
        description: `I'm getting very hungry. My hunger is at ${Math.round(state.hunger)}%.`,
        importance: 8,
        tags: ['internal', 'hunger', 'survival', 'warning'],
        location,
      });
    }

    // Check thirst
    if (state.thirst < 30) {
      observations.push({
        description: `I'm extremely thirsty. My thirst is at ${Math.round(state.thirst)}%.`,
        importance: 8,
        tags: ['internal', 'thirst', 'survival', 'warning'],
        location,
      });
    }

    // Check energy
    if (state.energy < 20) {
      observations.push({
        description: `I'm exhausted. My energy is at ${Math.round(state.energy)}%. I can barely move.`,
        importance: 8,
        tags: ['internal', 'energy', 'exhaustion', 'warning'],
        location,
      });
    }

    return observations;
  }

  /**
   * Generate movement observations
   * Track where Arth is going
   */
  private generateMovementObservations(context: ObservationContext): Array<{
    description: string;
    importance: number;
    tags: string[];
    location: Position;
  }> {
    const observations: Array<{
      description: string;
      importance: number;
      tags: string[];
      location: Position;
    }> = [];

    const currentPos = context.agent.getTilePosition();
    const currentDir = context.agent.getFacing();
    const location = context.agent.getPosition();

    // Check if position changed
    if (this.lastPosition &&
        (this.lastPosition.x !== currentPos.x || this.lastPosition.y !== currentPos.y)) {
      const directionName = this.getDirectionName(currentDir);

      observations.push({
        description: `I moved ${directionName} to position (${currentPos.x}, ${currentPos.y}).`,
        importance: 3, // Movement is mundane
        tags: ['movement', 'navigation', 'position'],
        location,
      });
    }

    // Check if direction changed (turning without moving)
    if (this.lastDirection !== undefined &&
        this.lastDirection !== currentDir &&
        this.lastPosition &&
        this.lastPosition.x === currentPos.x &&
        this.lastPosition.y === currentPos.y) {
      const directionName = this.getDirectionName(currentDir);

      observations.push({
        description: `I turned to face ${directionName}.`,
        importance: 2, // Turning is very mundane
        tags: ['movement', 'direction'],
        location,
      });
    }

    return observations;
  }

  /**
   * Get direction name from Direction enum
   */
  private getDirectionName(direction: Direction): string {
    switch (direction) {
      case Direction.UP:
        return 'north';
      case Direction.RIGHT:
        return 'east';
      case Direction.DOWN:
        return 'south';
      case Direction.LEFT:
        return 'west';
      default:
        return 'unknown';
    }
  }

  /**
   * Update tracking state for change detection
   */
  private updateTrackingState(agent: Agent): void {
    this.lastPosition = agent.getTilePosition();
    this.lastDirection = agent.getFacing();
    this.lastHealth = agent.getHealth();
  }

  /**
   * Determine if observation should be recorded (debouncing)
   */
  private shouldRecordObservation(description: string): boolean {
    const now = Date.now();
    const lastTime = this.lastObservations.get(description);

    // If same observation was made recently, skip it
    if (lastTime && now - lastTime < this.observationCooldown) {
      return false;
    }

    // Record this observation time
    this.lastObservations.set(description, now);

    // Clean up old entries (older than 10 seconds)
    for (const [key, time] of this.lastObservations.entries()) {
      if (now - time > 10000) {
        this.lastObservations.delete(key);
      }
    }

    return true;
  }

  /**
   * Generate a one-time event observation (external call)
   * For special events like finding resources
   */
  generateEventObservation(
    description: string,
    importance: number,
    tags: string[],
    location?: Position
  ): {
    description: string;
    importance: number;
    tags: string[];
    location?: Position;
  } | null {
    if (!this.shouldRecordObservation(description)) {
      return null;
    }

    return {
      description,
      importance: Math.max(1, Math.min(10, importance)),
      tags: [...tags, 'event'],
      location,
    };
  }

  /**
   * Reset tracking state (useful for testing)
   */
  reset(): void {
    this.lastObservations.clear();
    this.lastPosition = undefined;
    this.lastDirection = undefined;
    this.lastHealth = undefined;
  }
}
