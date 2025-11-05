/**
 * Metrics Analyzer - Statistical analysis of simulation results (Week 4)
 *
 * Calculates:
 * - Aggregate statistics
 * - Success rates
 * - Resource usage patterns
 * - Comparative analysis
 */

import {
  SimulationMetrics,
  ExperimentResults,
  AggregateStats,
  SimulationOutcome,
  ExperimentConfig
} from '../types/metrics';

export class MetricsAnalyzer {
  /**
   * Analyze experiment results and generate aggregate statistics
   */
  static analyze(config: ExperimentConfig, runs: SimulationMetrics[], startTime: number, endTime: number): ExperimentResults {
    const stats = this.calculateAggregateStats(runs);

    const results: ExperimentResults = {
      config,
      runs,
      startTime,
      endTime,
      totalDuration: (endTime - startTime) / 1000, // Convert to seconds
      stats
    };

    console.log(`📈 Analysis complete: ${runs.length} runs analyzed`);
    this.printSummary(stats);

    return results;
  }

  /**
   * Calculate aggregate statistics from multiple runs
   */
  private static calculateAggregateStats(runs: SimulationMetrics[]): AggregateStats {
    const totalRuns = runs.length;

    if (totalRuns === 0) {
      return this.getEmptyStats();
    }

    // Count outcomes
    let successCount = 0;
    let deathByStarvation = 0;
    let deathByDehydration = 0;
    let deathByExhaustion = 0;
    let mentalBreakdowns = 0;
    let timeouts = 0;

    for (const run of runs) {
      switch (run.outcome) {
        case SimulationOutcome.SUCCESS:
          successCount++;
          break;
        case SimulationOutcome.DEATH_STARVATION:
          deathByStarvation++;
          break;
        case SimulationOutcome.DEATH_DEHYDRATION:
          deathByDehydration++;
          break;
        case SimulationOutcome.DEATH_EXHAUSTION:
          deathByExhaustion++;
          break;
        case SimulationOutcome.MENTAL_BREAKDOWN:
          mentalBreakdowns++;
          break;
        case SimulationOutcome.TIMEOUT:
          timeouts++;
          break;
      }
    }

    // Calculate survival time statistics
    const survivalTimes = runs.map(r => r.survivalTime);
    const avgSurvivalTime = this.mean(survivalTimes);
    const minSurvivalTime = Math.min(...survivalTimes);
    const maxSurvivalTime = Math.max(...survivalTimes);
    const stdDevSurvivalTime = this.standardDeviation(survivalTimes);

    // Calculate resource statistics
    const finalStress = runs.map(r => r.finalStress);
    const avgFinalStress = this.mean(finalStress);

    const itemsConsumed = runs.map(r => r.totalItemsConsumed);
    const avgItemsConsumed = this.mean(itemsConsumed);

    const explorationProgress = runs.map(r => r.explorationProgress);
    const avgExplorationProgress = this.mean(explorationProgress);

    // Success-specific metrics
    const successfulRuns = runs.filter(r => r.outcome === SimulationOutcome.SUCCESS);
    let avgTimeToExit: number | undefined;
    let avgEfficiency: number | undefined;

    if (successfulRuns.length > 0) {
      const timesToExit = successfulRuns
        .map(r => r.timeToExit)
        .filter((t): t is number => t !== undefined);

      avgTimeToExit = timesToExit.length > 0 ? this.mean(timesToExit) : undefined;

      const efficiencies = successfulRuns.map(r => r.efficiency);
      avgEfficiency = this.mean(efficiencies);
    }

    return {
      totalRuns,
      successCount,
      successRate: successCount / totalRuns,

      deathByStarvation,
      deathByDehydration,
      deathByExhaustion,
      mentalBreakdowns,
      timeouts,

      avgSurvivalTime,
      minSurvivalTime,
      maxSurvivalTime,
      stdDevSurvivalTime,

      avgFinalStress,
      avgItemsConsumed,
      avgExplorationProgress,

      avgTimeToExit,
      avgEfficiency
    };
  }

  /**
   * Get empty stats object
   */
  private static getEmptyStats(): AggregateStats {
    return {
      totalRuns: 0,
      successCount: 0,
      successRate: 0,
      deathByStarvation: 0,
      deathByDehydration: 0,
      deathByExhaustion: 0,
      mentalBreakdowns: 0,
      timeouts: 0,
      avgSurvivalTime: 0,
      minSurvivalTime: 0,
      maxSurvivalTime: 0,
      stdDevSurvivalTime: 0,
      avgFinalStress: 0,
      avgItemsConsumed: 0,
      avgExplorationProgress: 0
    };
  }

  /**
   * Calculate mean of array
   */
  private static mean(values: number[]): number {
    if (values.length === 0) return 0;
    return values.reduce((sum, v) => sum + v, 0) / values.length;
  }

  /**
   * Calculate standard deviation
   */
  private static standardDeviation(values: number[]): number {
    if (values.length === 0) return 0;

    const avg = this.mean(values);
    const squareDiffs = values.map(v => Math.pow(v - avg, 2));
    const avgSquareDiff = this.mean(squareDiffs);

    return Math.sqrt(avgSquareDiff);
  }

  /**
   * Print summary to console
   */
  private static printSummary(stats: AggregateStats): void {
    console.log('\n📊 ===== EXPERIMENT SUMMARY =====');
    console.log(`Total Runs: ${stats.totalRuns}`);
    console.log(`Success Rate: ${(stats.successRate * 100).toFixed(1)}% (${stats.successCount}/${stats.totalRuns})`);
    console.log('\nOutcomes:');
    console.log(`  Successes: ${stats.successCount}`);
    console.log(`  Deaths (Starvation): ${stats.deathByStarvation}`);
    console.log(`  Deaths (Dehydration): ${stats.deathByDehydration}`);
    console.log(`  Deaths (Exhaustion): ${stats.deathByExhaustion}`);
    console.log(`  Mental Breakdowns: ${stats.mentalBreakdowns}`);
    console.log(`  Timeouts: ${stats.timeouts}`);
    console.log('\nSurvival Time:');
    console.log(`  Average: ${this.formatTime(stats.avgSurvivalTime)}`);
    console.log(`  Min: ${this.formatTime(stats.minSurvivalTime)}`);
    console.log(`  Max: ${this.formatTime(stats.maxSurvivalTime)}`);
    console.log(`  Std Dev: ${stats.stdDevSurvivalTime.toFixed(1)}s`);
    console.log('\nResources:');
    console.log(`  Avg Final Stress: ${stats.avgFinalStress.toFixed(1)}%`);
    console.log(`  Avg Items Consumed: ${stats.avgItemsConsumed.toFixed(1)}`);
    console.log(`  Avg Exploration: ${(stats.avgExplorationProgress * 100).toFixed(1)}%`);

    if (stats.avgTimeToExit !== undefined) {
      console.log('\nSuccess Metrics:');
      console.log(`  Avg Time to Exit: ${this.formatTime(stats.avgTimeToExit)}`);
      console.log(`  Avg Efficiency: ${((stats.avgEfficiency || 0) * 100).toFixed(1)}%`);
    }

    console.log('================================\n');
  }

  /**
   * Format time in MM:SS
   */
  private static formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }

  /**
   * Generate CSV export data
   */
  static generateCSV(results: ExperimentResults): string {
    const headers = [
      'runId',
      'seed',
      'outcome',
      'survived',
      'survivalTime',
      'finalHunger',
      'finalThirst',
      'finalEnergy',
      'finalStress',
      'itemsConsumed',
      'tilesExplored',
      'explorationProgress',
      'efficiency',
      'decisions',
      'survivalPriorities'
    ];

    const rows = results.runs.map(run => [
      run.runId,
      run.seed,
      run.outcome,
      run.survived ? '1' : '0',
      run.survivalTime.toFixed(2),
      run.finalHunger.toFixed(2),
      run.finalThirst.toFixed(2),
      run.finalEnergy.toFixed(2),
      run.finalStress.toFixed(2),
      run.totalItemsConsumed,
      run.tilesExplored,
      run.explorationProgress.toFixed(4),
      run.efficiency.toFixed(4),
      run.totalDecisions,
      run.survivalPriorityCount
    ]);

    const csvLines = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ];

    return csvLines.join('\n');
  }

  /**
   * Generate JSON export
   */
  static generateJSON(results: ExperimentResults, pretty: boolean = true): string {
    return JSON.stringify(results, null, pretty ? 2 : 0);
  }
}
