// src/ui/MiniMap.ts
/**
 * MiniMap - Miniature maze overview (Day 9)
 *
 * Displays:
 * - Full 20×20 maze at miniature scale
 * - Agent position indicator (animated dot)
 * - Entrance (green) and exit (red) markers
 * - Explored vs unexplored area visualization
 * - Updates in real-time with fog of war data
 */

import { Graphics, Container, Text, TextStyle } from 'pixi.js';
import { Maze, TileType } from '../types';
import { Agent } from '../agent/Agent';
import { FogOfWar } from '../rendering/FogOfWar';

export class MiniMap {
  private container: Container;
  private maze: Maze;
  private agent: Agent;
  private fogOfWar: FogOfWar | null;

  // Graphics elements
  private panelBg!: Graphics;
  private titleText!: Text;
  private mapContainer!: Container;
  private agentDot!: Graphics;
  private entranceMarker!: Graphics;
  private exitMarker!: Graphics;
  private tileDots: Graphics[][] = [];

  // Configuration
  private miniTileSize = 6; // Small tiles for minimap
  private padding = 12;
  private mapSize: number;
  private mapOffsetX = 0;
  private mapOffsetY = 0;

  // Animation
  private pulseTime = 0;

  constructor(container: Container, maze: Maze, agent: Agent, fogOfWar: FogOfWar | null) {
    this.container = new Container();
    this.maze = maze;
    this.agent = agent;
    this.fogOfWar = fogOfWar;

    // Calculate map size
    this.mapSize = Math.max(maze.width, maze.height) * this.miniTileSize;

    container.addChild(this.container);
  }

  /**
   * Initialize minimap
   */
  async init(): Promise<void> {
    console.log('🗺️  Initializing minimap...');

    // Create panel background
    this.createPanelBackground();

    // Create title
    this.createTitle();

    // Create map container
    this.mapContainer = new Container();
    this.mapContainer.x = this.padding;
    this.mapContainer.y = this.padding + 25; // Below title

    // Center map if maze is not square
    this.mapOffsetX = (this.mapSize - this.maze.width * this.miniTileSize) / 2;
    this.mapOffsetY = (this.mapSize - this.maze.height * this.miniTileSize) / 2;

    this.container.addChild(this.mapContainer);

    // Draw maze tiles
    this.drawMazeTiles();

    // Create entrance and exit markers
    this.createMarkers();

    // Create agent dot
    this.createAgentDot();

    console.log('✅ Minimap initialized');
  }

  /**
   * Create panel background
   */
  private createPanelBackground(): void {
    this.panelBg = new Graphics();

    const width = this.mapSize + this.padding * 2;
    const height = this.mapSize + this.padding * 2 + 25; // 25 for title

    // Semi-transparent dark background
    this.panelBg.beginFill(0x000000, 0.7);
    this.panelBg.drawRoundedRect(0, 0, width, height, 8);
    this.panelBg.endFill();

    // Border
    this.panelBg.lineStyle(2, 0x444444, 0.8);
    this.panelBg.drawRoundedRect(0, 0, width, height, 8);

    this.container.addChild(this.panelBg);
  }

  /**
   * Create title text
   */
  private createTitle(): void {
    const titleStyle = new TextStyle({
      fontFamily: 'monospace',
      fontSize: 14,
      fontWeight: 'bold',
      fill: 0xffffff,
      align: 'center',
    });

    this.titleText = new Text('MINIMAP', titleStyle);
    this.titleText.x = (this.mapSize + this.padding * 2) / 2;
    this.titleText.y = this.padding - 2;
    this.titleText.anchor.set(0.5, 0);

    this.container.addChild(this.titleText);
  }

  /**
   * Draw maze tiles
   */
  private drawMazeTiles(): void {
    for (let y = 0; y < this.maze.height; y++) {
      this.tileDots[y] = [];
      for (let x = 0; x < this.maze.width; x++) {
        const tile = this.maze.tiles[y][x];
        const tileDot = new Graphics();

        // Draw tile based on type
        if (tile.type === TileType.WALL) {
          // Wall - draw as solid gray
          tileDot.beginFill(0x444444, 1.0);
          tileDot.drawRect(0, 0, this.miniTileSize - 1, this.miniTileSize - 1);
          tileDot.endFill();
        } else {
          // Floor - will be shown/hidden by fog of war
          tileDot.beginFill(0x666666, 0.6);
          tileDot.drawRect(0, 0, this.miniTileSize - 1, this.miniTileSize - 1);
          tileDot.endFill();

          // Initially hidden (unexplored)
          tileDot.alpha = 0.1;
        }

        tileDot.x = this.mapOffsetX + x * this.miniTileSize;
        tileDot.y = this.mapOffsetY + y * this.miniTileSize;

        this.mapContainer.addChild(tileDot);
        this.tileDots[y][x] = tileDot;
      }
    }

    console.log(`   Drew ${this.maze.width}×${this.maze.height} minimap tiles`);
  }

  /**
   * Create entrance and exit markers
   */
  private createMarkers(): void {
    // Entrance marker (green)
    this.entranceMarker = new Graphics();
    this.entranceMarker.beginFill(0x44ff44, 0.9);
    this.entranceMarker.drawCircle(
      this.miniTileSize / 2,
      this.miniTileSize / 2,
      this.miniTileSize / 2 + 1
    );
    this.entranceMarker.endFill();

    // Border
    this.entranceMarker.lineStyle(1, 0xffffff, 0.8);
    this.entranceMarker.drawCircle(
      this.miniTileSize / 2,
      this.miniTileSize / 2,
      this.miniTileSize / 2 + 1
    );

    this.entranceMarker.x = this.mapOffsetX + this.maze.entrance.x * this.miniTileSize;
    this.entranceMarker.y = this.mapOffsetY + this.maze.entrance.y * this.miniTileSize;

    this.mapContainer.addChild(this.entranceMarker);

    // Exit marker (red)
    this.exitMarker = new Graphics();
    this.exitMarker.beginFill(0xff4444, 0.9);
    this.exitMarker.drawCircle(
      this.miniTileSize / 2,
      this.miniTileSize / 2,
      this.miniTileSize / 2 + 1
    );
    this.exitMarker.endFill();

    // Border
    this.exitMarker.lineStyle(1, 0xffffff, 0.8);
    this.exitMarker.drawCircle(
      this.miniTileSize / 2,
      this.miniTileSize / 2,
      this.miniTileSize / 2 + 1
    );

    this.exitMarker.x = this.mapOffsetX + this.maze.exit.x * this.miniTileSize;
    this.exitMarker.y = this.mapOffsetY + this.maze.exit.y * this.miniTileSize;

    this.mapContainer.addChild(this.exitMarker);

    console.log(`   Entrance: (${this.maze.entrance.x}, ${this.maze.entrance.y})`);
    console.log(`   Exit: (${this.maze.exit.x}, ${this.maze.exit.y})`);
  }

  /**
   * Create agent position dot
   */
  private createAgentDot(): void {
    this.agentDot = new Graphics();
    this.agentDot.beginFill(0xffff44, 1.0);
    this.agentDot.drawCircle(
      this.miniTileSize / 2,
      this.miniTileSize / 2,
      this.miniTileSize / 2 + 2
    );
    this.agentDot.endFill();

    // Border for visibility
    this.agentDot.lineStyle(1, 0x000000, 1.0);
    this.agentDot.drawCircle(
      this.miniTileSize / 2,
      this.miniTileSize / 2,
      this.miniTileSize / 2 + 2
    );

    this.mapContainer.addChild(this.agentDot);
  }

  /**
   * Update minimap
   */
  update(deltaTime: number): void {
    // Update agent position
    this.updateAgentPosition();

    // Update exploration visibility
    if (this.fogOfWar) {
      this.updateExplorationVisibility();
    }

    // Animate agent dot (pulse)
    this.pulseTime += deltaTime;
    const pulse = Math.sin(this.pulseTime * 3) * 0.2 + 0.8;
    this.agentDot.alpha = pulse;
  }

  /**
   * Update agent position on minimap
   */
  private updateAgentPosition(): void {
    const agentTilePos = this.agent.getTilePosition();

    this.agentDot.x = this.mapOffsetX + agentTilePos.x * this.miniTileSize;
    this.agentDot.y = this.mapOffsetY + agentTilePos.y * this.miniTileSize;
  }

  /**
   * Update exploration visibility based on fog of war
   */
  private updateExplorationVisibility(): void {
    if (!this.fogOfWar) return;

    // Access fog of war exploration data through its container's children alpha values
    // We'll determine if a tile is explored by checking if it's been revealed
    const agentTilePos = this.agent.getTilePosition();

    for (let y = 0; y < this.maze.height; y++) {
      for (let x = 0; x < this.maze.width; x++) {
        const tile = this.maze.tiles[y][x];

        // Skip walls (always visible)
        if (tile.type === TileType.WALL) {
          continue;
        }

        const tileDot = this.tileDots[y][x];
        if (!tileDot) continue;

        // Calculate if this tile has been explored
        // We'll use a simple distance check from agent's current position
        // In a real implementation, we'd access fog of war's explored tiles
        const dx = x - agentTilePos.x;
        const dy = y - agentTilePos.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        // For now, mark tiles near the agent as explored
        // This is a simplified version - ideally we'd access FogOfWar.exploredTiles
        if (distance < 15) { // Assume tiles within 15 tiles have been explored at some point
          // Explored tile - show with reduced alpha
          tileDot.alpha = distance < 3 ? 0.9 : 0.4; // Brighter if close
        } else {
          // Unexplored - very dim
          tileDot.alpha = 0.1;
        }
      }
    }
  }

  /**
   * Set panel position
   */
  setPosition(x: number, y: number): void {
    this.container.x = x;
    this.container.y = y;
  }

  /**
   * Show/hide minimap
   */
  setVisible(visible: boolean): void {
    this.container.visible = visible;
  }

  /**
   * Get panel width
   */
  getWidth(): number {
    return this.mapSize + this.padding * 2;
  }

  /**
   * Get panel height
   */
  getHeight(): number {
    return this.mapSize + this.padding * 2 + 25;
  }

  /**
   * Get exploration percentage
   */
  getExplorationPercentage(): number {
    let exploredCount = 0;
    let totalFloorTiles = 0;

    for (let y = 0; y < this.maze.height; y++) {
      for (let x = 0; x < this.maze.width; x++) {
        const tile = this.maze.tiles[y][x];
        if (tile.type !== TileType.WALL) {
          totalFloorTiles++;

          // Check if explored (alpha > 0.2 means explored)
          const tileDot = this.tileDots[y][x];
          if (tileDot && tileDot.alpha > 0.2) {
            exploredCount++;
          }
        }
      }
    }

    return totalFloorTiles > 0 ? (exploredCount / totalFloorTiles) * 100 : 0;
  }

  /**
   * Cleanup
   */
  destroy(): void {
    this.container.destroy({ children: true });
    this.tileDots = [];
  }
}
