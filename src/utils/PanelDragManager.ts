// src/utils/PanelDragManager.ts
/**
 * PanelDragManager - Utility to add drag functionality to existing panels
 *
 * Features:
 * - Add draggable behavior to any PixiJS Container
 * - Position persistence via localStorage
 * - Z-index management
 * - Snap to screen edges
 * - Visual drag indicators
 *
 * Usage:
 *   const dragManager = new PanelDragManager();
 *   dragManager.makeDraggable(panelContainer, {
 *     id: 'debug-panel',
 *     width: 300,
 *     height: 340
 *   });
 */

import { Container, Graphics } from 'pixi.js';

export interface DragConfig {
  id: string;                    // Unique ID for localStorage
  width: number;                 // Panel width
  height: number;                // Panel height
  snapThreshold?: number;        // Distance from edge to snap (default: 20)
  persistPosition?: boolean;     // Save position to localStorage (default: true)
  showDragHandle?: boolean;      // Show visual drag indicator (default: true)
}

interface DragState {
  isDragging: boolean;
  startX: number;
  startY: number;
  offsetX: number;
  offsetY: number;
  dragHandle: Graphics | null;
}

export class PanelDragManager {
  private static currentMaxZIndex: number = 1000;
  private static readonly BASE_Z_INDEX = 1000;

  private dragStates: Map<Container, DragState> = new Map();
  private screenWidth: number = window.innerWidth;
  private screenHeight: number = window.innerHeight;

  /**
   * Make a container draggable
   */
  makeDraggable(container: Container, config: DragConfig): void {
    const fullConfig: Required<DragConfig> = {
      snapThreshold: 20,
      persistPosition: true,
      showDragHandle: true,
      ...config
    };

    // Initialize drag state
    const dragState: DragState = {
      isDragging: false,
      startX: 0,
      startY: 0,
      offsetX: 0,
      offsetY: 0,
      dragHandle: null
    };

    this.dragStates.set(container, dragState);

    // Load saved position
    this.loadPosition(container, fullConfig);

    // Add visual drag handle (creates title bar and stores in dragState.dragHandle)
    if (fullConfig.showDragHandle) {
      this.createDragHandle(container, dragState, fullConfig);
      // Setup drag handlers after title bar is created
      this.setupDragHandlers(container, dragState, fullConfig);
    }

    // Set sortable children for z-index
    if (container.parent) {
      container.parent.sortableChildren = true;
    }
    container.zIndex = PanelDragManager.BASE_Z_INDEX;
  }

  /**
   * Create visible title bar drag handle
   */
  private createDragHandle(container: Container, dragState: DragState, config: Required<DragConfig>): void {
    const titleBar = new Graphics();

    // Create visible title bar background (32px height)
    titleBar.beginFill(0x1a1a1a, 0.8);
    titleBar.drawRoundedRect(0, 0, config.width, 32, 8);
    titleBar.endFill();

    // Make title bar interactive for dragging
    titleBar.eventMode = 'static' as any;
    titleBar.cursor = 'grab';
    titleBar.hitArea = {
      contains: (x: number, y: number) => x >= 0 && x <= config.width && y >= 0 && y <= 32
    } as any;

    // Add panel name text
    const panelName = config.id.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
    const titleText = new (window as any).PIXI.Text(panelName, {
      fontFamily: 'Courier New, monospace',
      fontSize: 12,
      fill: 0x00ff00,
      fontWeight: 'bold'
    });
    titleText.x = 10;
    titleText.y = 10;
    titleBar.addChild(titleText);

    // Add drag indicator dots (6 dots in 2x3 grid, top-right)
    const dotSize = 1.5;
    const dotSpacing = 3;
    const dotsStartX = config.width - 20;
    const dotsStartY = 12;

    for (let row = 0; row < 2; row++) {
      for (let col = 0; col < 3; col++) {
        titleBar.beginFill(0x00ff00, 0.4);
        titleBar.drawCircle(
          dotsStartX + col * dotSpacing,
          dotsStartY + row * dotSpacing,
          dotSize
        );
        titleBar.endFill();
      }
    }

    // Add title bar as first child (on top visually but behind in z-order)
    container.addChildAt(titleBar, 0);

    // Store reference for cleanup
    dragState.dragHandle = titleBar;
  }

  /**
   * Setup drag event handlers with global event tracking
   */
  private setupDragHandlers(container: Container, dragState: DragState, config: Required<DragConfig>): void {
    // Get the title bar (created in createDragHandle)
    const titleBar = dragState.dragHandle;
    if (!titleBar) return;

    // Enable interactive children for panel content
    (container as any).eventMode = 'passive'; // Container doesn't capture events directly
    container.interactiveChildren = true;

    // Get reference to stage for global event handling
    const getStage = () => {
      let current = container.parent;
      while (current && current.parent) {
        current = current.parent;
      }
      return current;
    };

    // Event handlers (defined here to maintain closure over dragState)
    const onDragMove = (event: any) => {
      if (!dragState.isDragging) return;

      const position = event.global;
      let newX = position.x - dragState.offsetX;
      let newY = position.y - dragState.offsetY;

      // Constrain to screen bounds
      newX = Math.max(0, Math.min(this.screenWidth - config.width, newX));
      newY = Math.max(0, Math.min(this.screenHeight - config.height, newY));

      // Apply snap to edges
      const threshold = config.snapThreshold;

      if (newX < threshold) newX = 0;
      if (newX > this.screenWidth - config.width - threshold) {
        newX = this.screenWidth - config.width;
      }
      if (newY < threshold) newY = 0;
      if (newY > this.screenHeight - config.height - threshold) {
        newY = this.screenHeight - config.height;
      }

      container.x = newX;
      container.y = newY;
    };

    const onDragEnd = () => {
      if (!dragState.isDragging) return;

      dragState.isDragging = false;
      titleBar.cursor = 'grab';

      // Remove global event handlers
      const stage = getStage();
      if (stage) {
        stage.off('globalpointermove', onDragMove);
        stage.off('pointerup', onDragEnd);
        stage.off('pointerupoutside', onDragEnd);
      }

      // Save position
      this.savePosition(container, config);
    };

    // Pointer down on title bar - start drag
    titleBar.on('pointerdown', (event: any) => {
      const position = event.global;
      dragState.offsetX = position.x - container.x;
      dragState.offsetY = position.y - container.y;
      dragState.isDragging = true;

      // Change cursor to grabbing
      titleBar.cursor = 'grabbing';

      // Bring panel to front
      this.bringToFront(container);

      // Attach global event handlers for smooth continuous tracking
      const stage = getStage();
      if (stage) {
        // Use globalpointermove for continuous tracking (PixiJS v8)
        stage.on('globalpointermove', onDragMove);
        stage.on('pointerup', onDragEnd);
        stage.on('pointerupoutside', onDragEnd);
      }

      event.stopPropagation();
    });

    // Click on title bar to bring to front (without dragging)
    titleBar.on('click', (event: any) => {
      if (!dragState.isDragging) {
        this.bringToFront(container);
      }
      event.stopPropagation();
    });
  }

  /**
   * Bring container to front
   */
  private bringToFront(container: Container): void {
    PanelDragManager.currentMaxZIndex++;
    container.zIndex = PanelDragManager.currentMaxZIndex;
  }

  /**
   * Load position from localStorage
   */
  private loadPosition(container: Container, config: Required<DragConfig>): void {
    if (!config.persistPosition) return;

    const key = `panel_position_${config.id}`;
    const saved = localStorage.getItem(key);

    if (saved) {
      try {
        const { x, y } = JSON.parse(saved);
        container.x = Math.max(0, Math.min(this.screenWidth - config.width, x));
        container.y = Math.max(0, Math.min(this.screenHeight - config.height, y));
      } catch (e) {
        // Invalid data, keep current position
      }
    }
  }

  /**
   * Save position to localStorage
   */
  private savePosition(container: Container, config: Required<DragConfig>): void {
    if (!config.persistPosition) return;

    const key = `panel_position_${config.id}`;
    const data = {
      x: container.x,
      y: container.y
    };

    localStorage.setItem(key, JSON.stringify(data));
  }

  /**
   * Update screen dimensions (call on resize)
   */
  updateScreenDimensions(width: number, height: number): void {
    this.screenWidth = width;
    this.screenHeight = height;

    // Constrain all managed containers
    for (const [container, _state] of this.dragStates) {
      const config = this.getConfigFromLocalStorage(container);
      if (config) {
        container.x = Math.max(0, Math.min(width - config.width, container.x));
        container.y = Math.max(0, Math.min(height - config.height, container.y));
      }
    }
  }

  /**
   * Get config from localStorage (helper)
   */
  private getConfigFromLocalStorage(_container: Container): { width: number; height: number } | null {
    // This is a simplified version - in practice, you'd store config alongside state
    return null;
  }

  /**
   * Reset position to saved or center
   */
  resetPosition(container: Container, config: DragConfig): void {
    const key = `panel_position_${config.id}`;
    localStorage.removeItem(key);

    // Center on screen
    container.x = (this.screenWidth - config.width) / 2;
    container.y = (this.screenHeight - config.height) / 2;
  }

  /**
   * Remove drag functionality
   */
  removeDraggable(container: Container): void {
    const dragState = this.dragStates.get(container);
    if (!dragState) return;

    // Clean up graphics
    if (dragState.dragHandle) {
      dragState.dragHandle.destroy();
    }

    // Remove event listeners
    container.off('pointerdown');
    container.off('pointermove');
    container.off('pointerup');
    container.off('pointerupoutside');
    container.off('click');

    this.dragStates.delete(container);
  }

  /**
   * Cleanup all managed containers
   */
  destroy(): void {
    for (const [container, _state] of this.dragStates) {
      this.removeDraggable(container);
    }
    this.dragStates.clear();
  }
}
