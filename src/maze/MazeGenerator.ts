// src/maze/MazeGenerator.ts
/**
 * MazeGenerator - Procedural maze generation using recursive backtracking
 * 
 * Algorithm: Recursive Backtracking (DFS-based)
 * 
 * 1. Start with grid of cells, all walls intact
 * 2. Pick random starting cell, mark as visited
 * 3. While there are unvisited neighbors:
 *    a. Choose random unvisited neighbor
 *    b. Remove wall between current and chosen cell
 *    c. Recursively visit the chosen cell
 * 4. When stuck (no unvisited neighbors), backtrack
 * 
 * This creates a "perfect maze" (one solution, no loops)
 * We then add complexity by creating loops and dead ends
 */

import seedrandom from 'seedrandom';
import { Maze, MazeConfig, TileType, Position } from '@/types/index';
import { Tile } from './Tile';

export class MazeGenerator {
  private rng!: () => number; // Seeded random number generator
  private width!: number;
  private height!: number;
  private tiles: Tile[][] = [];
  
  /**
   * Generate a new procedural maze
   * 
   * @param config - Maze configuration (size, complexity, seed)
   * @returns Complete Maze object
   */
  generate(config: MazeConfig): Maze {
    this.width = config.width;
    this.height = config.height;
    
    // Initialize seeded random number generator for reproducibility
    const seed = config.seed || Date.now().toString();
    this.rng = seedrandom(seed);
    
    console.log(`🧩 Generating ${this.width}×${this.height} maze (seed: ${seed})`);
    
    // Step 1: Create grid of tiles (all walls intact initially)
    this.initializeGrid();
    
    // Step 2: Generate perfect maze using recursive backtracking
    const startX = Math.floor(this.width / 2);
    const startY = Math.floor(this.height / 2);
    this.carvePath(startX, startY);
    
    // Step 3: Add complexity (loops, branches) based on complexity setting
    this.addComplexity(config.complexity);
    
    // Step 4: Add intentional dead ends
    this.addDeadEnds(config.deadEnds);
    
    // Step 5: Place entrance and exit
    const entrance = config.entrancePosition || this.findEntrancePosition();
    const exit = config.exitPosition || this.findExitPosition(entrance);
    
    this.tiles[entrance.y][entrance.x].type = TileType.ENTRANCE;
    this.tiles[exit.y][exit.x].type = TileType.EXIT;
    
    console.log(`✅ Maze generated: ${entrance.x},${entrance.y} → ${exit.x},${exit.y}`);
    
    // Step 6: Create and return Maze object
    return {
      width: this.width,
      height: this.height,
      tiles: this.tiles,
      entrance,
      exit,
      resources: [], // Resources added in Week 3
      seed,
    };
  }
  
  /**
   * Initialize grid with all tiles and walls intact
   */
  private initializeGrid(): void {
    this.tiles = [];
    
    for (let y = 0; y < this.height; y++) {
      const row: Tile[] = [];
      for (let x = 0; x < this.width; x++) {
        row.push(new Tile(x, y, TileType.FLOOR));
      }
      this.tiles.push(row);
    }
  }
  
  /**
   * Recursive backtracking algorithm to carve maze paths
   * This is the core maze generation algorithm
   * 
   * @param x - Current X position
   * @param y - Current Y position
   */
  private carvePath(x: number, y: number): void {
    const current = this.tiles[y][x];
    current.visited = true;
    
    // Get all unvisited neighbors in random order
    const neighbors = this.getUnvisitedNeighbors(x, y);
    this.shuffleArray(neighbors);
    
    // Visit each unvisited neighbor
    for (const neighbor of neighbors) {
      const nx = neighbor.x;
      const ny = neighbor.y;
      const next = this.tiles[ny][nx];
      
      // If neighbor hasn't been visited yet
      if (!next.visited) {
        // Remove wall between current and neighbor
        this.removeWallBetween(current, next);
        
        // Recursively carve from neighbor
        this.carvePath(nx, ny);
      }
    }
  }
  
  /**
   * Get all unvisited neighbors of a cell
   * 
   * @param x - Cell X coordinate
   * @param y - Cell Y coordinate
   * @returns Array of neighbor positions
   */
  private getUnvisitedNeighbors(x: number, y: number): Position[] {
    const neighbors: Position[] = [];
    
    // North
    if (y > 0 && !this.tiles[y - 1][x].visited) {
      neighbors.push({ x, y: y - 1 });
    }
    
    // South
    if (y < this.height - 1 && !this.tiles[y + 1][x].visited) {
      neighbors.push({ x, y: y + 1 });
    }
    
    // East
    if (x < this.width - 1 && !this.tiles[y][x + 1].visited) {
      neighbors.push({ x: x + 1, y });
    }
    
    // West
    if (x > 0 && !this.tiles[y][x - 1].visited) {
      neighbors.push({ x: x - 1, y });
    }
    
    return neighbors;
  }
  
  /**
   * Get all valid neighbors (within bounds)
   * Used for adding complexity
   */
  private getAllNeighbors(x: number, y: number): Position[] {
    const neighbors: Position[] = [];
    
    if (y > 0) neighbors.push({ x, y: y - 1 }); // North
    if (y < this.height - 1) neighbors.push({ x, y: y + 1 }); // South
    if (x < this.width - 1) neighbors.push({ x: x + 1, y }); // East
    if (x > 0) neighbors.push({ x: x - 1, y }); // West
    
    return neighbors;
  }
  
  /**
   * Remove wall between two adjacent tiles
   * 
   * @param tile1 - First tile
   * @param tile2 - Adjacent tile
   */
  private removeWallBetween(tile1: Tile, tile2: Tile): void {
    const dx = tile2.position.x - tile1.position.x;
    const dy = tile2.position.y - tile1.position.y;
    
    // Determine direction and remove corresponding walls
    if (dx === 1) {
      // tile2 is to the east of tile1
      tile1.removeWall('east');
      tile2.removeWall('west');
    } else if (dx === -1) {
      // tile2 is to the west of tile1
      tile1.removeWall('west');
      tile2.removeWall('east');
    } else if (dy === 1) {
      // tile2 is to the south of tile1
      tile1.removeWall('south');
      tile2.removeWall('north');
    } else if (dy === -1) {
      // tile2 is to the north of tile1
      tile1.removeWall('north');
      tile2.removeWall('south');
    }
  }
  
  /**
   * Add complexity by removing additional walls to create loops
   * Higher complexity = more branching paths
   * 
   * @param complexity - 0-1 scale (0.7 = 70% chance to add loops)
   */
  private addComplexity(complexity: number): void {
    const wallsToRemove = Math.floor(
      this.width * this.height * complexity * 0.3
    );
    
    console.log(`  Adding complexity: removing ${wallsToRemove} walls`);
    
    for (let i = 0; i < wallsToRemove; i++) {
      // Pick random tile
      const x = Math.floor(this.rng() * this.width);
      const y = Math.floor(this.rng() * this.height);
      const tile = this.tiles[y][x];
      
      // Pick random neighbor
      const neighbors = this.getAllNeighbors(x, y);
      if (neighbors.length === 0) continue;
      
      const randomNeighbor = neighbors[Math.floor(this.rng() * neighbors.length)];
      const neighbor = this.tiles[randomNeighbor.y][randomNeighbor.x];
      
      // Remove wall between them (creates loop)
      this.removeWallBetween(tile, neighbor);
    }
  }
  
  /**
   * Add intentional dead ends for challenge
   * Dead ends make the maze more difficult by creating false paths
   * 
   * @param count - Number of dead ends to add
   */
  private addDeadEnds(count: number): void {
    console.log(`  Adding ${count} dead ends`);
    
    let added = 0;
    let attempts = 0;
    const maxAttempts = count * 10;
    
    while (added < count && attempts < maxAttempts) {
      attempts++;
      
      // Pick random tile
      const x = Math.floor(this.rng() * this.width);
      const y = Math.floor(this.rng() * this.height);
      const tile = this.tiles[y][x];
      
      // Skip if already a dead end or has too few openings
      if (tile.isDeadEnd() || tile.getWallCount() >= 3) {
        continue;
      }
      
      // Close off random walls to create dead end (leave only 1 opening)
      const openings = tile.getOpenings();
      const keepOpening = openings[Math.floor(this.rng() * openings.length)];
      
      // Close all other openings
      const directions: Array<'north' | 'south' | 'east' | 'west'> = [
        'north',
        'south',
        'east',
        'west',
      ];
      
      for (const dir of directions) {
        if (dir !== keepOpening) {
          tile.addWall(dir);
          
          // Also add wall on neighbor's side
          const neighbor = this.getNeighborInDirection(x, y, dir);
          if (neighbor) {
            const oppositeDir = this.getOppositeDirection(dir);
            neighbor.addWall(oppositeDir);
          }
        }
      }
      
      added++;
    }
  }
  
  /**
   * Get neighbor tile in specific direction
   */
  private getNeighborInDirection(
    x: number,
    y: number,
    direction: 'north' | 'south' | 'east' | 'west'
  ): Tile | null {
    let nx = x;
    let ny = y;
    
    switch (direction) {
      case 'north':
        ny--;
        break;
      case 'south':
        ny++;
        break;
      case 'east':
        nx++;
        break;
      case 'west':
        nx--;
        break;
    }
    
    // Check bounds
    if (nx < 0 || nx >= this.width || ny < 0 || ny >= this.height) {
      return null;
    }
    
    return this.tiles[ny][nx];
  }
  
  /**
   * Get opposite direction
   */
  private getOppositeDirection(
    direction: 'north' | 'south' | 'east' | 'west'
  ): 'north' | 'south' | 'east' | 'west' {
    const opposites = {
      north: 'south' as const,
      south: 'north' as const,
      east: 'west' as const,
      west: 'east' as const,
    };
    return opposites[direction];
  }
  
  /**
   * Find good position for entrance (typically on edge)
   */
  private findEntrancePosition(): Position {
    // Place on left edge, middle
    return {
      x: 0,
      y: Math.floor(this.height / 2),
    };
  }
  
  /**
   * Find good position for exit (far from entrance)
   */
  private findExitPosition(_entrance: Position): Position {
    // Place on opposite corner from entrance
    // If entrance is on left, put exit on right
    return {
      x: this.width - 1,
      y: Math.floor(this.height / 2),
    };
  }
  
  /**
   * Shuffle array in place (Fisher-Yates algorithm)
   * Used to randomize neighbor order
   */
  private shuffleArray<T>(array: T[]): void {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(this.rng() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
  }
}
