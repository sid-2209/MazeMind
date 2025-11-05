/**
 * Item Renderer
 *
 * Renders consumable items (food, water, energy drinks) in the maze.
 * Uses pulsing circles with distinct colors for each item type.
 */

import { Container, Graphics } from 'pixi.js';
import { Item, ITEM_COLORS } from '../entities/Item';

export class ItemRenderer {
  private container: Container;
  private itemGraphics: Map<string, Graphics> = new Map();

  constructor(container: Container, _tileSize: number = 32) {
    this.container = container;

    console.log('🎨 ItemRenderer created');
  }

  /**
   * Initialize the renderer
   */
  async init(): Promise<void> {
    console.log('🎨 ItemRenderer initialized');
  }

  /**
   * Render all items
   * @param items - Array of items to render
   */
  render(items: Item[]): void {
    // Remove graphics for consumed items
    for (const [itemId, graphic] of this.itemGraphics.entries()) {
      const item = items.find(i => i.id === itemId);
      if (!item || item.consumed) {
        this.container.removeChild(graphic);
        this.itemGraphics.delete(itemId);
      }
    }

    // Render unconsumed items
    for (const item of items) {
      if (item.consumed) continue;

      let graphic = this.itemGraphics.get(item.id);

      if (!graphic) {
        // Create new graphic for this item
        graphic = this.createItemGraphic(item);
        this.container.addChild(graphic);
        this.itemGraphics.set(item.id, graphic);

        // Store reference in item
        item.sprite = graphic;
      }

      // Update position and animation
      this.updateItemGraphic(graphic, item);
    }
  }

  /**
   * Create graphic for an item
   */
  private createItemGraphic(item: Item): Graphics {
    const graphic = new Graphics();
    const color = ITEM_COLORS[item.type];
    const radius = 8;

    // Draw circle
    graphic.beginFill(color, 1.0);
    graphic.drawCircle(0, 0, radius);
    graphic.endFill();

    // Add white border for visibility
    graphic.lineStyle(2, 0xffffff, 0.6);
    graphic.drawCircle(0, 0, radius);

    // Position at item location
    graphic.x = item.position.x;
    graphic.y = item.position.y;

    return graphic;
  }

  /**
   * Update item graphic (position and pulsing animation)
   */
  private updateItemGraphic(graphic: Graphics, item: Item): void {
    // Update position
    graphic.x = item.position.x;
    graphic.y = item.position.y;

    // Pulsing animation
    const time = Date.now() / 500; // Oscillate every 500ms
    const pulse = Math.sin(time) * 0.15 + 1; // Scale between 0.85 and 1.15
    graphic.scale.set(pulse);

    // Slight rotation for visual interest
    graphic.rotation = Math.sin(time * 0.5) * 0.1; // Rotate +/- 0.1 radians
  }

  /**
   * Update animation for all items (called each frame)
   */
  update(_deltaTime: number): void {
    // Animation is handled in updateItemGraphic which is called during render
    // This method exists for consistency with other renderers
  }

  /**
   * Clear all rendered items
   */
  clear(): void {
    for (const graphic of this.itemGraphics.values()) {
      this.container.removeChild(graphic);
    }
    this.itemGraphics.clear();
  }

  /**
   * Get number of rendered items
   */
  getRenderedCount(): number {
    return this.itemGraphics.size;
  }

  /**
   * Highlight specific item (for debugging or UI feedback)
   */
  highlightItem(itemId: string, highlight: boolean = true): void {
    const graphic = this.itemGraphics.get(itemId);
    if (graphic) {
      if (highlight) {
        graphic.alpha = 1.0;
        graphic.scale.set(1.5);
      } else {
        graphic.alpha = 1.0;
        graphic.scale.set(1.0);
      }
    }
  }

  /**
   * Get container for external manipulation
   */
  getContainer(): Container {
    return this.container;
  }

  /**
   * Cleanup
   */
  destroy(): void {
    this.clear();
    console.log('🎨 ItemRenderer destroyed');
  }
}
