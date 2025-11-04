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

export class Agent {
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

    console.log(`👤 Agent "${this.state.name}" created at tile (${startTile.x}, ${startTile.y})`);
    console.log(`   World position: (${this.currentPosition.x}, ${this.currentPosition.y})`);
    console.log(`🧠 Memory system initialized with ${this.memoryStream.getMemoryCount()} memories`);
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
   */
  update(deltaTime: number): void {
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
  
  /**
   * Get agent name
   */
  getName(): string {
    return this.state.name;
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
