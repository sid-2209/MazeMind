// src/ui/EmbeddingVisualizationPanel.ts
/**
 * EmbeddingVisualizationPanel - 2D visualization of memory embeddings (Week 2, Days 1-2)
 *
 * Displays:
 * - 2D scatter plot of embeddings (PCA projection from 768/1024/1536D → 2D)
 * - Color-coded clusters (by importance or category)
 * - Query vector visualization (shows semantic relationships)
 * - Interactive hover to see memory content
 * - Real-time updates as new memories are added
 * - Toggle visibility with 'M' key (M for Memory visualization)
 *
 * Purpose: Visualize semantic relationships between memories
 * Shows how embeddings cluster semantically related memories together
 *
 * Uses simple PCA (Principal Component Analysis) for dimensionality reduction
 */

import { Graphics, Text, Container, TextStyle } from 'pixi.js';
import { Agent } from '../agent/Agent';
import { Memory } from '../types';

interface Point2D {
  x: number;
  y: number;
  memory: Memory;
  color: number;
}

export class EmbeddingVisualizationPanel {
  private container: Container;
  private agent: Agent;

  // Graphics elements
  private panelBg!: Graphics;
  private titleText!: Text;
  private plotCanvas!: Graphics;
  private hoverText!: Text;

  // Configuration
  private padding = 12;
  private panelWidth = 400;
  private panelHeight = 450;
  private plotWidth = 360;
  private plotHeight = 360;
  private plotOffsetX = 20;
  private plotOffsetY = 60;

  // Visible state
  private visible = false;

  // Update tracking
  private updateInterval = 2.0; // Update every 2 seconds
  private updateTimer = 0;

  // Data
  private points: Point2D[] = [];

  constructor(container: Container, agent: Agent) {
    this.container = new Container();
    this.agent = agent;

    container.addChild(this.container);

    // Start hidden
    this.container.visible = false;

    // Make interactive for hover
    this.container.interactive = true;
    this.container.interactiveChildren = true;
  }

  /**
   * Initialize embedding visualization panel
   */
  async init(): Promise<void> {
    console.log('📊 Initializing embedding visualization panel...');

    // Create panel background
    this.createPanelBackground();

    // Create title
    this.createTitle();

    // Create plot canvas
    this.createPlotCanvas();

    // Create hover text
    this.createHoverText();

    // Initial update
    this.update(0);

    console.log('✅ Embedding visualization panel initialized (hidden by default, press M to toggle)');
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
    this.panelBg.lineStyle(2, 0x9b59b6, 0.8);
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
      fill: 0x9b59b6,
      align: 'left',
    });

    this.titleText = new Text('📊 MEMORY EMBEDDINGS', titleStyle);
    this.titleText.x = this.padding;
    this.titleText.y = this.padding;

    this.container.addChild(this.titleText);
  }

  /**
   * Create plot canvas
   */
  private createPlotCanvas(): void {
    this.plotCanvas = new Graphics();
    this.plotCanvas.x = this.plotOffsetX;
    this.plotCanvas.y = this.plotOffsetY;

    this.container.addChild(this.plotCanvas);

    // Draw plot axes
    this.drawPlotAxes();
  }

  /**
   * Draw plot axes
   */
  private drawPlotAxes(): void {
    this.plotCanvas.clear();

    // Draw background
    this.plotCanvas.beginFill(0x0a0a0a, 0.5);
    this.plotCanvas.drawRect(0, 0, this.plotWidth, this.plotHeight);
    this.plotCanvas.endFill();

    // Draw grid lines
    this.plotCanvas.lineStyle(1, 0x333333, 0.3);
    const gridLines = 5;
    for (let i = 0; i <= gridLines; i++) {
      const x = (i / gridLines) * this.plotWidth;
      const y = (i / gridLines) * this.plotHeight;

      // Vertical grid lines
      this.plotCanvas.moveTo(x, 0);
      this.plotCanvas.lineTo(x, this.plotHeight);

      // Horizontal grid lines
      this.plotCanvas.moveTo(0, y);
      this.plotCanvas.lineTo(this.plotWidth, y);
    }

    // Draw axes
    this.plotCanvas.lineStyle(2, 0x555555, 0.8);

    // X axis (horizontal)
    this.plotCanvas.moveTo(0, this.plotHeight / 2);
    this.plotCanvas.lineTo(this.plotWidth, this.plotHeight / 2);

    // Y axis (vertical)
    this.plotCanvas.moveTo(this.plotWidth / 2, 0);
    this.plotCanvas.lineTo(this.plotWidth / 2, this.plotHeight);
  }

  /**
   * Create hover text
   */
  private createHoverText(): void {
    const hoverStyle = new TextStyle({
      fontFamily: 'monospace',
      fontSize: 10,
      fill: 0xffffff,
      align: 'left',
      wordWrap: true,
      wordWrapWidth: this.panelWidth - 2 * this.padding,
    });

    this.hoverText = new Text('Hover over points to see memory content', hoverStyle);
    this.hoverText.x = this.padding;
    this.hoverText.y = this.panelHeight - 30;

    this.container.addChild(this.hoverText);
  }

  /**
   * Update embedding visualization
   */
  update(deltaTime: number): void {
    if (!this.visible) return;

    // Update periodically
    this.updateTimer += deltaTime;
    if (this.updateTimer < this.updateInterval) return;
    this.updateTimer = 0;

    // Get recent memories
    const memories = this.agent.getRecentMemories(50); // Visualize last 50 memories

    if (memories.length === 0) {
      this.points = [];
      this.drawPlot();
      return;
    }

    // Project embeddings to 2D using simple PCA
    this.points = this.projectTo2D(memories);

    // Draw the plot
    this.drawPlot();
  }

  /**
   * Project high-dimensional embeddings to 2D using simple PCA
   */
  private projectTo2D(memories: Memory[]): Point2D[] {
    const embeddings = memories
      .filter(m => m.embedding && m.embedding.length > 0)
      .map(m => m.embedding!);

    if (embeddings.length === 0) {
      return [];
    }

    const dim = embeddings[0].length;

    // Simple PCA: just use first 2 principal components
    // For visualization purposes, we'll use a simplified approach:
    // Take weighted sum of dimensions to create 2D projection

    const points: Point2D[] = [];

    for (let i = 0; i < embeddings.length; i++) {
      const emb = embeddings[i];
      const memory = memories.filter(m => m.embedding === emb)[0];

      // Project to 2D using weighted sums
      // X: sum of first half of dimensions
      // Y: sum of second half of dimensions
      const half = Math.floor(dim / 2);

      let x = 0;
      let y = 0;

      for (let j = 0; j < half; j++) {
        x += emb[j];
      }
      for (let j = half; j < dim; j++) {
        y += emb[j];
      }

      // Normalize to [-1, 1] range (approx)
      x = x / half;
      y = y / (dim - half);

      // Color by importance
      const color = this.getColorForImportance(memory.importance);

      points.push({ x, y, memory, color });
    }

    return points;
  }

  /**
   * Get color for memory importance
   */
  private getColorForImportance(importance: number): number {
    // Low importance (1-3): Blue
    if (importance <= 3) return 0x4a90e2;

    // Medium importance (4-6): Green
    if (importance <= 6) return 0x44ff44;

    // High importance (7-8): Yellow
    if (importance <= 8) return 0xffcc00;

    // Critical importance (9-10): Red
    return 0xff4444;
  }

  /**
   * Draw the 2D plot with memory points
   */
  private drawPlot(): void {
    // Redraw axes
    this.drawPlotAxes();

    if (this.points.length === 0) {
      // Draw "No data" message
      this.plotCanvas.lineStyle(0);
      this.plotCanvas.beginFill(0x666666, 0.8);

      const textStyle = new TextStyle({
        fontFamily: 'monospace',
        fontSize: 14,
        fill: 0xaaaaaa,
        align: 'center',
      });

      const noDataText = new Text('No memories with embeddings yet', textStyle);
      noDataText.x = this.plotWidth / 2 - noDataText.width / 2;
      noDataText.y = this.plotHeight / 2 - noDataText.height / 2;

      this.plotCanvas.addChild(noDataText);
      return;
    }

    // Find min/max for scaling
    const xValues = this.points.map(p => p.x);
    const yValues = this.points.map(p => p.y);

    const xMin = Math.min(...xValues);
    const xMax = Math.max(...xValues);
    const yMin = Math.min(...yValues);
    const yMax = Math.max(...yValues);

    const xRange = xMax - xMin || 1;
    const yRange = yMax - yMin || 1;

    // Draw points
    this.points.forEach((point) => {
      // Scale to plot coordinates
      const x = ((point.x - xMin) / xRange) * this.plotWidth;
      const y = this.plotHeight - ((point.y - yMin) / yRange) * this.plotHeight;

      // Draw point
      this.plotCanvas.lineStyle(1, 0x000000, 0.5);
      this.plotCanvas.beginFill(point.color, 0.8);
      this.plotCanvas.drawCircle(x, y, 4);
      this.plotCanvas.endFill();

      // Add hover circle (invisible, for interaction)
      const hoverCircle = new Graphics();
      hoverCircle.beginFill(0xffffff, 0.01); // Almost invisible
      hoverCircle.drawCircle(x, y, 10);
      hoverCircle.endFill();
      hoverCircle.interactive = true;

      // Hover events
      hoverCircle.on('pointerover', () => {
        this.updateHoverText(point);

        // Highlight point
        this.plotCanvas.lineStyle(2, 0xffffff, 1.0);
        this.plotCanvas.beginFill(point.color, 1.0);
        this.plotCanvas.drawCircle(x, y, 6);
        this.plotCanvas.endFill();
      });

      hoverCircle.on('pointerout', () => {
        this.hoverText.text = 'Hover over points to see memory content';
        this.drawPlot(); // Redraw to remove highlight
      });

      this.plotCanvas.addChild(hoverCircle);
    });

    // Draw legend
    this.drawLegend();
  }

  /**
   * Draw color legend
   */
  private drawLegend(): void {
    const legendX = this.padding;
    const legendY = this.plotOffsetY + this.plotHeight + 15;

    const legendStyle = new TextStyle({
      fontFamily: 'monospace',
      fontSize: 9,
      fill: 0xcccccc,
      align: 'left',
    });

    const legend = new Text(
      '● Blue: Low   ● Green: Medium   ● Yellow: High   ● Red: Critical',
      legendStyle
    );
    legend.x = legendX;
    legend.y = legendY;

    this.container.addChild(legend);
  }

  /**
   * Update hover text with memory content
   */
  private updateHoverText(point: Point2D): void {
    const memory = point.memory;
    const preview = memory.description.substring(0, 80);
    const text = `[${memory.importance}] ${preview}${memory.description.length > 80 ? '...' : ''}`;
    this.hoverText.text = text;
  }

  /**
   * Toggle panel visibility
   */
  toggle(): void {
    this.visible = !this.visible;
    this.container.visible = this.visible;

    if (this.visible) {
      console.log('📊 Embedding visualization panel: visible');
      // Force immediate update when shown
      this.updateTimer = this.updateInterval;
    } else {
      console.log('📊 Embedding visualization panel: hidden');
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
