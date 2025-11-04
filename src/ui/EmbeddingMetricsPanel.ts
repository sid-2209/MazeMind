// src/ui/EmbeddingMetricsPanel.ts
/**
 * EmbeddingMetricsPanel - Real-time embedding quality metrics (Week 2, Days 1-2)
 *
 * Displays:
 * - Current embedding provider (OpenAI, Voyage, Ollama, Fake)
 * - Model information (dimension, model name)
 * - Cache performance (hit rate, size, capacity)
 * - API statistics (total calls, errors, avg latency)
 * - Cost tracking (total cost, cost per embedding)
 * - Provider availability status
 * - Semantic retrieval quality (recent accuracy)
 * - Toggle visibility with 'E' key
 *
 * Purpose: Monitor embedding system health and performance in real-time
 */

import { Graphics, Text, Container, TextStyle } from 'pixi.js';
import { Agent } from '../agent/Agent';

interface EmbeddingMetrics {
  provider: string;
  model: string;
  dimension: number;
  totalGenerated: number;
  cacheHits: number;
  cacheMisses: number;
  cacheHitRate: number;
  totalCost: number;
  avgLatency: number;
  errors: number;
  availability: {
    openai: boolean;
    voyage: boolean;
    ollama: boolean;
  };
  isRealEmbeddings: boolean;
}

export class EmbeddingMetricsPanel {
  private container: Container;
  private agent: Agent;

  // Graphics elements
  private panelBg!: Graphics;
  private titleText!: Text;
  private metricsText!: Text;
  private providerIndicator!: Graphics;

  // Configuration
  private padding = 12;
  private panelWidth = 320;
  private panelHeight = 550;  // Increased to 550px to ensure AVAILABILITY section is fully visible with all 3 providers

  // Visible state
  private visible = false;

  // Update tracking
  private updateInterval = 1.0; // Update every 1 second
  private updateTimer = 0;

  constructor(container: Container, agent: Agent) {
    this.container = new Container();
    this.agent = agent;

    container.addChild(this.container);

    // Start hidden
    this.container.visible = false;
  }

  /**
   * Initialize embedding metrics panel
   */
  async init(): Promise<void> {
    console.log('🧠 Initializing embedding metrics panel...');

    // Create panel background
    this.createPanelBackground();

    // Create title
    this.createTitle();

    // Create provider indicator
    this.createProviderIndicator();

    // Create metrics text
    this.createMetricsText();

    // Initial update
    this.update(0);

    console.log('✅ Embedding metrics panel initialized (hidden by default, press E to toggle)');
  }

  /**
   * Create panel background
   */
  private createPanelBackground(): void {
    this.panelBg = new Graphics();

    // Semi-transparent dark background
    this.panelBg.beginFill(0x1a1a1a, 0.92);
    this.panelBg.drawRoundedRect(0, 0, this.panelWidth, this.panelHeight, 8);
    this.panelBg.endFill();

    // Border
    this.panelBg.lineStyle(2, 0x4a90e2, 0.8);
    this.panelBg.drawRoundedRect(0, 0, this.panelWidth, this.panelHeight, 8);

    this.container.addChild(this.panelBg);
  }

  /**
   * Create title text
   */
  private createTitle(): void {
    const titleStyle = new TextStyle({
      fontFamily: 'monospace',
      fontSize: 16,
      fontWeight: 'bold',
      fill: 0x4a90e2,
      align: 'left',
    });

    this.titleText = new Text('🧠 EMBEDDING METRICS', titleStyle);
    this.titleText.x = this.padding;
    this.titleText.y = this.padding;

    this.container.addChild(this.titleText);
  }

  /**
   * Create provider status indicator
   */
  private createProviderIndicator(): void {
    this.providerIndicator = new Graphics();
    this.container.addChild(this.providerIndicator);
  }

  /**
   * Create metrics text
   */
  private createMetricsText(): void {
    const textStyle = new TextStyle({
      fontFamily: 'monospace',
      fontSize: 11,  // Reduced from 12 to fit more content
      fill: 0xe0e0e0,
      align: 'left',
      lineHeight: 16,  // Reduced from 18 for tighter spacing
    });

    this.metricsText = new Text('Loading metrics...', textStyle);
    this.metricsText.x = this.padding;
    this.metricsText.y = this.padding + 40;

    // Create a mask to clip content that extends beyond panel
    const maskGraphics = new Graphics();
    maskGraphics.beginFill(0xffffff);
    maskGraphics.drawRect(
      this.padding,
      this.padding + 35,
      this.panelWidth - 2 * this.padding,
      this.panelHeight - 2 * this.padding - 35
    );
    maskGraphics.endFill();
    this.container.addChild(maskGraphics);
    this.metricsText.mask = maskGraphics;

    this.container.addChild(this.metricsText);
  }

  /**
   * Update embedding metrics
   */
  update(deltaTime: number): void {
    if (!this.visible) return;

    // Update periodically
    this.updateTimer += deltaTime;
    if (this.updateTimer < this.updateInterval) return;
    this.updateTimer = 0;

    // Gather metrics
    const metrics = this.gatherMetrics();

    // Update provider indicator
    this.updateProviderIndicator(metrics);

    // Update metrics text
    this.updateMetricsText(metrics);
  }

  /**
   * Gather embedding metrics from agent
   */
  private gatherMetrics(): EmbeddingMetrics {
    const anthropicService = this.agent.getAnthropicService();

    if (!anthropicService) {
      return this.getDefaultMetrics();
    }

    const embeddingService = anthropicService.getEmbeddingService();
    const isRealEmbeddings = anthropicService.isUsingRealEmbeddings();

    if (!embeddingService) {
      return {
        ...this.getDefaultMetrics(),
        isRealEmbeddings: false,
      };
    }

    const stats = embeddingService.getStatistics();
    const cacheTotal = stats.cacheHits + stats.cacheMisses;
    const cacheHitRate = cacheTotal > 0 ? (stats.cacheHits / cacheTotal) * 100 : 0;

    return {
      provider: stats.provider,
      model: stats.model,
      dimension: stats.dimension,
      totalGenerated: stats.totalGenerated,
      cacheHits: stats.cacheHits,
      cacheMisses: stats.cacheMisses,
      cacheHitRate,
      totalCost: stats.totalCost,
      avgLatency: stats.avgLatency,
      errors: stats.errors,
      availability: stats.availability,
      isRealEmbeddings,
    };
  }

  /**
   * Get default metrics when no embedding service available
   */
  private getDefaultMetrics(): EmbeddingMetrics {
    return {
      provider: 'none',
      model: 'N/A',
      dimension: 0,
      totalGenerated: 0,
      cacheHits: 0,
      cacheMisses: 0,
      cacheHitRate: 0,
      totalCost: 0,
      avgLatency: 0,
      errors: 0,
      availability: {
        openai: false,
        voyage: false,
        ollama: false,
      },
      isRealEmbeddings: false,
    };
  }

  /**
   * Update provider status indicator
   */
  private updateProviderIndicator(metrics: EmbeddingMetrics): void {
    this.providerIndicator.clear();

    // Provider status indicator (colored dot)
    const indicatorX = this.panelWidth - 20;
    const indicatorY = this.padding + 8;
    const indicatorRadius = 6;

    let color: number;
    if (!metrics.isRealEmbeddings) {
      color = 0xff4444; // Red for fake embeddings
    } else if (metrics.provider === 'openai') {
      color = 0x44ff44; // Green for OpenAI
    } else if (metrics.provider === 'voyage') {
      color = 0x4444ff; // Blue for Voyage
    } else if (metrics.provider === 'ollama') {
      color = 0xffaa44; // Orange for Ollama
    } else {
      color = 0x888888; // Gray for unknown
    }

    this.providerIndicator.beginFill(color, 1.0);
    this.providerIndicator.drawCircle(indicatorX, indicatorY, indicatorRadius);
    this.providerIndicator.endFill();

    // Pulsing glow effect
    this.providerIndicator.lineStyle(2, color, 0.5);
    this.providerIndicator.drawCircle(indicatorX, indicatorY, indicatorRadius + 2);
  }

  /**
   * Update metrics text display
   */
  private updateMetricsText(metrics: EmbeddingMetrics): void {
    const lines: string[] = [];

    // Provider section
    lines.push('┌─ PROVIDER ───────────────────┐');
    lines.push(`│ Active: ${this.formatProvider(metrics.provider)}`);
    lines.push(`│ Model: ${metrics.model}`);
    lines.push(`│ Dimensions: ${metrics.dimension}D`);
    lines.push(`│ Status: ${metrics.isRealEmbeddings ? '✓ Real' : '✗ Fake'}`);
    lines.push('└──────────────────────────────┘');
    lines.push('');

    // Cache section
    lines.push('┌─ CACHE ──────────────────────┐');
    lines.push(`│ Hit Rate: ${metrics.cacheHitRate.toFixed(1)}%`);
    lines.push(`│ Hits: ${metrics.cacheHits}`);
    lines.push(`│ Misses: ${metrics.cacheMisses}`);
    const cacheBar = this.createProgressBar(metrics.cacheHitRate, 20);
    lines.push(`│ ${cacheBar}`);
    lines.push('└──────────────────────────────┘');
    lines.push('');

    // Performance section
    lines.push('┌─ PERFORMANCE ────────────────┐');
    lines.push(`│ Generated: ${metrics.totalGenerated}`);
    lines.push(`│ Avg Latency: ${metrics.avgLatency.toFixed(0)}ms`);
    lines.push(`│ Errors: ${metrics.errors}`);
    lines.push('└──────────────────────────────┘');
    lines.push('');

    // Cost section (only for paid providers)
    if (metrics.provider !== 'ollama' && metrics.provider !== 'fake') {
      lines.push('┌─ COST ───────────────────────┐');
      lines.push(`│ Total: $${metrics.totalCost.toFixed(6)}`);
      const costPerEmb = metrics.totalGenerated > 0
        ? metrics.totalCost / metrics.totalGenerated
        : 0;
      lines.push(`│ Per Embedding: $${costPerEmb.toFixed(8)}`);
      lines.push('└──────────────────────────────┘');
      lines.push('');
    }

    // Availability section
    lines.push('┌─ AVAILABILITY ───────────────┐');
    lines.push(`│ OpenAI: ${metrics.availability.openai ? '✓' : '✗'}`);
    lines.push(`│ Voyage: ${metrics.availability.voyage ? '✓' : '✗'}`);
    lines.push(`│ Ollama: ${metrics.availability.ollama ? '✓' : '✗'}`);
    lines.push('└──────────────────────────────┘');

    this.metricsText.text = lines.join('\n');
  }

  /**
   * Format provider name with proper capitalization
   */
  private formatProvider(provider: string): string {
    switch (provider) {
      case 'openai':
        return 'OpenAI';
      case 'voyage':
        return 'Voyage AI';
      case 'ollama':
        return 'Ollama (Local)';
      case 'fake':
        return 'Fake (Heuristic)';
      default:
        return provider;
    }
  }

  /**
   * Create ASCII progress bar
   */
  private createProgressBar(percentage: number, width: number): string {
    const filled = Math.round((percentage / 100) * width);
    const empty = width - filled;
    return '[' + '█'.repeat(filled) + '░'.repeat(empty) + ']';
  }

  /**
   * Toggle panel visibility
   */
  toggle(): void {
    this.visible = !this.visible;
    this.container.visible = this.visible;

    if (this.visible) {
      console.log('📊 Embedding metrics panel: visible');
      // Force immediate update when shown
      this.updateTimer = this.updateInterval;
    } else {
      console.log('📊 Embedding metrics panel: hidden');
    }
  }

  /**
   * Show panel
   */
  show(): void {
    if (!this.visible) {
      this.toggle();
    }
  }

  /**
   * Hide panel
   */
  hide(): void {
    if (this.visible) {
      this.toggle();
    }
  }

  /**
   * Check if panel is visible
   */
  isVisible(): boolean {
    return this.visible;
  }

  /**
   * Set panel position
   */
  setPosition(x: number, y: number): void {
    this.container.x = x;
    this.container.y = y;
  }

  /**
   * Get panel width
   */
  getWidth(): number {
    return this.panelWidth;
  }

  /**
   * Get panel height
   */
  getHeight(): number {
    return this.panelHeight;
  }

  /**
   * Handle window resize
   */
  resize(_screenWidth: number, _screenHeight: number): void {
    // Panel position will be updated by UIManager
  }

  /**
   * Cleanup
   */
  destroy(): void {
    this.container.destroy({ children: true });
  }
}
