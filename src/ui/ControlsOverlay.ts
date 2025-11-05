// src/ui/ControlsOverlay.ts
/**
 * ControlsOverlay - Keyboard shortcuts reference (Day 9)
 *
 * Displays:
 * - Comprehensive keyboard shortcuts
 * - Organized by category (Movement, Time, View, Debug)
 * - Toggle with 'H' key for help
 * - Fade-in/fade-out animations
 */

import { Graphics, Text, Container, TextStyle } from 'pixi.js';

interface ControlCategory {
  title: string;
  controls: { key: string; description: string }[];
}

export class ControlsOverlay {
  private container: Container;

  // Graphics elements
  private panelBg!: Graphics;
  private titleText!: Text;
  private categoryTexts: Text[] = [];

  // Configuration
  private padding = 20;
  private panelWidth = 400;
  private panelHeight = 620;  // Increased to 620px to ensure all categories and controls are fully visible

  // Visible state
  private visible = false;
  private targetAlpha = 0;
  private currentAlpha = 0;
  private fadeSpeed = 5; // Speed of fade animation

  // Control categories
  private categories: ControlCategory[] = [
    {
      title: 'MOVEMENT',
      controls: [
        { key: '↑', description: 'Move North' },
        { key: '←', description: 'Move West' },
        { key: '↓', description: 'Move South' },
        { key: '→', description: 'Move East' },
      ],
    },
    {
      title: 'CAMERA',
      controls: [
        { key: 'Mouse Wheel', description: 'Zoom in/out' },
        { key: 'Home', description: 'Reset camera' },
      ],
    },
    {
      title: 'TIME CONTROL',
      controls: [
        { key: 'T', description: 'Skip to next period' },
        { key: '[', description: 'Slow down time' },
        { key: ']', description: 'Speed up time' },
        { key: 'Space', description: 'Pause/Resume' },
      ],
    },
    {
      title: 'VIEW MODES',
      controls: [
        { key: 'V', description: 'Next view mode' },
        { key: 'B', description: 'Previous view mode' },
      ],
    },
    {
      title: 'AGENT & MULTI-AGENT',
      controls: [
        { key: 'A', description: 'Toggle Autonomous mode' },
        { key: 'Z', description: 'Toggle Multi-Agent panel' },
        { key: 'L', description: 'Cycle LLM provider' },
      ],
    },
    {
      title: 'UI PANELS',
      controls: [
        { key: 'I', description: 'Toggle debug panel' },
        { key: 'S', description: 'Toggle survival panel' },
        { key: 'P', description: 'Toggle planning panel' },
        { key: 'C', description: 'Toggle current run panel' },
        { key: 'D', description: 'Toggle dialogue panel' },
        { key: 'E', description: 'Toggle embedding metrics' },
        { key: 'M', description: 'Toggle memory viz' },
        { key: 'H', description: 'Toggle this help' },
      ],
    },
    {
      title: 'MAZE',
      controls: [
        { key: 'R', description: 'Regenerate maze' },
      ],
    },
  ];

  constructor(container: Container) {
    this.container = new Container();
    this.container.alpha = 0; // Start invisible

    container.addChild(this.container);
  }

  /**
   * Initialize controls overlay
   */
  async init(): Promise<void> {
    console.log('🎮 Initializing controls overlay...');

    // Create panel background
    this.createPanelBackground();

    // Create title
    this.createTitle();

    // Create control listings
    this.createControlListings();

    console.log('✅ Controls overlay initialized (hidden by default)');
  }

  /**
   * Create panel background
   */
  private createPanelBackground(): void {
    this.panelBg = new Graphics();

    // Semi-transparent dark background
    this.panelBg.beginFill(0x000000, 0.9);
    this.panelBg.drawRoundedRect(0, 0, this.panelWidth, this.panelHeight, 12);
    this.panelBg.endFill();

    // Border
    this.panelBg.lineStyle(2, 0x888888, 0.8);
    this.panelBg.drawRoundedRect(0, 0, this.panelWidth, this.panelHeight, 12);

    this.container.addChild(this.panelBg);
  }

  /**
   * Create title text
   */
  private createTitle(): void {
    const titleStyle = new TextStyle({
      fontFamily: 'monospace',
      fontSize: 20,
      fontWeight: 'bold',
      fill: 0xffffff,
      align: 'center',
    });

    this.titleText = new Text('KEYBOARD CONTROLS', titleStyle);
    this.titleText.x = this.panelWidth / 2;
    this.titleText.y = this.padding;
    this.titleText.anchor.set(0.5, 0);

    this.container.addChild(this.titleText);
  }

  /**
   * Create control listings
   */
  private createControlListings(): void {
    let yOffset = this.padding + 40;

    for (const category of this.categories) {
      // Category title
      const categoryTitleStyle = new TextStyle({
        fontFamily: 'monospace',
        fontSize: 14,
        fontWeight: 'bold',
        fill: 0xffaa00,
        align: 'left',
      });

      const categoryTitle = new Text(category.title, categoryTitleStyle);
      categoryTitle.x = this.padding;
      categoryTitle.y = yOffset;

      this.container.addChild(categoryTitle);
      this.categoryTexts.push(categoryTitle);

      yOffset += 25;

      // Controls in this category
      for (const control of category.controls) {
        const controlContainer = this.createControlLine(control.key, control.description);
        controlContainer.y = yOffset;

        this.container.addChild(controlContainer);

        yOffset += 22;
      }

      yOffset += 10; // Extra spacing between categories
    }

    // Footer hint
    const footerStyle = new TextStyle({
      fontFamily: 'monospace',
      fontSize: 11,
      fill: 0x888888,
      align: 'center',
      fontStyle: 'italic',
    });

    const footer = new Text('Press H to close', footerStyle);
    footer.x = this.panelWidth / 2;
    footer.y = this.panelHeight - this.padding - 10;
    footer.anchor.set(0.5, 0);

    this.container.addChild(footer);
  }

  /**
   * Create a single control line
   */
  private createControlLine(key: string, description: string): Container {
    const lineContainer = new Container();

    // Key box
    const keyBox = new Graphics();
    keyBox.lineStyle(1, 0x666666, 1.0);
    keyBox.beginFill(0x222222, 0.8);
    keyBox.drawRoundedRect(0, 0, 100, 18, 4);
    keyBox.endFill();

    // Key text
    const keyStyle = new TextStyle({
      fontFamily: 'monospace',
      fontSize: 11,
      fontWeight: 'bold',
      fill: 0xffffff,
      align: 'center',
    });

    const keyText = new Text(key, keyStyle);
    keyText.x = 50;
    keyText.y = 9;
    keyText.anchor.set(0.5, 0.5);

    // Description text
    const descStyle = new TextStyle({
      fontFamily: 'monospace',
      fontSize: 11,
      fill: 0xcccccc,
      align: 'left',
    });

    const descText = new Text(description, descStyle);
    descText.x = 110;
    descText.y = 9;
    descText.anchor.set(0, 0.5);

    lineContainer.addChild(keyBox);
    lineContainer.addChild(keyText);
    lineContainer.addChild(descText);

    lineContainer.x = this.padding;

    return lineContainer;
  }

  /**
   * Update controls overlay (handle fade animation)
   */
  update(deltaTime: number): void {
    // Smooth fade animation
    if (this.currentAlpha !== this.targetAlpha) {
      const delta = this.fadeSpeed * deltaTime;

      if (this.currentAlpha < this.targetAlpha) {
        this.currentAlpha = Math.min(this.targetAlpha, this.currentAlpha + delta);
      } else {
        this.currentAlpha = Math.max(this.targetAlpha, this.currentAlpha - delta);
      }

      this.container.alpha = this.currentAlpha;
    }
  }

  /**
   * Toggle visibility
   */
  toggle(): void {
    this.visible = !this.visible;

    if (this.visible) {
      this.show();
    } else {
      this.hide();
    }

    console.log(`🎮 Controls overlay: ${this.visible ? 'Visible' : 'Hidden'}`);
  }

  /**
   * Show overlay
   */
  show(): void {
    this.visible = true;
    this.targetAlpha = 1;
    this.container.visible = true;
  }

  /**
   * Hide overlay
   */
  hide(): void {
    this.visible = false;
    this.targetAlpha = 0;
    // Container visibility will be handled by alpha reaching 0
  }

  /**
   * Set panel position (centered on screen)
   */
  setPosition(screenWidth: number, screenHeight: number): void {
    this.container.x = (screenWidth - this.panelWidth) / 2;
    this.container.y = (screenHeight - this.panelHeight) / 2;
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
   * Check if panel is visible
   */
  isVisible(): boolean {
    return this.visible;
  }

  /**
   * Cleanup
   */
  destroy(): void {
    this.container.destroy({ children: true });
    this.categoryTexts = [];
  }
}
