// src/core/Game.ts
/**
 * Game - Main game controller (Updated for Day 9)
 *
 * Coordinates all game systems:
 * - Rendering (PixiJS)
 * - Input (keyboard/mouse)
 * - Time management
 * - Fog of war (Day 8)
 * - View modes (Day 8)
 * - UI system (NEW in Day 9)
 * - Agent systems
 * - Game loop
 */

import { Application } from 'pixi.js';
import { Maze, GameConfig } from '../types';
import { GAME_CONFIG } from '../config/game.config';
import { MazeGenerator } from '../maze/MazeGenerator';
import { Renderer } from '../rendering/Renderer';
import { InputManager } from './InputManager';
import { TimeManager } from './TimeManager';
import { Agent } from '../agent/Agent';
import { AgentRenderer } from '../agent/AgentRenderer';
import { AgentController } from '../agent/AgentController';
import { ViewModeManager } from '../ui/ViewModeManager';
import { UIManager } from '../ui/UIManager';

export class Game {
  // Core systems
  private app: Application | null = null;
  private renderer: Renderer | null = null;
  private inputManager: InputManager | null = null;
  private timeManager: TimeManager | null = null;
  private viewModeManager: ViewModeManager | null = null;  // Day 8
  private uiManager: UIManager | null = null;  // NEW in Day 9

  // Agent systems
  private agent: Agent | null = null;
  private agentRenderer: AgentRenderer | null = null;
  private agentController: AgentController | null = null;

  // Game state
  private maze: Maze | null = null;
  private isRunning: boolean = false;
  private isPaused: boolean = false;

  // Configuration
  private config: GameConfig;

  // Performance tracking
  private lastTime: number = 0;
  private deltaTime: number = 0;
  private fps: number = 60;

  constructor(config: GameConfig = GAME_CONFIG) {
    this.config = config;

    console.log('🎮 Game instance created');
  }

  /**
   * Initialize all game systems
   */
  async init(): Promise<void> {
    console.log('🎮 Initializing game systems...');

    try {
      await this.generateMaze();
      await this.initPixiJS();
      this.initTimeManager();
      await this.initRenderer();
      this.initInput();
      await this.initAgent();
      await this.initViewModes();  // Day 8
      await this.initUI();  // NEW in Day 9
      this.start();

      console.log('✅ Game initialized successfully!');
    } catch (error) {
      console.error('❌ Failed to initialize game:', error);
      throw error;
    }
  }

  /**
   * Generate the maze
   */
  private async generateMaze(): Promise<void> {
    console.log('🧩 Generating maze...');
    const generator = new MazeGenerator();
    this.maze = generator.generate(this.config.maze);
    console.log(`   Generated ${this.maze.width}×${this.maze.height} maze`);
  }

  /**
   * Initialize PixiJS application
   */
  private async initPixiJS(): Promise<void> {
    console.log('🎨 Initializing PixiJS...');

    const CONTROL_PANEL_WIDTH = 360; // Matches CSS margin-left
    const maxWidth = window.innerWidth - CONTROL_PANEL_WIDTH - 40;
    const maxHeight = window.innerHeight - 40;

    this.app = new Application({
      width: maxWidth,
      height: maxHeight,
      backgroundColor: 0x000000,  // Pure black for better aesthetics
      antialias: true,
      resolution: window.devicePixelRatio || 1,
      autoDensity: true,
    });

    const container = document.getElementById('app');
    if (container) {
      container.innerHTML = '';
      container.appendChild(this.app.view as HTMLCanvasElement);
    } else {
      throw new Error('Could not find #app container');
    }

    console.log(`   Canvas: ${maxWidth}×${maxHeight}px`);
  }

  /**
   * Initialize time manager
   */
  private initTimeManager(): void {
    console.log('⏰ Initializing time manager...');
    this.timeManager = new TimeManager(this.config.time);
    console.log('✅ Time manager initialized');
  }

  /**
   * Initialize renderer system
   */
  private async initRenderer(): Promise<void> {
    if (!this.app || !this.maze || !this.timeManager) {
      throw new Error('Prerequisites not initialized');
    }

    console.log('🖼️  Initializing renderer...');
    this.renderer = new Renderer(this.app, this.maze, this.config, this.timeManager);
    await this.renderer.init();
    console.log('   Renderer ready');
  }

  /**
   * Initialize input handling
   */
  private initInput(): void {
    console.log('🎮 Initializing input...');
    this.inputManager = new InputManager();
    this.inputManager.init();
    this.setupControls();
    console.log('   Input ready');
  }

  /**
   * Initialize agent system
   */
  private async initAgent(): Promise<void> {
    if (!this.maze || !this.renderer || !this.inputManager) {
      throw new Error('Cannot initialize agent: prerequisites not ready');
    }

    console.log('👤 Initializing agent...');

    this.agent = new Agent(this.maze, this.maze.entrance);

    const agentLayer = this.renderer.getAgentLayer();
    this.agentRenderer = new AgentRenderer(
      agentLayer,
      this.agent,
      this.config.visual
    );
    await this.agentRenderer.init();

    this.agentController = new AgentController(
      this.agent,
      this.inputManager,
      this.renderer.camera
    );

    console.log('✅ Agent initialized');
  }

  /**
   * Initialize view mode system (Day 8)
   */
  private async initViewModes(): Promise<void> {
    if (!this.renderer || !this.agent || !this.timeManager) {
      throw new Error('Cannot initialize view modes: prerequisites not ready');
    }

    console.log('🎭 Initializing view modes...');

    // Create view mode manager
    const uiLayer = this.renderer.getUILayer();
    this.viewModeManager = new ViewModeManager(uiLayer);
    await this.viewModeManager.init();

    // Initialize fog of war in renderer
    await this.renderer.initFogOfWar(this.agent, this.timeManager);

    // Connect fog of war to view mode manager
    const fogOfWar = this.renderer.getFogOfWar();
    if (fogOfWar) {
      this.viewModeManager.setFogOfWar(fogOfWar);
    }

    console.log('✅ View modes initialized');
  }

  /**
   * Initialize UI system (NEW in Day 9)
   */
  private async initUI(): Promise<void> {
    if (!this.renderer || !this.maze || !this.agent || !this.timeManager || !this.app) {
      throw new Error('Cannot initialize UI: prerequisites not ready');
    }

    console.log('🎨 Initializing UI system...');

    // Create UI manager
    const uiLayer = this.renderer.getUILayer();
    const fogOfWar = this.renderer.getFogOfWar();

    this.uiManager = new UIManager(
      uiLayer,
      this.maze,
      this.agent,
      this.timeManager,
      this.renderer.camera,
      fogOfWar,
      this.app.screen.width,
      this.app.screen.height
    );

    await this.uiManager.init();

    console.log('✅ UI system initialized');
  }

  /**
   * Setup controls and keyboard shortcuts
   */
  private setupControls(): void {
    if (!this.inputManager || !this.renderer) return;

    // Mouse wheel zoom
    window.addEventListener('wheel', (e: WheelEvent) => {
      e.preventDefault();
      const zoomDelta = e.deltaY > 0 ? 0.9 : 1.1;
      this.renderer?.camera.zoom(zoomDelta);
    }, { passive: false });

    // Keyboard shortcuts
    window.addEventListener('keydown', (e: KeyboardEvent) => {
      switch (e.key) {
        case 'Home':
          this.renderer?.camera.reset();
          break;
        case ' ':
          this.togglePause();
          break;
        // Time controls
        case 't':
        case 'T':
          this.timeManager?.skipToNextPeriod();
          break;
        case '[':
          const currentScale = this.timeManager?.getTimeScale() || 1;
          this.timeManager?.setTimeScale(Math.max(0.5, currentScale / 2));
          break;
        case ']':
          const scale = this.timeManager?.getTimeScale() || 1;
          this.timeManager?.setTimeScale(Math.min(100, scale * 2));
          break;
        // View mode controls (NEW in Day 8)
        case 'v':
        case 'V':
          this.viewModeManager?.nextMode();
          break;
        case 'b':
        case 'B':
          this.viewModeManager?.previousMode();
          break;
      }
    });

    console.log('   Controls:');
    console.log('     - WASD/Arrows: Move agent');
    console.log('     - Mouse wheel: Zoom');
    console.log('     - V: Next view mode');
    console.log('     - B: Previous view mode');
    console.log('     - T: Skip time period');
    console.log('     - Space: Pause');
  }

  /**
   * Start the game loop
   */
  private start(): void {
    console.log('▶️  Starting game loop...');

    this.isRunning = true;
    this.lastTime = performance.now();

    this.app?.ticker.add(() => this.gameLoop());
  }

  /**
   * Main game loop
   */
  private gameLoop(): void {
    if (!this.isRunning || this.isPaused) return;

    const currentTime = performance.now();
    this.deltaTime = (currentTime - this.lastTime) / 1000;
    this.lastTime = currentTime;

    this.fps = 1 / this.deltaTime;

    this.update(this.deltaTime);
    this.render();
  }

  /**
   * Update game state
   */
  private update(deltaTime: number): void {
    // Update time
    if (this.timeManager) {
      this.timeManager.update(deltaTime);
    }

    // Update agent
    if (this.agent && this.agentController && this.agentRenderer) {
      this.agentController.update(deltaTime);
      this.agent.update(deltaTime);
      this.agentRenderer.update(deltaTime);
    }

    // Update view mode manager (Day 8)
    if (this.viewModeManager) {
      this.viewModeManager.update(deltaTime);
    }

    // Update UI system (NEW in Day 9)
    if (this.uiManager) {
      this.uiManager.update(deltaTime);
    }

    // Update renderer (includes fog of war)
    this.renderer?.update(deltaTime);
  }

  /**
   * Render the game
   */
  private render(): void {
    if (!this.renderer) return;

    this.renderer.render();
  }

  /**
   * Toggle pause state
   */
  private togglePause(): void {
    this.isPaused = !this.isPaused;

    if (this.agentController) {
      this.agentController.setEnabled(!this.isPaused);
    }

    if (this.timeManager) {
      this.timeManager.togglePause();
    }

    console.log(this.isPaused ? '⏸️  Paused' : '▶️  Resumed');
  }

  /**
   * Get current FPS
   */
  getFPS(): number {
    return Math.round(this.fps);
  }

  /**
   * Get current maze
   */
  getMaze(): Maze | null {
    return this.maze;
  }

  /**
   * Get agent
   */
  getAgent(): Agent | null {
    return this.agent;
  }

  /**
   * Get time manager
   */
  getTimeManager(): TimeManager | null {
    return this.timeManager;
  }

  /**
   * Get view mode manager (NEW in Day 8)
   */
  getViewModeManager(): ViewModeManager | null {
    return this.viewModeManager;
  }

  /**
   * Get fog of war (NEW in Day 8)
   */
  getFogOfWar() {
    return this.renderer?.getFogOfWar();
  }

  /**
   * Regenerate maze with new seed
   */
  async regenerateMaze(seed?: string): Promise<void> {
    console.log('🔄 Regenerating maze...');

    const config = { ...this.config.maze };
    if (seed) {
      config.seed = seed;
    } else {
      config.seed = Date.now().toString();
    }

    const generator = new MazeGenerator();
    this.maze = generator.generate(config);

    if (this.renderer && this.maze) {
      await this.renderer.loadMaze(this.maze);
    }

    if (this.agent && this.maze && this.agentRenderer) {
      this.agentRenderer.destroy();

      this.agent = new Agent(this.maze, this.maze.entrance);

      const agentLayer = this.renderer!.getAgentLayer();
      this.agentRenderer = new AgentRenderer(
        agentLayer,
        this.agent,
        this.config.visual
      );
      await this.agentRenderer.init();

      this.agentController = new AgentController(
        this.agent,
        this.inputManager!,
        this.renderer!.camera
      );

      // Reinitialize fog of war for new maze (NEW in Day 8)
      if (this.timeManager) {
        await this.renderer!.initFogOfWar(this.agent, this.timeManager);
        const fogOfWar = this.renderer!.getFogOfWar();
        if (fogOfWar && this.viewModeManager) {
          this.viewModeManager.setFogOfWar(fogOfWar);
        }
      }
    }

    console.log(`✅ New maze generated (seed: ${config.seed})`);
  }

  /**
   * Cleanup and destroy
   */
  destroy(): void {
    console.log('🗑️  Cleaning up game...');

    this.isRunning = false;

    if (this.uiManager) {
      this.uiManager.destroy();
      this.uiManager = null;
    }

    if (this.viewModeManager) {
      this.viewModeManager.destroy();
      this.viewModeManager = null;
    }

    if (this.agentRenderer) {
      this.agentRenderer.destroy();
      this.agentRenderer = null;
    }
    this.agent = null;
    this.agentController = null;

    if (this.renderer) {
      this.renderer.destroy();
      this.renderer = null;
    }

    if (this.app) {
      this.app.destroy(true, { children: true, texture: true, baseTexture: true });
      this.app = null;
    }

    if (this.inputManager) {
      this.inputManager.destroy();
      this.inputManager = null;
    }

    this.timeManager = null;

    console.log('✅ Game cleaned up');
  }

  /**
   * Handle window resize
   */
  handleResize(): void {
    if (!this.app || !this.renderer) return;

    const CONTROL_PANEL_WIDTH = 360; // Matches CSS margin-left
    const maxWidth = window.innerWidth - CONTROL_PANEL_WIDTH - 40;
    const maxHeight = window.innerHeight - 40;

    this.app.renderer.resize(maxWidth, maxHeight);
    this.renderer.handleResize(maxWidth, maxHeight);

    // Update UI layout (NEW in Day 9)
    if (this.uiManager) {
      this.uiManager.handleResize(maxWidth, maxHeight);
    }
  }
}
