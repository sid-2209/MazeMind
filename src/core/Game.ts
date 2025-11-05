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
import { AutonomousController } from '../agent/AutonomousController'; // NEW in Days 3-4
import { ViewModeManager } from '../ui/ViewModeManager';
import { UIManager } from '../ui/UIManager';
import { ItemGenerator } from '../systems/ItemGenerator'; // Week 3
import { ItemRenderer } from '../rendering/ItemRenderer'; // Week 3
import { CONSTANTS } from '../config/game.config'; // Week 3
import { DataCollector } from '../systems/DataCollector'; // Week 4
import { SimulationOutcome } from '../types/metrics'; // Week 4
import { ExportManager } from '../utils/ExportManager'; // Week 4
import { AgentManager } from '../systems/AgentManager'; // Week 6
import { MultiAgentRenderer } from '../rendering/MultiAgentRenderer'; // Week 6
import { PREDEFINED_AGENTS } from '../types/multi-agent'; // Week 6

export class Game {
  // Core systems
  private app: Application | null = null;
  private renderer: Renderer | null = null;
  private inputManager: InputManager | null = null;
  private timeManager: TimeManager | null = null;
  private viewModeManager: ViewModeManager | null = null;  // Day 8
  private uiManager: UIManager | null = null;  // NEW in Day 9

  // Agent systems (Week 6: Multi-agent support)
  private agent: Agent | null = null;  // Primary agent (backward compatibility)
  private agentRenderer: AgentRenderer | null = null;
  private agentController: AgentController | null = null;
  private autonomousController: AutonomousController | null = null; // NEW in Days 3-4

  // Multi-agent systems (Week 6)
  private agentManager: AgentManager | null = null;
  private multiAgentRenderer: MultiAgentRenderer | null = null;
  private selectedAgentCount: number = 1; // Default: single agent
  private agentControllers: Map<string, AgentController> = new Map();
  private autonomousControllers: Map<string, AutonomousController> = new Map();

  // Survival systems (Week 3)
  private itemGenerator: ItemGenerator | null = null;
  private itemRenderer: ItemRenderer | null = null;

  // Data collection (Week 4)
  private dataCollector: DataCollector | null = null;
  private gameTime: number = 0; // Track total game time

  // Game state
  private maze: Maze | null = null;
  private isRunning: boolean = false;
  private isPaused: boolean = false;
  private isAutonomousMode: boolean = false; // NEW in Days 3-4 - toggle between manual/AI

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
      await this.initSurvivalSystems();  // Week 3 - before agent
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
   * Generate the maze (Week 6: Multi-agent support)
   */
  private async generateMaze(): Promise<void> {
    console.log('🧩 Generating maze...');
    const generator = new MazeGenerator();

    // Week 6: Set agent count for maze generation
    this.config.maze.agentCount = this.selectedAgentCount;
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
   * Initialize survival systems (Week 3)
   */
  private async initSurvivalSystems(): Promise<void> {
    if (!this.maze || !this.renderer) {
      throw new Error('Cannot initialize survival systems: prerequisites not ready');
    }

    console.log('🧬 Initializing survival systems...');

    // Initialize item generator
    this.itemGenerator = new ItemGenerator(this.maze, CONSTANTS.TILE_SIZE);
    this.itemGenerator.generateItems();

    // Initialize item renderer
    const itemLayer = this.renderer.getAgentLayer(); // Items render on same layer as agent
    this.itemRenderer = new ItemRenderer(itemLayer, CONSTANTS.TILE_SIZE);
    await this.itemRenderer.init();

    console.log('✅ Survival systems initialized');
  }

  /**
   * Initialize agent system
   */
  private async initAgent(): Promise<void> {
    if (!this.maze || !this.renderer || !this.inputManager) {
      throw new Error('Cannot initialize agent: prerequisites not ready');
    }

    console.log(`👤 Initializing ${this.selectedAgentCount} agent(s)...`);

    // Week 6: Initialize multi-agent system
    this.agentManager = new AgentManager(this.maze);
    const agentLayer = this.renderer.getAgentLayer();
    this.multiAgentRenderer = new MultiAgentRenderer(agentLayer, this.config.visual);

    // Get selected agent configurations
    const selectedConfigs = PREDEFINED_AGENTS.slice(0, this.selectedAgentCount);
    const entrances = this.maze.entrances || [this.maze.entrance];

    // Create each agent
    for (let i = 0; i < selectedConfigs.length; i++) {
      const config = selectedConfigs[i];

      // Assign entrance position
      config.startPosition = entrances[i] || entrances[0];

      // Create agent through AgentManager
      const agent = await this.agentManager.createAgent(config);

      // Add to multi-agent renderer
      await this.multiAgentRenderer.addAgent(agent);

      // Create controller for this agent
      const controller = new AgentController(
        agent,
        this.inputManager,
        this.renderer.camera
      );
      this.agentControllers.set(config.id, controller);

      // Set primary agent (first one, for backward compatibility)
      if (i === 0) {
        this.agent = agent;
        this.agentRenderer = this.multiAgentRenderer.getRenderer(config.id)!;
        this.agentController = controller;
      }

      console.log(`   ✅ Created agent: ${config.name} at (${config.startPosition.x}, ${config.startPosition.y})`);
    }

    // Week 6: Initialize all agents
    const apiKey = (import.meta as any).env?.VITE_ANTHROPIC_API_KEY;
    const llmProvider = (import.meta as any).env?.VITE_LLM_PROVIDER || 'heuristic';
    const ollamaUrl = (import.meta as any).env?.VITE_OLLAMA_URL || 'http://localhost:11434';
    const ollamaModel = (import.meta as any).env?.VITE_OLLAMA_MODEL || 'llama3.2:3b-instruct-q4_K_M';
    const embeddingProvider = (import.meta as any).env?.VITE_EMBEDDING_PROVIDER || 'openai';
    const openaiApiKey = (import.meta as any).env?.VITE_OPENAI_API_KEY;
    const voyageApiKey = (import.meta as any).env?.VITE_VOYAGE_API_KEY;

    console.log(`🔍 Initializing memory systems for ${this.selectedAgentCount} agent(s)...`);
    console.log(`🤖 LLM Provider: ${llmProvider}`);
    console.log(`🧠 Embedding Provider: ${embeddingProvider}`);

    // Initialize each agent's systems
    for (const agent of this.agentManager!.getAllAgents()) {
      // Initialize retrieval system
      agent.initializeRetrieval(
        apiKey && apiKey !== 'sk-ant-your-key-here' ? apiKey : undefined,
        llmProvider,
        { url: ollamaUrl, model: ollamaModel },
        {
          provider: embeddingProvider,
          openaiApiKey: openaiApiKey && openaiApiKey !== 'your-openai-api-key-here' ? openaiApiKey : undefined,
          voyageApiKey: voyageApiKey && voyageApiKey !== 'your-voyage-api-key-here' ? voyageApiKey : undefined,
        }
      );

      // Initialize autonomous controller
      const decisionMaker = agent.getDecisionMaker();
      if (decisionMaker) {
        const autoController = new AutonomousController(
          agent,
          decisionMaker,
          {
            decisionInterval: 3.0,
            enableEmergencyOverride: true,
            enableLogging: true,
          }
        );
        autoController.setEnabled(false); // Start in manual mode
        this.autonomousControllers.set(agent.getId(), autoController);

        if (agent === this.agent) {
          this.autonomousController = autoController; // Backward compatibility
        }
      }

      // Wire up survival systems
      if (this.itemGenerator) {
        agent.setItemGenerator(this.itemGenerator);
        agent.setDeathCallback((a) => this.handleAgentDeath(a));
        agent.setBreakdownCallback((a) => this.handleAgentBreakdown(a));

        if (decisionMaker) {
          decisionMaker.setItemGenerator(this.itemGenerator);
        }
      }

      // Initialize planning system
      if (agent.getPlanningSystem()) {
        await agent.initializePlan(this.gameTime);
      }

      console.log(`   ✅ ${agent.getName()}: Memory, AI, and planning initialized`);
    }

    // Initialize data collector (primary agent only for now)
    this.dataCollector = new DataCollector(this.agent!, this.maze, this.maze.seed);
    console.log('📊 Data collector initialized');

    console.log('✅ All agents initialized');
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

    // Wire data collector to UI (Week 4)
    if (this.dataCollector) {
      this.uiManager.setDataCollector(this.dataCollector);
    }

    // Wire agent manager to UI (Week 6)
    if (this.agentManager) {
      this.uiManager.setAgentManager(this.agentManager);
    }

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
        // Autonomous mode toggle (NEW in Days 3-4)
        case 'a':
        case 'A':
          this.toggleAutonomousMode();
          break;
        // LLM provider switching (NEW: Ollama integration)
        case 'l':
        case 'L':
          this.cycleLLMProvider();
          break;
        // Export data (Week 4)
        case 'x':
        case 'X':
          this.exportCurrentRun();
          break;
      }
    });

    console.log('   Controls:');
    console.log('     - WASD/Arrows: Move agent (manual mode)');
    console.log('     - A: Toggle autonomous/manual mode');
    console.log('     - L: Cycle LLM provider (Heuristic → Ollama → Anthropic)');
    console.log('     - X: Export current run data');
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

    // Get time scale for survival systems
    const timeScale = this.timeManager?.getTimeScale() || 1;

    // Track game time (Week 4)
    this.gameTime += deltaTime * timeScale;

    // Week 6: Update all agents
    if (this.agentManager && this.multiAgentRenderer) {
      // Update each agent
      for (const agent of this.agentManager.getAllAgents()) {
        // Update DecisionMaker with game time
        const decisionMaker = agent.getDecisionMaker();
        if (decisionMaker) {
          decisionMaker.updateGameTime(this.gameTime);
        }

        // Monitor for re-planning triggers
        const planningSystem = agent.getPlanningSystem();
        if (planningSystem) {
          const context = agent.getPlanningContext();
          context.gameTime = this.gameTime;

          const replanReason = planningSystem.monitorForReplanning(context);
          if (replanReason) {
            console.log(`🔄 ${agent.getName()} re-planning: ${replanReason}`);
            agent.replan(replanReason, this.gameTime).catch(err => {
              console.error(`❌ ${agent.getName()} failed to replan:`, err);
            });
          }
        }

        // Update controller based on mode
        const agentId = agent.getId();
        const controller = this.agentControllers.get(agentId);
        const autoController = this.autonomousControllers.get(agentId);

        if (this.isAutonomousMode && autoController) {
          autoController.update(deltaTime);
        } else if (controller) {
          // Only update primary agent controller in manual mode
          if (agent === this.agent) {
            controller.update(deltaTime);
          }
        }

        // Update agent state
        agent.update(deltaTime, timeScale);
      }

      // Update AgentManager for social interactions
      this.agentManager.update(deltaTime, timeScale, this.gameTime);

      // Update multi-agent renderer
      this.multiAgentRenderer.update(deltaTime);
    }

    // Update survival systems (Week 3)
    if (this.itemRenderer && this.itemGenerator) {
      const items = this.itemGenerator.getAllItems();
      this.itemRenderer.render(items);
      this.itemRenderer.update(deltaTime);
    }

    // Update data collector (Week 4)
    if (this.dataCollector) {
      this.dataCollector.update(this.gameTime);
    }

    // Update view mode manager (Day 8)
    if (this.viewModeManager) {
      this.viewModeManager.update(deltaTime);
    }

    // Update UI system (NEW in Day 9)
    if (this.uiManager) {
      this.uiManager.update(deltaTime, this.gameTime); // Pass game time for CurrentRunPanel
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
   * Toggle between manual and autonomous mode (NEW in Days 3-4)
   */
  private toggleAutonomousMode(): void {
    if (!this.autonomousController) {
      console.warn('⚠️  Autonomous controller not initialized');
      return;
    }

    this.isAutonomousMode = !this.isAutonomousMode;

    if (this.isAutonomousMode) {
      // Switching to autonomous mode
      if (this.agentController) {
        this.agentController.setEnabled(false);
      }
      this.autonomousController.setEnabled(true);
      console.log('🤖 AUTONOMOUS MODE: AI is now controlling the agent');
      console.log('   The agent will make decisions based on memories and observations');
      console.log('   Press A again to return to manual control');
    } else {
      // Switching to manual mode
      this.autonomousController.setEnabled(false);
      if (this.agentController) {
        this.agentController.setEnabled(true);
      }
      console.log('🎮 MANUAL MODE: You are now controlling the agent');
      console.log('   Use WASD or arrow keys to move');
      console.log('   Press A to enable autonomous mode');
    }
  }

  /**
   * Cycle through LLM providers (NEW: Ollama integration)
   */
  private async cycleLLMProvider(): Promise<void> {
    const llmService = this.agent?.getLLMService();
    if (!llmService) {
      console.warn('⚠️  LLM service not initialized');
      return;
    }

    const oldProvider = llmService.getCurrentProvider();
    const newProvider = await llmService.cycleProvider();
    const model = llmService.getCurrentModel();

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`🔄 LLM Provider switched:`);
    console.log(`   From: ${oldProvider}`);
    console.log(`   To: ${newProvider}`);
    console.log(`   Model: ${model}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    // Show available providers
    const status = llmService.getProviderStatus();
    console.log('Available providers:');
    console.log(`   Heuristic: ✅ Always available`);
    console.log(`   Ollama: ${status.ollama ? '✅ Available' : '❌ Not available'}`);
    console.log(`   Anthropic: ${status.anthropic ? '✅ Available' : '❌ Not available'}`);
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
   * Get autonomous mode status (NEW in Week 2)
   */
  isAutonomous(): boolean {
    return this.isAutonomousMode;
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

  // ============================================
  // Survival Event Handlers (Week 3)
  // ============================================

  /**
   * Handle agent death
   */
  private handleAgentDeath(agent: Agent): void {
    console.log('💀 Agent has died - stopping autonomous mode');

    // Determine cause of death
    const survivalState = agent.getSurvivalState();
    let outcome: SimulationOutcome;

    if (survivalState.hunger === 0) {
      outcome = SimulationOutcome.DEATH_STARVATION;
    } else if (survivalState.thirst === 0) {
      outcome = SimulationOutcome.DEATH_DEHYDRATION;
    } else if (survivalState.energy === 0) {
      outcome = SimulationOutcome.DEATH_EXHAUSTION;
    } else {
      outcome = SimulationOutcome.DEATH_STARVATION; // Fallback
    }

    // Finalize metrics (Week 4)
    if (this.dataCollector) {
      const metrics = this.dataCollector.finalize(outcome, this.gameTime);
      console.log(`📊 Run completed: ${metrics.runId}`);
      console.log(`   Outcome: ${outcome}`);
      console.log(`   Survival Time: ${metrics.survivalTime.toFixed(1)}s`);
      console.log(`   Items Consumed: ${metrics.totalItemsConsumed}`);
      console.log(`   Tiles Explored: ${metrics.tilesExplored}`);
    }

    // Stop autonomous mode
    if (this.autonomousController) {
      this.autonomousController.setEnabled(false);
      this.isAutonomousMode = false;
    }

    // Pause game
    this.isPaused = true;

    console.log('⏸️  Game paused due to agent death');
  }

  /**
   * Handle agent mental breakdown
   */
  private handleAgentBreakdown(_agent: Agent): void {
    console.log('🧠 Agent suffered mental breakdown - stopping autonomous mode');

    // Finalize metrics (Week 4)
    if (this.dataCollector) {
      const metrics = this.dataCollector.finalize(SimulationOutcome.MENTAL_BREAKDOWN, this.gameTime);
      console.log(`📊 Run completed: ${metrics.runId}`);
      console.log(`   Outcome: Mental Breakdown`);
      console.log(`   Survival Time: ${metrics.survivalTime.toFixed(1)}s`);
      console.log(`   Final Stress: ${metrics.finalStress.toFixed(1)}%`);
    }

    // Stop autonomous mode
    if (this.autonomousController) {
      this.autonomousController.setEnabled(false);
      this.isAutonomousMode = false;
    }

    // Pause game
    this.isPaused = true;

    console.log('⏸️  Game paused due to mental breakdown');
  }

  /**
   * Export current run data (Week 4)
   */
  private exportCurrentRun(): void {
    if (!this.dataCollector || !this.agent) {
      console.log('⚠️  No data to export (no active run)');
      return;
    }

    // Finalize metrics if agent is still alive
    let metrics;
    if (this.agent.getState().isAlive) {
      // Agent still alive - export in-progress data
      metrics = this.dataCollector.finalize(SimulationOutcome.IN_PROGRESS, this.gameTime);
      console.log('📥 Exporting in-progress run data...');
    } else {
      // Agent dead/breakdown - should already be finalized, but finalize again to be safe
      const survivalState = this.agent.getSurvivalState();
      const outcome = survivalState.isDead ? SimulationOutcome.DEATH_DEHYDRATION : SimulationOutcome.MENTAL_BREAKDOWN;
      metrics = this.dataCollector.finalize(outcome, this.gameTime);
      console.log('📥 Exporting completed run data...');
    }

    // Export as JSON
    ExportManager.exportRunJSON(metrics);
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

  // ============================================
  // Multi-Agent Support (Week 6)
  // ============================================

  /**
   * Set number of agents for next game
   */
  setAgentCount(count: number): void {
    this.selectedAgentCount = Math.max(1, Math.min(3, count));
    console.log(`👥 Agent count set to: ${this.selectedAgentCount}`);
  }

  /**
   * Get agent manager
   */
  getAgentManager(): AgentManager | null {
    return this.agentManager;
  }

  /**
   * Get all agents
   */
  getAllAgents(): Agent[] {
    return this.agentManager?.getAllAgents() || [];
  }
}
