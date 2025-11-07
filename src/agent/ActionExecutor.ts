// src/agent/ActionExecutor.ts
/**
 * ActionExecutor - Rich object interactions
 *
 * Implements the extended action vocabulary from Park et al. (2023):
 * "Agents can act on objects in accordance with their affordances"
 *
 * Supported actions:
 * - Resting: sit_on, sleep_on, sit_at
 * - Interactive: cook_at, read_from, write_at
 * - Container: open, search
 * - Utility: drink_from, wash_at
 */

import type { Agent } from './Agent';
import type { WorldHierarchy } from '../systems/WorldHierarchy';
import {
  GameObject,
  ObjectCapability,
  ActionDefinition,
  ActionEffect,
  ActionResult,
  EffectType,
  RequirementType
} from '../types/environment';

export class ActionExecutor {
  private agent: Agent;
  private worldHierarchy: WorldHierarchy;

  // Track currently executing action
  private currentAction: ActionDefinition | null = null;
  private actionStartTime: number = 0;

  constructor(agent: Agent, worldHierarchy: WorldHierarchy) {
    this.agent = agent;
    this.worldHierarchy = worldHierarchy;

    console.log(`🎬 ActionExecutor initialized for agent ${agent.getName()}`);
  }

  // ============================================
  // Resting Actions
  // ============================================

  /**
   * Sit on furniture (chairs, cushions)
   */
  async sitOn(object: GameObject): Promise<ActionResult> {
    if (!object.capabilities.includes(ObjectCapability.SIT_ON)) {
      return {
        success: false,
        message: `Cannot sit on ${object.name}`,
        effects: {},
        duration: 0
      };
    }

    const action: ActionDefinition = {
      verb: 'sit on',
      target: object,
      duration: 300, // 5 minutes
      effects: [
        { type: EffectType.RESTORE_ENERGY, value: 10, target: 'self' },
        { type: EffectType.REDUCE_STRESS, value: 5, target: 'self' }
      ],
      requirements: [
        { type: RequirementType.PROXIMITY }
      ]
    };

    return await this.worldHierarchy.executeAction(action, this.agent);
  }

  /**
   * Sleep on bed
   */
  async sleepOn(object: GameObject): Promise<ActionResult> {
    if (!object.capabilities.includes(ObjectCapability.SLEEP_ON)) {
      return {
        success: false,
        message: `Cannot sleep on ${object.name}`,
        effects: {},
        duration: 0
      };
    }

    const action: ActionDefinition = {
      verb: 'sleep on',
      target: object,
      duration: 3600, // 1 hour
      effects: [
        { type: EffectType.RESTORE_ENERGY, value: 50, target: 'self' },
        { type: EffectType.REDUCE_STRESS, value: 20, target: 'self' }
      ],
      requirements: [
        { type: RequirementType.PROXIMITY },
        { type: RequirementType.OBJECT_STATE, property: 'occupied', value: false }
      ]
    };

    return await this.worldHierarchy.executeAction(action, this.agent);
  }

  /**
   * Sit at table/desk
   */
  async sitAt(object: GameObject): Promise<ActionResult> {
    if (!object.capabilities.includes(ObjectCapability.SIT_AT)) {
      return {
        success: false,
        message: `Cannot sit at ${object.name}`,
        effects: {},
        duration: 0
      };
    }

    const action: ActionDefinition = {
      verb: 'sit at',
      target: object,
      duration: 300, // 5 minutes
      effects: [
        { type: EffectType.RESTORE_ENERGY, value: 10, target: 'self' },
        { type: EffectType.REDUCE_STRESS, value: 5, target: 'self' }
      ],
      requirements: [
        { type: RequirementType.PROXIMITY }
      ]
    };

    return await this.worldHierarchy.executeAction(action, this.agent);
  }

  // ============================================
  // Interactive Actions
  // ============================================

  /**
   * Cook at stove
   */
  async cookAt(object: GameObject): Promise<ActionResult> {
    if (!object.capabilities.includes(ObjectCapability.COOK_AT)) {
      return {
        success: false,
        message: `Cannot cook at ${object.name}`,
        effects: {},
        duration: 0
      };
    }

    const action: ActionDefinition = {
      verb: 'cook at',
      target: object,
      duration: 900, // 15 minutes
      effects: [
        { type: EffectType.RESTORE_HUNGER, value: 40, target: 'self' }
      ],
      requirements: [
        { type: RequirementType.PROXIMITY },
        { type: RequirementType.OBJECT_STATE, property: 'lit', value: true }
      ]
    };

    return await this.worldHierarchy.executeAction(action, this.agent);
  }

  /**
   * Read from bookshelf/books
   */
  async readFrom(object: GameObject): Promise<ActionResult> {
    if (!object.capabilities.includes(ObjectCapability.READ_FROM)) {
      return {
        success: false,
        message: `Cannot read from ${object.name}`,
        effects: {},
        duration: 0
      };
    }

    const action: ActionDefinition = {
      verb: 'read from',
      target: object,
      duration: 600, // 10 minutes
      effects: [
        { type: EffectType.REDUCE_STRESS, value: 10, target: 'self' }
      ],
      requirements: [
        { type: RequirementType.PROXIMITY }
      ]
    };

    return await this.worldHierarchy.executeAction(action, this.agent);
  }

  /**
   * Write at desk
   */
  async writeAt(object: GameObject): Promise<ActionResult> {
    if (!object.capabilities.includes(ObjectCapability.WRITE_AT)) {
      return {
        success: false,
        message: `Cannot write at ${object.name}`,
        effects: {},
        duration: 0
      };
    }

    const action: ActionDefinition = {
      verb: 'write at',
      target: object,
      duration: 600, // 10 minutes
      effects: [
        { type: EffectType.REDUCE_STRESS, value: 8, target: 'self' }
      ],
      requirements: [
        { type: RequirementType.PROXIMITY }
      ]
    };

    return await this.worldHierarchy.executeAction(action, this.agent);
  }

  /**
   * Examine object (inspect closely)
   */
  async examine(object: GameObject): Promise<ActionResult> {
    if (!object.capabilities.includes(ObjectCapability.EXAMINE)) {
      return {
        success: false,
        message: `Cannot examine ${object.name}`,
        effects: {},
        duration: 0
      };
    }

    const action: ActionDefinition = {
      verb: 'examine',
      target: object,
      duration: 60, // 1 minute
      effects: [],
      requirements: [
        { type: RequirementType.PROXIMITY }
      ]
    };

    // Record detailed observation
    this.agent.addObservation(
      `I examined the ${object.name}: ${object.description}`,
      6,
      ['examine', 'observation'],
      object.position
    );

    return await this.worldHierarchy.executeAction(action, this.agent);
  }

  // ============================================
  // Container Actions
  // ============================================

  /**
   * Open container/door
   */
  async open(object: GameObject): Promise<ActionResult> {
    if (!object.capabilities.includes(ObjectCapability.OPEN)) {
      return {
        success: false,
        message: `Cannot open ${object.name}`,
        effects: {},
        duration: 0
      };
    }

    const action: ActionDefinition = {
      verb: 'open',
      target: object,
      duration: 10, // 10 seconds
      effects: [
        {
          type: EffectType.CHANGE_STATE,
          value: 0,
          target: 'object',
          stateChange: { open: true }
        }
      ],
      requirements: [
        { type: RequirementType.PROXIMITY },
        { type: RequirementType.OBJECT_STATE, property: 'locked', value: false }
      ]
    };

    return await this.worldHierarchy.executeAction(action, this.agent);
  }

  /**
   * Close container/door
   */
  async close(object: GameObject): Promise<ActionResult> {
    if (!object.capabilities.includes(ObjectCapability.CLOSE)) {
      return {
        success: false,
        message: `Cannot close ${object.name}`,
        effects: {},
        duration: 0
      };
    }

    const action: ActionDefinition = {
      verb: 'close',
      target: object,
      duration: 10, // 10 seconds
      effects: [
        {
          type: EffectType.CHANGE_STATE,
          value: 0,
          target: 'object',
          stateChange: { open: false }
        }
      ],
      requirements: [
        { type: RequirementType.PROXIMITY }
      ]
    };

    return await this.worldHierarchy.executeAction(action, this.agent);
  }

  /**
   * Search container for items
   */
  async search(object: GameObject): Promise<ActionResult> {
    if (!object.capabilities.includes(ObjectCapability.SEARCH)) {
      return {
        success: false,
        message: `Cannot search ${object.name}`,
        effects: {},
        duration: 0
      };
    }

    // Check if container is open (if it's a container)
    if (object.objectType === 'container' && !object.state.open) {
      return {
        success: false,
        message: `The ${object.name} is closed. Open it first.`,
        effects: {},
        duration: 0
      };
    }

    const action: ActionDefinition = {
      verb: 'search',
      target: object,
      duration: 120, // 2 minutes
      effects: [],
      requirements: [
        { type: RequirementType.PROXIMITY }
      ]
    };

    // Check for items
    if (!object.contains || object.contains.length === 0) {
      this.agent.addObservation(
        `I searched the ${object.name} but found nothing useful`,
        3,
        ['search', 'empty'],
        object.position
      );
    } else {
      this.agent.addObservation(
        `I searched the ${object.name} and found: ${object.contains.join(', ')}`,
        7,
        ['search', 'success', 'items'],
        object.position
      );

      // In a full implementation, this would actually spawn items
      // For now, just record the discovery
    }

    return await this.worldHierarchy.executeAction(action, this.agent);
  }

  // ============================================
  // Utility Actions
  // ============================================

  /**
   * Drink from fountain/sink
   */
  async drinkFrom(object: GameObject): Promise<ActionResult> {
    if (!object.capabilities.includes(ObjectCapability.DRINK_FROM)) {
      return {
        success: false,
        message: `Cannot drink from ${object.name}`,
        effects: {},
        duration: 0
      };
    }

    const action: ActionDefinition = {
      verb: 'drink from',
      target: object,
      duration: 30, // 30 seconds
      effects: [
        { type: EffectType.RESTORE_THIRST, value: 30, target: 'self' }
      ],
      requirements: [
        { type: RequirementType.PROXIMITY }
      ]
    };

    return await this.worldHierarchy.executeAction(action, this.agent);
  }

  /**
   * Wash at sink
   */
  async washAt(object: GameObject): Promise<ActionResult> {
    if (!object.capabilities.includes(ObjectCapability.WASH_AT)) {
      return {
        success: false,
        message: `Cannot wash at ${object.name}`,
        effects: {},
        duration: 0
      };
    }

    const action: ActionDefinition = {
      verb: 'wash at',
      target: object,
      duration: 180, // 3 minutes
      effects: [
        { type: EffectType.REDUCE_STRESS, value: 5, target: 'self' }
      ],
      requirements: [
        { type: RequirementType.PROXIMITY }
      ]
    };

    return await this.worldHierarchy.executeAction(action, this.agent);
  }

  /**
   * Light torch/fireplace
   */
  async light(object: GameObject): Promise<ActionResult> {
    if (!object.capabilities.includes(ObjectCapability.LIGHT)) {
      return {
        success: false,
        message: `Cannot light ${object.name}`,
        effects: {},
        duration: 0
      };
    }

    const action: ActionDefinition = {
      verb: 'light',
      target: object,
      duration: 30, // 30 seconds
      effects: [
        {
          type: EffectType.CHANGE_STATE,
          value: 0,
          target: 'object',
          stateChange: { lit: true }
        }
      ],
      requirements: [
        { type: RequirementType.PROXIMITY }
      ]
    };

    return await this.worldHierarchy.executeAction(action, this.agent);
  }

  /**
   * Extinguish torch/fireplace
   */
  async extinguish(object: GameObject): Promise<ActionResult> {
    if (!object.capabilities.includes(ObjectCapability.EXTINGUISH)) {
      return {
        success: false,
        message: `Cannot extinguish ${object.name}`,
        effects: {},
        duration: 0
      };
    }

    const action: ActionDefinition = {
      verb: 'extinguish',
      target: object,
      duration: 10, // 10 seconds
      effects: [
        {
          type: EffectType.CHANGE_STATE,
          value: 0,
          target: 'object',
          stateChange: { lit: false }
        }
      ],
      requirements: [
        { type: RequirementType.PROXIMITY }
      ]
    };

    return await this.worldHierarchy.executeAction(action, this.agent);
  }

  // ============================================
  // Action Management
  // ============================================

  /**
   * Execute action by capability name
   */
  async executeCapability(capability: ObjectCapability, object: GameObject): Promise<ActionResult> {
    switch (capability) {
      case ObjectCapability.SIT_ON:
        return await this.sitOn(object);
      case ObjectCapability.SLEEP_ON:
        return await this.sleepOn(object);
      case ObjectCapability.SIT_AT:
        return await this.sitAt(object);
      case ObjectCapability.COOK_AT:
        return await this.cookAt(object);
      case ObjectCapability.READ_FROM:
        return await this.readFrom(object);
      case ObjectCapability.WRITE_AT:
        return await this.writeAt(object);
      case ObjectCapability.EXAMINE:
        return await this.examine(object);
      case ObjectCapability.OPEN:
        return await this.open(object);
      case ObjectCapability.CLOSE:
        return await this.close(object);
      case ObjectCapability.SEARCH:
        return await this.search(object);
      case ObjectCapability.DRINK_FROM:
        return await this.drinkFrom(object);
      case ObjectCapability.WASH_AT:
        return await this.washAt(object);
      case ObjectCapability.LIGHT:
        return await this.light(object);
      case ObjectCapability.EXTINGUISH:
        return await this.extinguish(object);
      default:
        return {
          success: false,
          message: `Unknown capability: ${capability}`,
          effects: {},
          duration: 0
        };
    }
  }

  /**
   * Check if currently executing an action
   */
  isExecutingAction(): boolean {
    return this.currentAction !== null;
  }

  /**
   * Get current action
   */
  getCurrentAction(): ActionDefinition | null {
    return this.currentAction;
  }

  /**
   * Cancel current action
   */
  cancelAction(): void {
    if (this.currentAction) {
      console.log(`❌ Cancelled action: ${this.currentAction.verb} ${this.currentAction.target.name}`);
      this.currentAction = null;
      this.actionStartTime = 0;
    }
  }
}
