/**
 * Item Generator
 *
 * Generates and places consumable items strategically throughout the maze.
 * Ensures minimum spacing between items and valid placement locations.
 */

import { Maze, TileType } from '@/types';
import { Item, ItemType, ITEM_TEMPLATES } from '../entities/Item';

export interface ItemSpawnConfig {
  foodCount: number;      // Number of food items to spawn
  waterCount: number;     // Number of water sources to spawn
  energyCount: number;    // Number of energy drinks to spawn
  minDistance: number;    // Minimum tiles between items
}

const DEFAULT_SPAWN_CONFIG: ItemSpawnConfig = {
  foodCount: 8,
  waterCount: 10,
  energyCount: 5,
  minDistance: 3
};

export class ItemGenerator {
  private items: Map<string, Item> = new Map();
  private maze: Maze;
  private nextItemId = 0;
  private spawnConfig: ItemSpawnConfig;
  private tileSize: number;

  constructor(maze: Maze, tileSize: number = 32, config: Partial<ItemSpawnConfig> = {}) {
    this.maze = maze;
    this.tileSize = tileSize;
    this.spawnConfig = { ...DEFAULT_SPAWN_CONFIG, ...config };
  }

  /**
   * Generate all items in the maze
   * Clears existing items and creates new distribution
   */
  generateItems(): void {
    console.log('🍎 Generating survival items...');

    // Clear existing items
    this.items.clear();
    this.nextItemId = 0;

    // Get valid spawn locations (walkable tiles, not near start)
    const validTiles = this.getValidSpawnTiles();

    if (validTiles.length === 0) {
      console.error('❌ No valid spawn locations found!');
      return;
    }

    // Spawn items with minimum spacing
    this.spawnItems(ItemType.FOOD, this.spawnConfig.foodCount, validTiles);
    this.spawnItems(ItemType.WATER, this.spawnConfig.waterCount, validTiles);
    this.spawnItems(ItemType.ENERGY_DRINK, this.spawnConfig.energyCount, validTiles);

    console.log(`✅ Generated ${this.items.size} items (${this.spawnConfig.foodCount} food, ${this.spawnConfig.waterCount} water, ${this.spawnConfig.energyCount} energy)`);
  }

  /**
   * Spawn items of a specific type
   * @param type - Item type to spawn
   * @param count - Number of items to spawn
   * @param validTiles - Array of available spawn locations (modified in place)
   */
  private spawnItems(type: ItemType, count: number, validTiles: { x: number; y: number }[]): void {
    const template = ITEM_TEMPLATES[type];

    for (let i = 0; i < count; i++) {
      // Check if we have valid tiles left
      if (validTiles.length === 0) {
        console.warn(`⚠️ No valid tiles left for ${type} (spawned ${i}/${count})`);
        break;
      }

      // Pick random valid tile
      const index = Math.floor(Math.random() * validTiles.length);
      const tile = validTiles.splice(index, 1)[0];

      // Create item
      const item: Item = {
        ...template,
        id: `item_${this.nextItemId++}`,
        type,
        position: {
          x: tile.x * this.tileSize + this.tileSize / 2,
          y: tile.y * this.tileSize + this.tileSize / 2
        },
        tilePosition: tile,
        spawnTime: Date.now()
      };

      this.items.set(item.id, item);

      // Remove nearby tiles to enforce minimum distance
      this.removeNearbyTiles(validTiles, tile, this.spawnConfig.minDistance);
    }
  }

  /**
   * Get all valid spawn tiles (walkable, not start/end, reasonable distance from entrance)
   */
  private getValidSpawnTiles(): { x: number; y: number }[] {
    const tiles: { x: number; y: number }[] = [];
    const entrance = this.maze.entrance;
    const exit = this.maze.exit;

    for (let y = 0; y < this.maze.height; y++) {
      for (let x = 0; x < this.maze.width; x++) {
        const tile = this.maze.tiles[y][x];

        // Skip walls
        if (tile.type === TileType.WALL) continue;

        // Skip entrance and exit
        if ((x === entrance.x && y === entrance.y) || (x === exit.x && y === exit.y)) continue;

        // Skip tiles too close to entrance (let agent start without immediate items)
        const distToEntrance = Math.abs(x - entrance.x) + Math.abs(y - entrance.y);
        if (distToEntrance < 3) continue;

        tiles.push({ x, y });
      }
    }

    return tiles;
  }

  /**
   * Remove tiles within minimum distance of a center point
   * @param tiles - Array of tiles (modified in place)
   * @param center - Center position
   * @param minDistance - Minimum Manhattan distance
   */
  private removeNearbyTiles(
    tiles: { x: number; y: number }[],
    center: { x: number; y: number },
    minDistance: number
  ): void {
    for (let i = tiles.length - 1; i >= 0; i--) {
      const tile = tiles[i];
      const distance = Math.abs(tile.x - center.x) + Math.abs(tile.y - center.y);

      if (distance < minDistance) {
        tiles.splice(i, 1);
      }
    }
  }

  /**
   * Get item at specific tile position
   * @param x - Tile X coordinate
   * @param y - Tile Y coordinate
   * @returns Item at position or null
   */
  getItemAtTile(x: number, y: number): Item | null {
    for (const item of this.items.values()) {
      if (!item.consumed && item.tilePosition.x === x && item.tilePosition.y === y) {
        return item;
      }
    }
    return null;
  }

  /**
   * Consume item by ID
   * @param itemId - Item ID to consume
   * @returns Consumed item or null if not found/already consumed
   */
  consumeItem(itemId: string): Item | null {
    const item = this.items.get(itemId);
    if (item && !item.consumed) {
      item.consumed = true;
      console.log(`🍴 Consumed ${item.type}: +${item.hungerRestore} hunger, +${item.thirstRestore} thirst, +${item.energyRestore} energy`);
      return item;
    }
    return null;
  }

  /**
   * Get all items (consumed and unconsumed)
   */
  getAllItems(): Item[] {
    return Array.from(this.items.values());
  }

  /**
   * Get only unconsumed items
   */
  getAvailableItems(): Item[] {
    return Array.from(this.items.values()).filter(item => !item.consumed);
  }

  /**
   * Get items of specific type
   */
  getItemsByType(type: ItemType): Item[] {
    return Array.from(this.items.values()).filter(item => item.type === type && !item.consumed);
  }

  /**
   * Find nearest item of specific type from a position
   * @param position - Starting position (tile coordinates)
   * @param type - Item type to search for (optional, null = any type)
   * @returns Nearest item or null
   */
  findNearestItem(position: { x: number; y: number }, type?: ItemType): Item | null {
    let nearestItem: Item | null = null;
    let minDistance = Infinity;

    for (const item of this.items.values()) {
      if (item.consumed) continue;
      if (type && item.type !== type) continue;

      const distance = Math.abs(item.tilePosition.x - position.x) +
                      Math.abs(item.tilePosition.y - position.y);

      if (distance < minDistance) {
        minDistance = distance;
        nearestItem = item;
      }
    }

    return nearestItem;
  }

  /**
   * Get count of unconsumed items
   */
  getAvailableItemCount(): number {
    return this.getAvailableItems().length;
  }

  /**
   * Get count of consumed items
   */
  getConsumedItemCount(): number {
    return Array.from(this.items.values()).filter(item => item.consumed).length;
  }

  /**
   * Reset all items (unconsumed all items)
   */
  reset(): void {
    for (const item of this.items.values()) {
      item.consumed = false;
    }
  }

  /**
   * Update spawn configuration
   */
  setSpawnConfig(config: Partial<ItemSpawnConfig>): void {
    this.spawnConfig = { ...this.spawnConfig, ...config };
  }
}
