# Feature 1: Cross-Simulation Memory Persistence

**Priority**: 🔴 CRITICAL
**Impact**: High (3% alignment gain)
**Effort**: Medium (3-4 days)
**Dependencies**: None (uses existing MemoryStream)

---

## Overview

Enable agents to remember and learn from previous maze simulation runs. Agents persist key memories (discovered paths, dangers, strategies) across simulations, creating a learning curve where they improve over time.

### Paper Alignment
**Section 4.1 - Memory Stream**: "Agents maintain a comprehensive record of experiences"

**Maze Adaptation**: Extend memory to persist **across simulation boundaries**, enabling learning over multiple episodes.

---

## Architecture

### 1. Data Structures

```typescript
// src/types/cross-simulation.ts

export interface CrossSimulationMemory {
  agentId: string;
  simulationHistory: SimulationRun[];

  // Maze knowledge (accumulated across runs)
  mazeKnowledge: {
    discoveredPaths: Map<string, PathInfo>;
    deadEnds: TilePosition[];
    dangerZones: DangerInfo[];
    resourceLocations: Map<ItemType, TilePosition[]>;
    exitLocations: ExitInfo[];
    safeRooms: TilePosition[];
  };

  // Strategy knowledge
  strategies: {
    successful: Strategy[];
    failed: Strategy[];
    bestPractices: string[];
  };

  // Performance metrics
  performance: {
    totalRuns: number;
    successfulExits: number;
    averageSurvivalTime: number;
    totalDeaths: number;
    deathLocations: Map<TilePosition, number>;  // position -> death count
  };

  // Social learning
  socialKnowledge: {
    learnedFromOthers: Map<string, SharedKnowledge>;  // agentId -> knowledge
    trustLevels: Map<string, number>;  // agentId -> trust (0-1)
    cooperationHistory: CooperationEvent[];
  };

  // Metadata
  lastSimulationDate: number;
  totalExperienceHours: number;
  version: string;
}

export interface SimulationRun {
  runId: string;
  startTime: number;
  endTime: number;
  outcome: 'SUCCESS' | 'DEATH' | 'TIMEOUT';
  finalPosition: TilePosition;
  survivalTime: number;
  resourcesCollected: number;
  teammatesHelped: number;
  keyLearnings: string[];
}

export interface PathInfo {
  from: TilePosition;
  to: TilePosition;
  path: TilePosition[];
  timesUsed: number;
  successRate: number;
  avgTime: number;
}

export interface DangerInfo {
  location: TilePosition;
  type: 'TRAP' | 'DEAD_END' | 'ENEMY' | 'ENVIRONMENTAL';
  severity: number;  // 1-10
  description: string;
  witnessedCount: number;
  deathsAtLocation: number;
}

export interface Strategy {
  name: string;
  description: string;
  conditions: string[];
  actions: string[];
  successRate: number;
  timesAttempted: number;
  avgOutcome: number;
}

export interface ExitInfo {
  location: TilePosition;
  discoveredInRun: string;
  requiresKey: boolean;
  requiresMultipleAgents: boolean;
  activationMethod: string;
}
```

### 2. Core System

```typescript
// src/systems/CrossSimulationMemorySystem.ts

import { CrossSimulationMemory, SimulationRun } from '../types/cross-simulation';
import { Agent } from '../agent/Agent';
import { Memory } from '../types/memory';
import * as fs from 'fs/promises';
import * as path from 'path';

export class CrossSimulationMemorySystem {
  private storageDir: string = './data/agent_memories';
  private cache: Map<string, CrossSimulationMemory> = new Map();

  constructor() {
    this.ensureStorageDirectory();
  }

  /**
   * Load agent's cross-simulation memory at start of new run
   */
  async loadMemories(agent: Agent): Promise<void> {
    const agentId = agent.id;

    try {
      // Try to load from disk
      const memory = await this.loadFromDisk(agentId);

      if (memory) {
        console.log(`✅ Loaded ${memory.performance.totalRuns} previous runs for ${agent.name}`);

        // Inherit accumulated knowledge
        this.inheritKnowledge(agent, memory);

        // Generate reflections on past experiences
        this.generatePastReflections(agent, memory);

        // Cache for quick access
        this.cache.set(agentId, memory);
      } else {
        console.log(`📝 No previous memories found for ${agent.name} (first run)`);
        // Initialize empty memory
        const newMemory = this.createEmptyMemory(agentId);
        this.cache.set(agentId, newMemory);
      }
    } catch (error) {
      console.error(`❌ Error loading memories for ${agentId}:`, error);
      // Initialize empty on error
      this.cache.set(agentId, this.createEmptyMemory(agentId));
    }
  }

  /**
   * Save agent's experiences at end of simulation
   */
  async saveMemories(
    agent: Agent,
    outcome: SimulationRun['outcome'],
    runMetrics: any
  ): Promise<void> {
    const agentId = agent.id;
    const memory = this.cache.get(agentId) || this.createEmptyMemory(agentId);

    // Create simulation run record
    const run: SimulationRun = {
      runId: `run_${Date.now()}`,
      startTime: runMetrics.startTime,
      endTime: Date.now(),
      outcome,
      finalPosition: agent.position,
      survivalTime: runMetrics.survivalTime,
      resourcesCollected: runMetrics.resourcesCollected,
      teammatesHelped: runMetrics.teammatesHelped,
      keyLearnings: this.extractKeyLearnings(agent, outcome)
    };

    memory.simulationHistory.push(run);

    // Update maze knowledge
    this.updateMazeKnowledge(memory, agent);

    // Update strategies
    this.updateStrategies(memory, agent, outcome);

    // Update performance metrics
    this.updatePerformance(memory, run);

    // Update social knowledge
    this.updateSocialKnowledge(memory, agent);

    // Save to disk
    await this.saveToDisk(agentId, memory);

    console.log(`💾 Saved memories for ${agent.name} (Run #${memory.performance.totalRuns})`);
  }

  /**
   * Inherit knowledge from previous runs
   */
  private inheritKnowledge(agent: Agent, memory: CrossSimulationMemory): void {
    const knowledge = memory.mazeKnowledge;

    // Add discovered paths to agent's knowledge
    knowledge.discoveredPaths.forEach((pathInfo, pathKey) => {
      agent.addMemory({
        type: 'OBSERVATION',
        description: `I remember a path from ${pathInfo.from} to ${pathInfo.to}. ` +
                     `Used it ${pathInfo.timesUsed} times with ${(pathInfo.successRate * 100).toFixed(0)}% success.`,
        importance: 7,
        timestamp: Date.now(),
        metadata: { source: 'CROSS_SIMULATION', pathInfo }
      });
    });

    // Warn about danger zones
    knowledge.dangerZones.forEach(danger => {
      agent.addMemory({
        type: 'OBSERVATION',
        description: `DANGER: ${danger.type} at ${danger.location}. ` +
                     `${danger.description}. I've witnessed this ${danger.witnessedCount} times.`,
        importance: Math.min(10, danger.severity + danger.deathsAtLocation),
        timestamp: Date.now(),
        metadata: { source: 'CROSS_SIMULATION', danger }
      });
    });

    // Remember safe rooms
    knowledge.safeRooms.forEach(safeRoom => {
      agent.addMemory({
        type: 'OBSERVATION',
        description: `Safe room at ${safeRoom}. Good place to rest and recover.`,
        importance: 6,
        timestamp: Date.now(),
        metadata: { source: 'CROSS_SIMULATION' }
      });
    });

    // Remember resource locations
    knowledge.resourceLocations.forEach((locations, itemType) => {
      locations.forEach(loc => {
        agent.addMemory({
          type: 'OBSERVATION',
          description: `Found ${itemType} at ${loc} in previous runs.`,
          importance: 5,
          timestamp: Date.now(),
          metadata: { source: 'CROSS_SIMULATION', itemType }
        });
      });
    });

    // Remember exit locations
    knowledge.exitLocations.forEach(exitInfo => {
      agent.addMemory({
        type: 'OBSERVATION',
        description: `EXIT at ${exitInfo.location}! ` +
                     (exitInfo.requiresKey ? 'Requires key. ' : '') +
                     (exitInfo.requiresMultipleAgents ? 'Needs team activation. ' : ''),
        importance: 10,
        timestamp: Date.now(),
        metadata: { source: 'CROSS_SIMULATION', exitInfo }
      });
    });

    console.log(`  📖 Inherited: ${knowledge.discoveredPaths.size} paths, ` +
                `${knowledge.dangerZones.length} dangers, ` +
                `${knowledge.exitLocations.length} exits`);
  }

  /**
   * Generate reflections based on past experiences
   */
  private generatePastReflections(agent: Agent, memory: CrossSimulationMemory): void {
    const perf = memory.performance;

    // Overall performance reflection
    if (perf.totalRuns > 0) {
      const successRate = (perf.successfulExits / perf.totalRuns) * 100;
      agent.addMemory({
        type: 'REFLECTION',
        description: `I've attempted this maze ${perf.totalRuns} times before. ` +
                     `My success rate is ${successRate.toFixed(1)}%. ` +
                     `I need to ${successRate < 50 ? 'improve my strategy' : 'maintain my approach'}.`,
        importance: 8,
        timestamp: Date.now(),
        metadata: { source: 'CROSS_SIMULATION_REFLECTION' }
      });
    }

    // Strategy reflection
    const bestStrategy = memory.strategies.successful
      .sort((a, b) => b.successRate - a.successRate)[0];

    if (bestStrategy) {
      agent.addMemory({
        type: 'REFLECTION',
        description: `My most successful strategy is: ${bestStrategy.name}. ` +
                     `${bestStrategy.description} (${(bestStrategy.successRate * 100).toFixed(0)}% success)`,
        importance: 9,
        timestamp: Date.now(),
        metadata: { source: 'CROSS_SIMULATION_REFLECTION', strategy: bestStrategy }
      });
    }

    // Death location reflection
    if (perf.deathLocations.size > 0) {
      const mostDangerousLocation = Array.from(perf.deathLocations.entries())
        .sort((a, b) => b[1] - a[1])[0];

      agent.addMemory({
        type: 'REFLECTION',
        description: `I've died ${mostDangerousLocation[1]} times at ${mostDangerousLocation[0]}. ` +
                     `I must be extremely careful in that area.`,
        importance: 10,
        timestamp: Date.now(),
        metadata: { source: 'CROSS_SIMULATION_REFLECTION' }
      });
    }

    // Social learning reflection
    if (memory.socialKnowledge.learnedFromOthers.size > 0) {
      const mostTrustedAgent = Array.from(memory.socialKnowledge.trustLevels.entries())
        .sort((a, b) => b[1] - a[1])[0];

      if (mostTrustedAgent) {
        agent.addMemory({
          type: 'REFLECTION',
          description: `I trust ${mostTrustedAgent[0]} the most (trust: ${mostTrustedAgent[1].toFixed(2)}). ` +
                       `Their advice has been valuable in past runs.`,
          importance: 7,
          timestamp: Date.now(),
          metadata: { source: 'CROSS_SIMULATION_REFLECTION' }
        });
      }
    }

    console.log(`  🧠 Generated ${4} reflections from past experiences`);
  }

  /**
   * Update maze knowledge based on current run
   */
  private updateMazeKnowledge(memory: CrossSimulationMemory, agent: Agent): void {
    // Extract new path discoveries
    const exploredTiles = agent.memoryStream.getMemoriesByType('OBSERVATION')
      .filter(m => m.description.includes('explored') || m.description.includes('moved to'));

    // Add to discovered paths (simplified - you'd implement actual path tracking)
    // ...

    // Extract danger discoveries
    const dangerMemories = agent.memoryStream.getMemoriesByType('OBSERVATION')
      .filter(m => m.description.toLowerCase().includes('danger') ||
                   m.description.toLowerCase().includes('trap') ||
                   m.importance >= 8);

    dangerMemories.forEach(mem => {
      // Parse danger info from memory
      // Add to danger zones
      // ...
    });

    // Extract resource locations
    const resourceMemories = agent.memoryStream.getMemoriesByType('OBSERVATION')
      .filter(m => m.description.includes('found') &&
                   (m.description.includes('food') ||
                    m.description.includes('water') ||
                    m.description.includes('energy')));

    // Add to resource locations
    // ...
  }

  /**
   * Update strategies based on outcome
   */
  private updateStrategies(
    memory: CrossSimulationMemory,
    agent: Agent,
    outcome: SimulationRun['outcome']
  ): void {
    // Extract strategy from agent's plan
    const dailyPlans = agent.memoryStream.getMemoriesByType('PLAN')
      .filter(m => m.description.includes('daily'));

    if (dailyPlans.length > 0) {
      const strategyDesc = dailyPlans[0].description;

      // Create strategy object
      const strategy: Strategy = {
        name: this.extractStrategyName(strategyDesc),
        description: strategyDesc,
        conditions: [],
        actions: [],
        successRate: outcome === 'SUCCESS' ? 1.0 : 0.0,
        timesAttempted: 1,
        avgOutcome: outcome === 'SUCCESS' ? 1.0 : 0.0
      };

      // Check if similar strategy exists
      const existingStrategy = memory.strategies.successful
        .concat(memory.strategies.failed)
        .find(s => s.name === strategy.name);

      if (existingStrategy) {
        // Update existing strategy
        existingStrategy.timesAttempted++;
        const totalOutcome = existingStrategy.avgOutcome * (existingStrategy.timesAttempted - 1);
        existingStrategy.avgOutcome = (totalOutcome + strategy.avgOutcome) / existingStrategy.timesAttempted;
        existingStrategy.successRate = existingStrategy.avgOutcome;
      } else {
        // Add new strategy
        if (outcome === 'SUCCESS') {
          memory.strategies.successful.push(strategy);
        } else {
          memory.strategies.failed.push(strategy);
        }
      }
    }
  }

  /**
   * Update performance metrics
   */
  private updatePerformance(memory: CrossSimulationMemory, run: SimulationRun): void {
    const perf = memory.performance;

    perf.totalRuns++;
    if (run.outcome === 'SUCCESS') {
      perf.successfulExits++;
    }

    // Update average survival time
    const totalTime = perf.averageSurvivalTime * (perf.totalRuns - 1);
    perf.averageSurvivalTime = (totalTime + run.survivalTime) / perf.totalRuns;

    if (run.outcome === 'DEATH') {
      perf.totalDeaths++;
      // Increment death count at location
      const locKey = `${run.finalPosition.x},${run.finalPosition.y}`;
      const currentCount = perf.deathLocations.get(run.finalPosition) || 0;
      perf.deathLocations.set(run.finalPosition, currentCount + 1);
    }
  }

  /**
   * Update social knowledge
   */
  private updateSocialKnowledge(memory: CrossSimulationMemory, agent: Agent): void {
    // Extract social interactions from memory
    const socialMemories = agent.memoryStream.getMemoriesByType('OBSERVATION')
      .filter(m => m.metadata?.relatedAgents?.length > 0);

    // Update cooperation history, trust levels, etc.
    // ...
  }

  /**
   * Extract key learnings from simulation
   */
  private extractKeyLearnings(agent: Agent, outcome: SimulationRun['outcome']): string[] {
    const learnings: string[] = [];

    // Get high-importance memories
    const importantMemories = agent.memoryStream.getAllMemories()
      .filter(m => m.importance >= 7)
      .sort((a, b) => b.importance - a.importance)
      .slice(0, 5);

    importantMemories.forEach(mem => {
      learnings.push(mem.description);
    });

    // Add outcome-specific learning
    if (outcome === 'SUCCESS') {
      learnings.push('Successfully exited the maze this run');
    } else if (outcome === 'DEATH') {
      learnings.push(`Died at ${agent.position} - must avoid this strategy`);
    }

    return learnings;
  }

  /**
   * File I/O operations
   */
  private async ensureStorageDirectory(): Promise<void> {
    try {
      await fs.mkdir(this.storageDir, { recursive: true });
    } catch (error) {
      console.error('Failed to create storage directory:', error);
    }
  }

  private async loadFromDisk(agentId: string): Promise<CrossSimulationMemory | null> {
    try {
      const filePath = path.join(this.storageDir, `${agentId}.json`);
      const data = await fs.readFile(filePath, 'utf-8');
      return JSON.parse(data, this.reviver);
    } catch (error) {
      return null;  // File doesn't exist or parse error
    }
  }

  private async saveToDisk(agentId: string, memory: CrossSimulationMemory): Promise<void> {
    try {
      const filePath = path.join(this.storageDir, `${agentId}.json`);
      const data = JSON.stringify(memory, this.replacer, 2);
      await fs.writeFile(filePath, data, 'utf-8');
    } catch (error) {
      console.error(`Failed to save memories for ${agentId}:`, error);
    }
  }

  // JSON serialization helpers for Maps
  private replacer(key: string, value: any): any {
    if (value instanceof Map) {
      return {
        dataType: 'Map',
        value: Array.from(value.entries())
      };
    }
    if (value instanceof Set) {
      return {
        dataType: 'Set',
        value: Array.from(value)
      };
    }
    return value;
  }

  private reviver(key: string, value: any): any {
    if (typeof value === 'object' && value !== null) {
      if (value.dataType === 'Map') {
        return new Map(value.value);
      }
      if (value.dataType === 'Set') {
        return new Set(value.value);
      }
    }
    return value;
  }

  private createEmptyMemory(agentId: string): CrossSimulationMemory {
    return {
      agentId,
      simulationHistory: [],
      mazeKnowledge: {
        discoveredPaths: new Map(),
        deadEnds: [],
        dangerZones: [],
        resourceLocations: new Map(),
        exitLocations: [],
        safeRooms: []
      },
      strategies: {
        successful: [],
        failed: [],
        bestPractices: []
      },
      performance: {
        totalRuns: 0,
        successfulExits: 0,
        averageSurvivalTime: 0,
        totalDeaths: 0,
        deathLocations: new Map()
      },
      socialKnowledge: {
        learnedFromOthers: new Map(),
        trustLevels: new Map(),
        cooperationHistory: []
      },
      lastSimulationDate: Date.now(),
      totalExperienceHours: 0,
      version: '1.0.0'
    };
  }

  private extractStrategyName(description: string): string {
    // Simple extraction - you'd make this smarter
    const words = description.split(' ').slice(0, 5);
    return words.join('_').toLowerCase();
  }
}
```

---

## 3. Integration with Game.ts

```typescript
// src/core/Game.ts

import { CrossSimulationMemorySystem } from '../systems/CrossSimulationMemorySystem';

export class Game {
  private crossSimMemory: CrossSimulationMemorySystem;
  private simulationStartTime: number = 0;
  private runMetrics: any = {
    resourcesCollected: 0,
    teammatesHelped: 0
  };

  async init(): Promise<void> {
    // ... existing init code ...

    // Initialize cross-simulation memory system
    this.crossSimMemory = new CrossSimulationMemorySystem();

    // Load memories for all agents
    if (this.agentManager) {
      const agents = this.agentManager.getAllAgents();
      for (const agent of agents) {
        await this.crossSimMemory.loadMemories(agent);
      }
    }

    this.simulationStartTime = Date.now();
    console.log('✅ Cross-simulation memory system initialized');
  }

  async endSimulation(outcome: 'SUCCESS' | 'DEATH' | 'TIMEOUT'): Promise<void> {
    console.log(`📊 Ending simulation with outcome: ${outcome}`);

    // Calculate run metrics
    const survivalTime = Date.now() - this.simulationStartTime;

    // Save memories for all agents
    if (this.agentManager) {
      const agents = this.agentManager.getAllAgents();
      for (const agent of agents) {
        await this.crossSimMemory.saveMemories(agent, outcome, {
          startTime: this.simulationStartTime,
          survivalTime,
          resourcesCollected: this.runMetrics.resourcesCollected,
          teammatesHelped: this.runMetrics.teammatesHelped
        });
      }
    }

    console.log('💾 All agent memories saved');
  }

  // Call this when agent reaches exit
  handleAgentExit(agent: Agent): void {
    this.endSimulation('SUCCESS');
  }

  // Call this when agent dies
  handleAgentDeath(agent: Agent): void {
    this.endSimulation('DEATH');
  }
}
```

---

## 4. Usage Examples

### Example 1: First Run
```typescript
// Simulation #1
Agent Arth starts fresh:
  - No previous memories
  - Explores randomly
  - Discovers: Safe room at (10, 5), Dead end at (20, 15), Exit at (50, 50)
  - Dies at (30, 25) due to hunger
  - Memories saved

Output:
  📝 No previous memories found for Arth (first run)
  💾 Saved memories for Arth (Run #1)
```

### Example 2: Second Run (Learning!)
```typescript
// Simulation #2
Agent Arth loads memories:
  - Remembers safe room, dead end, exit location
  - Reflects: "I died at (30, 25) last time - must avoid"
  - Plans: "Go to safe room first, avoid (30, 25), head to exit"
  - Success!

Output:
  ✅ Loaded 1 previous runs for Arth
  📖 Inherited: 3 paths, 2 dangers, 1 exits
  🧠 Generated 4 reflections from past experiences
  Arth: "I remember dying at (30, 25) last time. I'll take a different route."
```

### Example 3: Fifth Run (Mastery)
```typescript
// Simulation #5
Agent Arth is experienced:
  - Knows optimal path to exit
  - Avoids all danger zones
  - Gathers resources efficiently
  - Shares knowledge with teammates
  - Consistent success

Reflection: "I've attempted this maze 5 times before. My success rate is 80%.
             I should maintain my approach and help my team succeed."
```

---

## 5. Testing

```typescript
// tests/CrossSimulationMemory.test.ts

describe('CrossSimulationMemorySystem', () => {
  it('should save and load agent memories', async () => {
    const system = new CrossSimulationMemorySystem();
    const agent = new Agent({ id: 'test_agent', name: 'Test' });

    // Run simulation
    agent.addMemory({
      type: 'OBSERVATION',
      description: 'Found exit at (50, 50)',
      importance: 10
    });

    // Save memories
    await system.saveMemories(agent, 'SUCCESS', {
      startTime: Date.now(),
      survivalTime: 60000,
      resourcesCollected: 5,
      teammatesHelped: 2
    });

    // Load in new run
    const newAgent = new Agent({ id: 'test_agent', name: 'Test' });
    await system.loadMemories(newAgent);

    // Check if memory was inherited
    const exitMemories = newAgent.memoryStream.getAllMemories()
      .filter(m => m.description.includes('exit'));

    expect(exitMemories.length).toBeGreaterThan(0);
  });
});
```

---

## 6. Expected Outcomes

### Immediate Benefits
- ✅ Agents remember maze layout across runs
- ✅ Learning curve appears (improving success rate)
- ✅ Danger avoidance behavior emerges
- ✅ Optimal path discovery speeds up

### Emergent Behaviors
1. **Strategy Evolution**: Failed strategies are abandoned, successful ones refined
2. **Collective Learning**: Agents share knowledge from past runs with teammates
3. **Risk Assessment**: Agents avoid high-death locations
4. **Efficiency Gains**: Later runs are faster and more direct

### Metrics to Track
- Success rate over time (should increase)
- Average survival time (should increase)
- Time to exit (should decrease for successful runs)
- Death locations (should diversify then decrease)
- Strategy success rates (successful strategies dominate)

---

## 7. Next Steps

After implementing this feature:

1. **Test with multiple runs** - Run 5-10 simulations and observe learning
2. **Visualize learning curve** - Plot success rate over runs
3. **Analyze strategy evolution** - Track which strategies emerge as dominant
4. **Implement Feature 2** - Cooperative Planning (builds on shared knowledge)

---

**Status**: Ready to implement 🚀
**Estimated Time**: 3-4 days
**Difficulty**: Medium (file I/O, JSON serialization, memory integration)
**ROI**: ⭐⭐⭐⭐⭐ (Highest impact feature)
