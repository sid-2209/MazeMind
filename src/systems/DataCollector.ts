/**
 * Data Collector - Real-time metrics collection during simulation (Week 4)
 *
 * Collects:
 * - Agent state snapshots
 * - Event logs
 * - Resource consumption
 * - Exploration progress
 * - Memory statistics
 */

import {
  SimulationMetrics,
  SimulationEvent,
  MetricsSnapshot,
  SimulationOutcome,
  EventType
} from '../types/metrics';
import { Agent } from '../agent/Agent';
import { Maze, Position } from '../types';
import { v4 as uuidv4 } from 'uuid';

export class DataCollector {
  private agent: Agent;
  private maze: Maze;
  private runId: string;
  private startTime: number;

  // Collected data
  private events: SimulationEvent[] = [];
  private snapshots: MetricsSnapshot[] = [];
  private pathTaken: Position[] = [];

  // Tracking
  private tilesExplored: Set<string> = new Set();
  private itemsConsumed: Map<string, number> = new Map([
    ['food', 0],
    ['water', 0],
    ['energy', 0]
  ]);

  private totalDecisions: number = 0;
  private survivalPriorityCount: number = 0;
  private autonomousSteps: number = 0;

  // Snapshot tracking
  private lastSnapshotTime: number = 0;
  private snapshotInterval: number = 5; // Snapshot every 5 seconds

  // Min/max tracking
  private minHunger: number = 100;
  private minThirst: number = 100;
  private minEnergy: number = 100;
  private maxStress: number = 0;

  // Running averages
  private hungerSum: number = 0;
  private thirstSum: number = 0;
  private energySum: number = 0;
  private stressSum: number = 0;
  private snapshotCount: number = 0;

  constructor(agent: Agent, maze: Maze, _seed: string) {
    this.agent = agent;
    this.maze = maze;
    this.runId = uuidv4();
    this.startTime = Date.now();

    console.log(`📊 DataCollector initialized (Run: ${this.runId.substring(0, 8)})`);
  }

  /**
   * Update collector (called every frame)
   */
  update(gameTime: number): void {
    // Track path
    const currentPos = this.agent.getTilePosition();
    const lastPos = this.pathTaken[this.pathTaken.length - 1];

    if (!lastPos || lastPos.x !== currentPos.x || lastPos.y !== currentPos.y) {
      this.pathTaken.push({ ...currentPos });

      // Track exploration
      const tileKey = `${currentPos.x},${currentPos.y}`;
      this.tilesExplored.add(tileKey);
    }

    // Take periodic snapshots
    if (gameTime - this.lastSnapshotTime >= this.snapshotInterval) {
      this.takeSnapshot(gameTime);
      this.lastSnapshotTime = gameTime;
    }
  }

  /**
   * Take a metrics snapshot
   */
  private takeSnapshot(timestamp: number): void {
    const state = this.agent.getState();
    const survivalState = this.agent.getSurvivalState();
    const memoryStats = this.agent.getMemoryStatistics();

    const snapshot: MetricsSnapshot = {
      timestamp,
      position: { ...this.agent.getTilePosition() },
      hunger: survivalState.hunger,
      thirst: survivalState.thirst,
      energy: survivalState.energy,
      stress: this.agent.getStressLevel(),
      health: state.health,
      memoryCount: memoryStats.total,
      reflectionCount: memoryStats.byType['reflection'] || 0,
      tilesExplored: this.tilesExplored.size,
      explorationProgress: this.getExplorationProgress(),
      itemsConsumed: this.getTotalItemsConsumed(),
      foodConsumed: this.itemsConsumed.get('food') || 0,
      waterConsumed: this.itemsConsumed.get('water') || 0,
      energyConsumed: this.itemsConsumed.get('energy') || 0
    };

    this.snapshots.push(snapshot);
    this.snapshotCount++;

    // Update running totals for averages
    this.hungerSum += survivalState.hunger;
    this.thirstSum += survivalState.thirst;
    this.energySum += survivalState.energy;
    this.stressSum += this.agent.getStressLevel();

    // Update min/max
    this.minHunger = Math.min(this.minHunger, survivalState.hunger);
    this.minThirst = Math.min(this.minThirst, survivalState.thirst);
    this.minEnergy = Math.min(this.minEnergy, survivalState.energy);
    this.maxStress = Math.max(this.maxStress, this.agent.getStressLevel());
  }

  /**
   * Log an event
   */
  logEvent(event: SimulationEvent): void {
    this.events.push(event);

    // Track specific event types
    if (event.type === EventType.ITEM_CONSUMED && event.data?.itemType) {
      const type = event.data.itemType;
      this.itemsConsumed.set(type, (this.itemsConsumed.get(type) || 0) + 1);
    }

    if (event.type === EventType.DECISION) {
      this.totalDecisions++;
    }

    if (event.type === EventType.SURVIVAL_PRIORITY) {
      this.survivalPriorityCount++;
    }
  }

  /**
   * Record autonomous step
   */
  recordAutonomousStep(): void {
    this.autonomousSteps++;
  }

  /**
   * Get exploration progress (0-1)
   */
  private getExplorationProgress(): number {
    const totalWalkableTiles = this.countWalkableTiles();
    return totalWalkableTiles > 0 ? this.tilesExplored.size / totalWalkableTiles : 0;
  }

  /**
   * Count walkable tiles in maze
   */
  private countWalkableTiles(): number {
    let count = 0;
    for (let y = 0; y < this.maze.height; y++) {
      for (let x = 0; x < this.maze.width; x++) {
        const tile = this.maze.tiles[y][x];
        // Count all non-wall tiles as walkable
        if (tile.type !== 'wall') {
          count++;
        }
      }
    }
    return count;
  }

  /**
   * Get total items consumed
   */
  private getTotalItemsConsumed(): number {
    return Array.from(this.itemsConsumed.values()).reduce((sum, count) => sum + count, 0);
  }

  /**
   * Finalize metrics and generate report
   */
  finalize(outcome: SimulationOutcome, gameTime: number): SimulationMetrics {
    // Take final snapshot
    this.takeSnapshot(gameTime);

    const survivalState = this.agent.getSurvivalState();
    const memoryStats = this.agent.getMemoryStatistics();

    // Calculate efficiency (path length / optimal path)
    const efficiency = this.calculateEfficiency();

    const metrics: SimulationMetrics = {
      // Identification
      runId: this.runId,
      timestamp: this.startTime,
      seed: this.maze.seed,

      // Outcome
      outcome,
      survived: outcome === SimulationOutcome.SUCCESS,
      foundExit: outcome === SimulationOutcome.SUCCESS,

      // Time metrics
      survivalTime: survivalState.survivalTime,
      explorationTime: gameTime,
      timeToExit: outcome === SimulationOutcome.SUCCESS ? gameTime : undefined,

      // Final resource metrics
      finalHunger: survivalState.hunger,
      finalThirst: survivalState.thirst,
      finalEnergy: survivalState.energy,
      finalStress: this.agent.getStressLevel(),

      // Average resource metrics
      averageHunger: this.snapshotCount > 0 ? this.hungerSum / this.snapshotCount : 100,
      averageThirst: this.snapshotCount > 0 ? this.thirstSum / this.snapshotCount : 100,
      averageEnergy: this.snapshotCount > 0 ? this.energySum / this.snapshotCount : 100,
      averageStress: this.snapshotCount > 0 ? this.stressSum / this.snapshotCount : 0,

      // Min/max metrics
      minHunger: this.minHunger,
      minThirst: this.minThirst,
      minEnergy: this.minEnergy,
      maxStress: this.maxStress,

      // Consumption metrics
      totalItemsConsumed: this.getTotalItemsConsumed(),
      foodConsumed: this.itemsConsumed.get('food') || 0,
      waterConsumed: this.itemsConsumed.get('water') || 0,
      energyDrinksConsumed: this.itemsConsumed.get('energy') || 0,

      // Exploration metrics
      tilesExplored: this.tilesExplored.size,
      explorationProgress: this.getExplorationProgress(),
      efficiency,

      // Memory metrics
      totalMemories: memoryStats.total,
      observationCount: memoryStats.byType['observation'] || 0,
      reflectionCount: memoryStats.byType['reflection'] || 0,
      planCount: memoryStats.byType['plan'] || 0,

      // Decision metrics
      totalDecisions: this.totalDecisions,
      survivalPriorityCount: this.survivalPriorityCount,
      autonomousSteps: this.autonomousSteps,

      // Events and snapshots
      events: this.events,
      snapshots: this.snapshots,
      pathTaken: this.pathTaken
    };

    console.log(`📊 Metrics finalized: ${outcome} (${gameTime.toFixed(1)}s, ${this.tilesExplored.size} tiles explored)`);

    return metrics;
  }

  /**
   * Calculate path efficiency (path length / optimal path length)
   */
  private calculateEfficiency(): number {
    if (this.pathTaken.length === 0) return 0;

    const actualPath = this.pathTaken.length;
    const start = this.maze.entrance;
    const end = this.pathTaken[this.pathTaken.length - 1];

    // Manhattan distance as approximation of optimal path
    const optimalPath = Math.abs(end.x - start.x) + Math.abs(end.y - start.y);

    return optimalPath > 0 ? optimalPath / actualPath : 0;
  }

  /**
   * Get current run ID
   */
  getRunId(): string {
    return this.runId;
  }

  /**
   * Get events count
   */
  getEventCount(): number {
    return this.events.length;
  }

  /**
   * Get tiles explored count
   */
  getTilesExploredCount(): number {
    return this.tilesExplored.size;
  }
}
