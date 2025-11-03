// src/maze/MazeVisualizer.ts
/**
 * MazeVisualizer - Console-based maze visualization
 * 
 * Converts maze to ASCII art for debugging and testing
 * Helps visualize the maze structure before rendering in PixiJS
 */

import { Maze } from '@/types/index';
import { Tile } from './Tile';

export class MazeVisualizer {
  /**
   * Convert maze to ASCII art string
   * 
   * Uses box-drawing characters to show walls and paths
   * S = Start (entrance)
   * E = Exit
   * █ = Wall
   * · = Open path
   * 
   * @param maze - The maze to visualize
   * @returns Multi-line string representation
   */
  static toAscii(maze: Maze): string {
    const lines: string[] = [];
    
    // Top border
    lines.push('┌' + '─'.repeat(maze.width * 2) + '┐');
    
    // Each row
    for (let y = 0; y < maze.height; y++) {
      let line = '│';
      
      for (let x = 0; x < maze.width; x++) {
        const tile = maze.tiles[y][x] as Tile;
        
        // Check if this is entrance or exit
        if (tile.position.x === maze.entrance.x && tile.position.y === maze.entrance.y) {
          line += 'S ';
        } else if (tile.position.x === maze.exit.x && tile.position.y === maze.exit.y) {
          line += 'E ';
        } else if (tile.getWallCount() === 4) {
          // Fully walled (shouldn't happen after generation)
          line += '█ ';
        } else {
          // Show path with dot
          line += '· ';
        }
      }
      
      line += '│';
      lines.push(line);
    }
    
    // Bottom border
    lines.push('└' + '─'.repeat(maze.width * 2) + '┘');
    
    return lines.join('\n');
  }
  
  /**
   * Detailed wall visualization showing individual walls
   * More detailed than toAscii, shows actual wall structure
   * 
   * @param maze - The maze to visualize
   * @returns Detailed ASCII representation
   */
  static toDetailedAscii(maze: Maze): string {
    const lines: string[] = [];
    
    for (let y = 0; y < maze.height; y++) {
      // Line for top walls
      let topLine = '';
      for (let x = 0; x < maze.width; x++) {
        const tile = maze.tiles[y][x] as Tile;
        topLine += '+';
        topLine += tile.hasWall('north') ? '---' : '   ';
      }
      topLine += '+';
      lines.push(topLine);
      
      // Line for cell content and side walls
      let midLine = '';
      for (let x = 0; x < maze.width; x++) {
        const tile = maze.tiles[y][x] as Tile;
        midLine += tile.hasWall('west') ? '|' : ' ';
        
        // Cell content
        if (tile.position.x === maze.entrance.x && tile.position.y === maze.entrance.y) {
          midLine += ' S ';
        } else if (tile.position.x === maze.exit.x && tile.position.y === maze.exit.y) {
          midLine += ' E ';
        } else {
          midLine += '   ';
        }
      }
      // Right border
      midLine += '|';
      lines.push(midLine);
    }
    
    // Bottom border
    let bottomLine = '';
    for (let x = 0; x < maze.width; x++) {
      bottomLine += '+---';
    }
    bottomLine += '+';
    lines.push(bottomLine);
    
    return lines.join('\n');
  }
  
  /**
   * Print maze statistics
   * 
   * @param maze - The maze to analyze
   */
  static printStats(maze: Maze): void {
    let deadEnds = 0;
    let junctions = 0;
    let corridors = 0;
    
    for (let y = 0; y < maze.height; y++) {
      for (let x = 0; x < maze.width; x++) {
        const tile = maze.tiles[y][x] as Tile;
        if (tile.isDeadEnd()) deadEnds++;
        if (tile.isJunction()) junctions++;
        if (tile.isCorridor()) corridors++;
      }
    }
    
    console.log('\n📊 Maze Statistics:');
    console.log(`   Size: ${maze.width}×${maze.height} (${maze.width * maze.height} tiles)`);
    console.log(`   Entrance: (${maze.entrance.x}, ${maze.entrance.y})`);
    console.log(`   Exit: (${maze.exit.x}, ${maze.exit.y})`);
    console.log(`   Dead ends: ${deadEnds}`);
    console.log(`   Junctions: ${junctions}`);
    console.log(`   Corridors: ${corridors}`);
    console.log(`   Seed: ${maze.seed}`);
  }
  
  /**
   * Create a simple text map showing wall density
   * Useful for understanding maze complexity at a glance
   * 
   * @param maze - The maze to visualize
   */
  static toHeatmap(maze: Maze): string {
    const lines: string[] = [];
    
    for (let y = 0; y < maze.height; y++) {
      let line = '';
      for (let x = 0; x < maze.width; x++) {
        const tile = maze.tiles[y][x] as Tile;
        const wallCount = tile.getWallCount();
        
        // Use different characters based on wall density
        if (wallCount === 4) line += '█'; // Fully blocked
        else if (wallCount === 3) line += '▓'; // Dead end
        else if (wallCount === 2) line += '▒'; // Corridor
        else if (wallCount === 1) line += '░'; // Junction
        else line += ' '; // Open space (shouldn't happen)
      }
      lines.push(line);
    }
    
    return lines.join('\n');
  }
}
