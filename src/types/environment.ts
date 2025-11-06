// src/types/environment.ts
/**
 * Environment Types - Hierarchical world representation (Week 9)
 *
 * Implements the environment tree structure from Park et al. (2023):
 * "The environment is represented as a tree structure: the world contains areas,
 * areas contain sub-areas, and sub-areas contain objects."
 *
 * Based on: https://arxiv.org/abs/2304.03442 (Section 5)
 */

import { Position } from './index';

// ============================================
// Location Hierarchy Types
// ============================================

export enum LocationType {
  WORLD = 'world',
  AREA = 'area',
  ROOM = 'room',
  CORRIDOR = 'corridor',
  OBJECT = 'object'
}

export interface WorldNode {
  id: string;
  type: LocationType;
  name: string;
  description: string;
  parent?: string;           // Parent node ID
  children: string[];        // Child node IDs
  position?: Position;       // Tile coordinates (for rooms/corridors)
  bounds?: {                 // Spatial bounds (for areas)
    x: number;
    y: number;
    width: number;
    height: number;
  };
  tags: string[];           // Searchable tags (e.g., 'storage', 'rest', 'cooking')
}

// ============================================
// Game Object Types
// ============================================

export enum ObjectType {
  FURNITURE = 'furniture',      // Chairs, tables, beds
  CONTAINER = 'container',      // Crates, barrels, chests
  INTERACTIVE = 'interactive',  // Stoves, sinks, doors
  DECORATIVE = 'decorative',    // Paintings, statues
  UTILITY = 'utility'           // Torches, fireplaces
}

export interface GameObject {
  id: string;
  name: string;
  description: string;
  location: string;          // Parent room/corridor ID
  position: Position;        // Tile position
  objectType: ObjectType;
  state: ObjectState;
  capabilities: ObjectCapability[];
  contains?: string[];       // Item types this object might contain (e.g., 'food', 'water')
  visualIcon?: string;       // Emoji or symbol for rendering
}

export interface ObjectState {
  occupied: boolean;        // Is someone using it?
  locked: boolean;          // Is it locked?
  lit: boolean;             // Is it lit/burning?
  open: boolean;            // Is it open (for containers/doors)?
  broken: boolean;          // Is it broken?
  dirty: boolean;           // Is it dirty/needs cleaning?
  [key: string]: boolean;   // Allow custom state properties
}

// ============================================
// Object Capabilities
// ============================================

export enum ObjectCapability {
  // Resting capabilities
  SIT_ON = 'sit_on',
  SLEEP_ON = 'sleep_on',
  SIT_AT = 'sit_at',

  // Interactive capabilities
  COOK_AT = 'cook_at',
  READ_FROM = 'read_from',
  WRITE_AT = 'write_at',
  EXAMINE = 'examine',

  // Container capabilities
  OPEN = 'open',
  CLOSE = 'close',
  SEARCH = 'search',

  // Utility capabilities
  DRINK_FROM = 'drink_from',
  WASH_AT = 'wash_at',
  LIGHT = 'light',
  EXTINGUISH = 'extinguish'
}

// ============================================
// Action System
// ============================================

export interface ActionDefinition {
  verb: string;              // Human-readable action (e.g., "sit on", "cook at")
  target: GameObject;        // The object being acted upon
  duration: number;          // Duration in seconds (game time)
  effects: ActionEffect[];   // Effects of this action
  requirements: ActionRequirement[];  // What's needed to perform this action
}

export interface ActionEffect {
  type: EffectType;
  value: number;
  target: 'self' | 'object';
  stateChange?: Partial<ObjectState>;  // State changes to object
}

export enum EffectType {
  RESTORE_ENERGY = 'restore_energy',
  RESTORE_HUNGER = 'restore_hunger',
  RESTORE_THIRST = 'restore_thirst',
  REDUCE_STRESS = 'reduce_stress',
  INCREASE_STRESS = 'increase_stress',
  CHANGE_STATE = 'change_state',
  SPAWN_ITEM = 'spawn_item'
}

export interface ActionRequirement {
  type: RequirementType;
  property?: string;         // Object state property (e.g., 'lit', 'open')
  value?: any;               // Required value
  itemType?: string;         // Required item type
}

export enum RequirementType {
  OBJECT_STATE = 'object_state',    // Object must be in certain state
  HAS_ITEM = 'has_item',            // Agent must have item
  ENERGY_LEVEL = 'energy_level',    // Agent energy requirement
  PROXIMITY = 'proximity'           // Agent must be close enough
}

// ============================================
// Location Awareness
// ============================================

export interface LocationContext {
  currentRoom: string;        // Current room ID
  currentArea: string;        // Current area ID
  nearbyObjects: GameObject[];  // Objects within 3 tiles
  availableActions: AvailableAction[];  // Actions possible here
}

export interface AvailableAction {
  actionType: ObjectCapability;
  object: GameObject;
  estimatedDuration: number;
  estimatedEffects: string[];  // Natural language descriptions
}

// ============================================
// Room Templates (for world generation)
// ============================================

export enum RoomTemplate {
  STORAGE = 'storage',
  MEDITATION = 'meditation',
  KITCHEN = 'kitchen',
  LIBRARY = 'library',
  SAFE_ROOM = 'safe_room',
  WORKSHOP = 'workshop',
  GARDEN = 'garden',
  EXIT_CHAMBER = 'exit_chamber'
}

export interface RoomDefinition {
  template: RoomTemplate;
  name: string;
  description: string;
  requiredObjects: ObjectTemplate[];
  optionalObjects: ObjectTemplate[];
  tags: string[];
}

export interface ObjectTemplate {
  name: string;
  type: ObjectType;
  capabilities: ObjectCapability[];
  contains?: string[];
  visualIcon?: string;
}

// ============================================
// Helper Type Guards
// ============================================

export function isContainer(obj: GameObject): boolean {
  return obj.objectType === ObjectType.CONTAINER ||
         obj.capabilities.includes(ObjectCapability.SEARCH);
}

export function canRestOn(obj: GameObject): boolean {
  return obj.capabilities.includes(ObjectCapability.SIT_ON) ||
         obj.capabilities.includes(ObjectCapability.SLEEP_ON) ||
         obj.capabilities.includes(ObjectCapability.SIT_AT);
}

export function isInteractive(obj: GameObject): boolean {
  return obj.capabilities.length > 0;
}

// ============================================
// Action Result
// ============================================

export interface ActionResult {
  success: boolean;
  message: string;
  effects: {
    energyChange?: number;
    hungerChange?: number;
    thirstChange?: number;
    stressChange?: number;
    itemsGained?: string[];
    stateChanges?: Partial<ObjectState>;
  };
  duration: number;  // Actual duration in seconds
}

// ============================================
// Spatial Queries
// ============================================

export interface SpatialQuery {
  capability?: ObjectCapability;
  objectType?: ObjectType;
  withinDistance?: number;
  inRoom?: string;
  inArea?: string;
  hasTag?: string;
  stateFilter?: Partial<ObjectState>;
}
