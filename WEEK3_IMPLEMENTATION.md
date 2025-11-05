# Week 3 Implementation: Survival Mechanics & Cognitive Stress

## Overview

Week 3 introduces **survival mechanics** and **cognitive stress systems** to the Maze Mind project, transforming it from a pure exploration simulation into a challenging survival experience. The agent must now manage resources (hunger, thirst, energy) while navigating the maze, with cognitive performance degrading under stress.

**Status**: 🔴 Not Started (0% complete)
**Estimated Duration**: 20-28 hours (6 days)
**Dependencies**: Week 2 (Memory System, Autonomous AI) must be complete

---

## Table of Contents

1. [Research Paper Alignment](#research-paper-alignment)
2. [System Architecture](#system-architecture)
3. [Day-by-Day Implementation Plan](#day-by-day-implementation-plan)
4. [Technical Specifications](#technical-specifications)
5. [Integration Points](#integration-points)
6. [Testing Strategy](#testing-strategy)
7. [Performance Considerations](#performance-considerations)
8. [Troubleshooting](#troubleshooting)

---

## Research Paper Alignment

The Stanford Generative Agents paper doesn't explicitly cover survival mechanics, but Week 3 extends the architecture by:

### 1. **Memory Stream Extension**
```typescript
// Survival events added to memory stream
{
  timestamp: "2024-01-15T14:23:00Z",
  description: "Arth felt extremely hungry and ate a food pellet",
  importance: 8,  // LLM-scored based on urgency
  type: "survival",
  subtype: "consumption"
}
```

### 2. **Cognitive Degradation Effects**
Research paper shows agents maintain consistent behavior through memory retrieval. Week 3 introduces **stress modifiers**:

```typescript
// Retrieval score modified by stress
score = (α_recency · recency + α_importance · importance + α_relevance · relevance) × stress_modifier

// stress_modifier ranges from 0.5 (critical stress) to 1.0 (no stress)
```

### 3. **Planning Under Constraint**
Agents must now prioritize survival in their hierarchical plans:

```
Daily Plan: "Survive the day while exploring the maze"
  ↓
Hourly Plan: "Find water source in north corridor (8:00-9:00)"
  ↓
5-min Actions: ["Move north", "Search for water", "Drink water", "Rest"]
```

---

## System Architecture

### Component Overview

```
┌─────────────────────────────────────────────────────────────┐
│                        Game.ts                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │           SurvivalSystem (NEW)                       │  │
│  │  ┌────────────┐  ┌────────────┐  ┌────────────┐    │  │
│  │  │  Resource  │  │   Stress   │  │ Cognitive  │    │  │
│  │  │  Manager   │  │  Manager   │  │ Degrader   │    │  │
│  │  └────────────┘  └────────────┘  └────────────┘    │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │              ItemGenerator (NEW)                     │  │
│  │  Places consumable items in maze                     │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │           Agent.ts (MODIFIED)                        │  │
│  │  + survivalState: SurvivalState                      │  │
│  │  + consume(item): void                               │  │
│  │  + getStressLevel(): number                          │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │         DecisionMaker.ts (MODIFIED)                  │  │
│  │  Survival considerations in action planning          │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### Data Flow

```
1. Time Tick (TimeManager)
   ↓
2. Resource Depletion (SurvivalSystem)
   hunger -= 0.1/min, thirst -= 0.15/min, energy -= 0.08/min
   ↓
3. Stress Calculation (StressManager)
   stress = f(hunger, thirst, energy, exploration_time)
   ↓
4. Cognitive Effects (CognitiveDegradation)
   retrieval_modifier = 1.0 - (stress × 0.5)
   planning_quality = 1.0 - (stress × 0.3)
   ↓
5. Decision Making (DecisionMaker)
   if (hunger > 70) prioritize_food()
   else continue_exploration()
   ↓
6. Memory Recording (MemoryStream)
   "Arth felt hungry and searched for food"
```

---

## Day-by-Day Implementation Plan

### **Day 1: Resource System Foundation** (4-5 hours)

**Goal**: Implement core resource depletion mechanics

#### Files to Create:
- `src/systems/SurvivalState.ts` (interface definitions)
- `src/systems/ResourceManager.ts` (depletion logic)

#### Implementation Steps:

1. **Define SurvivalState Interface**
```typescript
// src/systems/SurvivalState.ts
export interface SurvivalState {
  // Core resources (0-100 scale)
  hunger: number;      // 100 = full, 0 = starving
  thirst: number;      // 100 = hydrated, 0 = dehydrated
  energy: number;      // 100 = rested, 0 = exhausted

  // Depletion rates (per minute)
  hungerRate: number;  // Base: 0.1
  thirstRate: number;  // Base: 0.15
  energyRate: number;  // Base: 0.08

  // Status flags
  isStarving: boolean;   // hunger < 10
  isDehydrated: boolean; // thirst < 10
  isExhausted: boolean;  // energy < 10
  isDead: boolean;       // Any resource = 0

  // Timers
  lastUpdate: number;
  survivalTime: number;  // Total survival time in seconds
}

export const DEFAULT_SURVIVAL_STATE: SurvivalState = {
  hunger: 100,
  thirst: 100,
  energy: 100,
  hungerRate: 0.1,
  thirstRate: 0.15,
  energyRate: 0.08,
  isStarving: false,
  isDehydrated: false,
  isExhausted: false,
  isDead: false,
  lastUpdate: 0,
  survivalTime: 0
};
```

2. **Implement ResourceManager**
```typescript
// src/systems/ResourceManager.ts
export class ResourceManager {
  private state: SurvivalState;

  constructor(initialState: SurvivalState = DEFAULT_SURVIVAL_STATE) {
    this.state = { ...initialState };
  }

  /**
   * Update resource levels based on elapsed time
   */
  update(deltaTime: number, timeScale: number = 1): void {
    const minutes = (deltaTime * timeScale) / 60;

    // Deplete resources
    this.state.hunger = Math.max(0, this.state.hunger - this.state.hungerRate * minutes);
    this.state.thirst = Math.max(0, this.state.thirst - this.state.thirstRate * minutes);
    this.state.energy = Math.max(0, this.state.energy - this.state.energyRate * minutes);

    // Update status flags
    this.state.isStarving = this.state.hunger < 10;
    this.state.isDehydrated = this.state.thirst < 10;
    this.state.isExhausted = this.state.energy < 10;
    this.state.isDead = this.state.hunger === 0 || this.state.thirst === 0 || this.state.energy === 0;

    // Update timers
    this.state.survivalTime += deltaTime;
    this.state.lastUpdate = Date.now();
  }

  /**
   * Get current resource levels
   */
  getState(): Readonly<SurvivalState> {
    return this.state;
  }

  /**
   * Check if agent is in critical condition
   */
  isCritical(): boolean {
    return this.state.hunger < 20 || this.state.thirst < 20 || this.state.energy < 20;
  }

  /**
   * Get most urgent need
   */
  getMostUrgentNeed(): 'hunger' | 'thirst' | 'energy' | null {
    if (this.state.isDead) return null;

    const needs = [
      { type: 'thirst' as const, value: this.state.thirst },
      { type: 'hunger' as const, value: this.state.hunger },
      { type: 'energy' as const, value: this.state.energy }
    ];

    needs.sort((a, b) => a.value - b.value);
    return needs[0].value < 30 ? needs[0].type : null;
  }
}
```

3. **Testing**
```typescript
// Test resource depletion
const manager = new ResourceManager();
manager.update(60, 1); // 1 minute at 1x speed
console.log(manager.getState());
// Expected: hunger=99.9, thirst=99.85, energy=99.92
```

**Completion Criteria**:
- ✅ ResourceManager depletes resources over time
- ✅ Critical status flags trigger correctly
- ✅ Death state detected when any resource = 0

---

### **Day 2: Item System** (4-5 hours)

**Goal**: Generate and place consumable items in the maze

#### Files to Create:
- `src/systems/ItemGenerator.ts`
- `src/entities/Item.ts`
- `src/rendering/ItemRenderer.ts`

#### Implementation Steps:

1. **Define Item Interface**
```typescript
// src/entities/Item.ts
export enum ItemType {
  FOOD = 'food',
  WATER = 'water',
  ENERGY_DRINK = 'energy'
}

export interface Item {
  id: string;
  type: ItemType;
  position: { x: number; y: number };
  tilePosition: { x: number; y: number };

  // Restoration values
  hungerRestore: number;   // 0-50
  thirstRestore: number;   // 0-50
  energyRestore: number;   // 0-50

  // Visual
  sprite?: Sprite;
  consumed: boolean;

  // Metadata
  spawnTime: number;
  expiryTime?: number;  // Optional: items can expire
}

// Predefined item templates
export const ITEM_TEMPLATES: Record<ItemType, Omit<Item, 'id' | 'position' | 'tilePosition' | 'spawnTime'>> = {
  [ItemType.FOOD]: {
    type: ItemType.FOOD,
    hungerRestore: 30,
    thirstRestore: 0,
    energyRestore: 5,
    consumed: false
  },
  [ItemType.WATER]: {
    type: ItemType.WATER,
    hungerRestore: 0,
    thirstRestore: 40,
    energyRestore: 0,
    consumed: false
  },
  [ItemType.ENERGY_DRINK]: {
    type: ItemType.ENERGY_DRINK,
    hungerRestore: 0,
    thirstRestore: 10,
    energyRestore: 35,
    consumed: false
  }
};
```

2. **Implement ItemGenerator**
```typescript
// src/systems/ItemGenerator.ts
export class ItemGenerator {
  private items: Map<string, Item> = new Map();
  private maze: Maze;
  private nextItemId = 0;

  // Spawn configuration
  private spawnConfig = {
    foodCount: 8,      // 8 food items in maze
    waterCount: 10,    // 10 water sources
    energyCount: 5,    // 5 energy drinks
    minDistance: 3     // Min tiles between items
  };

  constructor(maze: Maze) {
    this.maze = maze;
  }

  /**
   * Generate all items in the maze
   */
  generateItems(): void {
    console.log('🍎 Generating survival items...');

    // Clear existing items
    this.items.clear();

    // Get valid spawn locations (walkable tiles, not near start)
    const validTiles = this.getValidSpawnTiles();

    // Spawn food
    this.spawnItems(ItemType.FOOD, this.spawnConfig.foodCount, validTiles);

    // Spawn water
    this.spawnItems(ItemType.WATER, this.spawnConfig.waterCount, validTiles);

    // Spawn energy drinks
    this.spawnItems(ItemType.ENERGY_DRINK, this.spawnConfig.energyCount, validTiles);

    console.log(`✅ Generated ${this.items.size} items`);
  }

  /**
   * Spawn items of specific type
   */
  private spawnItems(type: ItemType, count: number, validTiles: { x: number; y: number }[]): void {
    const template = ITEM_TEMPLATES[type];

    for (let i = 0; i < count; i++) {
      // Pick random valid tile
      if (validTiles.length === 0) {
        console.warn(`⚠️ No valid tiles left for ${type}`);
        break;
      }

      const index = Math.floor(Math.random() * validTiles.length);
      const tile = validTiles.splice(index, 1)[0];

      // Create item
      const item: Item = {
        ...template,
        id: `item_${this.nextItemId++}`,
        position: {
          x: tile.x * TILE_SIZE + TILE_SIZE / 2,
          y: tile.y * TILE_SIZE + TILE_SIZE / 2
        },
        tilePosition: tile,
        spawnTime: Date.now()
      };

      this.items.set(item.id, item);

      // Remove nearby tiles to respect minDistance
      this.removeNearbyTiles(validTiles, tile, this.spawnConfig.minDistance);
    }
  }

  /**
   * Get all valid spawn tiles (walkable, not start/end)
   */
  private getValidSpawnTiles(): { x: number; y: number }[] {
    const tiles: { x: number; y: number }[] = [];
    const start = this.maze.getStart();
    const end = this.maze.getEnd();

    for (let y = 0; y < this.maze.getHeight(); y++) {
      for (let x = 0; x < this.maze.getWidth(); x++) {
        const tile = this.maze.getTile(x, y);

        // Skip walls
        if (tile.type === TileType.WALL) continue;

        // Skip start/end positions
        if ((x === start.x && y === start.y) || (x === end.x && y === end.y)) continue;

        tiles.push({ x, y });
      }
    }

    return tiles;
  }

  /**
   * Remove tiles within minDistance of a point
   */
  private removeNearbyTiles(tiles: { x: number; y: number }[], center: { x: number; y: number }, minDistance: number): void {
    for (let i = tiles.length - 1; i >= 0; i--) {
      const tile = tiles[i];
      const distance = Math.abs(tile.x - center.x) + Math.abs(tile.y - center.y);

      if (distance < minDistance) {
        tiles.splice(i, 1);
      }
    }
  }

  /**
   * Get item at tile position
   */
  getItemAtTile(x: number, y: number): Item | null {
    for (const item of this.items.values()) {
      if (!item.consumed && item.tilePosition.x === x && item.tilePosition.y === y) {
        return item;
      }
    }
    return null;
  }

  /**
   * Consume item
   */
  consumeItem(itemId: string): Item | null {
    const item = this.items.get(itemId);
    if (item && !item.consumed) {
      item.consumed = true;
      console.log(`🍴 Consumed ${item.type}: +${item.hungerRestore} hunger, +${item.thirstRestore} thirst, +${item.energyRestore} energy`);
      return item;
    }
    return null;
  }

  /**
   * Get all items
   */
  getItems(): Item[] {
    return Array.from(this.items.values());
  }
}
```

3. **Visual Rendering**
```typescript
// src/rendering/ItemRenderer.ts
export class ItemRenderer {
  private container: Container;

  // Item colors
  private colors = {
    [ItemType.FOOD]: 0xff6b6b,      // Red
    [ItemType.WATER]: 0x4dabf7,     // Blue
    [ItemType.ENERGY_DRINK]: 0xffd43b  // Yellow
  };

  render(items: Item[]): void {
    // Clear existing sprites
    this.container.removeChildren();

    for (const item of items) {
      if (item.consumed) continue;

      // Create circle sprite
      const graphics = new Graphics();
      graphics.beginFill(this.colors[item.type], 1.0);
      graphics.drawCircle(0, 0, 8);
      graphics.endFill();

      // Position
      graphics.x = item.position.x;
      graphics.y = item.position.y;

      // Pulsing animation
      const pulse = Math.sin(Date.now() / 500) * 0.2 + 1;
      graphics.scale.set(pulse);

      this.container.addChild(graphics);
      item.sprite = graphics as any;
    }
  }
}
```

**Completion Criteria**:
- ✅ Items spawn at valid locations
- ✅ Minimum distance between items enforced
- ✅ Items render with distinct colors
- ✅ Items can be consumed

---

### **Day 3: Consumption System** (3-4 hours)

**Goal**: Allow agent to detect and consume items

#### Files to Modify:
- `src/agent/Agent.ts` (add consumption methods)
- `src/systems/ResourceManager.ts` (add restoration methods)

#### Implementation Steps:

1. **Add Consumption to Agent**
```typescript
// src/agent/Agent.ts (additions)

export class Agent {
  private survivalState!: SurvivalState;
  private resourceManager!: ResourceManager;

  async init(): Promise<void> {
    // ... existing init ...

    // Initialize survival system
    this.resourceManager = new ResourceManager();
    this.survivalState = this.resourceManager.getState();

    console.log('✅ Agent survival system initialized');
  }

  update(deltaTime: number, timeScale: number): void {
    // ... existing update ...

    // Update survival resources
    this.resourceManager.update(deltaTime, timeScale);
    this.survivalState = this.resourceManager.getState();

    // Check for death
    if (this.survivalState.isDead) {
      this.handleDeath();
    }

    // Auto-consume nearby items if critical
    if (this.resourceManager.isCritical()) {
      this.tryConsumeNearbyItem();
    }
  }

  /**
   * Try to consume item at current tile
   */
  tryConsumeNearbyItem(): void {
    const tile = this.getTilePosition();
    const item = this.game.getItemGenerator().getItemAtTile(tile.x, tile.y);

    if (item) {
      this.consumeItem(item);
    }
  }

  /**
   * Consume an item
   */
  consumeItem(item: Item): void {
    // Consume item
    this.game.getItemGenerator().consumeItem(item.id);

    // Restore resources
    this.resourceManager.restore({
      hunger: item.hungerRestore,
      thirst: item.thirstRestore,
      energy: item.energyRestore
    });

    // Add to memory
    const description = this.generateConsumptionMemory(item);
    this.addMemory({
      timestamp: new Date().toISOString(),
      description,
      importance: this.calculateConsumptionImportance(item),
      type: 'survival',
      subtype: 'consumption'
    });

    console.log(`🍴 ${this.name} consumed ${item.type}`);
  }

  /**
   * Generate memory description for consumption
   */
  private generateConsumptionMemory(item: Item): string {
    const urgency = this.resourceManager.isCritical() ? 'desperately' : 'gratefully';
    const itemName = item.type === ItemType.FOOD ? 'food pellet' :
                     item.type === ItemType.WATER ? 'water source' :
                     'energy drink';

    return `${this.name} ${urgency} consumed a ${itemName}`;
  }

  /**
   * Calculate importance of consumption event
   */
  private calculateConsumptionImportance(item: Item): number {
    const needLevel = this.resourceManager.getMostUrgentNeed();

    if (needLevel === 'thirst' && item.type === ItemType.WATER) return 9;
    if (needLevel === 'hunger' && item.type === ItemType.FOOD) return 9;
    if (needLevel === 'energy' && item.type === ItemType.ENERGY_DRINK) return 8;

    return 5; // Non-urgent consumption
  }

  /**
   * Handle agent death
   */
  private handleDeath(): void {
    console.log(`💀 ${this.name} has died`);

    // Add death memory
    this.addMemory({
      timestamp: new Date().toISOString(),
      description: `${this.name} succumbed to ${this.survivalState.hunger === 0 ? 'starvation' :
                                                 this.survivalState.thirst === 0 ? 'dehydration' :
                                                 'exhaustion'}`,
      importance: 10,
      type: 'survival',
      subtype: 'death'
    });

    // Stop movement
    this.stopMovement();

    // Notify game
    this.game.handleAgentDeath(this);
  }

  /**
   * Get survival state
   */
  getSurvivalState(): Readonly<SurvivalState> {
    return this.survivalState;
  }
}
```

2. **Add Restoration to ResourceManager**
```typescript
// src/systems/ResourceManager.ts (additions)

export class ResourceManager {
  /**
   * Restore resources
   */
  restore(amounts: { hunger?: number; thirst?: number; energy?: number }): void {
    if (amounts.hunger) {
      this.state.hunger = Math.min(100, this.state.hunger + amounts.hunger);
    }

    if (amounts.thirst) {
      this.state.thirst = Math.min(100, this.state.thirst + amounts.thirst);
    }

    if (amounts.energy) {
      this.state.energy = Math.min(100, this.state.energy + amounts.energy);
    }

    // Update status flags
    this.state.isStarving = this.state.hunger < 10;
    this.state.isDehydrated = this.state.thirst < 10;
    this.state.isExhausted = this.state.energy < 10;
    this.state.isDead = false; // Resurrection not allowed, but reset flag for safety
  }
}
```

**Completion Criteria**:
- ✅ Agent detects items at current tile
- ✅ Consumption restores correct resource amounts
- ✅ Memory events created for consumption
- ✅ Death triggers when resources reach 0

---

### **Day 4: Stress System** (4-5 hours)

**Goal**: Calculate stress from resource levels and exploration time

#### Files to Create:
- `src/systems/StressManager.ts`

#### Implementation Steps:

1. **Implement StressManager**
```typescript
// src/systems/StressManager.ts

export interface StressState {
  // Stress level (0-100)
  stressLevel: number;

  // Contributing factors (0-1 scale)
  hungerStress: number;
  thirstStress: number;
  energyStress: number;
  explorationStress: number;  // Increases with time spent exploring

  // Status flags
  isCriticalStress: boolean;  // stress > 80
  isMentalBreakdown: boolean; // stress = 100

  // Weights for stress calculation
  weights: {
    hunger: number;    // 0.3
    thirst: number;    // 0.4 (most urgent)
    energy: number;    // 0.2
    exploration: number; // 0.1
  };
}

export class StressManager {
  private state: StressState = {
    stressLevel: 0,
    hungerStress: 0,
    thirstStress: 0,
    energyStress: 0,
    explorationStress: 0,
    isCriticalStress: false,
    isMentalBreakdown: false,
    weights: {
      hunger: 0.3,
      thirst: 0.4,
      energy: 0.2,
      exploration: 0.1
    }
  };

  /**
   * Calculate stress from survival state
   */
  calculateStress(survivalState: SurvivalState, explorationTime: number): number {
    // Calculate individual stress factors (inverse of resource levels)
    this.state.hungerStress = 1 - (survivalState.hunger / 100);
    this.state.thirstStress = 1 - (survivalState.thirst / 100);
    this.state.energyStress = 1 - (survivalState.energy / 100);

    // Exploration stress increases over time (sigmoid curve)
    // Starts low, ramps up after 30 minutes
    const explorationMinutes = explorationTime / 60;
    this.state.explorationStress = 1 / (1 + Math.exp(-0.1 * (explorationMinutes - 30)));

    // Weighted sum
    this.state.stressLevel = (
      this.state.hungerStress * this.state.weights.hunger +
      this.state.thirstStress * this.state.weights.thirst +
      this.state.energyStress * this.state.weights.energy +
      this.state.explorationStress * this.state.weights.exploration
    ) * 100;

    // Clamp to 0-100
    this.state.stressLevel = Math.max(0, Math.min(100, this.state.stressLevel));

    // Update status flags
    this.state.isCriticalStress = this.state.stressLevel > 80;
    this.state.isMentalBreakdown = this.state.stressLevel >= 100;

    return this.state.stressLevel;
  }

  /**
   * Get stress modifier for cognitive functions (0.5-1.0)
   */
  getStressModifier(): number {
    // Linear decay from 1.0 (no stress) to 0.5 (max stress)
    return 1.0 - (this.state.stressLevel / 100) * 0.5;
  }

  /**
   * Get stress state
   */
  getState(): Readonly<StressState> {
    return this.state;
  }

  /**
   * Get stress level category
   */
  getStressCategory(): 'none' | 'low' | 'moderate' | 'high' | 'critical' {
    if (this.state.stressLevel < 20) return 'none';
    if (this.state.stressLevel < 40) return 'low';
    if (this.state.stressLevel < 60) return 'moderate';
    if (this.state.stressLevel < 80) return 'high';
    return 'critical';
  }
}
```

2. **Integrate with Agent**
```typescript
// src/agent/Agent.ts (additions)

export class Agent {
  private stressManager!: StressManager;

  async init(): Promise<void> {
    // ... existing init ...

    // Initialize stress system
    this.stressManager = new StressManager();
  }

  update(deltaTime: number, timeScale: number): void {
    // ... existing update ...

    // Calculate stress
    const explorationTime = this.survivalState.survivalTime;
    const stressLevel = this.stressManager.calculateStress(this.survivalState, explorationTime);

    // Check for mental breakdown
    if (this.stressManager.getState().isMentalBreakdown) {
      this.handleMentalBreakdown();
    }
  }

  /**
   * Get stress level
   */
  getStressLevel(): number {
    return this.stressManager.getState().stressLevel;
  }

  /**
   * Handle mental breakdown
   */
  private handleMentalBreakdown(): void {
    console.log(`🧠 ${this.name} suffered a mental breakdown`);

    // Add breakdown memory
    this.addMemory({
      timestamp: new Date().toISOString(),
      description: `${this.name} collapsed from overwhelming stress and exhaustion`,
      importance: 10,
      type: 'survival',
      subtype: 'breakdown'
    });

    // Stop movement
    this.stopMovement();

    // Notify game
    this.game.handleAgentBreakdown(this);
  }
}
```

**Completion Criteria**:
- ✅ Stress calculated from multiple factors
- ✅ Stress increases over exploration time
- ✅ Mental breakdown triggers at 100% stress
- ✅ Stress modifier computed for cognitive effects

---

### **Day 5: Cognitive Degradation** (4-5 hours)

**Goal**: Apply stress effects to memory retrieval and decision making

#### Files to Modify:
- `src/memory/MemoryRetriever.ts`
- `src/agent/DecisionMaker.ts`

#### Implementation Steps:

1. **Modify Memory Retrieval**
```typescript
// src/memory/MemoryRetriever.ts (modifications)

export class MemoryRetriever {
  /**
   * Retrieve relevant memories (modified for stress)
   */
  async retrieve(
    query: string,
    k: number = 5,
    stressModifier: number = 1.0  // NEW PARAMETER
  ): Promise<Memory[]> {
    // ... existing retrieval logic ...

    // Apply stress modifier to scores
    const modifiedScores = scores.map(s => s * stressModifier);

    // Higher stress = more random selection
    if (stressModifier < 0.8) {
      // Add noise to scores under high stress
      const noise = (1 - stressModifier) * 0.3;
      for (let i = 0; i < modifiedScores.length; i++) {
        modifiedScores[i] += (Math.random() - 0.5) * noise;
      }
    }

    // Sort and return top k
    const indexed = modifiedScores.map((score, idx) => ({ score, idx }));
    indexed.sort((a, b) => b.score - a.score);

    return indexed.slice(0, k).map(item => memories[item.idx]);
  }
}
```

2. **Modify Decision Making**
```typescript
// src/agent/DecisionMaker.ts (modifications)

export class DecisionMaker {
  /**
   * Make decision with survival considerations
   */
  async makeDecision(): Promise<Action> {
    const agent = this.agent;
    const stressLevel = agent.getStressLevel();
    const stressModifier = agent.getStressManager().getStressModifier();
    const survivalState = agent.getSurvivalState();

    // PRIORITY 1: Handle critical survival needs
    const urgentNeed = agent.getResourceManager().getMostUrgentNeed();
    if (urgentNeed) {
      console.log(`⚠️ Urgent need: ${urgentNeed}`);
      return this.planSurvivalAction(urgentNeed);
    }

    // PRIORITY 2: Normal decision making (with stress effects)
    // Retrieve memories with stress modifier
    const relevantMemories = await this.memoryRetriever.retrieve(
      this.getCurrentContext(),
      5,
      stressModifier
    );

    // Generate action with degraded planning quality
    const action = await this.generateAction(relevantMemories, stressModifier);

    return action;
  }

  /**
   * Plan action to address survival need
   */
  private async planSurvivalAction(need: 'hunger' | 'thirst' | 'energy'): Promise<Action> {
    // Determine target item type
    const targetType = need === 'hunger' ? ItemType.FOOD :
                       need === 'thirst' ? ItemType.WATER :
                       ItemType.ENERGY_DRINK;

    // Find nearest item of target type
    const nearestItem = this.findNearestItem(targetType);

    if (nearestItem) {
      // Plan path to item
      return {
        type: 'move_to_item',
        target: nearestItem,
        reason: `Addressing critical ${need}`
      };
    } else {
      // No item found, explore to find one
      return {
        type: 'explore_for_item',
        targetType,
        reason: `Searching for ${targetType} to address ${need}`
      };
    }
  }

  /**
   * Find nearest item of specific type
   */
  private findNearestItem(type: ItemType): Item | null {
    const items = this.game.getItemGenerator().getItems();
    const agentPos = this.agent.getTilePosition();

    let nearest: Item | null = null;
    let minDistance = Infinity;

    for (const item of items) {
      if (item.consumed || item.type !== type) continue;

      const distance = Math.abs(item.tilePosition.x - agentPos.x) +
                       Math.abs(item.tilePosition.y - agentPos.y);

      if (distance < minDistance) {
        minDistance = distance;
        nearest = item;
      }
    }

    return nearest;
  }

  /**
   * Generate action with stress effects
   */
  private async generateAction(memories: Memory[], stressModifier: number): Promise<Action> {
    // Under high stress, planning quality degrades
    const planningQuality = stressModifier;

    // ... existing LLM-based planning ...

    // Modify prompt to include stress level
    const prompt = `
      You are ${this.agent.getName()}, exploring a maze.

      Current stress level: ${(1 - stressModifier) * 100}%
      ${stressModifier < 0.8 ? '⚠️ You are under high stress and may not think clearly.' : ''}

      Recent memories:
      ${memories.map(m => m.description).join('\\n')}

      What should you do next?
    `;

    // ... generate action ...
  }
}
```

**Completion Criteria**:
- ✅ Memory retrieval affected by stress
- ✅ Decision making prioritizes survival when critical
- ✅ Pathfinding to nearest survival items
- ✅ Planning quality degrades under stress

---

### **Day 6: UI & Polish** (3-4 hours)

**Goal**: Add survival UI panel and visual feedback

#### Files to Create:
- `src/ui/SurvivalPanel.ts`

#### Files to Modify:
- `src/ui/UIManager.ts`
- `src/main.ts`

#### Implementation Steps:

1. **Create Survival Panel**
```typescript
// src/ui/SurvivalPanel.ts

export class SurvivalPanel {
  private container: Container;
  private agent: Agent;

  private panelWidth = 280;
  private panelHeight = 380;

  // Graphics elements
  private panelBg!: Graphics;
  private resourceBars!: { hunger: Graphics; thirst: Graphics; energy: Graphics };
  private stressBar!: Graphics;
  private statusText!: Text;

  async init(): Promise<void> {
    // Create panel background
    this.createPanelBackground();

    // Create resource bars
    this.createResourceBars();

    // Create stress bar
    this.createStressBar();

    // Create status text
    this.createStatusText();
  }

  /**
   * Create resource bars (hunger, thirst, energy)
   */
  private createResourceBars(): void {
    const barWidth = this.panelWidth - 40;
    const barHeight = 20;
    const startY = 60;
    const spacing = 40;

    this.resourceBars = {
      hunger: this.createBar(20, startY, barWidth, barHeight, 0xff6b6b, 'Hunger'),
      thirst: this.createBar(20, startY + spacing, barWidth, barHeight, 0x4dabf7, 'Thirst'),
      energy: this.createBar(20, startY + spacing * 2, barWidth, barHeight, 0xffd43b, 'Energy')
    };
  }

  /**
   * Create a single resource bar
   */
  private createBar(x: number, y: number, width: number, height: number, color: number, label: string): Graphics {
    // Label
    const labelText = new Text(label, {
      fontFamily: 'monospace',
      fontSize: 12,
      fill: 0xcccccc
    });
    labelText.x = x;
    labelText.y = y - 18;
    this.container.addChild(labelText);

    // Background
    const bg = new Graphics();
    bg.beginFill(0x333333, 0.8);
    bg.drawRect(x, y, width, height);
    bg.endFill();
    this.container.addChild(bg);

    // Fill bar
    const bar = new Graphics();
    this.container.addChild(bar);

    return bar;
  }

  /**
   * Update resource bars
   */
  update(deltaTime: number): void {
    if (!this.visible) return;

    const survivalState = this.agent.getSurvivalState();
    const stressState = this.agent.getStressManager().getState();

    // Update hunger bar
    this.updateBar(this.resourceBars.hunger, survivalState.hunger, 0xff6b6b, 20, 60, this.panelWidth - 40, 20);

    // Update thirst bar
    this.updateBar(this.resourceBars.thirst, survivalState.thirst, 0x4dabf7, 20, 100, this.panelWidth - 40, 20);

    // Update energy bar
    this.updateBar(this.resourceBars.energy, survivalState.energy, 0xffd43b, 20, 140, this.panelWidth - 40, 20);

    // Update stress bar
    this.updateBar(this.stressBar, 100 - stressState.stressLevel, 0x00ff00, 20, 200, this.panelWidth - 40, 20);

    // Update status text
    this.updateStatusText(survivalState, stressState);
  }

  /**
   * Update a single bar
   */
  private updateBar(bar: Graphics, value: number, color: number, x: number, y: number, maxWidth: number, height: number): void {
    bar.clear();

    const fillWidth = (value / 100) * maxWidth;

    // Color changes based on value
    let fillColor = color;
    if (value < 20) {
      fillColor = 0xff0000; // Red when critical
    } else if (value < 40) {
      fillColor = 0xff8800; // Orange when low
    }

    bar.beginFill(fillColor, 0.9);
    bar.drawRect(x, y, fillWidth, height);
    bar.endFill();

    // Value text
    const valueText = new Text(`${value.toFixed(0)}%`, {
      fontFamily: 'monospace',
      fontSize: 11,
      fill: 0xffffff
    });
    valueText.x = x + maxWidth - 40;
    valueText.y = y + 3;
    bar.addChild(valueText);
  }

  /**
   * Update status text
   */
  private updateStatusText(survival: SurvivalState, stress: StressState): void {
    const lines: string[] = [];

    // Status flags
    if (survival.isDead) {
      lines.push('💀 DECEASED');
    } else if (stress.isMentalBreakdown) {
      lines.push('🧠 MENTAL BREAKDOWN');
    } else if (stress.isCriticalStress) {
      lines.push('⚠️ CRITICAL STRESS');
    } else if (survival.isStarving || survival.isDehydrated || survival.isExhausted) {
      lines.push('⚠️ CRITICAL CONDITION');
    } else {
      lines.push('✓ Stable');
    }

    // Survival time
    const minutes = Math.floor(survival.survivalTime / 60);
    const seconds = Math.floor(survival.survivalTime % 60);
    lines.push('');
    lines.push(`Survival Time: ${minutes}m ${seconds}s`);

    // Stress category
    lines.push('');
    lines.push(`Stress: ${this.agent.getStressManager().getStressCategory().toUpperCase()}`);

    this.statusText.text = lines.join('\\n');
  }
}
```

2. **Add Panel to UIManager**
```typescript
// src/ui/UIManager.ts (additions)

export class UIManager {
  private survivalPanel!: SurvivalPanel;

  async init(): Promise<void> {
    // ... existing panels ...

    // Initialize survival panel
    this.survivalPanel = new SurvivalPanel(this.container, this.agent);
    await this.survivalPanel.init();

    // Position in top-right corner (below embedding metrics)
    this.survivalPanel.setPosition(
      this.screenWidth - this.survivalPanel.getWidth() - 20,
      440  // Below embedding metrics panel
    );
  }

  handleKeyPress(key: string): void {
    // ... existing keys ...

    // S key: Toggle survival panel
    if (key === 's' || key === 'S') {
      this.survivalPanel.toggle();
    }
  }
}
```

3. **Update Controls**
```typescript
// src/main.ts (additions to control panel)

🧬 S: Survival Stats<br>
```

**Completion Criteria**:
- ✅ Survival panel displays all resources
- ✅ Visual bars update in real-time
- ✅ Color coding for critical states
- ✅ Stress bar shows current stress level
- ✅ Status text shows survival time and conditions

---

## Technical Specifications

### Resource Depletion Formulas

```typescript
// Base depletion rates (per minute of game time)
hunger_depletion = 0.1 * timeScale
thirst_depletion = 0.15 * timeScale  // Fastest depletion
energy_depletion = 0.08 * timeScale

// Expected survival times (no items consumed)
hunger_survival = 100 / 0.1 = 1000 minutes = 16.7 hours
thirst_survival = 100 / 0.15 = 666 minutes = 11.1 hours (bottleneck)
energy_survival = 100 / 0.08 = 1250 minutes = 20.8 hours

// At 10x time scale:
real_survival_time = 11.1 hours / 10 = 66.6 minutes = ~1 hour
```

### Stress Calculation

```typescript
// Weighted stress formula
stress = (
  (1 - hunger/100) × 0.3 +
  (1 - thirst/100) × 0.4 +
  (1 - energy/100) × 0.2 +
  exploration_stress × 0.1
) × 100

// Exploration stress (sigmoid)
exploration_stress = 1 / (1 + e^(-0.1 × (minutes - 30)))

// Stress modifier for cognitive functions
cognitive_modifier = 1.0 - (stress/100) × 0.5
// Range: 1.0 (no stress) → 0.5 (max stress)
```

### Item Placement Algorithm

```typescript
// Spatial distribution
min_distance_between_items = 3 tiles

// Item counts (for 50×50 maze)
food_items = 8      // Restores 30 hunger
water_items = 10    // Restores 40 thirst
energy_items = 5    // Restores 35 energy

// Expected item density
total_walkable_tiles ≈ 1500 (50×50 maze with 40% walls)
item_density = 23 / 1500 = 1.53%
```

---

## Integration Points

### 1. **Game.ts Integration**

```typescript
// src/core/Game.ts (additions)

export class Game {
  private itemGenerator!: ItemGenerator;
  private survivalSystem!: SurvivalSystem;

  async init(): Promise<void> {
    // ... existing init ...

    // Initialize item generator
    this.itemGenerator = new ItemGenerator(this.maze);
    this.itemGenerator.generateItems();

    // Initialize survival system
    this.survivalSystem = new SurvivalSystem(this.agent);

    console.log('✅ Survival systems initialized');
  }

  /**
   * Handle agent death
   */
  handleAgentDeath(agent: Agent): void {
    console.log('💀 Game Over: Agent died');

    // Pause game
    this.timeManager.pause();

    // Show game over UI
    this.uiManager.showGameOver({
      reason: 'death',
      survivalTime: agent.getSurvivalState().survivalTime,
      explorationPercent: this.miniMap.getExplorationPercentage()
    });
  }

  /**
   * Handle agent mental breakdown
   */
  handleAgentBreakdown(agent: Agent): void {
    console.log('🧠 Game Over: Mental breakdown');

    // Pause game
    this.timeManager.pause();

    // Show game over UI
    this.uiManager.showGameOver({
      reason: 'breakdown',
      survivalTime: agent.getSurvivalState().survivalTime,
      stressLevel: agent.getStressLevel()
    });
  }

  /**
   * Get item generator
   */
  getItemGenerator(): ItemGenerator {
    return this.itemGenerator;
  }
}
```

### 2. **Renderer Integration**

```typescript
// src/rendering/MazeRenderer.ts (additions)

export class MazeRenderer {
  private itemRenderer!: ItemRenderer;

  async init(): Promise<void> {
    // ... existing init ...

    // Initialize item renderer
    this.itemRenderer = new ItemRenderer(this.container);
  }

  render(): void {
    // ... existing rendering ...

    // Render items
    const items = this.game.getItemGenerator().getItems();
    this.itemRenderer.render(items);
  }
}
```

---

## Testing Strategy

### Unit Tests

```typescript
// tests/ResourceManager.test.ts

describe('ResourceManager', () => {
  it('should deplete resources over time', () => {
    const manager = new ResourceManager();
    manager.update(60, 1); // 1 minute

    const state = manager.getState();
    expect(state.hunger).toBe(99.9);
    expect(state.thirst).toBe(99.85);
    expect(state.energy).toBe(99.92);
  });

  it('should detect critical condition', () => {
    const manager = new ResourceManager({ ...DEFAULT_SURVIVAL_STATE, hunger: 15 });
    expect(manager.isCritical()).toBe(true);
  });

  it('should identify most urgent need', () => {
    const manager = new ResourceManager({
      ...DEFAULT_SURVIVAL_STATE,
      hunger: 50,
      thirst: 10,
      energy: 60
    });
    expect(manager.getMostUrgentNeed()).toBe('thirst');
  });
});

// tests/StressManager.test.ts

describe('StressManager', () => {
  it('should calculate stress from low resources', () => {
    const manager = new StressManager();
    const stress = manager.calculateStress({
      ...DEFAULT_SURVIVAL_STATE,
      hunger: 20,
      thirst: 10,
      energy: 30
    }, 0);

    expect(stress).toBeGreaterThan(50);
  });

  it('should provide stress modifier for cognitive functions', () => {
    const manager = new StressManager();
    manager.calculateStress({
      ...DEFAULT_SURVIVAL_STATE,
      hunger: 10,
      thirst: 10,
      energy: 10
    }, 3600); // 1 hour

    const modifier = manager.getStressModifier();
    expect(modifier).toBeLessThan(0.7); // Significant degradation
  });
});
```

### Integration Tests

```typescript
// tests/SurvivalIntegration.test.ts

describe('Survival System Integration', () => {
  it('should allow agent to consume item', async () => {
    const game = new Game(GAME_CONFIG);
    await game.init();

    const agent = game.getAgent();
    const item = game.getItemGenerator().getItems()[0];

    // Move agent to item
    agent.setPosition(item.position.x, item.position.y);

    // Consume item
    const beforeHunger = agent.getSurvivalState().hunger;
    agent.consumeItem(item);
    const afterHunger = agent.getSurvivalState().hunger;

    expect(afterHunger).toBeGreaterThan(beforeHunger);
    expect(item.consumed).toBe(true);
  });

  it('should trigger death when resources reach 0', async () => {
    const game = new Game(GAME_CONFIG);
    await game.init();

    const agent = game.getAgent();

    // Force resources to 0
    agent.getResourceManager().restore({ hunger: -100 });
    agent.update(0.1, 1);

    expect(agent.getSurvivalState().isDead).toBe(true);
  });
});
```

### Manual Testing Checklist

- [ ] Resources deplete at correct rates
- [ ] Items spawn at valid locations with minimum spacing
- [ ] Agent can consume items and restore resources
- [ ] Stress increases as resources deplete
- [ ] Memory retrieval quality degrades under stress
- [ ] Decision making prioritizes survival when critical
- [ ] Death triggers when any resource = 0
- [ ] Mental breakdown triggers at 100% stress
- [ ] Survival panel displays correct real-time data
- [ ] Visual bars update smoothly with color coding
- [ ] Game over UI shows on death/breakdown

---

## Performance Considerations

### 1. **Item Rendering Optimization**

```typescript
// Only render visible items
const visibleItems = items.filter(item => {
  return !item.consumed && camera.isInView(item.position);
});

// Use sprite pooling for better performance
const spritePool = new SpritePool(ItemSprite, 50);
```

### 2. **Stress Calculation Caching**

```typescript
// Calculate stress every 0.5 seconds, not every frame
private stressUpdateInterval = 0.5;
private stressUpdateTimer = 0;

update(deltaTime: number): void {
  this.stressUpdateTimer += deltaTime;

  if (this.stressUpdateTimer >= this.stressUpdateInterval) {
    this.calculateStress();
    this.stressUpdateTimer = 0;
  }
}
```

### 3. **Memory Impact**

```
Estimated memory usage for Week 3:
- ItemGenerator: ~5 KB (23 items × 200 bytes)
- ResourceManager: ~1 KB
- StressManager: ~1 KB
- SurvivalPanel: ~50 KB (sprites + textures)

Total additional memory: ~60 KB (negligible)
```

---

## Troubleshooting

### Issue: Resources deplete too quickly

**Solution**: Adjust depletion rates in `ResourceManager`

```typescript
private hungerRate = 0.05;  // Reduced from 0.1
private thirstRate = 0.08;  // Reduced from 0.15
private energyRate = 0.04;  // Reduced from 0.08
```

### Issue: Items spawn too close together

**Solution**: Increase `minDistance` in `ItemGenerator`

```typescript
private spawnConfig = {
  minDistance: 5  // Increased from 3
};
```

### Issue: Stress too high even with good resources

**Solution**: Adjust stress weights in `StressManager`

```typescript
weights: {
  hunger: 0.25,      // Reduced from 0.3
  thirst: 0.35,      // Reduced from 0.4
  energy: 0.15,      // Reduced from 0.2
  exploration: 0.05  // Reduced from 0.1
}
```

### Issue: Agent doesn't seek items when critical

**Solution**: Check `DecisionMaker.planSurvivalAction()` logic

```typescript
// Ensure survival actions have highest priority
if (urgentNeed && survivalState[urgentNeed] < 30) {
  return this.planSurvivalAction(urgentNeed);
}
```

---

## Next Steps After Week 3

### Week 4 Potential: Advanced Social Dynamics (Optional)

If continuing beyond Week 3, consider:

1. **Multi-Agent Scenarios**
   - Multiple agents in the same maze
   - Resource competition
   - Cooperative strategies

2. **Communication System**
   - Agents share item locations
   - Warning signals for danger
   - Collaborative planning

3. **Personality Traits**
   - Risk-averse vs. risk-taking agents
   - Stress resilience variations
   - Different survival strategies

4. **Dynamic Events**
   - Item respawning
   - Environmental hazards
   - Time-limited challenges

---

## Summary

Week 3 transforms Maze Mind into a **survival simulation** where the agent must balance exploration with resource management. The implementation introduces:

✅ **Resource System**: Hunger, thirst, and energy depletion
✅ **Item System**: Consumable items placed strategically in maze
✅ **Consumption Mechanics**: Agent detects and consumes items
✅ **Stress Calculation**: Multi-factor stress from resources and time
✅ **Cognitive Degradation**: Stress affects memory and planning
✅ **Failure States**: Death (resource = 0) and mental breakdown (stress = 100)
✅ **Survival UI**: Real-time resource bars and status display

**Estimated Timeline**: 20-28 hours across 6 days
**Difficulty**: Intermediate (builds on Week 2 systems)
**Research Paper Alignment**: Extends Stanford architecture with survival constraints

---

## File Checklist

### New Files to Create (13 files):
- [ ] `src/systems/SurvivalState.ts`
- [ ] `src/systems/ResourceManager.ts`
- [ ] `src/systems/StressManager.ts`
- [ ] `src/systems/ItemGenerator.ts`
- [ ] `src/entities/Item.ts`
- [ ] `src/rendering/ItemRenderer.ts`
- [ ] `src/ui/SurvivalPanel.ts`
- [ ] `tests/ResourceManager.test.ts`
- [ ] `tests/StressManager.test.ts`
- [ ] `tests/ItemGenerator.test.ts`
- [ ] `tests/SurvivalIntegration.test.ts`

### Files to Modify (6 files):
- [ ] `src/agent/Agent.ts` (add survival state, consumption methods)
- [ ] `src/agent/DecisionMaker.ts` (add survival priority logic)
- [ ] `src/memory/MemoryRetriever.ts` (add stress modifier)
- [ ] `src/core/Game.ts` (integrate survival systems)
- [ ] `src/ui/UIManager.ts` (add survival panel)
- [ ] `src/main.ts` (add survival controls)

---

**Ready to begin Week 3 implementation!** 🚀
