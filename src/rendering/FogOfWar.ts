// src/rendering/FogOfWar.ts
/**
 * FogOfWar - Basic implementation (Day 8)
 *
 * Manages visibility and exploration fog overlays:
 * - Unexplored tiles: Completely dark (black)
 * - Explored but not visible: Semi-transparent dark (gray)
 * - Currently visible: No fog overlay
 */

import { Container, Graphics } from 'pixi.js';
import { Maze, ViewMode, Position } from '../types';
import { Agent } from '../agent/Agent';
import { TimeManager } from '../core/TimeManager';
import { CONSTANTS } from '../config/game.config';

export class FogOfWar {
  private container: Container;
  private maze: Maze;
  private agent: Agent;
  private timeManager: TimeManager;
  private currentViewMode: ViewMode;

  // Vision settings
  private visionRange: number;
  private visionRangeNight: number;

  // Fog graphics
  private fogTiles: Graphics[][] = [];

  // Exploration tracking
  private exploredTiles: boolean[][] = [];

  constructor(
    container: Container,
    maze: Maze,
    agent: Agent,
    timeManager: TimeManager,
    visionRange: number,
    visionRangeNight: number
  ) {
    this.container = container;
    this.maze = maze;
    this.agent = agent;
    this.timeManager = timeManager;
    this.visionRange = visionRange;
    this.visionRangeNight = visionRangeNight;
    this.currentViewMode = ViewMode.AGENT_POV;

    // Initialize exploration tracking
    this.exploredTiles = [];
    for (let y = 0; y < maze.height; y++) {
      this.exploredTiles[y] = [];
      for (let x = 0; x < maze.width; x++) {
        this.exploredTiles[y][x] = false;
      }
    }
  }

  async init(): Promise<void> {
    console.log('🌫️  Initializing fog of war...');

    // Create fog tiles for each maze position
    for (let y = 0; y < this.maze.height; y++) {
      this.fogTiles[y] = [];
      for (let x = 0; x < this.maze.width; x++) {
        const fogTile = new Graphics();
        fogTile.beginFill(0x000000, 1.0); // Black, fully opaque
        fogTile.drawRect(0, 0, CONSTANTS.TILE_SIZE, CONSTANTS.TILE_SIZE);
        fogTile.endFill();

        fogTile.x = x * CONSTANTS.TILE_SIZE;
        fogTile.y = y * CONSTANTS.TILE_SIZE;

        this.container.addChild(fogTile);
        this.fogTiles[y][x] = fogTile;
      }
    }

    console.log('✅ FogOfWar initialized');
  }

  update(_deltaTime: number): void {
    // Get current vision range based on time of day
    const timeOfDay = this.timeManager.getTimeOfDay();
    const currentVisionRange = timeOfDay.period === 'night'
      ? this.visionRangeNight
      : this.visionRange;

    // Get agent position and convert from world coordinates (pixels) to tile coordinates
    const agentPos = this.agent.getPosition();
    const agentTileX = Math.floor(agentPos.x / CONSTANTS.TILE_SIZE);
    const agentTileY = Math.floor(agentPos.y / CONSTANTS.TILE_SIZE);

    // Update fog visibility for all tiles
    for (let y = 0; y < this.maze.height; y++) {
      for (let x = 0; x < this.maze.width; x++) {
        const distance = this.getDistance({ x, y }, { x: agentTileX, y: agentTileY });
        const isVisible = distance <= currentVisionRange;

        // Mark as explored if visible
        if (isVisible) {
          this.exploredTiles[y][x] = true;
        }

        // Update fog tile visibility based on view mode
        this.updateFogTile(x, y, isVisible);
      }
    }
  }

  /**
   * Update individual fog tile based on visibility and view mode
   */
  private updateFogTile(x: number, y: number, isVisible: boolean): void {
    const fogTile = this.fogTiles[y][x];
    if (!fogTile) return;

    const isExplored = this.exploredTiles[y][x];

    switch (this.currentViewMode) {
      case ViewMode.AGENT_POV:
        // Only show currently visible tiles
        if (isVisible) {
          fogTile.alpha = 0; // No fog - can see
        } else {
          fogTile.alpha = 1; // Full fog - cannot see
        }
        break;

      case ViewMode.GOD_MODE:
        // See everything
        fogTile.alpha = 0;
        break;

      case ViewMode.MIXED_MODE:
        // Show explored tiles dimmed, visible tiles clear
        if (isVisible) {
          fogTile.alpha = 0; // No fog - can see clearly
        } else if (isExplored) {
          fogTile.alpha = 0.6; // Semi-transparent - explored but not visible
        } else {
          fogTile.alpha = 1; // Full fog - unexplored
        }
        break;

      case ViewMode.DEBUG_MODE:
        // Show everything with minimal fog
        fogTile.alpha = isVisible ? 0 : 0.3;
        break;

      default:
        fogTile.alpha = 1;
    }
  }

  /**
   * Calculate distance between two positions
   */
  private getDistance(pos1: Position, pos2: Position): number {
    const dx = pos1.x - pos2.x;
    const dy = pos1.y - pos2.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  setViewMode(mode: ViewMode): void {
    this.currentViewMode = mode;
    console.log(`🌫️  View Mode: ${mode}`);

    // Trigger immediate update of fog tiles
    this.update(0);
  }

  destroy(): void {
    this.container.removeChildren();
    this.fogTiles = [];
  }
}
