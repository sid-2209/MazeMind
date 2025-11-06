// src/systems/WorldHierarchy.ts
/**
 * WorldHierarchy - Hierarchical world representation (Week 9)
 *
 * Implements the environment tree from Park et al. (2023):
 * "The environment is represented as a tree structure: the world contains areas,
 * areas contain sub-areas, and sub-areas contain objects."
 *
 * Based on: https://arxiv.org/abs/2304.03442 (Section 5)
 */

import { v4 as uuidv4 } from 'uuid';
import type { Maze, Position } from '../types';
import type { Agent } from '../agent/Agent';
import {
  WorldNode,
  GameObject,
  LocationType,
  ObjectType,
  ObjectCapability,
  ActionDefinition,
  ActionEffect,
  ActionRequirement,
  ActionResult,
  RequirementType,
  EffectType,
  SpatialQuery,
  LocationContext,
  RoomTemplate
} from '../types/environment';
import {
  ROOM_DEFINITIONS,
  AREA_TEMPLATES,
  WORLD_GEN_CONFIG
} from '../config/environment.config';

export class WorldHierarchy {
  private nodes: Map<string, WorldNode> = new Map();
  private objects: Map<string, GameObject> = new Map();
  private rootId: string = 'world';
  private maze: Maze | null = null;

  // Spatial index for fast lookups
  private roomsByPosition: Map<string, string> = new Map();  // "x,y" -> roomId

  constructor() {
    console.log('🌍 WorldHierarchy initialized');
  }

  // ============================================
  // World Building
  // ============================================

  /**
   * Build world hierarchy from maze
   */
  buildFromMaze(maze: Maze): void {
    console.log('🌍 Building world hierarchy from maze...');
    this.maze = maze;

    // Create root world node
    const world: WorldNode = {
      id: 'world',
      type: LocationType.WORLD,
      name: 'The Maze',
      description: 'A mysterious, ancient maze filled with challenges and secrets',
      children: [],
      tags: ['maze', 'dungeon', 'ancient']
    };
    this.nodes.set('world', world);

    // Step 1: Detect areas (spatial regions)
    const areas = this.detectAreas(maze);
    console.log(`   Detected ${areas.length} areas`);

    // Step 2: Detect rooms within each area
    let totalRooms = 0;
    for (const area of areas) {
      world.children.push(area.id);
      this.nodes.set(area.id, area);

      const rooms = this.detectRooms(maze, area);
      totalRooms += rooms.length;
      console.log(`   ${area.name}: ${rooms.length} rooms`);

      for (const room of rooms) {
        area.children.push(room.id);
        this.nodes.set(room.id, room);

        // Index room by position
        if (room.position) {
          this.roomsByPosition.set(`${room.position.x},${room.position.y}`, room.id);
        }

        // Step 3: Place objects in room
        const objects = this.placeObjects(room);
        for (const obj of objects) {
          room.children.push(obj.id);
          this.objects.set(obj.id, obj);
        }
      }
    }

    console.log(`✅ World hierarchy built: ${areas.length} areas, ${totalRooms} rooms, ${this.objects.size} objects`);
  }

  /**
   * Detect areas in maze (quadrant-based approach)
   */
  private detectAreas(maze: Maze): WorldNode[] {
    const areas: WorldNode[] = [];

    // Create areas based on templates
    const templates = AREA_TEMPLATES.slice(0, 3); // Use first 3 templates

    if (templates.length >= 1) {
      // Eastern Wing
      areas.push({
        id: 'area_eastern_wing',
        type: LocationType.AREA,
        name: templates[0].name,
        description: templates[0].description,
        parent: 'world',
        children: [],
        bounds: {
          x: Math.floor(maze.width * 0.5),
          y: 0,
          width: Math.floor(maze.width * 0.5),
          height: maze.height
        },
        tags: templates[0].tags
      });
    }

    if (templates.length >= 2) {
      // Western Wing
      areas.push({
        id: 'area_western_wing',
        type: LocationType.AREA,
        name: templates[1].name,
        description: templates[1].description,
        parent: 'world',
        children: [],
        bounds: {
          x: 0,
          y: 0,
          width: Math.floor(maze.width * 0.5),
          height: maze.height
        },
        tags: templates[1].tags
      });
    }

    if (templates.length >= 3) {
      // Central Hub (overlapping center region)
      areas.push({
        id: 'area_central_hub',
        type: LocationType.AREA,
        name: templates[2].name,
        description: templates[2].description,
        parent: 'world',
        children: [],
        bounds: {
          x: Math.floor(maze.width * 0.25),
          y: Math.floor(maze.height * 0.25),
          width: Math.floor(maze.width * 0.5),
          height: Math.floor(maze.height * 0.5)
        },
        tags: templates[2].tags
      });
    }

    return areas;
  }

  /**
   * Detect rooms within area (simplified clustering)
   */
  private detectRooms(maze: Maze, area: WorldNode): WorldNode[] {
    if (!area.bounds) return [];

    const rooms: WorldNode[] = [];
    const areaTemplate = AREA_TEMPLATES.find(t => t.name === area.name);
    const preferredRooms = areaTemplate?.preferredRooms || [RoomTemplate.STORAGE, RoomTemplate.MEDITATION];

    // Create a few rooms per area
    const roomCount = Math.min(
      WORLD_GEN_CONFIG.maxRoomsPerArea,
      Math.max(WORLD_GEN_CONFIG.minRoomsPerArea, preferredRooms.length)
    );

    for (let i = 0; i < roomCount; i++) {
      const roomTemplate = preferredRooms[i % preferredRooms.length];
      const roomDef = ROOM_DEFINITIONS[roomTemplate];

      // Find a suitable position within area bounds
      const position = this.findRoomPosition(maze, area, i, roomCount);

      const room: WorldNode = {
        id: `${area.id}_room_${i}`,
        type: LocationType.ROOM,
        name: roomDef.name,
        description: roomDef.description,
        parent: area.id,
        children: [],
        position,
        tags: roomDef.tags
      };

      rooms.push(room);
    }

    return rooms;
  }

  /**
   * Find a suitable position for a room within area bounds
   */
  private findRoomPosition(maze: Maze, area: WorldNode, index: number, total: number): Position {
    if (!area.bounds) {
      return { x: 0, y: 0 };
    }

    // Distribute rooms evenly across the area
    const xOffset = area.bounds.x + Math.floor((area.bounds.width / (total + 1)) * (index + 1));
    const yOffset = area.bounds.y + Math.floor(area.bounds.height / 2);

    // Find nearest open space
    let x = Math.min(Math.max(xOffset, 0), maze.width - 1);
    let y = Math.min(Math.max(yOffset, 0), maze.height - 1);

    // Search for open tile
    for (let dy = -3; dy <= 3; dy++) {
      for (let dx = -3; dx <= 3; dx++) {
        const testX = x + dx;
        const testY = y + dy;
        if (testX >= 0 && testX < maze.width && testY >= 0 && testY < maze.height) {
          if (maze.tiles[testY][testX].type === 'floor') {  // Check if it's a floor tile
            return { x: testX, y: testY };
          }
        }
      }
    }

    return { x, y };  // Fallback to original position
  }

  /**
   * Place objects in room based on room template
   */
  private placeObjects(room: WorldNode): GameObject[] {
    const objects: GameObject[] = [];

    // Find room definition
    const roomDef = Object.values(ROOM_DEFINITIONS).find(def => def.name === room.name);
    if (!roomDef || !room.position) return objects;

    // Place required objects
    for (const objTemplate of roomDef.requiredObjects) {
      const obj: GameObject = {
        id: `${room.id}_${objTemplate.name.toLowerCase().replace(/\s+/g, '_')}`,
        name: objTemplate.name,
        description: `A ${objTemplate.name.toLowerCase()} in the ${room.name}`,
        location: room.id,
        position: room.position,  // Objects share room position for simplicity
        objectType: objTemplate.type,
        state: {
          occupied: false,
          locked: false,
          lit: objTemplate.type === ObjectType.UTILITY,  // Utilities start lit
          open: false,
          broken: false,
          dirty: false
        },
        capabilities: objTemplate.capabilities,
        contains: objTemplate.contains,
        visualIcon: objTemplate.visualIcon
      };

      objects.push(obj);
    }

    // Place optional objects (based on density)
    for (const objTemplate of roomDef.optionalObjects) {
      if (Math.random() < WORLD_GEN_CONFIG.objectDensity) {
        const obj: GameObject = {
          id: `${room.id}_${objTemplate.name.toLowerCase().replace(/\s+/g, '_')}`,
          name: objTemplate.name,
          description: `A ${objTemplate.name.toLowerCase()} in the ${room.name}`,
          location: room.id,
          position: room.position,
          objectType: objTemplate.type,
          state: {
            occupied: false,
            locked: false,
            lit: false,
            open: false,
            broken: false,
            dirty: false
          },
          capabilities: objTemplate.capabilities,
          contains: objTemplate.contains,
          visualIcon: objTemplate.visualIcon
        };

        objects.push(obj);
      }
    }

    return objects;
  }

  // ============================================
  // Location Queries
  // ============================================

  /**
   * Get natural language description of location
   */
  describeLocation(nodeId: string): string {
    const node = this.nodes.get(nodeId);
    if (!node) return 'Unknown location';

    // Build hierarchical description: "Room in Area in World"
    const path = this.getPath(nodeId);
    return path.map(n => n.name).reverse().join(' in the ');
  }

  /**
   * Get path from root to node
   */
  private getPath(nodeId: string): WorldNode[] {
    const path: WorldNode[] = [];
    let current = this.nodes.get(nodeId);

    while (current) {
      path.unshift(current);
      current = current.parent ? this.nodes.get(current.parent) : undefined;
    }

    return path;
  }

  /**
   * Get room at position
   */
  getRoomAtPosition(position: Position): WorldNode | null {
    const key = `${position.x},${position.y}`;
    const roomId = this.roomsByPosition.get(key);
    return roomId ? this.nodes.get(roomId) || null : null;
  }

  /**
   * Get area containing position
   */
  getAreaAtPosition(position: Position): WorldNode | null {
    for (const node of this.nodes.values()) {
      if (node.type === LocationType.AREA && node.bounds) {
        const { x, y, width, height } = node.bounds;
        if (position.x >= x && position.x < x + width &&
            position.y >= y && position.y < y + height) {
          return node;
        }
      }
    }
    return null;
  }

  /**
   * Get location context for agent's current position
   */
  getLocationContext(position: Position): LocationContext {
    const room = this.getRoomAtPosition(position);
    const area = this.getAreaAtPosition(position);

    const nearbyObjects = this.findNearbyObjects(position, 3);
    const availableActions = nearbyObjects.flatMap(obj =>
      obj.capabilities.map(cap => ({
        actionType: cap,
        object: obj,
        estimatedDuration: this.estimateActionDuration(cap),
        estimatedEffects: this.estimateActionEffects(cap, obj)
      }))
    );

    return {
      currentRoom: room?.id || '',
      currentArea: area?.id || '',
      nearbyObjects,
      availableActions
    };
  }

  // ============================================
  // Object Queries
  // ============================================

  /**
   * Find objects matching spatial query
   */
  findObjects(query: SpatialQuery): GameObject[] {
    let objects = Array.from(this.objects.values());

    // Filter by capability
    if (query.capability) {
      objects = objects.filter(obj => obj.capabilities.includes(query.capability!));
    }

    // Filter by object type
    if (query.objectType) {
      objects = objects.filter(obj => obj.objectType === query.objectType);
    }

    // Filter by room
    if (query.inRoom) {
      objects = objects.filter(obj => obj.location === query.inRoom);
    }

    // Filter by area
    if (query.inArea) {
      objects = objects.filter(obj => {
        const room = this.nodes.get(obj.location);
        return room?.parent === query.inArea;
      });
    }

    // Filter by tag
    if (query.hasTag) {
      objects = objects.filter(obj => {
        const room = this.nodes.get(obj.location);
        return room?.tags.includes(query.hasTag!);
      });
    }

    // Filter by state
    if (query.stateFilter) {
      objects = objects.filter(obj => {
        for (const [key, value] of Object.entries(query.stateFilter!)) {
          if (obj.state[key] !== value) return false;
        }
        return true;
      });
    }

    // Filter by distance
    if (query.withinDistance !== undefined && this.maze) {
      const referencePos = query.inRoom
        ? this.nodes.get(query.inRoom)?.position
        : undefined;

      if (referencePos) {
        objects = objects.filter(obj => {
          const dist = Math.abs(obj.position.x - referencePos.x) +
                      Math.abs(obj.position.y - referencePos.y);
          return dist <= query.withinDistance!;
        });
      }
    }

    return objects;
  }

  /**
   * Find nearby objects within radius
   */
  findNearbyObjects(position: Position, radius: number): GameObject[] {
    return Array.from(this.objects.values()).filter(obj => {
      const dist = Math.abs(obj.position.x - position.x) + Math.abs(obj.position.y - position.y);
      return dist <= radius;
    });
  }

  /**
   * Get object by ID
   */
  getObject(id: string): GameObject | undefined {
    return this.objects.get(id);
  }

  /**
   * Get all objects
   */
  getAllObjects(): GameObject[] {
    return Array.from(this.objects.values());
  }

  // ============================================
  // Action Execution
  // ============================================

  /**
   * Execute action on object
   */
  async executeAction(action: ActionDefinition, agent: Agent): Promise<ActionResult> {
    // Check requirements
    for (const req of action.requirements) {
      if (!this.checkRequirement(req, agent, action.target)) {
        return {
          success: false,
          message: `Cannot ${action.verb} ${action.target.name}: requirement not met`,
          effects: {},
          duration: 0
        };
      }
    }

    // Apply effects
    const effectResults: ActionResult['effects'] = {};
    for (const effect of action.effects) {
      this.applyEffect(effect, agent, action.target, effectResults);
    }

    // Update object state
    action.target.state.occupied = true;

    // Record in memory
    const locationDesc = this.describeLocation(action.target.location);
    agent.addObservation(
      `I ${action.verb} the ${action.target.name} in the ${locationDesc}`,
      5,
      ['action', action.verb.replace(/\s+/g, '_')],
      action.target.position
    );

    return {
      success: true,
      message: `Successfully ${action.verb} ${action.target.name}`,
      effects: effectResults,
      duration: action.duration
    };
  }

  /**
   * Check if action requirement is met
   */
  private checkRequirement(req: ActionRequirement, agent: Agent, target: GameObject): boolean {
    switch (req.type) {
      case RequirementType.OBJECT_STATE:
        if (req.property && req.value !== undefined) {
          return target.state[req.property] === req.value;
        }
        return true;

      case RequirementType.PROXIMITY:
        const dist = Math.abs(agent.getTilePosition().x - target.position.x) +
                    Math.abs(agent.getTilePosition().y - target.position.y);
        return dist <= 1;  // Must be adjacent

      case RequirementType.ENERGY_LEVEL:
        if (req.value !== undefined) {
          return agent.getSurvivalState().energy >= req.value;
        }
        return true;

      default:
        return true;
    }
  }

  /**
   * Apply action effect
   */
  private applyEffect(
    effect: ActionEffect,
    agent: Agent,
    target: GameObject,
    results: ActionResult['effects']
  ): void {
    if (effect.target === 'self') {
      // Apply to agent
      switch (effect.type) {
        case EffectType.RESTORE_ENERGY:
          // Note: This would need to be implemented in Agent class
          results.energyChange = (results.energyChange || 0) + effect.value;
          break;
        case EffectType.RESTORE_HUNGER:
          results.hungerChange = (results.hungerChange || 0) + effect.value;
          break;
        case EffectType.RESTORE_THIRST:
          results.thirstChange = (results.thirstChange || 0) + effect.value;
          break;
        case EffectType.REDUCE_STRESS:
          results.stressChange = (results.stressChange || 0) - effect.value;
          break;
      }
    } else if (effect.target === 'object') {
      // Apply to object
      if (effect.type === EffectType.CHANGE_STATE && effect.stateChange) {
        Object.assign(target.state, effect.stateChange);
        results.stateChanges = effect.stateChange;
      }
    }
  }

  // ============================================
  // Helper Methods
  // ============================================

  /**
   * Estimate action duration
   */
  private estimateActionDuration(capability: ObjectCapability): number {
    const durations: Record<ObjectCapability, number> = {
      [ObjectCapability.SIT_ON]: 300,
      [ObjectCapability.SLEEP_ON]: 3600,
      [ObjectCapability.SIT_AT]: 300,
      [ObjectCapability.COOK_AT]: 900,
      [ObjectCapability.READ_FROM]: 600,
      [ObjectCapability.WRITE_AT]: 600,
      [ObjectCapability.EXAMINE]: 60,
      [ObjectCapability.OPEN]: 10,
      [ObjectCapability.CLOSE]: 10,
      [ObjectCapability.SEARCH]: 120,
      [ObjectCapability.DRINK_FROM]: 30,
      [ObjectCapability.WASH_AT]: 180,
      [ObjectCapability.LIGHT]: 30,
      [ObjectCapability.EXTINGUISH]: 10
    };
    return durations[capability] || 60;
  }

  /**
   * Estimate action effects
   */
  private estimateActionEffects(capability: ObjectCapability, obj: GameObject): string[] {
    const effects: string[] = [];

    switch (capability) {
      case ObjectCapability.SIT_ON:
      case ObjectCapability.SIT_AT:
        effects.push('Restores energy +10');
        effects.push('Reduces stress -5');
        break;
      case ObjectCapability.SLEEP_ON:
        effects.push('Restores energy +50');
        effects.push('Reduces stress -20');
        break;
      case ObjectCapability.COOK_AT:
        effects.push('Restores hunger +40');
        break;
      case ObjectCapability.READ_FROM:
        effects.push('Reduces stress -10');
        break;
      case ObjectCapability.DRINK_FROM:
        effects.push('Restores thirst +30');
        break;
      case ObjectCapability.SEARCH:
        if (obj.contains && obj.contains.length > 0) {
          effects.push(`May find: ${obj.contains.join(', ')}`);
        }
        break;
    }

    return effects;
  }

  /**
   * Get world tree (for visualization)
   */
  getWorldTree(): WorldNode[] {
    return Array.from(this.nodes.values());
  }

  /**
   * Get node by ID
   */
  getNode(id: string): WorldNode | undefined {
    return this.nodes.get(id);
  }

  /**
   * Get statistics
   */
  getStatistics() {
    const areas = Array.from(this.nodes.values()).filter(n => n.type === LocationType.AREA);
    const rooms = Array.from(this.nodes.values()).filter(n => n.type === LocationType.ROOM);

    return {
      totalAreas: areas.length,
      totalRooms: rooms.length,
      totalObjects: this.objects.size,
      objectsByType: this.getObjectCountByType()
    };
  }

  /**
   * Get object counts by type
   */
  private getObjectCountByType(): Record<ObjectType, number> {
    const counts: Record<ObjectType, number> = {
      [ObjectType.FURNITURE]: 0,
      [ObjectType.CONTAINER]: 0,
      [ObjectType.INTERACTIVE]: 0,
      [ObjectType.DECORATIVE]: 0,
      [ObjectType.UTILITY]: 0
    };

    for (const obj of this.objects.values()) {
      counts[obj.objectType]++;
    }

    return counts;
  }
}
