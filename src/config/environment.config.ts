// src/config/environment.config.ts
/**
 * Environment Configuration - Room templates and object definitions (Week 9)
 */

import {
  RoomTemplate,
  RoomDefinition,
  ObjectType,
  ObjectCapability
} from '../types/environment';

// ============================================
// Room Definitions
// ============================================

export const ROOM_DEFINITIONS: Record<RoomTemplate, RoomDefinition> = {
  [RoomTemplate.STORAGE]: {
    template: RoomTemplate.STORAGE,
    name: 'Storage Chamber',
    description: 'A dusty room filled with old supplies and crates',
    tags: ['storage', 'supplies', 'items'],
    requiredObjects: [
      {
        name: 'Wooden Crate',
        type: ObjectType.CONTAINER,
        capabilities: [ObjectCapability.OPEN, ObjectCapability.SEARCH],
        contains: ['food'],
        visualIcon: '📦'
      },
      {
        name: 'Water Barrel',
        type: ObjectType.CONTAINER,
        capabilities: [ObjectCapability.OPEN, ObjectCapability.DRINK_FROM],
        contains: ['water'],
        visualIcon: '🛢️'
      }
    ],
    optionalObjects: [
      {
        name: 'Torch',
        type: ObjectType.UTILITY,
        capabilities: [ObjectCapability.LIGHT, ObjectCapability.EXTINGUISH],
        visualIcon: '🔥'
      }
    ]
  },

  [RoomTemplate.MEDITATION]: {
    template: RoomTemplate.MEDITATION,
    name: 'Meditation Room',
    description: 'A quiet, peaceful space perfect for rest and reflection',
    tags: ['quiet', 'rest', 'peaceful'],
    requiredObjects: [
      {
        name: 'Meditation Cushion',
        type: ObjectType.FURNITURE,
        capabilities: [ObjectCapability.SIT_ON],
        visualIcon: '🧘'
      }
    ],
    optionalObjects: [
      {
        name: 'Shrine',
        type: ObjectType.DECORATIVE,
        capabilities: [ObjectCapability.EXAMINE],
        visualIcon: '⛩️'
      }
    ]
  },

  [RoomTemplate.SAFE_ROOM]: {
    template: RoomTemplate.SAFE_ROOM,
    name: 'Safe Room',
    description: 'A secure chamber with basic amenities for rest',
    tags: ['safe', 'rest', 'sleep'],
    requiredObjects: [
      {
        name: 'Bed',
        type: ObjectType.FURNITURE,
        capabilities: [ObjectCapability.SLEEP_ON, ObjectCapability.SIT_ON],
        visualIcon: '🛏️'
      },
      {
        name: 'Table',
        type: ObjectType.FURNITURE,
        capabilities: [ObjectCapability.SIT_AT],
        visualIcon: '🪑'
      }
    ],
    optionalObjects: [
      {
        name: 'Fireplace',
        type: ObjectType.UTILITY,
        capabilities: [ObjectCapability.LIGHT, ObjectCapability.EXAMINE],
        visualIcon: '🔥'
      }
    ]
  },

  [RoomTemplate.LIBRARY]: {
    template: RoomTemplate.LIBRARY,
    name: 'Library',
    description: 'A room filled with ancient books and scrolls',
    tags: ['books', 'knowledge', 'quiet'],
    requiredObjects: [
      {
        name: 'Bookshelf',
        type: ObjectType.FURNITURE,
        capabilities: [ObjectCapability.READ_FROM, ObjectCapability.EXAMINE],
        visualIcon: '📚'
      },
      {
        name: 'Reading Desk',
        type: ObjectType.FURNITURE,
        capabilities: [ObjectCapability.SIT_AT, ObjectCapability.WRITE_AT],
        visualIcon: '📝'
      }
    ],
    optionalObjects: [
      {
        name: 'Comfortable Chair',
        type: ObjectType.FURNITURE,
        capabilities: [ObjectCapability.SIT_ON],
        visualIcon: '🪑'
      }
    ]
  },

  [RoomTemplate.KITCHEN]: {
    template: RoomTemplate.KITCHEN,
    name: 'Kitchen',
    description: 'A cooking area with basic amenities',
    tags: ['cooking', 'food', 'water'],
    requiredObjects: [
      {
        name: 'Stove',
        type: ObjectType.INTERACTIVE,
        capabilities: [ObjectCapability.COOK_AT, ObjectCapability.LIGHT],
        visualIcon: '🔥'
      },
      {
        name: 'Sink',
        type: ObjectType.INTERACTIVE,
        capabilities: [ObjectCapability.WASH_AT, ObjectCapability.DRINK_FROM],
        visualIcon: '🚰'
      }
    ],
    optionalObjects: [
      {
        name: 'Counter',
        type: ObjectType.CONTAINER,
        capabilities: [ObjectCapability.SEARCH],
        contains: ['food'],
        visualIcon: '🍽️'
      }
    ]
  },

  [RoomTemplate.WORKSHOP]: {
    template: RoomTemplate.WORKSHOP,
    name: 'Workshop',
    description: 'A cluttered room with tools and workbenches',
    tags: ['work', 'crafting', 'tools'],
    requiredObjects: [
      {
        name: 'Workbench',
        type: ObjectType.FURNITURE,
        capabilities: [ObjectCapability.SIT_AT, ObjectCapability.EXAMINE],
        visualIcon: '🔨'
      },
      {
        name: 'Tool Chest',
        type: ObjectType.CONTAINER,
        capabilities: [ObjectCapability.OPEN, ObjectCapability.SEARCH],
        visualIcon: '🧰'
      }
    ],
    optionalObjects: []
  },

  [RoomTemplate.GARDEN]: {
    template: RoomTemplate.GARDEN,
    name: 'Garden',
    description: 'An indoor garden with plants and a small fountain',
    tags: ['nature', 'peaceful', 'water'],
    requiredObjects: [
      {
        name: 'Garden Bench',
        type: ObjectType.FURNITURE,
        capabilities: [ObjectCapability.SIT_ON],
        visualIcon: '🪑'
      },
      {
        name: 'Fountain',
        type: ObjectType.INTERACTIVE,
        capabilities: [ObjectCapability.DRINK_FROM, ObjectCapability.EXAMINE],
        visualIcon: '⛲'
      }
    ],
    optionalObjects: []
  },

  [RoomTemplate.EXIT_CHAMBER]: {
    template: RoomTemplate.EXIT_CHAMBER,
    name: 'Exit Chamber',
    description: 'The final chamber containing the maze exit',
    tags: ['exit', 'final', 'goal'],
    requiredObjects: [
      {
        name: 'Exit Door',
        type: ObjectType.INTERACTIVE,
        capabilities: [ObjectCapability.OPEN, ObjectCapability.EXAMINE],
        visualIcon: '🚪'
      }
    ],
    optionalObjects: []
  }
};

// ============================================
// Area Templates
// ============================================

export interface AreaTemplate {
  name: string;
  description: string;
  preferredRooms: RoomTemplate[];
  tags: string[];
}

export const AREA_TEMPLATES: AreaTemplate[] = [
  {
    name: 'Eastern Wing',
    description: 'The eastern section of the maze',
    preferredRooms: [RoomTemplate.STORAGE, RoomTemplate.MEDITATION, RoomTemplate.WORKSHOP],
    tags: ['east', 'storage', 'quiet']
  },
  {
    name: 'Western Wing',
    description: 'The western section of the maze',
    preferredRooms: [RoomTemplate.KITCHEN, RoomTemplate.GARDEN, RoomTemplate.EXIT_CHAMBER],
    tags: ['west', 'cooking', 'exit']
  },
  {
    name: 'Central Hub',
    description: 'The central area of the maze',
    preferredRooms: [RoomTemplate.SAFE_ROOM, RoomTemplate.LIBRARY],
    tags: ['central', 'safe', 'rest']
  },
  {
    name: 'Northern Reaches',
    description: 'The northern extremity of the maze',
    preferredRooms: [RoomTemplate.STORAGE, RoomTemplate.WORKSHOP],
    tags: ['north', 'supplies']
  }
];

// ============================================
// Action Duration Configuration
// ============================================

export const ACTION_DURATIONS = {
  SIT_ON: 300,        // 5 minutes
  SLEEP_ON: 3600,     // 1 hour
  SIT_AT: 300,        // 5 minutes
  COOK_AT: 900,       // 15 minutes
  READ_FROM: 600,     // 10 minutes
  WRITE_AT: 600,      // 10 minutes
  EXAMINE: 60,        // 1 minute
  OPEN: 10,           // 10 seconds
  CLOSE: 10,          // 10 seconds
  SEARCH: 120,        // 2 minutes
  DRINK_FROM: 30,     // 30 seconds
  WASH_AT: 180,       // 3 minutes
  LIGHT: 30,          // 30 seconds
  EXTINGUISH: 10      // 10 seconds
};

// ============================================
// Generation Parameters
// ============================================

export const WORLD_GEN_CONFIG = {
  minRoomsPerArea: 2,
  maxRoomsPerArea: 4,
  roomDetectionThreshold: 9,  // Min open space size to be considered a room
  objectDensity: 0.7,          // Probability of placing optional objects
  corridorMinLength: 5         // Min tiles for corridor vs room
};
