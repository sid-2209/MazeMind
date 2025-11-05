/**
 * Item System
 *
 * Defines consumable items (food, water, energy drinks) that agents can find
 * and consume to restore resources.
 */

import { Graphics } from 'pixi.js';

export enum ItemType {
  FOOD = 'food',
  WATER = 'water',
  ENERGY_DRINK = 'energy'
}

export interface Item {
  id: string;
  type: ItemType;
  position: { x: number; y: number };       // World position (pixels)
  tilePosition: { x: number; y: number };   // Grid position (tiles)

  // Restoration values (0-50 range)
  hungerRestore: number;
  thirstRestore: number;
  energyRestore: number;

  // Visual
  sprite?: Graphics;
  consumed: boolean;

  // Metadata
  spawnTime: number;      // When item was spawned
  expiryTime?: number;    // Optional: when item expires (future feature)
}

/**
 * Predefined item templates with restoration values
 */
export const ITEM_TEMPLATES: Record<ItemType, Omit<Item, 'id' | 'position' | 'tilePosition' | 'spawnTime'>> = {
  [ItemType.FOOD]: {
    type: ItemType.FOOD,
    hungerRestore: 30,
    thirstRestore: 0,
    energyRestore: 5,
    consumed: false
  },
  [ItemType.WATER]: {
    type: ItemType.WATER,
    hungerRestore: 0,
    thirstRestore: 40,
    energyRestore: 0,
    consumed: false
  },
  [ItemType.ENERGY_DRINK]: {
    type: ItemType.ENERGY_DRINK,
    hungerRestore: 0,
    thirstRestore: 10,
    energyRestore: 35,
    consumed: false
  }
};

/**
 * Item colors for rendering
 */
export const ITEM_COLORS: Record<ItemType, number> = {
  [ItemType.FOOD]: 0xff6b6b,      // Red
  [ItemType.WATER]: 0x4dabf7,     // Blue
  [ItemType.ENERGY_DRINK]: 0xffd43b  // Yellow
};

/**
 * Get human-readable name for item type
 */
export function getItemName(type: ItemType): string {
  switch (type) {
    case ItemType.FOOD:
      return 'food pellet';
    case ItemType.WATER:
      return 'water source';
    case ItemType.ENERGY_DRINK:
      return 'energy drink';
  }
}

/**
 * Get item description for memory events
 */
export function getItemDescription(item: Item, agentName: string, urgency: 'desperately' | 'gratefully' | 'casually' = 'gratefully'): string {
  const itemName = getItemName(item.type);
  return `${agentName} ${urgency} consumed a ${itemName}`;
}
