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

    // Add visual drag handle
    if (fullConfig.showDragHandle) {
      this.createDragHandle(container, dragState, fullConfig);
    }

    // Setup drag handlers
    this.setupDragHandlers(container, dragState, fullConfig);

    // Set sortable children for z-index
    if (container.parent) {
      container.parent.sortableChildren = true;
    }
    container.zIndex = PanelDragManager.BASE_Z_INDEX;
  }

  /**
   * Create visual drag handle
   */
  private createDragHandle(container: Container, dragState: DragState, config: Required<DragConfig>): void {
    const dragHandle = new Graphics();

    // Small drag icon in top-right corner (6 dots in 2x3 grid)
    const iconSize = 2;
    const iconSpacing = 3;
    const iconX = config.width - 18; // 18px from right edge
    const iconY = 8; // 8px from top

    // Draw 2x3 grid of dots
    for (let row = 0; row < 2; row++) {
      for (let col = 0; col < 3; col++) {
        dragHandle.beginFill(0x00ff00, 0.3);
        dragHandle.drawCircle(
          iconX + col * iconSpacing,
          iconY + row * iconSpacing,
          iconSize
        );
        dragHandle.endFill();
      }
    }

    dragHandle.interactive = false;
    dragHandle.y = 0;
    container.addChildAt(dragHandle, container.children.length); // Add on top

    dragState.dragHandle = dragHandle;
  }

  /**
   * Setup drag event handlers - Professional implementation
   */
  private setupDragHandlers(container: Container, dragState: DragState, config: Required<DragConfig>): void {
    // Create invisible draggable background layer
    const dragBackground = new Graphics();
    dragBackground.beginFill(0x000000, 0.01); // Nearly invisible
    dragBackground.drawRect(0, 0, config.width, config.height);
    dragBackground.endFill();
    dragBackground.interactive = true;
    dragBackground.cursor = 'grab';
    dragBackground.zIndex = -100; // Behind all content

    // Add as first child (background layer)
    container.addChildAt(dragBackground, 0);

    // Enable interactive children for buttons, dropdowns, etc.
    container.interactive = false; // Container itself doesn't capture events
    container.interactiveChildren = true;

    // Track if we're dragging
    let isDraggingActive = false;

    // Pointer down on drag background - start drag
    dragBackground.on('pointerdown', (event: any) => {
      const position = event.data.global;
      dragState.offsetX = position.x - container.x;
      dragState.offsetY = position.y - container.y;
      isDraggingActive = true;
      dragState.isDragging = true;

      // Change cursor
      dragBackground.cursor = 'grabbing';

      // Bring to front
      this.bringToFront(container);

      // Attach global move/up handlers for smooth dragging
      const stage = container.parent;
      if (stage) {
        stage.interactive = true;
        stage.on('pointermove', onPointerMove);
        stage.on('pointerup', onPointerUp);
        stage.on('pointerupoutside', onPointerUp);
      }

      event.stopPropagation();
    });

    // Global pointer move - smooth drag anywhere
    const onPointerMove = (event: any) => {
      if (!isDraggingActive) return;

      const position = event.data.global;
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

    // Global pointer up - end drag
    const onPointerUp = () => {
      if (!isDraggingActive) return;

      isDraggingActive = false;
      dragState.isDragging = false;
      dragBackground.cursor = 'grab';

      // Remove global handlers
      const stage = container.parent;
      if (stage) {
        stage.off('pointermove', onPointerMove);
        stage.off('pointerup', onPointerUp);
        stage.off('pointerupoutside', onPointerUp);
      }

      // Save position
      this.savePosition(container, config);
    };

    // Click on drag background to bring to front
    dragBackground.on('click', (event: any) => {
      this.bringToFront(container);
      event.stopPropagation();
    });

    // Store drag background reference for cleanup
    dragState.dragHandle = dragBackground;
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
