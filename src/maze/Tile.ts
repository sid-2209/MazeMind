// src/maze/Tile.ts
/**
 * Tile - Individual cell in the maze
 * 
 * Each tile has a type (wall, floor, entrance, exit) and tracks
 * which walls exist on its four sides. During maze generation,
 * we "carve" paths by removing walls between tiles.
 */

import { TileType, Position, ResourceType } from '@/types/index';

export class Tile {
  // Tile properties
  type: TileType;
  position: Position;
  
  // Wall configuration (true = wall exists)
  walls: {
    north: boolean;
    south: boolean;
    east: boolean;
    west: boolean;
  };
  
  // Exploration state (for fog of war - Week 1 Day 8)
  isExplored: boolean = false;
  isVisible: boolean = false;
  
  // Resource tracking (Week 3)
  hasResource: boolean = false;
  resourceType?: ResourceType;
  
  // Maze generation metadata
  visited: boolean = false; // For generation algorithm
  
  /**
   * Create a new tile
   * @param x - X coordinate in maze grid
   * @param y - Y coordinate in maze grid
   * @param type - Type of tile (default: FLOOR)
   */
  constructor(x: number, y: number, type: TileType = TileType.FLOOR) {
    this.position = { x, y };
    this.type = type;
    
    // Initially, all walls exist (solid block)
    this.walls = {
      north: true,
      south: true,
      east: true,
      west: true,
    };
  }
  
  /**
   * Check if this tile can be walked through
   * @returns true if agent can move through this tile
   */
  isWalkable(): boolean {
    return this.type !== TileType.WALL;
  }
  
  /**
   * Remove wall between this tile and an adjacent tile
   * This is how we "carve" paths during maze generation
   * 
   * @param direction - Which wall to remove ('north', 'south', 'east', 'west')
   */
  removeWall(direction: 'north' | 'south' | 'east' | 'west'): void {
    this.walls[direction] = false;
  }
  
  /**
   * Add wall (useful for creating dead ends or obstacles)
   * @param direction - Which wall to add
   */
  addWall(direction: 'north' | 'south' | 'east' | 'west'): void {
    this.walls[direction] = true;
  }
  
  /**
   * Check if wall exists in direction
   * @param direction - Direction to check
   * @returns true if wall exists
   */
  hasWall(direction: 'north' | 'south' | 'east' | 'west'): boolean {
    return this.walls[direction];
  }
  
  /**
   * Get number of walls surrounding this tile
   * @returns count (0-4)
   */
  getWallCount(): number {
    let count = 0;
    if (this.walls.north) count++;
    if (this.walls.south) count++;
    if (this.walls.east) count++;
    if (this.walls.west) count++;
    return count;
  }
  
  /**
   * Check if this is a dead end (only one opening)
   * @returns true if tile has 3 walls (one way in/out)
   */
  isDeadEnd(): boolean {
    return this.getWallCount() === 3;
  }
  
  /**
   * Check if this is a corridor (two opposite openings)
   * @returns true if tile is a straight corridor
   */
  isCorridor(): boolean {
    const wallCount = this.getWallCount();
    if (wallCount !== 2) return false;
    
    // Check for opposite walls (north-south or east-west)
    return (
      (this.walls.north && this.walls.south) ||
      (this.walls.east && this.walls.west)
    );
  }
  
  /**
   * Check if this is a junction (3+ openings)
   * @returns true if tile is an intersection
   */
  isJunction(): boolean {
    return this.getWallCount() <= 1;
  }
  
  /**
   * Get list of available exits (directions without walls)
   * @returns array of directions ['north', 'east', etc.]
   */
  getOpenings(): Array<'north' | 'south' | 'east' | 'west'> {
    const openings: Array<'north' | 'south' | 'east' | 'west'> = [];
    
    if (!this.walls.north) openings.push('north');
    if (!this.walls.south) openings.push('south');
    if (!this.walls.east) openings.push('east');
    if (!this.walls.west) openings.push('west');
    
    return openings;
  }
  
  /**
   * Convert to simple character for console visualization
   * @returns single character representing this tile
   */
  toChar(): string {
    switch (this.type) {
      case TileType.WALL:
        return '█'; // Solid block
      case TileType.ENTRANCE:
        return 'S'; // Start
      case TileType.EXIT:
        return 'E'; // Exit
      case TileType.FLOOR:
        // Show as space or dot based on wall configuration
        if (this.getWallCount() === 4) return '█'; // Fully enclosed
        return ' '; // Open path
      default:
        return '?';
    }
  }
  
  /**
   * Create a copy of this tile
   * @returns new Tile instance with same properties
   */
  clone(): Tile {
    const newTile = new Tile(this.position.x, this.position.y, this.type);
    newTile.walls = { ...this.walls };
    newTile.isExplored = this.isExplored;
    newTile.isVisible = this.isVisible;
    newTile.hasResource = this.hasResource;
    newTile.resourceType = this.resourceType;
    newTile.visited = this.visited;
    return newTile;
  }
  
  /**
   * Reset tile to initial state (for testing)
   */
  reset(): void {
    this.walls = {
      north: true,
      south: true,
      east: true,
      west: true,
    };
    this.visited = false;
    this.isExplored = false;
    this.isVisible = false;
    this.hasResource = false;
    this.resourceType = undefined;
  }
}
