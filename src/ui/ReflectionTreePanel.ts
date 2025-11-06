// src/ui/ReflectionTreePanel.ts
/**
 * ReflectionTreePanel - Visualize reflection hierarchy (Week 8)
 *
 * Displays:
 * - Reflection tree structure (observations → reflections → meta-reflections)
 * - Recent reflection questions and answers
 * - Importance-sum tracker progress
 * - Reflection statistics
 * - Color-coded by reflection level and category
 */

import { Container, Graphics, Text } from 'pixi.js';
import { ReflectionSystem } from '../agent/ReflectionSystem';
import { ReflectionNode, ReflectionTree, ReflectionStatistics } from '../types/reflection';

export class ReflectionTreePanel {
  private container: Container;
  private reflectionSystem: ReflectionSystem | null = null;

  // Panel dimensions
  private readonly width = 400;
  private readonly height = 500;

  // Visual elements
  private panelBg!: Graphics;
  private titleText!: Text;
  private contentContainer!: Container;
  private statsContainer!: Container;

  // Refresh rate
  private updateTimer: number = 0;
  private readonly updateInterval: number = 1; // Update every 1 second

  constructor(container: Container) {
    this.container = new Container();
    container.addChild(this.container);
    this.createPanel();
    this.updateDisplay();
  }

  /**
   * Create panel UI elements
   */
  private createPanel(): void {
    // Background
    this.panelBg = new Graphics();
    this.panelBg.beginFill(0x0a0a0a, 0.95);
    this.panelBg.drawRoundedRect(0, 0, this.width, this.height, 8);
    this.panelBg.endFill();
    this.panelBg.lineStyle(2, 0x00ff00, 0.8);
    this.panelBg.drawRoundedRect(0, 0, this.width, this.height, 8);
    this.container.addChild(this.panelBg);

    // Title
    this.titleText = new Text('REFLECTION TREE (Week 8)', {
      fontFamily: 'Courier New, monospace',
      fontSize: 14,
      fill: 0x00ff00,
      fontWeight: 'bold',
    });
    this.titleText.x = 10;
    this.titleText.y = 10;
    this.container.addChild(this.titleText);

    // Content container (scrollable area)
    this.contentContainer = new Container();
    this.contentContainer.x = 10;
    this.contentContainer.y = 40;
    this.container.addChild(this.contentContainer);

    // Stats container (bottom)
    this.statsContainer = new Container();
    this.statsContainer.x = 10;
    this.statsContainer.y = this.height - 100;
    this.container.addChild(this.statsContainer);

    // Initial position (will be properly set by UIManager)
    // Positioned temporarily, will be adjusted by positionUIElements() and drag manager
    this.container.x = 100;
    this.container.y = 20;
  }

  /**
   * Set reflection system reference
   */
  setReflectionSystem(system: ReflectionSystem | null): void {
    this.reflectionSystem = system;
    this.updateDisplay();
  }

  /**
   * Update display (called periodically)
   */
  update(deltaTime: number): void {
    this.updateTimer += deltaTime;

    if (this.updateTimer >= this.updateInterval) {
      this.updateTimer = 0;
      this.updateDisplay();
    }
  }

  /**
   * Update all visual elements
   */
  private updateDisplay(): void {
    // Clear previous content
    this.contentContainer.removeChildren();
    this.statsContainer.removeChildren();

    if (!this.reflectionSystem) {
      this.showNoDataMessage();
      return;
    }

    const tree = this.reflectionSystem.getReflectionTree();
    const stats = this.reflectionSystem.getEnhancedStatistics();

    let yOffset = 0;

    // Show importance tracker
    yOffset = this.renderImportanceTracker(stats, yOffset);
    yOffset += 15;

    // Show recent reflections
    yOffset = this.renderRecentReflections(tree, yOffset);

    // Show statistics at bottom
    this.renderStatistics(stats);
  }

  /**
   * Render importance-sum tracker
   */
  private renderImportanceTracker(stats: ReflectionStatistics, yOffset: number): number {
    const sectionTitle = new Text('Importance Tracker:', {
      fontFamily: 'Courier New, monospace',
      fontSize: 11,
      fill: 0x00ff00,
      fontWeight: 'bold',
    });
    sectionTitle.y = yOffset;
    this.contentContainer.addChild(sectionTitle);
    yOffset += 18;

    // Progress bar
    const barWidth = this.width - 40;
    const barHeight = 20;
    const progress = Math.min(1, stats.currentImportanceSum / stats.nextTriggerAt);

    // Background bar
    const bgBar = new Graphics();
    bgBar.beginFill(0x1a1a1a);
    bgBar.drawRect(0, yOffset, barWidth, barHeight);
    bgBar.endFill();
    bgBar.lineStyle(1, 0x00ff00, 0.5);
    bgBar.drawRect(0, yOffset, barWidth, barHeight);
    this.contentContainer.addChild(bgBar);

    // Progress fill
    const progressBar = new Graphics();
    const fillColor = progress >= 1 ? 0x00ff00 : 0xffaa00;
    progressBar.beginFill(fillColor, 0.6);
    progressBar.drawRect(0, yOffset, barWidth * progress, barHeight);
    progressBar.endFill();
    this.contentContainer.addChild(progressBar);

    // Text overlay
    const trackerText = new Text(
      `${stats.currentImportanceSum}/${stats.nextTriggerAt}`,
      {
        fontFamily: 'Courier New, monospace',
        fontSize: 10,
        fill: 0xffffff,
      }
    );
    trackerText.x = barWidth / 2 - trackerText.width / 2;
    trackerText.y = yOffset + 5;
    this.contentContainer.addChild(trackerText);

    return yOffset + barHeight + 5;
  }

  /**
   * Render recent reflections
   */
  private renderRecentReflections(tree: ReflectionTree, yOffset: number): number {
    const sectionTitle = new Text('Recent Reflections:', {
      fontFamily: 'Courier New, monospace',
      fontSize: 11,
      fill: 0x00ff00,
      fontWeight: 'bold',
    });
    sectionTitle.y = yOffset;
    this.contentContainer.addChild(sectionTitle);
    yOffset += 18;

    // Combine all reflections and sort by timestamp
    const allReflections = [
      ...tree.firstOrderReflections,
      ...tree.secondOrderReflections,
      ...tree.higherOrderReflections,
    ].sort((a, b) => b.timestamp - a.timestamp);

    const recentReflections = allReflections.slice(0, 5);

    if (recentReflections.length === 0) {
      const noDataText = new Text('No reflections yet...', {
        fontFamily: 'Courier New, monospace',
        fontSize: 10,
        fill: 0x666666,
        wordWrap: true,
        wordWrapWidth: this.width - 40,
      });
      noDataText.y = yOffset;
      this.contentContainer.addChild(noDataText);
      return yOffset + 20;
    }

    for (const reflection of recentReflections) {
      yOffset = this.renderReflectionNode(reflection, yOffset);
      yOffset += 10; // Spacing between reflections
    }

    return yOffset;
  }

  /**
   * Render a single reflection node
   */
  private renderReflectionNode(node: ReflectionNode, yOffset: number): number {
    const maxWidth = this.width - 40;

    // Level indicator and category
    const levelColor = this.getLevelColor(node.level);
    const categoryColor = this.getCategoryColor(node.category);

    const levelIndicator = new Graphics();
    levelIndicator.beginFill(levelColor);
    levelIndicator.drawCircle(5, yOffset + 6, 4);
    levelIndicator.endFill();
    this.contentContainer.addChild(levelIndicator);

    const headerText = new Text(
      `[L${node.level}] ${node.category.toUpperCase()}`,
      {
        fontFamily: 'Courier New, monospace',
        fontSize: 9,
        fill: categoryColor,
        fontWeight: 'bold',
      }
    );
    headerText.x = 15;
    headerText.y = yOffset;
    this.contentContainer.addChild(headerText);

    yOffset += 14;

    // Reflection content
    const contentText = new Text(node.content, {
      fontFamily: 'Courier New, monospace',
      fontSize: 9,
      fill: 0xcccccc,
      wordWrap: true,
      wordWrapWidth: maxWidth,
    });
    contentText.x = 15;
    contentText.y = yOffset;
    this.contentContainer.addChild(contentText);

    yOffset += contentText.height + 5;

    // Question (if available)
    if (node.question) {
      const questionText = new Text(`Q: "${node.question}"`, {
        fontFamily: 'Courier New, monospace',
        fontSize: 8,
        fill: 0x888888,
        fontStyle: 'italic',
        wordWrap: true,
        wordWrapWidth: maxWidth,
      });
      questionText.x = 15;
      questionText.y = yOffset;
      this.contentContainer.addChild(questionText);
      yOffset += questionText.height + 3;
    }

    // Importance and confidence
    const metaText = new Text(
      `Importance: ${node.importance} | Confidence: ${(node.confidence * 100).toFixed(0)}%`,
      {
        fontFamily: 'Courier New, monospace',
        fontSize: 8,
        fill: 0x666666,
      }
    );
    metaText.x = 15;
    metaText.y = yOffset;
    this.contentContainer.addChild(metaText);

    yOffset += 15;

    // Separator line
    const separator = new Graphics();
    separator.lineStyle(1, 0x333333, 0.5);
    separator.moveTo(0, yOffset);
    separator.lineTo(maxWidth, yOffset);
    this.contentContainer.addChild(separator);

    return yOffset + 5;
  }

  /**
   * Render statistics
   */
  private renderStatistics(stats: ReflectionStatistics): void {
    const lines = [
      `Total: ${stats.totalReflections} | Questions: ${stats.questionsGenerated}/${stats.questionsAnswered}`,
      `Tree Depth: ${this.reflectionSystem?.getReflectionTree().maxDepth || 0} | Nodes: ${this.reflectionSystem?.getReflectionTree().totalNodes || 0}`,
      `Triggers: Importance=${stats.importanceSumTriggers} Time=${stats.timeTriggers}`,
    ];

    let yOffset = 0;
    for (const line of lines) {
      const text = new Text(line, {
        fontFamily: 'Courier New, monospace',
        fontSize: 9,
        fill: 0x00ff00,
      });
      text.y = yOffset;
      this.statsContainer.addChild(text);
      yOffset += 14;
    }
  }

  /**
   * Show "no data" message
   */
  private showNoDataMessage(): void {
    const message = new Text('Reflection system not initialized...', {
      fontFamily: 'Courier New, monospace',
      fontSize: 10,
      fill: 0x666666,
    });
    message.x = 0;
    message.y = 0;
    this.contentContainer.addChild(message);
  }

  /**
   * Get color for reflection level
   */
  private getLevelColor(level: number): number {
    const colors = [
      0x888888, // Level 0: observations (gray)
      0x00aaff, // Level 1: first-order reflections (blue)
      0xff00ff, // Level 2: meta-reflections (magenta)
      0xffaa00, // Level 3+: higher-order (orange)
    ];
    return colors[Math.min(level, colors.length - 1)];
  }

  /**
   * Get color for reflection category
   */
  private getCategoryColor(category: string): number {
    const colors: Record<string, number> = {
      strategy: 0x00ff00,   // Green
      pattern: 0x00aaff,    // Blue
      emotional: 0xff00aa,  // Pink
      learning: 0xffaa00,   // Orange
      social: 0xaa00ff,     // Purple
      meta: 0xff00ff,       // Magenta
    };
    return colors[category] || 0xcccccc;
  }

  /**
   * Toggle visibility
   */
  toggle(): void {
    this.container.visible = !this.container.visible;
  }

  /**
   * Check if visible
   */
  isVisible(): boolean {
    return this.container.visible;
  }

  /**
   * Set position
   */
  setPosition(x: number, y: number): void {
    this.container.x = x;
    this.container.y = y;
  }

  /**
   * Get panel dimensions
   */
  getWidth(): number {
    return this.width;
  }

  getHeight(): number {
    return this.height;
  }

  /**
   * Cleanup
   */
  destroy(): void {
    this.container.destroy({ children: true });
  }
}
