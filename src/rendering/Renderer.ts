// src/rendering/Renderer.ts
/**
 * Renderer - Main rendering coordinator (Updated for Day 8)
 *
 * Manages:
 * - PixiJS application
 * - Rendering layers
 * - Camera system
 * - Lighting system
 * - Fog of war (NEW in Day 8)
 * - Performance optimization
 */

import { Application, Container, Graphics } from 'pixi.js';
import { Maze, GameConfig } from '../types';
import { Camera } from './Camera';
import { MazeRenderer } from './MazeRenderer';
import { LightingSystem } from './LightingSystem';
import { FogOfWar } from './FogOfWar';
import { TimeManager } from '../core/TimeManager';
import { Agent } from '../agent/Agent';
import { CONSTANTS } from '../config/game.config';

export class Renderer {
  // PixiJS
  private app: Application;

  // Rendering layers
  private worldContainer: Container;
  private backgroundLayer: Container;
  private mazeLayer: Container;
  private agentLayer: Container;
  private fogLayer: Container;        // NEW in Day 8
  private lightingLayer: Container;
  private uiLayer: Container;

  // Systems
  public camera!: Camera;
  private mazeRenderer!: MazeRenderer;
  private lightingSystem: LightingSystem | null = null;
  private fogOfWar: FogOfWar | null = null;  // NEW in Day 8

  // State
  private maze: Maze;
  private config: GameConfig;
  private timeManager: TimeManager | null = null;

  constructor(
    app: Application,
    maze: Maze,
    config: GameConfig,
    timeManager?: TimeManager
  ) {
    this.app = app;
    this.maze = maze;
    this.config = config;
    this.timeManager = timeManager || null;

    // Create container hierarchy
    this.worldContainer = new Container();
    this.backgroundLayer = new Container();
    this.mazeLayer = new Container();
    this.agentLayer = new Container();
    this.fogLayer = new Container();      // NEW in Day 8
    this.lightingLayer = new Container();
    this.uiLayer = new Container();

    console.log('🖼️  Renderer created');
  }
  
  /**
   * Initialize renderer and all subsystems
   */
  async init(): Promise<void> {
    console.log('🖼️  Initializing renderer...');

    this.setupLayers();
    this.initCamera();
    await this.initMazeRenderer();

    if (this.timeManager) {
      await this.initLightingSystem();
    }

    this.drawBackground();

    console.log('✅ Renderer initialized');
  }
  
  /**
   * Setup rendering layer hierarchy
   */
  private setupLayers(): void {
    // Add world container to stage
    this.app.stage.addChild(this.worldContainer);

    // Add layers to world container (affected by camera)
    this.worldContainer.addChild(this.backgroundLayer);
    this.worldContainer.addChild(this.mazeLayer);
    this.worldContainer.addChild(this.agentLayer);
    this.worldContainer.addChild(this.fogLayer);      // NEW in Day 8 (above agent)
    this.worldContainer.addChild(this.lightingLayer);

    // UI layer is separate (not affected by camera)
    this.app.stage.addChild(this.uiLayer);

    console.log('   Layers: Background → Maze → Agent → Fog → Lighting → UI');
  }
  
  /**
   * Initialize camera system
   */
  private initCamera(): void {
    const worldSize = {
      width: this.maze.width * this.config.visual.tileSize,
      height: this.maze.height * this.config.visual.tileSize,
    };

    this.camera = new Camera(
      this.worldContainer,
      this.app.screen.width,
      this.app.screen.height,
      worldSize.width,
      worldSize.height
    );

    this.camera.setZoomLimits(
      this.config.visual.cameraZoomLevels[0],
      this.config.visual.cameraZoomLevels[this.config.visual.cameraZoomLevels.length - 1]
    );

    if (this.config.visual.cameraFollowSmooth) {
      this.camera.setSmoothing(0.1);
    } else {
      this.camera.setSmoothing(1.0);
    }
  }
  
  /**
   * Initialize maze renderer
   */
  private async initMazeRenderer(): Promise<void> {
    this.mazeRenderer = new MazeRenderer(this.mazeLayer, this.maze);
    await this.mazeRenderer.init();
  }

  /**
   * Initialize lighting system
   */
  private async initLightingSystem(): Promise<void> {
    if (!this.timeManager) {
      console.log('⚠️  No time manager - skipping lighting system');
      return;
    }

    console.log('💡 Initializing lighting system...');

    this.lightingSystem = new LightingSystem(this.lightingLayer, this.timeManager);
    await this.lightingSystem.init();

    this.lightingSystem.updateOverlaySize(
      this.app.screen.width * 2,
      this.app.screen.height * 2
    );

    this.lightingLayer.x = -this.app.screen.width / 2;
    this.lightingLayer.y = -this.app.screen.height / 2;

    console.log('✅ Lighting system initialized');
  }

  /**
   * Initialize fog of war (NEW in Day 8)
   * Called after agent is created
   */
  async initFogOfWar(agent: Agent, timeManager: TimeManager): Promise<void> {
    console.log('🌫️  Initializing fog of war...');

    // Destroy existing fog if any
    if (this.fogOfWar) {
      this.fogOfWar.destroy();
    }

    // Create new fog of war
    this.fogOfWar = new FogOfWar(
      this.fogLayer,
      this.maze,
      agent,
      timeManager,
      this.config.agent.visionRange,
      this.config.agent.visionRangeNight
    );

    await this.fogOfWar.init();

    console.log('✅ Fog of war initialized');
  }

  /**
   * Draw background
   */
  private drawBackground(): void {
    const bg = new Graphics();

    // Draw solid background matching maze dimensions
    bg.beginFill(CONSTANTS.COLORS.background, 1.0);
    bg.drawRect(
      0,
      0,
      this.maze.width * this.config.visual.tileSize,
      this.maze.height * this.config.visual.tileSize
    );
    bg.endFill();

    // Add border for visual clarity
    bg.lineStyle(2, 0x444444, 1.0);
    bg.drawRect(
      0,
      0,
      this.maze.width * this.config.visual.tileSize,
      this.maze.height * this.config.visual.tileSize
    );

    this.backgroundLayer.addChild(bg);

    console.log('   Background drawn with border');
  }
  
  /**
   * Update renderer (called every frame)
   */
  update(deltaTime: number): void {
    // Update camera
    this.camera.update(deltaTime);

    // Update lighting system
    if (this.lightingSystem) {
      this.lightingSystem.update(deltaTime);
    }

    // Update fog of war (NEW in Day 8)
    if (this.fogOfWar) {
      this.fogOfWar.update(deltaTime);
    }
  }

  /**
   * Render frame
   */
  render(): void {
    // PixiJS automatically renders
  }
  
  /**
   * Load new maze
   */
  async loadMaze(maze: Maze): Promise<void> {
    console.log('🔄 Loading new maze...');

    if (this.mazeRenderer) {
      this.mazeRenderer.destroy();
    }

    // Destroy fog of war (will be recreated with new maze)
    if (this.fogOfWar) {
      this.fogOfWar.destroy();
      this.fogOfWar = null;
    }

    this.maze = maze;

    this.mazeRenderer = new MazeRenderer(this.mazeLayer, this.maze);
    await this.mazeRenderer.init();

    this.camera.reset();

    console.log('✅ New maze loaded');
  }

  /**
   * Handle window resize
   */
  handleResize(width: number, height: number): void {
    this.camera.handleResize(width, height);

    if (this.lightingSystem) {
      this.lightingSystem.updateOverlaySize(width * 2, height * 2);
      this.lightingLayer.x = -width / 2;
      this.lightingLayer.y = -height / 2;
    }
  }
  
  /**
   * Get agent layer
   */
  getAgentLayer(): Container {
    return this.agentLayer;
  }

  /**
   * Get UI layer
   */
  getUILayer(): Container {
    return this.uiLayer;
  }

  /**
   * Get lighting system
   */
  getLightingSystem(): LightingSystem | null {
    return this.lightingSystem;
  }

  /**
   * Get fog of war (NEW in Day 8)
   */
  getFogOfWar(): FogOfWar | null {
    return this.fogOfWar;
  }

  /**
   * Cleanup and destroy
   */
  destroy(): void {
    console.log('🗑️  Destroying Renderer...');

    if (this.mazeRenderer) {
      this.mazeRenderer.destroy();
    }

    if (this.lightingSystem) {
      this.lightingSystem.destroy();
    }

    if (this.fogOfWar) {
      this.fogOfWar.destroy();
    }

    this.worldContainer.destroy({ children: true });
    this.uiLayer.destroy({ children: true });
  }
}
