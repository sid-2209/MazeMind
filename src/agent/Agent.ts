// src/agent/Agent.ts
/**
 * Agent - Core agent class for Arth (Updated for Week 2)
 *
 * Manages:
 * - Agent state (position, direction, stats)
 * - Movement logic (tile-to-tile discrete movement)
 * - Collision detection
 * - State updates
 * - Memory system (NEW in Week 2)
 *
 * Week 1, Day 5-6: Basic movement and collision
 * Week 2, Days 1-2: Memory stream and observation generation
 * Week 2, Days 3-4: AI decision-making
 */

import { Position, Direction, Maze, TileType, AgentState } from '../types';
import { ARTH_PROFILE, ARTH_INITIAL_STATS } from '../config/arth.profile';
import { CONSTANTS, MEMORY_CONFIG } from '../config/game.config';
import { MemoryStream } from './MemoryStream';
import { ObservationGenerator } from './ObservationGenerator';
import { MemoryRetrieval } from './MemoryRetrieval';
import { AnthropicService } from '../services/AnthropicService';
import { EmbeddingProvider } from '../services/EmbeddingService'; // NEW: Embedding types
import { LLMService, LLMProvider } from '../services/LLMService'; // NEW: Multi-provider support
import { DecisionMaker } from './DecisionMaker'; // NEW in Days 3-4
import { ReflectionSystem } from './ReflectionSystem'; // NEW in Days 3-4
import { ResourceManager } from '../systems/ResourceManager'; // Week 3
import { StressManager } from '../systems/StressManager'; // Week 3
import { Item, getItemDescription, getItemName } from '../entities/Item'; // Week 3
import { PlanningSystem } from '../systems/PlanningSystem'; // Week 5
import { DailyPlan, ActionPlan, PlanningContext } from '../types/planning'; // Week 5
import { SocialMemory } from './SocialMemory'; // Week 6
import { v4 as uuidv4 } from 'uuid';

export class Agent {
  // Identity (Week 6 - Multi-agent support)
  private id: string = uuidv4();
  private agentName: string = 'Arth';
  private agentColor: number = 0x4CAF50; // Default green

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

  // Memory system (NEW in Week 2)
  private memoryStream: MemoryStream;
  private observationGenerator: ObservationGenerator;
  private memoryRetrieval: MemoryRetrieval | null = null; // Day 2
  private anthropicService: AnthropicService | null = null; // Day 2 - for embeddings
  private llmService: LLMService | null = null; // NEW: Multi-provider LLM
  private observationTimer: number = 0; // Track time for observation generation

  // Decision system (NEW in Days 3-4)
  private decisionMaker: DecisionMaker | null = null;
  private reflectionSystem: ReflectionSystem | null = null; // Days 3-4

  // Planning system (Week 5)
  private planningSystem: PlanningSystem | null = null;

  // Social memory system (Week 6)
  private socialMemory!: SocialMemory;

  // Survival systems (Week 3)
  private resourceManager: ResourceManager;
  private stressManager: StressManager;
  private itemGenerator: any = null; // Will be set by Game during initialization
  private onDeathCallback?: (agent: Agent) => void;
  private onBreakdownCallback?: (agent: Agent) => void;

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

    // Initialize memory system (NEW in Week 2)
    this.memoryStream = new MemoryStream(MEMORY_CONFIG.maxMemoriesStored);
    this.observationGenerator = new ObservationGenerator();

    // Generate initial observation
    const initialObs = `I've been placed in a maze at position (${startTile.x}, ${startTile.y}). This is the entrance. I must find the exit to survive. Elena is waiting for me.`;
    this.memoryStream.addObservation(initialObs, 9, ['start', 'motivation', 'goal'], this.currentPosition);

    // Initialize survival systems (Week 3)
    this.resourceManager = new ResourceManager();
    this.stressManager = new StressManager();

    console.log(`👤 Agent "${this.state.name}" created at tile (${startTile.x}, ${startTile.y})`);
    console.log(`   World position: (${this.currentPosition.x}, ${this.currentPosition.y})`);
    console.log(`🧠 Memory system initialized with ${this.memoryStream.getMemoryCount()} memories`);
    console.log(`❤️  Survival systems initialized (Resources: 100%, Stress: 0%)`);
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
   * @param timeScale - Time scale multiplier (default: 1)
   */
  update(deltaTime: number, timeScale: number = 1): void {
    // Update movement if moving
    if (this.state.isMoving && this.targetPosition) {
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

        // Check for items at this tile (Week 3)
        this.tryConsumeNearbyItem();
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

    // Update survival resources (Week 3)
    this.resourceManager.update(deltaTime, timeScale);
    const survivalState = this.resourceManager.getState();

    // Update agent state with current resources
    this.state.hunger = survivalState.hunger;
    this.state.thirst = survivalState.thirst;
    this.state.energy = survivalState.energy;

    // Calculate stress (Week 3)
    const explorationTime = survivalState.survivalTime;
    const stressLevel = this.stressManager.calculateStress(survivalState, explorationTime);
    this.state.stress = stressLevel;

    // Check for death (Week 3)
    if (survivalState.isDead && this.state.isAlive) {
      this.handleDeath();
    }

    // Check for mental breakdown (Week 3)
    if (this.stressManager.hasMentalBreakdown() && this.state.isAlive) {
      this.handleMentalBreakdown();
    }

    // Generate observations (NEW in Week 2)
    this.observationTimer += deltaTime;

    // Generate observations periodically (every ~1 second) or on state change
    if (this.observationTimer >= 1.0) {
      this.generateObservations(deltaTime);
      this.observationTimer = 0;
    }

    // Update reflection system (NEW in Days 3-4)
    if (this.reflectionSystem) {
      this.reflectionSystem.update(deltaTime);
    }
  }

  /**
   * Generate observations about current state and environment (NEW in Week 2)
   */
  private generateObservations(deltaTime: number): void {
    const observations = this.observationGenerator.generateObservations({
      agent: this,
      maze: this.maze,
      deltaTime,
    });

    // Add all observations to memory stream
    for (const obs of observations) {
      this.memoryStream.addObservation(
        obs.description,
        obs.importance,
        obs.tags,
        obs.location
      );
    }

    // Log observation count for debugging
    if (observations.length > 0) {
      const memCount = this.memoryStream.getMemoryCount();
      console.log(`🧠 Generated ${observations.length} observations (total memories: ${memCount})`);
    }
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
  // Memory System (NEW in Week 2)
  // ============================================

  /**
   * Initialize retrieval system with LLM provider configuration
   * Supports multiple providers: Anthropic, Ollama, or heuristic fallback
   * NOW WITH REAL EMBEDDINGS! 🎉
   */
  initializeRetrieval(
    anthropicApiKey?: string,
    llmProvider: LLMProvider = 'heuristic',
    ollamaConfig?: { url?: string; model?: string },
    embeddingConfig?: {
      provider?: 'openai' | 'voyage' | 'ollama';
      openaiApiKey?: string;
      voyageApiKey?: string;
    }
  ): void {
    // Prepare embedding configuration for real semantic embeddings
    const embeddingServiceConfig = embeddingConfig ? {
      provider: embeddingConfig.provider || 'openai',
      fallbackChain: ['openai', 'ollama', 'fake'] as EmbeddingProvider[],
      openaiApiKey: embeddingConfig.openaiApiKey,
      voyageApiKey: embeddingConfig.voyageApiKey,
      ollamaUrl: ollamaConfig?.url || 'http://localhost:11434',
      ollamaModel: 'nomic-embed-text',
      preferredDimension: embeddingConfig.provider === 'voyage' ? 1024 :
                         embeddingConfig.provider === 'ollama' ? 768 : 1536,
      maxCacheSize: 10000,
      enableCache: true,
    } : undefined;

    // Initialize Anthropic service with REAL embeddings support
    this.anthropicService = new AnthropicService(anthropicApiKey, embeddingServiceConfig);
    this.memoryRetrieval = new MemoryRetrieval(this.memoryStream, this.anthropicService);

    // Generate embeddings for existing memories
    if (this.anthropicService.isServiceEnabled()) {
      this.memoryRetrieval.generateMissingEmbeddings().catch(err => {
        console.error('❌ Failed to generate initial embeddings:', err);
      });
    }

    // Initialize LLMService with provider
    this.llmService = new LLMService({
      provider: llmProvider,
      anthropicApiKey,
      ollamaUrl: ollamaConfig?.url || 'http://localhost:11434',
      ollamaModel: ollamaConfig?.model || 'llama3.2:3b-instruct-q4_K_M',
    });

    // Initialize DecisionMaker (NEW in Days 3-4)
    this.decisionMaker = new DecisionMaker(
      this,
      this.maze,
      this.llmService,
      this.memoryRetrieval
    );
    console.log('🤖 DecisionMaker initialized');

    // Initialize ReflectionSystem (NEW in Days 3-4)
    this.reflectionSystem = new ReflectionSystem(
      this,
      this.memoryStream,
      this.llmService,
      {
        minMemoriesForReflection: 20,
        reflectionInterval: 120,  // 2 minutes
        importanceThreshold: 5,
        maxMemoriesPerReflection: 30,
      }
    );
    console.log('💭 ReflectionSystem initialized');

    // Initialize PlanningSystem (Week 5)
    this.planningSystem = new PlanningSystem(
      this,
      this.llmService,
      this.memoryStream
    );
    console.log('📋 PlanningSystem initialized');

    // Initialize SocialMemory (Week 6)
    this.socialMemory = new SocialMemory(this.id);
    console.log('🤝 SocialMemory initialized');
  }

  /**
   * Get the memory stream
   */
  getMemoryStream(): MemoryStream {
    return this.memoryStream;
  }

  /**
   * Get the memory retrieval system (Day 2)
   */
  getMemoryRetrieval(): MemoryRetrieval | null {
    return this.memoryRetrieval;
  }

  /**
   * Query memories with natural language (Day 2)
   */
  async queryMemories(query: string, k: number = 10) {
    if (!this.memoryRetrieval) {
      console.warn('⚠️  Memory retrieval not initialized');
      return [];
    }

    return this.memoryRetrieval.retrieve(query, k);
  }

  /**
   * Get recent memories
   */
  getRecentMemories(count: number = 10) {
    return this.memoryStream.getRecentMemories(count);
  }

  /**
   * Get memory statistics
   */
  getMemoryStatistics() {
    return this.memoryStream.getStatistics();
  }

  /**
   * Get the decision maker (Days 3-4)
   */
  getDecisionMaker(): DecisionMaker | null {
    return this.decisionMaker;
  }

  /**
   * Get the reflection system (Days 3-4)
   */
  getReflectionSystem(): ReflectionSystem | null {
    return this.reflectionSystem;
  }

  /**
   * Get the LLM service (for provider switching)
   */
  getLLMService(): LLMService | null {
    return this.llmService;
  }

  /**
   * Get the Anthropic service (for embedding metrics)
   */
  getAnthropicService(): AnthropicService | null {
    return this.anthropicService;
  }

  // ============================================
  // Planning System (Week 5)
  // ============================================

  /**
   * Get the planning system
   */
  getPlanningSystem(): PlanningSystem | null {
    return this.planningSystem;
  }

  /**
   * Get current planning context for plan generation
   */
  getPlanningContext(): PlanningContext {
    const survivalState = this.resourceManager.getState();
    const recentMemories = this.memoryStream
      .getMemoriesByType('observation')
      .slice(-5)
      .map(m => m.description);

    const recentReflections = this.memoryStream
      .getMemoriesByType('reflection')
      .slice(-3)
      .map(m => m.description);

    // Get items from item generator if available
    const knownItems = this.itemGenerator
      ? this.itemGenerator.getAllItems().filter((item: Item) => !item.consumed).map((item: Item) => ({
          type: getItemName(item.type),
          position: item.position
        }))
      : [];

    // Get exploration progress - stub for now (will be enhanced with fog of war)
    const explorationProgress = 0.3; // Placeholder

    return {
      survivalState: {
        hunger: survivalState.hunger,
        thirst: survivalState.thirst,
        energy: survivalState.energy,
        stress: this.state.stress
      },
      currentPosition: this.getTilePosition(),
      explorationProgress,
      knownItems,
      recentMemories,
      recentReflections,
      gameTime: 0, // Will be passed from Game
      timeOfDay: 'morning' // Placeholder - will be enhanced with time system
    };
  }

  /**
   * Get current plan
   */
  getCurrentPlan(): DailyPlan | null {
    return this.planningSystem?.getCurrentDailyPlan() || null;
  }

  /**
   * Get current action from plan
   */
  getCurrentPlannedAction(gameTime: number): ActionPlan | null {
    return this.planningSystem?.getCurrentAction(gameTime) || null;
  }

  /**
   * Trigger re-planning
   */
  async replan(reason: string, gameTime: number): Promise<void> {
    if (!this.planningSystem) {
      console.warn('⚠️  Planning system not initialized');
      return;
    }

    const context = this.getPlanningContext();
    context.gameTime = gameTime;
    await this.planningSystem.replan(reason, context);
  }

  /**
   * Initialize daily plan (called at game start)
   */
  async initializePlan(gameTime: number): Promise<void> {
    if (!this.planningSystem) {
      console.warn('⚠️  Planning system not initialized');
      return;
    }

    console.log('📋 Initializing daily plan...');
    const context = this.getPlanningContext();
    context.gameTime = gameTime;

    await this.planningSystem.generateDailyPlan(context);
    await this.planningSystem.decomposeInitialPlans(context);
  }

  // ============================================
  // Survival Systems (Week 3)
  // ============================================

  /**
   * Set item generator reference (called by Game during initialization)
   */
  setItemGenerator(itemGenerator: any): void {
    this.itemGenerator = itemGenerator;
  }

  /**
   * Set death callback (called by Game)
   */
  setDeathCallback(callback: (agent: Agent) => void): void {
    this.onDeathCallback = callback;
  }

  /**
   * Set breakdown callback (called by Game)
   */
  setBreakdownCallback(callback: (agent: Agent) => void): void {
    this.onBreakdownCallback = callback;
  }

  /**
   * Try to consume item at current tile
   */
  private tryConsumeNearbyItem(): void {
    if (!this.itemGenerator) return;

    const item = this.itemGenerator.getItemAtTile(this.tilePosition.x, this.tilePosition.y);

    if (item && !item.consumed) {
      this.consumeItem(item);
    }
  }

  /**
   * Consume an item and restore resources
   */
  private consumeItem(item: Item): void {
    if (!this.itemGenerator) return;

    // Consume item
    this.itemGenerator.consumeItem(item.id);

    // Restore resources
    this.resourceManager.restore({
      hunger: item.hungerRestore,
      thirst: item.thirstRestore,
      energy: item.energyRestore
    });

    // Determine urgency level
    const isCritical = this.resourceManager.isCritical();
    const urgency = isCritical ? 'desperately' : 'gratefully';

    // Add consumption memory
    const description = getItemDescription(item, this.state.name, urgency);
    const importance = this.calculateConsumptionImportance(item);

    this.memoryStream.addObservation(
      description,
      importance,
      ['survival', 'consumption', item.type],
      this.currentPosition
    );

    console.log(`🍴 ${this.state.name} consumed ${getItemName(item.type)}`);
  }

  /**
   * Calculate importance of consumption event
   * More urgent needs result in higher importance scores
   */
  private calculateConsumptionImportance(item: Item): number {
    const urgentNeed = this.resourceManager.getMostUrgentNeed();

    // High importance if consuming item for urgent need
    if (urgentNeed === 'thirst' && item.thirstRestore > 0) return 9;
    if (urgentNeed === 'hunger' && item.hungerRestore > 0) return 9;
    if (urgentNeed === 'energy' && item.energyRestore > 0) return 8;

    // Medium importance for preventative consumption
    return 5;
  }

  /**
   * Handle agent death
   */
  private handleDeath(): void {
    const survivalState = this.resourceManager.getState();
    const cause = survivalState.hunger === 0 ? 'starvation' :
                  survivalState.thirst === 0 ? 'dehydration' :
                  'exhaustion';

    console.log(`💀 ${this.state.name} has died from ${cause}`);

    // Mark as dead
    this.state.isAlive = false;

    // Add death memory
    this.memoryStream.addObservation(
      `${this.state.name} succumbed to ${cause}`,
      10,
      ['survival', 'death', cause],
      this.currentPosition
    );

    // Stop movement
    this.targetPosition = null;
    this.state.isMoving = false;

    // Notify game
    if (this.onDeathCallback) {
      this.onDeathCallback(this);
    }
  }

  /**
   * Handle mental breakdown
   */
  private handleMentalBreakdown(): void {
    console.log(`🧠 ${this.state.name} suffered a mental breakdown`);

    // Mark as not alive (breakdown = functional death)
    this.state.isAlive = false;

    // Add breakdown memory
    this.memoryStream.addObservation(
      `${this.state.name} collapsed from overwhelming stress and exhaustion`,
      10,
      ['survival', 'breakdown', 'stress'],
      this.currentPosition
    );

    // Stop movement
    this.targetPosition = null;
    this.state.isMoving = false;

    // Notify game
    if (this.onBreakdownCallback) {
      this.onBreakdownCallback(this);
    }
  }

  /**
   * Get resource manager
   */
  getResourceManager(): ResourceManager {
    return this.resourceManager;
  }

  /**
   * Get stress manager
   */
  getStressManager(): StressManager {
    return this.stressManager;
  }

  /**
   * Get survival state
   */
  getSurvivalState() {
    return this.resourceManager.getState();
  }

  /**
   * Get stress level
   */
  getStressLevel(): number {
    return this.stressManager.getStressLevel();
  }

  // ============================================
  // Multi-Agent Support (Week 6)
  // ============================================

  /**
   * Get unique agent ID
   */
  getId(): string {
    return this.id;
  }

  /**
   * Get agent name
   */
  getName(): string {
    return this.agentName;
  }

  /**
   * Set agent name
   */
  setName(name: string): void {
    this.agentName = name;
    this.state.name = name; // Also update state for backward compatibility
  }

  /**
   * Get agent color
   */
  getColor(): number {
    return this.agentColor;
  }

  /**
   * Set agent color
   */
  setColor(color: number): void {
    this.agentColor = color;
  }

  /**
   * Get social memory system
   */
  getSocialMemory(): SocialMemory {
    return this.socialMemory;
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
