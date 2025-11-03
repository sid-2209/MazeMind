// src/rendering/MazeRenderer.ts
/**
 * MazeRenderer - Renders the maze with tiles
 * 
 * For Week 1: Uses colored rectangles
 * Week 2+: Will use sprite textures
 * 
 * Features:
 * - Efficient tile rendering
 * - Different colors for different tile types
 * - Wall rendering
 * - Entrance/exit highlighting
 */

import { Container, Graphics } from 'pixi.js';
import { Maze, TileType } from '@/types/index';
import { CONSTANTS } from '@config/game.config';

export class MazeRenderer {
  private container: Container;
  private maze: Maze;
  private tileSize: number;
  
  // Graphics objects for tiles
  private tileGraphics: Graphics[][] = [];
  private wallGraphics: Graphics[][] = [];
  
  constructor(container: Container, maze: Maze) {
    this.container = container;
    this.maze = maze;
    this.tileSize = CONSTANTS.TILE_SIZE;
    
    console.log('🎨 MazeRenderer created');
  }
  
  /**
   * Initialize and render the maze
   */
  async init(): Promise<void> {
    console.log('🎨 Rendering maze tiles...');
    
    // Create graphics for each tile
    for (let y = 0; y < this.maze.height; y++) {
      const tileRow: Graphics[] = [];
      const wallRow: Graphics[] = [];
      
      for (let x = 0; x < this.maze.width; x++) {
        const tile = this.maze.tiles[y][x];
        
        // Create tile background
        const tileGraphic = this.createTileGraphic(tile, x, y);
        this.container.addChild(tileGraphic);
        tileRow.push(tileGraphic);
        
        // Create walls
        const wallGraphic = this.createWallGraphic(tile, x, y);
        this.container.addChild(wallGraphic);
        wallRow.push(wallGraphic);
      }
      
      this.tileGraphics.push(tileRow);
      this.wallGraphics.push(wallRow);
    }
    
    console.log(`   Rendered ${this.maze.width * this.maze.height} tiles`);
  }
  
  /**
   * Create graphics for a single tile
   */
  private createTileGraphic(tile: any, x: number, y: number): Graphics {
    const graphic = new Graphics();
    
    // Get color based on tile type
    let color = CONSTANTS.COLORS.floor;
    
    if (tile.type === TileType.ENTRANCE) {
      color = CONSTANTS.COLORS.entrance;
    } else if (tile.type === TileType.EXIT) {
      color = CONSTANTS.COLORS.exit;
    } else if (tile.type === TileType.WALL) {
      color = CONSTANTS.COLORS.wallDay;
    }
    
    // Draw tile
    graphic.beginFill(color);
    graphic.drawRect(
      x * this.tileSize,
      y * this.tileSize,
      this.tileSize,
      this.tileSize
    );
    graphic.endFill();
    
    // Add border for better visibility
    graphic.lineStyle(1, 0x000000, 0.1);
    graphic.drawRect(
      x * this.tileSize,
      y * this.tileSize,
      this.tileSize,
      this.tileSize
    );
    
    return graphic;
  }
  
  /**
   * Create graphics for tile walls
   */
  private createWallGraphic(tile: any, x: number, y: number): Graphics {
    const graphic = new Graphics();
    const wallColor = 0x2a2a2a;
    const wallThickness = 4;
    
    const tileX = x * this.tileSize;
    const tileY = y * this.tileSize;
    
    graphic.lineStyle(wallThickness, wallColor, 1);
    
    // Draw walls that exist
    if (tile.walls.north) {
      graphic.moveTo(tileX, tileY);
      graphic.lineTo(tileX + this.tileSize, tileY);
    }
    
    if (tile.walls.south) {
      graphic.moveTo(tileX, tileY + this.tileSize);
      graphic.lineTo(tileX + this.tileSize, tileY + this.tileSize);
    }
    
    if (tile.walls.west) {
      graphic.moveTo(tileX, tileY);
      graphic.lineTo(tileX, tileY + this.tileSize);
    }
    
    if (tile.walls.east) {
      graphic.moveTo(tileX + this.tileSize, tileY);
      graphic.lineTo(tileX + this.tileSize, tileY + this.tileSize);
    }
    
    return graphic;
  }
  
  /**
   * Update tile appearance (for fog of war, etc.)
   * Week 1: Not used yet
   * Week 2+: Will update based on visibility
   */
  updateTile(x: number, y: number): void {
    const tile = this.maze.tiles[y][x];
    const graphic = this.tileGraphics[y][x];
    
    // Clear and redraw
    graphic.clear();
    
    // Determine color
    let color = CONSTANTS.COLORS.floor;
    let alpha = 1.0;
    
    if (tile.type === TileType.ENTRANCE) {
      color = CONSTANTS.COLORS.entrance;
    } else if (tile.type === TileType.EXIT) {
      color = CONSTANTS.COLORS.exit;
    }
    
    // Apply fog of war (if not explored)
    if (!tile.isExplored) {
      alpha = 0.3;
    }
    
    // Draw
    graphic.beginFill(color, alpha);
    graphic.drawRect(
      x * this.tileSize,
      y * this.tileSize,
      this.tileSize,
      this.tileSize
    );
    graphic.endFill();
    
    // Border
    graphic.lineStyle(1, 0x000000, 0.1);
    graphic.drawRect(
      x * this.tileSize,
      y * this.tileSize,
      this.tileSize,
      this.tileSize
    );
  }
  
  /**
   * Highlight a specific tile (for debugging or selection)
   */
  highlightTile(x: number, y: number, color: number = 0xffff00): void {
    const graphic = new Graphics();
    
    graphic.lineStyle(3, color, 1);
    graphic.drawRect(
      x * this.tileSize + 2,
      y * this.tileSize + 2,
      this.tileSize - 4,
      this.tileSize - 4
    );
    
    this.container.addChild(graphic);
    
    // Auto-remove after 1 second
    setTimeout(() => {
      this.container.removeChild(graphic);
      graphic.destroy();
    }, 1000);
  }
  
  /**
   * Get world dimensions in pixels
   */
  getWorldSize(): { width: number; height: number } {
    return {
      width: this.maze.width * this.tileSize,
      height: this.maze.height * this.tileSize,
    };
  }
  
  /**
   * Clear all graphics
   */
  clear(): void {
    for (const row of this.tileGraphics) {
      for (const graphic of row) {
        graphic.destroy();
      }
    }
    
    for (const row of this.wallGraphics) {
      for (const graphic of row) {
        graphic.destroy();
      }
    }
    
    this.tileGraphics = [];
    this.wallGraphics = [];
  }
  
  /**
   * Destroy and cleanup
   */
  destroy(): void {
    console.log('🗑️  Destroying MazeRenderer...');
    this.clear();
  }
}
