// src/agent/Agent.ts
/**
 * Agent - Core agent class for Arth
 * 
 * Manages:
 * - Agent state (position, direction, stats)
 * - Movement logic (tile-to-tile discrete movement)
 * - Collision detection
 * - State updates
 * 
 * Week 1, Day 5-6: Basic movement and collision
 * Week 2+: AI decision-making, survival stats, memory
 */

import { Position, Direction, Maze, TileType, AgentState } from '../types';
import { ARTH_PROFILE, ARTH_INITIAL_STATS } from '../config/arth.profile';
import { CONSTANTS } from '../config/game.config';

export class Agent {
  // State
  private state: AgentState;
  
  // Position tracking
  private currentPosition: Position;      // World coordinates (pixels)
  private tilePosition: Position;         // Tile coordinates
  private targetPosition: Position | null = null;  // Target world position
  
  // Movement
  private moveProgress: number = 0;       // 0-1 interpolation progress
  private moveSpeed: number;              // Tiles per second
  
  // Reference to maze
  private maze: Maze;
  
  constructor(maze: Maze, startTile: Position) {
    this.maze = maze;
    this.tilePosition = { ...startTile };
    
    // Convert tile to world coordinates (center of tile)
    this.currentPosition = this.tileToWorld(startTile);
    
    // Initialize state
    this.state = {
      name: ARTH_PROFILE.identity.name,
      age: ARTH_PROFILE.identity.age,
      position: { ...this.currentPosition },
      facing: Direction.DOWN,
      isMoving: false,
      moveSpeed: ARTH_INITIAL_STATS.baseSpeed,
      
      // Physical stats (Week 2+)
      hunger: ARTH_INITIAL_STATS.hunger,
      thirst: ARTH_INITIAL_STATS.thirst,
      energy: ARTH_INITIAL_STATS.energy,
      health: ARTH_INITIAL_STATS.health,
      stress: ARTH_INITIAL_STATS.stress,
      
      // Inventory (Week 2+)
      foodCarried: ARTH_INITIAL_STATS.foodCarried,
      waterCarried: ARTH_INITIAL_STATS.waterCarried,
      items: [...ARTH_INITIAL_STATS.items],
      carryWeight: ARTH_INITIAL_STATS.carryWeight,
      
      // Time tracking (Week 2+)
      hoursPassed: 0,
      daysPassed: 0,
      sleepDeprivation: 0,
      
      // Status flags
      isAlive: true,
      isSleeping: false,
      isInjured: false,
      isHallucinating: false,
    };
    
    this.moveSpeed = this.state.moveSpeed;
    
    console.log(`👤 Agent "${this.state.name}" created at tile (${startTile.x}, ${startTile.y})`);
    console.log(`   World position: (${this.currentPosition.x}, ${this.currentPosition.y})`);
  }
  
  /**
   * Start moving to target tile
   * Returns true if movement started, false if blocked
   */
  moveTo(targetTile: Position): boolean {
    // Validate move
    if (!this.canMoveTo(targetTile)) {
      console.log(`❌ Cannot move to tile (${targetTile.x}, ${targetTile.y})`);
      return false;
    }
    
    // Setup movement
    this.targetPosition = this.tileToWorld(targetTile);
    this.state.isMoving = true;
    this.moveProgress = 0;
    
    // Update facing direction
    this.updateFacing(targetTile);
    
    console.log(`→ Moving from (${this.tilePosition.x}, ${this.tilePosition.y}) to (${targetTile.x}, ${targetTile.y})`);
    
    return true;
  }
  
  /**
   * Update agent state (called every frame)
   * @param deltaTime - Time since last frame (seconds)
   */
  update(deltaTime: number): void {
    if (!this.state.isMoving || !this.targetPosition) return;
    
    // Calculate distance to move this frame
    const speed = this.moveSpeed * CONSTANTS.TILE_SIZE; // Convert to pixels/second
    const moveDistance = speed * deltaTime;
    
    // Calculate direction vector
    const dx = this.targetPosition.x - this.currentPosition.x;
    const dy = this.targetPosition.y - this.currentPosition.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    if (distance <= moveDistance) {
      // Arrived at target tile
      this.currentPosition = { ...this.targetPosition };
      this.tilePosition = this.worldToTile(this.currentPosition);
      this.targetPosition = null;
      this.state.isMoving = false;
      this.moveProgress = 1;
      
      console.log(`✓ Arrived at tile (${this.tilePosition.x}, ${this.tilePosition.y})`);
    } else {
      // Move toward target
      const ratio = moveDistance / distance;
      this.currentPosition.x += dx * ratio;
      this.currentPosition.y += dy * ratio;
      
      // Update progress (0 to 1)
      const totalDistance = CONSTANTS.TILE_SIZE;
      const distanceRemaining = distance - moveDistance;
      this.moveProgress = 1 - (distanceRemaining / totalDistance);
    }
    
    // Update state position
    this.state.position = { ...this.currentPosition };
  }
  
  /**
   * Check if agent can move to target tile
   */
  canMoveTo(targetTile: Position): boolean {
    // 1. Check if already moving
    if (this.state.isMoving) {
      return false;
    }
    
    // 2. Check bounds
    if (targetTile.x < 0 || targetTile.x >= this.maze.width) {
      return false;
    }
    if (targetTile.y < 0 || targetTile.y >= this.maze.height) {
      return false;
    }
    
    // 3. Check if adjacent (only allow orthogonal moves)
    const dx = Math.abs(targetTile.x - this.tilePosition.x);
    const dy = Math.abs(targetTile.y - this.tilePosition.y);
    if (dx + dy !== 1) {
      return false; // Not adjacent or diagonal move
    }
    
    // 4. Check target tile type
    const tile = this.maze.tiles[targetTile.y][targetTile.x];
    if (tile.type === TileType.WALL) {
      return false;
    }
    
    // 5. Check walls between current and target tile
    const currentTile = this.maze.tiles[this.tilePosition.y][this.tilePosition.x];
    
    if (targetTile.x > this.tilePosition.x) {
      // Moving right - check east wall of current tile
      if (currentTile.walls.east) return false;
    } else if (targetTile.x < this.tilePosition.x) {
      // Moving left - check west wall of current tile
      if (currentTile.walls.west) return false;
    } else if (targetTile.y > this.tilePosition.y) {
      // Moving down - check south wall of current tile
      if (currentTile.walls.south) return false;
    } else if (targetTile.y < this.tilePosition.y) {
      // Moving up - check north wall of current tile
      if (currentTile.walls.north) return false;
    }
    
    return true;
  }
  
  /**
   * Stop current movement
   */
  stopMovement(): void {
    if (this.state.isMoving) {
      console.log('⏸️  Movement stopped');
      this.state.isMoving = false;
      this.targetPosition = null;
      this.moveProgress = 0;
      
      // Snap to current tile center
      this.currentPosition = this.tileToWorld(this.tilePosition);
      this.state.position = { ...this.currentPosition };
    }
  }
  
  /**
   * Update facing direction based on target tile
   */
  private updateFacing(targetTile: Position): void {
    if (targetTile.x > this.tilePosition.x) {
      this.state.facing = Direction.RIGHT;
    } else if (targetTile.x < this.tilePosition.x) {
      this.state.facing = Direction.LEFT;
    } else if (targetTile.y > this.tilePosition.y) {
      this.state.facing = Direction.DOWN;
    } else if (targetTile.y < this.tilePosition.y) {
      this.state.facing = Direction.UP;
    }
  }
  
  /**
   * Convert tile coordinates to world coordinates (center of tile)
   */
  private tileToWorld(tilePos: Position): Position {
    return {
      x: tilePos.x * CONSTANTS.TILE_SIZE + CONSTANTS.TILE_SIZE / 2,
      y: tilePos.y * CONSTANTS.TILE_SIZE + CONSTANTS.TILE_SIZE / 2
    };
  }
  
  /**
   * Convert world coordinates to tile coordinates
   */
  private worldToTile(worldPos: Position): Position {
    return {
      x: Math.floor(worldPos.x / CONSTANTS.TILE_SIZE),
      y: Math.floor(worldPos.y / CONSTANTS.TILE_SIZE)
    };
  }
  
  // ============================================
  // Getters
  // ============================================
  
  /**
   * Get current position in world coordinates
   */
  getPosition(): Position {
    return { ...this.currentPosition };
  }
  
  /**
   * Get current tile position
   */
  getTilePosition(): Position {
    return { ...this.tilePosition };
  }
  
  /**
   * Get facing direction
   */
  getFacing(): Direction {
    return this.state.facing;
  }
  
  /**
   * Check if agent is currently moving
   */
  isMoving(): boolean {
    return this.state.isMoving;
  }
  
  /**
   * Get movement progress (0-1)
   */
  getMoveProgress(): number {
    return this.moveProgress;
  }
  
  /**
   * Get full agent state (for debugging/UI)
   */
  getState(): AgentState {
    return { ...this.state };
  }
  
  /**
   * Get agent name
   */
  getName(): string {
    return this.state.name;
  }
  
  // ============================================
  // Stats (Week 2+)
  // ============================================
  
  getHunger(): number {
    return this.state.hunger;
  }
  
  getThirst(): number {
    return this.state.thirst;
  }
  
  getEnergy(): number {
    return this.state.energy;
  }
  
  getHealth(): number {
    return this.state.health;
  }
  
  getStress(): number {
    return this.state.stress;
  }
  
  // ============================================
  // Debug
  // ============================================
  
  /**
   * Get debug info
   */
  getDebugInfo(): string {
    return `Agent: ${this.state.name}
Position: (${this.currentPosition.x.toFixed(1)}, ${this.currentPosition.y.toFixed(1)})
Tile: (${this.tilePosition.x}, ${this.tilePosition.y})
Facing: ${Direction[this.state.facing]}
Moving: ${this.state.isMoving}
Progress: ${(this.moveProgress * 100).toFixed(1)}%
Speed: ${this.moveSpeed} tiles/sec`;
  }
}
