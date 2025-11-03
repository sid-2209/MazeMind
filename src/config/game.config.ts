// src/config/game.config.ts
/**
 * Main Game Configuration
 * 
 * All configurable parameters for Maze Mind simulation
 */

import {
  GameConfig,
  MazeConfig,
  AgentConfig,
  TimeConfig,
  SurvivalConfig,
  VisualConfig,
  StressFactors,
  StressEffects,
} from '../types';

// ============================================
// Maze Configuration
// ============================================
export const MAZE_CONFIG: MazeConfig = {
  // Dimensions
  width: 20,
  height: 20,

  // Generation parameters
  complexity: 0.7, // 0-1 scale (higher = more branching)
  deadEnds: 5, // Number of intentional dead ends

  // Seed for reproducibility (undefined = random)
  seed: undefined,

  // Fixed positions (undefined = random placement)
  entrancePosition: undefined,
  exitPosition: undefined,
};

// ============================================
// Agent Configuration
// ============================================
export const AGENT_CONFIG: AgentConfig = {
  // Vision (NEW in Day 8 - affects fog of war)
  visionRange: 2,              // Can see 2 tiles away during day (5x5 grid)
  visionRangeNight: 1,         // Can see only 1 tile away at night (3x3 grid)
  canSeeThroughWalls: false,   // Walls block line of sight
  memoryDecay: true,           // Older memories become fuzzier

  // Movement
  movementType: 'continuous', // 'discrete' or 'continuous'
  baseSpeed: 1.0, // tiles per second
  speedFatigueModifier: true, // Slows when exhausted
  speedStressModifier: true, // Can rush when panicked

  // Cognitive
  workingMemoryCapacity: 7, // Items in immediate awareness (Miller's Law)
  attentionSpan: 3600, // Seconds before focus degrades (1 hour)
  patternRecognition: true, // Can notice repeated structures
  spatialMappingAbility: 'medium', // 'low' | 'medium' | 'high'

  // Physical
  canRun: true, // Costs extra energy
  canRest: true, // Recovers energy
  injurySystem: true, // Can get hurt from exhaustion
  painAffectsDecisions: true, // Pain clouds judgment

  // Tools/Abilities
  canMarkPaths: true, // Mental markers (not physical)
  canDropItems: true, // Can discard items to lighten load
  canCountSteps: true, // But might lose count under stress
  canEstimateTime: true, // But accuracy degrades
};

// ============================================
// Time Configuration
// ============================================
export const TIME_CONFIG: TimeConfig = {
  // Time scale
  realTime: true,
  timeAcceleration: 10, // 1 real second = 10 game seconds
  pauseable: true,
  adjustableSpeed: [0.5, 1, 2, 5, 10, 20, 50], // Speed multiplier options

  // Day/Night cycle
  dayLength: 720, // 12 game hours (720 minutes)
  nightLength: 720, // 12 game hours (720 minutes)
  fullCycle: 1440, // 24 game hours (1440 minutes)
  dawnDuskTransition: 120, // 2 hours gradual transition

  // Visibility multipliers (affects vision range)
  dayVisibility: 1.0, // 100% vision during day
  duskVisibility: 0.7, // 70% vision during dusk
  nightVisibility: 0.3, // 30% vision during night (very limited)
  dawnVisibility: 0.7, // 70% vision during dawn

  // Sleep mechanics (Week 2+)
  requiresSleep: true,
  sleepDeprivationThreshold: 36, // Must sleep within 36 hours
  sleepDuration: [6, 8], // Hours needed (min, max)
  canSleepAnywhere: true, // But affects rest quality
  nightmaresPossible: true, // Under high stress
};

// ============================================
// Survival Configuration
// ============================================
const STRESS_FACTORS: StressFactors = {
  lowResources: 0.1, // Per hour below threshold
  darkness: 0.05, // Per hour in darkness
  injury: 0.15, // Per hour while injured
  lost: 0.08, // Per hour if disoriented
  timeInMaze: 0.02, // Just being trapped
  nearDeath: 0.3, // Any stat critical
};

const STRESS_EFFECTS: StressEffects = {
  decisionQuality: 'degrades',
  memoryAccuracy: 'degrades',
  hallucinations: 'increases',
  panicBehavior: 'possible',
  hopeLoss: 'gradual',
};

export const SURVIVAL_CONFIG: SurvivalConfig = {
  // Starting stats (0-100%)
  startingHunger: 100,
  startingThirst: 100,
  startingEnergy: 100,
  startingHealth: 100,

  // Starting inventory
  startingFood: 5, // units
  startingWater: 5, // units
  startingSupplies: ['basic_knife', 'cloth_wrap'],

  // Depletion rates (% per game hour)
  hungerDepletionBase: 1.5, // Normal activity
  hungerDepletionActive: 2.5, // While moving
  hungerDepletionResting: 0.8, // While resting

  thirstDepletionBase: 2.0, // Water more critical
  thirstDepletionActive: 3.5,
  thirstDepletionResting: 1.2,

  energyDepletionBase: 1.0,
  energyDepletionActive: 2.0,
  energyDepletionRunning: 5.0,
  energyRestorationSleep: 50, // % restored per sleep cycle

  // Thresholds
  wellFedThreshold: 70, // Above = optimal performance
  hungryThreshold: 40, // Below = impaired
  starvingThreshold: 15, // Critical

  hydratedThreshold: 70,
  thirstyThreshold: 40,
  dehydratedThreshold: 15,

  energeticThreshold: 70,
  tiredThreshold: 40,
  exhaustedThreshold: 15,

  // Death conditions
  starvationDeath: 0, // Dies at 0% hunger
  dehydrationDeath: 0, // Dies at 0% thirst
  exhaustionCollapse: 5, // Collapses, can recover if helped
  injuryDeathThreshold: 0, // Cumulative injury limit

  // Stress system
  stressAccumulation: true,
  stressFactors: STRESS_FACTORS,
  stressEffects: STRESS_EFFECTS,
};

// ============================================
// Visual Configuration
// ============================================
export const VISUAL_CONFIG: VisualConfig = {
  // Rendering
  tileSize: 32, // pixels per tile
  view: 'top_down', // 'top_down' | 'isometric'
  style: 'pixel_art', // 'pixel_art' | 'realistic'

  // Effects
  enableShadows: true,
  enableParticles: true,
  enableLighting: true,

  // Camera
  cameraFollowSmooth: true,
  cameraZoomLevels: [0.5, 0.75, 1.0, 1.5, 2.0],
};

// ============================================
// Resource Spawn Configuration
// ============================================
export const RESOURCE_CONFIG = {
  food: {
    types: ['dried_fruit', 'protein_bar', 'nuts'],
    spawns: 4, // 4 locations in 20×20 maze
    perSpawn: [1, 3], // 1-3 units per location
    visibilityRange: 1, // Must be close to see
    weight: 0.2, // kg per unit
    restoration: 20, // % hunger restored per unit
  },

  water: {
    types: ['bottle', 'canteen'],
    spawns: 3,
    perSpawn: [2, 4],
    visibilityRange: 1,
    weight: 0.5, // kg per unit
    restoration: 25, // % thirst restored per unit
  },

  medical: {
    types: ['bandage', 'pain_reliever'],
    spawns: 1, // Rare
    perSpawn: [1, 2],
    visibilityRange: 1,
    healthRestoration: 30,
  },

  // Carrying capacity
  maxCarryWeight: 5.0, // kg total
  weightAffectsSpeed: true,
  overencumberedThreshold: 4.0, // kg
};

// ============================================
// Complete Game Config
// ============================================
export const GAME_CONFIG: GameConfig = {
  maze: MAZE_CONFIG,
  agent: AGENT_CONFIG,
  time: TIME_CONFIG,
  survival: SURVIVAL_CONFIG,
  visual: VISUAL_CONFIG,
};

// ============================================
// Constants
// ============================================
export const CONSTANTS = {
  // Tile rendering
  TILE_SIZE: VISUAL_CONFIG.tileSize,

  // FPS
  TARGET_FPS: 60,
  FIXED_TIME_STEP: 1 / 60,

  // Color palette (hex)
  COLORS: {
    background: 0x1a1a1a,
    wallDay: 0x4a4a4a,
    wallNight: 0x2a2a2a,
    floor: 0x666666,
    entrance: 0x44ff44,
    exit: 0xff4444,
    agent: 0x00aaff,
    food: 0xffaa44,
    water: 0x44aaff,
    medical: 0xff4488,

    // Fog of war colors (NEW in Day 8)
    fogExplored: 0x000000,   // Black for explored but not visible
    fogUnseen: 0x000000,     // Black for unexplored

    // Lighting colors (NEW in Day 7)
    dawn: 0xffaa88,
    day: 0xffffff,
    dusk: 0xff8844,
    night: 0x4466aa,
  },

  // UI
  UI: {
    panelWidth: 300,
    panelHeight: 500,
    statusBarHeight: 30,
    miniMapSize: 150,
    padding: 20,
  },

  // Lighting
  LIGHTING: {
    ambientMultiplier: 0.3,
    torchRadius: 5, // tiles
    torchIntensity: 1.0,
    shadowAlpha: 0.6,
  },
};

// ============================================
// Difficulty Presets
// ============================================
export const DIFFICULTY_PRESETS = {
  easy: {
    maze: { ...MAZE_CONFIG, complexity: 0.5, deadEnds: 2 },
    survival: {
      ...SURVIVAL_CONFIG,
      startingFood: 8,
      startingWater: 8,
      hungerDepletionBase: 1.0,
      thirstDepletionBase: 1.5,
    },
    resources: {
      ...RESOURCE_CONFIG,
      food: { ...RESOURCE_CONFIG.food, spawns: 6 },
      water: { ...RESOURCE_CONFIG.water, spawns: 5 },
    },
  },

  medium: {
    maze: MAZE_CONFIG,
    survival: SURVIVAL_CONFIG,
    resources: RESOURCE_CONFIG,
  },

  hard: {
    maze: { ...MAZE_CONFIG, complexity: 0.9, deadEnds: 8 },
    survival: {
      ...SURVIVAL_CONFIG,
      startingFood: 3,
      startingWater: 3,
      hungerDepletionBase: 2.0,
      thirstDepletionBase: 2.5,
    },
    resources: {
      ...RESOURCE_CONFIG,
      food: { ...RESOURCE_CONFIG.food, spawns: 2 },
      water: { ...RESOURCE_CONFIG.water, spawns: 2 },
    },
  },
};

// ============================================
// Vision System Documentation (Day 8)
// ============================================

/**
 * Vision Range Explained:
 *
 * visionRange: 2 means:
 * - Agent can see 2 tiles in each direction (north, south, east, west)
 * - Creates a 5x5 grid of visible tiles (2 + agent + 2)
 * - Affected by walls (line of sight blocking)
 *
 * visionRangeNight: 1 means:
 * - At night, vision is reduced to 1 tile in each direction
 * - Creates a 3x3 grid of visible tiles (1 + agent + 1)
 * - Simulates darkness limiting vision
 *
 * Line of Sight:
 * - Walls block vision (canSeeThroughWalls: false)
 * - Uses Bresenham's line algorithm for LOS calculations
 * - Can't see through walls even if tiles are within range
 * - Diagonal vision is supported
 *
 * Fog of War States:
 * - Unexplored: Never seen (completely dark)
 * - Explored: Previously seen but not currently visible (dimmed/grayed)
 * - Visible: Currently within vision range and LOS (fully lit)
 *
 * View Modes:
 * - Agent POV: Only see what agent currently sees (realistic)
 * - God Mode: See entire maze (developer/testing)
 * - Mixed Mode: See all explored areas (game default)
 * - Debug Mode: Show debug info and grid overlays
 */

export default GAME_CONFIG;
