// src/types/index.ts
/**
 * Core type definitions for Maze Mind
 */

// ============================================
// Enums
// ============================================

export enum Direction {
  UP = 0,
  RIGHT = 1,
  DOWN = 2,
  LEFT = 3,
}

export enum TileType {
  WALL = 'wall',
  FLOOR = 'floor',
  ENTRANCE = 'entrance',
  EXIT = 'exit',
}

export enum ResourceType {
  FOOD = 'food',
  WATER = 'water',
  MEDICAL = 'medical',
}

export enum ViewMode {
  AGENT_POV = 'agent_pov',
  GOD_MODE = 'god_mode',
  MIXED_MODE = 'mixed_mode',
  REPLAY_MODE = 'replay_mode',
  DEBUG_MODE = 'debug_mode',
}

export enum TimePeriod {
  DAY = 'day',
  DUSK = 'dusk',
  NIGHT = 'night',
  DAWN = 'dawn',
}

export enum AnimationState {
  IDLE = 'idle',
  WALK = 'walk',
  RUN = 'run',
}

// ============================================
// Basic Types
// ============================================

export interface Position {
  x: number;
  y: number;
}

export interface Dimensions {
  width: number;
  height: number;
}

export interface Bounds {
  left: number;
  right: number;
  top: number;
  bottom: number;
}

export interface TimeOfDay {
  period: TimePeriod;
  brightness: number; // 0-1
  hour: number; // 0-24
}

// ============================================
// Game State Types
// ============================================

export interface GameConfig {
  maze: MazeConfig;
  agent: AgentConfig;
  time: TimeConfig;
  survival: SurvivalConfig;
  visual: VisualConfig;
}

export interface MazeConfig {
  width: number;
  height: number;
  complexity: number; // 0-1
  deadEnds: number;
  seed?: string;
  entrancePosition?: Position;
  exitPosition?: Position;
}

export interface AgentConfig {
  visionRange: number;
  visionRangeNight: number;
  canSeeThroughWalls: boolean;
  memoryDecay: boolean;
  movementType: 'discrete' | 'continuous';
  baseSpeed: number;
  speedFatigueModifier: boolean;
  speedStressModifier: boolean;
  workingMemoryCapacity: number;
  attentionSpan: number;
  patternRecognition: boolean;
  spatialMappingAbility: 'low' | 'medium' | 'high';
  canRun: boolean;
  canRest: boolean;
  injurySystem: boolean;
  painAffectsDecisions: boolean;
  canMarkPaths: boolean;
  canDropItems: boolean;
  canCountSteps: boolean;
  canEstimateTime: boolean;
}

export interface TimeConfig {
  realTime: boolean;
  timeAcceleration: number;
  pauseable: boolean;
  adjustableSpeed: number[];
  dayLength: number; // game hours
  nightLength: number; // game hours
  fullCycle: number; // game hours
  dawnDuskTransition: number; // game hours
  dayVisibility: number;
  duskVisibility: number;
  nightVisibility: number;
  dawnVisibility: number;
  requiresSleep: boolean;
  sleepDeprivationThreshold: number;
  sleepDuration: [number, number]; // min-max hours
  canSleepAnywhere: boolean;
  nightmaresPossible: boolean;
}

export interface SurvivalConfig {
  startingHunger: number;
  startingThirst: number;
  startingEnergy: number;
  startingHealth: number;
  startingFood: number;
  startingWater: number;
  startingSupplies: string[];
  hungerDepletionBase: number;
  hungerDepletionActive: number;
  hungerDepletionResting: number;
  thirstDepletionBase: number;
  thirstDepletionActive: number;
  thirstDepletionResting: number;
  energyDepletionBase: number;
  energyDepletionActive: number;
  energyDepletionRunning: number;
  energyRestorationSleep: number;
  wellFedThreshold: number;
  hungryThreshold: number;
  starvingThreshold: number;
  hydratedThreshold: number;
  thirstyThreshold: number;
  dehydratedThreshold: number;
  energeticThreshold: number;
  tiredThreshold: number;
  exhaustedThreshold: number;
  starvationDeath: number;
  dehydrationDeath: number;
  exhaustionCollapse: number;
  injuryDeathThreshold: number;
  stressAccumulation: boolean;
  stressFactors: StressFactors;
  stressEffects: StressEffects;
}

export interface StressFactors {
  lowResources: number;
  darkness: number;
  injury: number;
  lost: number;
  timeInMaze: number;
  nearDeath: number;
}

export interface StressEffects {
  decisionQuality: 'degrades' | 'stable';
  memoryAccuracy: 'degrades' | 'stable';
  hallucinations: 'increases' | 'stable';
  panicBehavior: 'possible' | 'impossible';
  hopeLoss: 'gradual' | 'none';
}

export interface VisualConfig {
  tileSize: number;
  view: 'top_down' | 'isometric';
  style: 'pixel_art' | 'realistic';
  enableShadows: boolean;
  enableParticles: boolean;
  enableLighting: boolean;
  cameraFollowSmooth: boolean;
  cameraZoomLevels: number[];
}

// ============================================
// Agent Types
// ============================================

export interface AgentState {
  // Identity
  name: string;
  age: number;
  
  // Position & Movement
  position: Position;
  facing: Direction;
  isMoving: boolean;
  moveSpeed: number;
  
  // Physical State (0-100)
  hunger: number;
  thirst: number;
  energy: number;
  health: number;
  stress: number;
  
  // Inventory
  foodCarried: number;
  waterCarried: number;
  items: string[];
  carryWeight: number;
  
  // Time Tracking
  hoursPassed: number;
  daysPassed: number;
  sleepDeprivation: number;
  
  // Status Flags
  isAlive: boolean;
  isSleeping: boolean;
  isInjured: boolean;
  isHallucinating: boolean;
}

export interface AgentPersonality {
  // Core traits (Big Five)
  openness: number; // 0-1
  conscientiousness: number;
  extraversion: number;
  agreeableness: number;
  neuroticism: number;
  
  // Domain-specific
  riskTolerance: number;
  optimism: number;
  resilience: number;
  focusAbility: number;
}

// ============================================
// Memory Types (Week 2+)
// ============================================

export interface Memory {
  id: string;
  description: string;
  timestamp: number;
  lastAccessed: number;
  memoryType: 'observation' | 'reflection' | 'plan';
  importance: number; // 1-10
  embedding?: number[];
  tags: string[];
  location?: Position;
}

export interface RetrievalResult {
  memory: Memory;
  score: number;
  recencyScore: number;
  importanceScore: number;
  relevanceScore: number;
}

// ============================================
// Maze Types
// ============================================

export interface Tile {
  type: TileType;
  position: Position;
  walls: {
    north: boolean;
    south: boolean;
    east: boolean;
    west: boolean;
  };
  hasResource: boolean;
  resourceType?: ResourceType;
  isExplored: boolean;
  isVisible: boolean;
}

export interface Maze {
  width: number;
  height: number;
  tiles: Tile[][];
  entrance: Position;
  exit: Position;
  resources: Resource[];
  seed: string;
}

export interface Resource {
  id: string;
  type: ResourceType;
  position: Position;
  quantity: number;
  isCollected: boolean;
}

// ============================================
// Rendering Types
// ============================================

export interface SpriteSheet {
  imagePath: string;
  frameWidth: number;
  frameHeight: number;
  animations: {
    [key: string]: {
      frames: number[];
      frameRate: number;
      loop: boolean;
    };
  };
}

export interface CameraState {
  position: Position;
  zoom: number;
  target: Position;
  smoothing: number;
}

export interface LightSource {
  position: Position;
  radius: number;
  intensity: number;
  color: number; // hex color
}

// ============================================
// UI Types
// ============================================

export interface UIState {
  viewMode: ViewMode;
  isPaused: boolean;
  showDebug: boolean;
  showMiniMap: boolean;
  showStats: boolean;
  selectedPanel: string | null;
}

export interface StatusBarData {
  label: string;
  value: number; // 0-100
  maxValue: number;
  color: number;
  warningThreshold: number;
  criticalThreshold: number;
}

// ============================================
// Metrics Types (Week 4)
// ============================================

export interface SimulationMetrics {
  simulationId: string;
  startTime: Date;
  endTime?: Date;
  outcome: 'success' | 'starvation' | 'dehydration' | 'exhaustion' | 'stress' | 'error';
  
  // Performance
  timeToComplete?: number; // game hours
  distanceTraveled: number;
  efficiencyScore: number;
  deadEndsVisited: number;
  
  // Survival
  foodConsumed: number;
  waterConsumed: number;
  averageStressLevel: number;
  peakStressLevel: number;
  closeCalls: number;
  
  // Cognitive
  decisionsMade: number;
  reflectionsGenerated: number;
  strategyPivots: number;
  memoryRetrievals: number;
  hallucinations: number;
  
  // Behavioral
  explorationStrategy: string;
  riskTolerance: string;
  rationingBehavior: string;
}

// ============================================
// Event Types
// ============================================

export interface GameEvent {
  type: string;
  timestamp: number;
  data: any;
}

export interface InputEvent {
  type: 'keydown' | 'keyup' | 'mousedown' | 'mouseup' | 'mousemove' | 'wheel';
  key?: string;
  button?: number;
  position?: Position;
  delta?: number;
}

// ============================================
// Fog of War & View Mode Types (NEW in Day 8)
// ============================================

export interface VisibilityInfo {
  isVisible: boolean;
  isExplored: boolean;
  distance: number;
}

export interface ExplorationStats {
  totalTiles: number;
  exploredCount: number;
  explorationPercentage: number;
  visibleCount: number;
}

// ============================================
// Utility Types
// ============================================

export type Nullable<T> = T | null;
export type Optional<T> = T | undefined;
export type Callback<T = void> = () => T;
export type AsyncCallback<T = void> = () => Promise<T>;

// ============================================
// Planning Types (Week 5)
// ============================================

export * from './planning';
