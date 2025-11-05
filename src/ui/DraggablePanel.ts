// src/ui/DraggablePanel.ts
/**
 * DraggablePanel - Base class for draggable UI panels
 *
 * Features:
 * - Click and drag to reposition
 * - Snap to screen edges
 * - Position persistence (localStorage)
 * - Z-index management (click to bring to front)
 * - Visual drag indicators
 */

import { Container, Graphics } from 'pixi.js';

export interface DraggablePanelConfig {
  id: string;                    // Unique ID for localStorage
  defaultX: number;              // Default X position
  defaultY: number;              // Default Y position
  width: number;                 // Panel width
  height: number;                // Panel height
  snapThreshold?: number;        // Distance from edge to snap (default: 20)
  persistPosition?: boolean;     // Save position to localStorage (default: true)
}

export class DraggablePanel {
  protected container: Container;
  protected config: DraggablePanelConfig;

  // Drag state
  private isDragging: boolean = false;
  private dragOffsetX: number = 0;
  private dragOffsetY: number = 0;

  // Visual elements
  private dragHandle: Graphics | null = null;
  private dragIndicator: Graphics | null = null;

  // Screen bounds
  private screenWidth: number = window.innerWidth;
  private screenHeight: number = window.innerHeight;

  // Z-index management
  private static currentMaxZIndex: number = 1000;
  private static readonly BASE_Z_INDEX = 1000;

  constructor(container: Container, config: DraggablePanelConfig) {
    this.container = container;
    this.config = {
      snapThreshold: 20,
      persistPosition: true,
      ...config
    };

    // Set interactive
    this.container.interactive = true;
    this.container.cursor = 'move';

    // Load saved position or use default
    this.loadPosition();

    // Setup drag handlers
    this.setupDragHandlers();

    // Add drag handle visual indicator
    this.createDragHandle();
  }

  /**
   * Create visual drag handle at top of panel
   */
  private createDragHandle(): void {
    this.dragHandle = new Graphics();
    this.dragHandle.beginFill(0x00ff00, 0.1);
    this.dragHandle.drawRect(0, 0, this.config.width, 30);
    this.dragHandle.endFill();

    // Draw drag indicator dots
    const dotSpacing = 8;
    const dotCount = 5;
    const startX = (this.config.width - (dotCount - 1) * dotSpacing) / 2;

    for (let i = 0; i < dotCount; i++) {
      this.dragHandle.beginFill(0x00ff00, 0.3);
      this.dragHandle.drawCircle(startX + i * dotSpacing, 15, 2);
      this.dragHandle.endFill();
    }

    this.dragHandle.interactive = false;
    this.container.addChildAt(this.dragHandle, 0);
  }

  /**
   * Create dragging visual indicator
   */
  private createDragIndicator(): void {
    this.dragIndicator = new Graphics();
    this.dragIndicator.lineStyle(2, 0x00ff00, 0.8);
    this.dragIndicator.drawRect(0, 0, this.config.width, this.config.height);
    this.dragIndicator.visible = false;
    this.container.addChild(this.dragIndicator);
  }

  /**
   * Setup drag event handlers
   */
  private setupDragHandlers(): void {
    // Pointer down - start drag
    this.container.on('pointerdown', (event: any) => {
      const position = event.data.global;
      this.dragOffsetX = position.x - this.container.x;
      this.dragOffsetY = position.y - this.container.y;
      this.isDragging = true;

      // Bring to front
      this.bringToFront();

      // Show drag indicator
      if (!this.dragIndicator) {
        this.createDragIndicator();
      }
      if (this.dragIndicator) {
        this.dragIndicator.visible = true;
        this.dragIndicator.alpha = 0.5;
      }

      event.stopPropagation();
    });

    // Pointer move - drag
    this.container.on('pointermove', (event: any) => {
      if (!this.isDragging) return;

      const position = event.data.global;
      let newX = position.x - this.dragOffsetX;
      let newY = position.y - this.dragOffsetY;

      // Constrain to screen bounds
      newX = Math.max(0, Math.min(this.screenWidth - this.config.width, newX));
      newY = Math.max(0, Math.min(this.screenHeight - this.config.height, newY));

      // Apply snap to edges
      const threshold = this.config.snapThreshold || 20;

      // Snap to left edge
      if (newX < threshold) {
        newX = 0;
      }
      // Snap to right edge
      if (newX > this.screenWidth - this.config.width - threshold) {
        newX = this.screenWidth - this.config.width;
      }
      // Snap to top edge
      if (newY < threshold) {
        newY = 0;
      }
      // Snap to bottom edge
      if (newY > this.screenHeight - this.config.height - threshold) {
        newY = this.screenHeight - this.config.height;
      }

      this.container.x = newX;
      this.container.y = newY;

      event.stopPropagation();
    });

    // Pointer up - end drag
    const endDrag = (event?: any) => {
      if (!this.isDragging) return;

      this.isDragging = false;

      // Hide drag indicator
      if (this.dragIndicator) {
        this.dragIndicator.visible = false;
      }

      // Save position
      this.savePosition();

      if (event) {
        event.stopPropagation();
      }
    };

    this.container.on('pointerup', endDrag);
    this.container.on('pointerupoutside', endDrag);

    // Click to bring to front (non-drag clicks)
    this.container.on('click', (event: any) => {
      if (!this.isDragging) {
        this.bringToFront();
      }
      event.stopPropagation();
    });
  }

  /**
   * Bring panel to front (highest z-index)
   */
  private bringToFront(): void {
    DraggablePanel.currentMaxZIndex++;
    this.container.zIndex = DraggablePanel.currentMaxZIndex;
  }

  /**
   * Load position from localStorage
   */
  private loadPosition(): void {
    if (!this.config.persistPosition) {
      this.container.x = this.config.defaultX;
      this.container.y = this.config.defaultY;
      return;
    }

    const key = `panel_position_${this.config.id}`;
    const saved = localStorage.getItem(key);

    if (saved) {
      try {
        const { x, y } = JSON.parse(saved);
        this.container.x = x;
        this.container.y = y;
      } catch (e) {
        // Invalid data, use defaults
        this.container.x = this.config.defaultX;
        this.container.y = this.config.defaultY;
      }
    } else {
      this.container.x = this.config.defaultX;
      this.container.y = this.config.defaultY;
    }

    // Set initial z-index
    this.container.zIndex = DraggablePanel.BASE_Z_INDEX;
  }

  /**
   * Save position to localStorage
   */
  private savePosition(): void {
    if (!this.config.persistPosition) return;

    const key = `panel_position_${this.config.id}`;
    const data = {
      x: this.container.x,
      y: this.container.y
    };

    localStorage.setItem(key, JSON.stringify(data));
  }

  /**
   * Update screen dimensions (call on resize)
   */
  updateScreenDimensions(width: number, height: number): void {
    this.screenWidth = width;
    this.screenHeight = height;

    // Constrain current position to new bounds
    this.container.x = Math.max(0, Math.min(width - this.config.width, this.container.x));
    this.container.y = Math.max(0, Math.min(height - this.config.height, this.container.y));
  }

  /**
   * Reset position to default
   */
  resetPosition(): void {
    this.container.x = this.config.defaultX;
    this.container.y = this.config.defaultY;
    this.savePosition();
  }

  /**
   * Get current position
   */
  getPosition(): { x: number; y: number } {
    return {
      x: this.container.x,
      y: this.container.y
    };
  }

  /**
   * Set position programmatically
   */
  setPosition(x: number, y: number, save: boolean = true): void {
    this.container.x = x;
    this.container.y = y;
    if (save) {
      this.savePosition();
    }
  }

  /**
   * Cleanup
   */
  destroy(): void {
    this.container.off('pointerdown');
    this.container.off('pointermove');
    this.container.off('pointerup');
    this.container.off('pointerupoutside');
    this.container.off('click');

    if (this.dragHandle) {
      this.dragHandle.destroy();
    }
    if (this.dragIndicator) {
      this.dragIndicator.destroy();
    }
  }
}
