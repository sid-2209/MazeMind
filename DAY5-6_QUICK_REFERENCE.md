# Day 5-6 Quick Implementation Reference

## 🚀 Quick Start Checklist

### Prerequisites ✅
- [x] Day 1-2 complete (maze generation)
- [x] Day 3-4 complete (PixiJS rendering)
- [x] All type definitions exist
- [x] Arth's profile configured
- [x] Game config set up

### Files to Create
- [ ] `src/agent/Agent.ts` (~250 lines)
- [ ] `src/agent/AgentRenderer.ts` (~200 lines)
- [ ] `src/agent/AgentController.ts` (~150 lines)

### Files to Update
- [ ] `src/core/Game.ts` (add agent initialization)
- [ ] `src/main.ts` (update controls display)

---

## 📝 Code Templates

### 1. Agent.ts Template

```typescript
// src/agent/Agent.ts
import { Position, Direction, Maze, TileType } from '@types/index';
import { ARTH_PROFILE, ARTH_INITIAL_STATS } from '@config/arth.profile';
import { CONSTANTS } from '@config/game.config';

export class Agent {
  // State
  private currentPosition: Position;
  private tilePosition: Position;
  private targetPosition: Position | null = null;
  private facing: Direction = Direction.DOWN;
  private isMovingFlag: boolean = false;
  
  // Movement
  private moveProgress: number = 0;
  private moveSpeed: number;
  
  // Reference
  private maze: Maze;
  
  constructor(maze: Maze, startTile: Position) {
    this.maze = maze;
    this.tilePosition = { ...startTile };
    
    // Convert tile to world coordinates (center of tile)
    this.currentPosition = {
      x: startTile.x * CONSTANTS.TILE_SIZE + CONSTANTS.TILE_SIZE / 2,
      y: startTile.y * CONSTANTS.TILE_SIZE + CONSTANTS.TILE_SIZE / 2
    };
    
    this.moveSpeed = ARTH_INITIAL_STATS.baseSpeed;
    
    console.log(`👤 Agent created at tile (${startTile.x}, ${startTile.y})`);
  }
  
  /**
   * Start moving to target tile
   */
  moveTo(targetTile: Position): boolean {
    // Validate move
    if (!this.canMoveTo(targetTile)) {
      return false;
    }
    
    // Setup movement
    this.targetPosition = {
      x: targetTile.x * CONSTANTS.TILE_SIZE + CONSTANTS.TILE_SIZE / 2,
      y: targetTile.y * CONSTANTS.TILE_SIZE + CONSTANTS.TILE_SIZE / 2
    };
    this.isMovingFlag = true;
    this.moveProgress = 0;
    
    // Update facing direction
    this.updateFacing(targetTile);
    
    return true;
  }
  
  /**
   * Update agent state
   */
  update(deltaTime: number): void {
    if (!this.isMovingFlag || !this.targetPosition) return;
    
    // Calculate distance to move this frame
    const speed = this.moveSpeed * CONSTANTS.TILE_SIZE; // pixels/second
    const moveDistance = speed * deltaTime;
    
    // Calculate direction and distance
    const dx = this.targetPosition.x - this.currentPosition.x;
    const dy = this.targetPosition.y - this.currentPosition.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    if (distance <= moveDistance) {
      // Arrived at target
      this.currentPosition = { ...this.targetPosition };
      this.tilePosition = this.worldToTile(this.currentPosition);
      this.targetPosition = null;
      this.isMovingFlag = false;
      this.moveProgress = 1;
    } else {
      // Move toward target
      const ratio = moveDistance / distance;
      this.currentPosition.x += dx * ratio;
      this.currentPosition.y += dy * ratio;
      this.moveProgress = 1 - (distance - moveDistance) / CONSTANTS.TILE_SIZE;
    }
  }
  
  /**
   * Check if agent can move to tile
   */
  canMoveTo(targetTile: Position): boolean {
    // Check bounds
    if (targetTile.x < 0 || targetTile.x >= this.maze.width) return false;
    if (targetTile.y < 0 || targetTile.y >= this.maze.height) return false;
    
    // Check if currently moving
    if (this.isMovingFlag) return false;
    
    // Check if adjacent
    const dx = Math.abs(targetTile.x - this.tilePosition.x);
    const dy = Math.abs(targetTile.y - this.tilePosition.y);
    if (dx + dy !== 1) return false; // Only allow orthogonal moves
    
    // Check tile type
    const tile = this.maze.tiles[targetTile.y][targetTile.x];
    if (tile.type === TileType.WALL) return false;
    
    // Check walls between tiles
    if (targetTile.x > this.tilePosition.x) {
      // Moving right
      const currentTile = this.maze.tiles[this.tilePosition.y][this.tilePosition.x];
      if (currentTile.walls.east) return false;
    } else if (targetTile.x < this.tilePosition.x) {
      // Moving left
      const currentTile = this.maze.tiles[this.tilePosition.y][this.tilePosition.x];
      if (currentTile.walls.west) return false;
    } else if (targetTile.y > this.tilePosition.y) {
      // Moving down
      const currentTile = this.maze.tiles[this.tilePosition.y][this.tilePosition.x];
      if (currentTile.walls.south) return false;
    } else if (targetTile.y < this.tilePosition.y) {
      // Moving up
      const currentTile = this.maze.tiles[this.tilePosition.y][this.tilePosition.x];
      if (currentTile.walls.north) return false;
    }
    
    return true;
  }
  
  /**
   * Update facing direction based on target
   */
  private updateFacing(targetTile: Position): void {
    if (targetTile.x > this.tilePosition.x) {
      this.facing = Direction.RIGHT;
    } else if (targetTile.x < this.tilePosition.x) {
      this.facing = Direction.LEFT;
    } else if (targetTile.y > this.tilePosition.y) {
      this.facing = Direction.DOWN;
    } else if (targetTile.y < this.tilePosition.y) {
      this.facing = Direction.UP;
    }
  }
  
  /**
   * Convert world coordinates to tile coordinates
   */
  private worldToTile(worldPos: Position): Position {
    return {
      x: Math.floor(worldPos.x / CONSTANTS.TILE_SIZE),
      y: Math.floor(worldPos.y / CONSTANTS.TILE_SIZE)
    };
  }
  
  // Getters
  getPosition(): Position { return { ...this.currentPosition }; }
  getTilePosition(): Position { return { ...this.tilePosition }; }
  getFacing(): Direction { return this.facing; }
  isMoving(): boolean { return this.isMovingFlag; }
  getMoveProgress(): number { return this.moveProgress; }
}
```

---

### 2. AgentRenderer.ts Template

```typescript
// src/agent/AgentRenderer.ts
import { Container, Graphics } from 'pixi.js';
import { Agent } from './Agent';
import { VisualConfig, AnimationState, Direction } from '@types/index';
import { CONSTANTS } from '@config/game.config';

export class AgentRenderer {
  private container: Container;
  private agent: Agent;
  private config: VisualConfig;
  
  // Sprite
  private sprite: Graphics;
  private directionIndicator: Graphics;
  
  // Animation
  private animationState: AnimationState = AnimationState.IDLE;
  private animationTime: number = 0;
  
  constructor(container: Container, agent: Agent, config: VisualConfig) {
    this.container = container;
    this.agent = agent;
    this.config = config;
  }
  
  /**
   * Initialize renderer
   */
  async init(): Promise<void> {
    console.log('🎨 Initializing agent renderer...');
    
    // Create sprite
    this.createSprite();
    
    // Add to container
    this.container.addChild(this.sprite);
    
    // Initial position
    this.updatePosition();
    
    console.log('   Agent sprite created');
  }
  
  /**
   * Create simple sprite (circle for now)
   */
  private createSprite(): void {
    const size = CONSTANTS.TILE_SIZE * 0.8;
    const radius = size / 2;
    
    // Create sprite container
    this.sprite = new Graphics();
    
    // Draw agent circle
    this.sprite.circle(0, 0, radius);
    this.sprite.fill(CONSTANTS.COLORS.agent);
    
    // Draw border
    this.sprite.circle(0, 0, radius);
    this.sprite.stroke({ width: 2, color: 0xffffff, alpha: 0.5 });
    
    // Create direction indicator
    this.directionIndicator = new Graphics();
    this.directionIndicator.moveTo(0, 0);
    this.directionIndicator.lineTo(0, -radius);
    this.directionIndicator.stroke({ width: 3, color: 0xffffff });
    this.sprite.addChild(this.directionIndicator);
  }
  
  /**
   * Update every frame
   */
  update(deltaTime: number): void {
    // Update position
    this.updatePosition();
    
    // Update direction
    this.updateDirection();
    
    // Update animation
    this.updateAnimation(deltaTime);
  }
  
  /**
   * Update sprite position from agent
   */
  private updatePosition(): void {
    const pos = this.agent.getPosition();
    this.sprite.x = pos.x;
    this.sprite.y = pos.y;
  }
  
  /**
   * Update direction indicator rotation
   */
  private updateDirection(): void {
    const facing = this.agent.getFacing();
    
    // Rotate direction indicator
    switch (facing) {
      case Direction.UP:
        this.directionIndicator.rotation = 0;
        break;
      case Direction.RIGHT:
        this.directionIndicator.rotation = Math.PI / 2;
        break;
      case Direction.DOWN:
        this.directionIndicator.rotation = Math.PI;
        break;
      case Direction.LEFT:
        this.directionIndicator.rotation = -Math.PI / 2;
        break;
    }
  }
  
  /**
   * Update animation
   */
  private updateAnimation(deltaTime: number): void {
    this.animationTime += deltaTime;
    
    // Determine animation state
    const newState = this.agent.isMoving() 
      ? AnimationState.WALK 
      : AnimationState.IDLE;
    
    if (newState !== this.animationState) {
      this.animationState = newState;
      this.animationTime = 0;
    }
    
    // Apply animation
    if (this.animationState === AnimationState.IDLE) {
      this.animateIdle();
    } else if (this.animationState === AnimationState.WALK) {
      this.animateWalk();
    }
  }
  
  /**
   * Idle animation - gentle pulse
   */
  private animateIdle(): void {
    const pulse = Math.sin(this.animationTime * Math.PI * 2) * 0.05;
    this.sprite.scale.set(1 + pulse);
  }
  
  /**
   * Walk animation - bob up and down
   */
  private animateWalk(): void {
    const bob = Math.sin(this.animationTime * Math.PI * 4) * 3;
    
    // Reset scale
    this.sprite.scale.set(1);
    
    // Apply vertical offset to sprite children
    // Note: We modify the position slightly for the bob effect
    this.sprite.pivot.y = bob;
  }
  
  /**
   * Cleanup
   */
  destroy(): void {
    this.sprite.destroy();
  }
}
```

---

### 3. AgentController.ts Template

```typescript
// src/agent/AgentController.ts
import { Agent } from './Agent';
import { InputManager } from '@core/InputManager';
import { Camera } from '@rendering/Camera';
import { Direction, Position } from '@types/index';

export class AgentController {
  private agent: Agent;
  private inputManager: InputManager;
  private camera: Camera;
  
  // Input buffering
  private inputCooldown: number = 0;
  private readonly INPUT_COOLDOWN_TIME = 0.05; // seconds
  
  constructor(agent: Agent, inputManager: InputManager, camera: Camera) {
    this.agent = agent;
    this.inputManager = inputManager;
    this.camera = camera;
    
    console.log('🎮 Agent controller created');
  }
  
  /**
   * Update controller
   */
  update(deltaTime: number): void {
    // Update cooldown
    if (this.inputCooldown > 0) {
      this.inputCooldown -= deltaTime;
    }
    
    // Handle movement input
    if (!this.agent.isMoving() && this.inputCooldown <= 0) {
      this.handleMovementInput();
    }
    
    // Update camera to follow agent
    this.updateCamera();
  }
  
  /**
   * Handle WASD/Arrow key input
   */
  private handleMovementInput(): void {
    const direction = this.getDesiredDirection();
    
    if (direction !== null) {
      this.attemptMove(direction);
    }
  }
  
  /**
   * Get desired movement direction from input
   */
  private getDesiredDirection(): Direction | null {
    // Check WASD
    if (this.inputManager.isKeyPressed('w') || this.inputManager.isKeyPressed('W')) {
      return Direction.UP;
    }
    if (this.inputManager.isKeyPressed('s') || this.inputManager.isKeyPressed('S')) {
      return Direction.DOWN;
    }
    if (this.inputManager.isKeyPressed('a') || this.inputManager.isKeyPressed('A')) {
      return Direction.LEFT;
    }
    if (this.inputManager.isKeyPressed('d') || this.inputManager.isKeyPressed('D')) {
      return Direction.RIGHT;
    }
    
    // Check Arrow keys
    if (this.inputManager.isKeyPressed('ArrowUp')) {
      return Direction.UP;
    }
    if (this.inputManager.isKeyPressed('ArrowDown')) {
      return Direction.DOWN;
    }
    if (this.inputManager.isKeyPressed('ArrowLeft')) {
      return Direction.LEFT;
    }
    if (this.inputManager.isKeyPressed('ArrowRight')) {
      return Direction.RIGHT;
    }
    
    return null;
  }
  
  /**
   * Attempt to move in direction
   */
  private attemptMove(direction: Direction): boolean {
    const targetTile = this.getTileInDirection(direction);
    
    // Try to move
    const success = this.agent.moveTo(targetTile);
    
    if (success) {
      // Start cooldown
      this.inputCooldown = this.INPUT_COOLDOWN_TIME;
    } else {
      console.log('❌ Cannot move to', targetTile);
    }
    
    return success;
  }
  
  /**
   * Get tile in given direction
   */
  private getTileInDirection(direction: Direction): Position {
    const currentTile = this.agent.getTilePosition();
    
    switch (direction) {
      case Direction.UP:
        return { x: currentTile.x, y: currentTile.y - 1 };
      case Direction.DOWN:
        return { x: currentTile.x, y: currentTile.y + 1 };
      case Direction.LEFT:
        return { x: currentTile.x - 1, y: currentTile.y };
      case Direction.RIGHT:
        return { x: currentTile.x + 1, y: currentTile.y };
      default:
        return currentTile;
    }
  }
  
  /**
   * Update camera to follow agent
   */
  private updateCamera(): void {
    const agentPos = this.agent.getPosition();
    this.camera.followTarget(agentPos);
  }
}
```

---

### 4. Game.ts Updates

```typescript
// In Game.ts, add these changes:

// Add imports
import { Agent } from '@agent/Agent';
import { AgentRenderer } from '@agent/AgentRenderer';
import { AgentController } from '@agent/AgentController';

// Add properties
private agent: Agent | null = null;
private agentRenderer: AgentRenderer | null = null;
private agentController: AgentController | null = null;

// In init() method, after initInput():
await this.initAgent();

// Add new method
private async initAgent(): Promise<void> {
  if (!this.maze || !this.renderer || !this.inputManager) {
    throw new Error('Cannot initialize agent: prerequisites not ready');
  }
  
  console.log('👤 Initializing agent...');
  
  // Create agent at maze entrance
  this.agent = new Agent(this.maze, this.maze.entrance);
  
  // Create agent renderer
  const agentLayer = this.renderer.getAgentLayer();
  this.agentRenderer = new AgentRenderer(
    agentLayer,
    this.agent,
    this.config.visual
  );
  await this.agentRenderer.init();
  
  // Create agent controller
  this.agentController = new AgentController(
    this.agent,
    this.inputManager,
    this.renderer.camera
  );
  
  console.log('✅ Agent initialized');
}

// In update() method:
private update(deltaTime: number): void {
  // Update agent systems
  if (this.agent && this.agentController && this.agentRenderer) {
    this.agentController.update(deltaTime);
    this.agent.update(deltaTime);
    this.agentRenderer.update(deltaTime);
  }
  
  // Update renderer
  this.renderer?.update(deltaTime);
}

// In destroy() method:
if (this.agentRenderer) {
  this.agentRenderer.destroy();
  this.agentRenderer = null;
}
this.agent = null;
this.agentController = null;
```

---

### 5. Camera.ts Updates

```typescript
// In Camera.ts, add this method:

/**
 * Set target position for camera to follow
 */
public followTarget(target: Position): void {
  this.targetPosition = { ...target };
}

// Update the update() method to smooth-follow target:
update(deltaTime: number): void {
  if (this.targetPosition) {
    // Smooth interpolation toward target
    const dx = this.targetPosition.x - this.position.x;
    const dy = this.targetPosition.y - this.position.y;
    
    this.position.x += dx * this.smoothing;
    this.position.y += dy * this.smoothing;
  }
  
  // Apply transform
  this.applyTransform();
}
```

---

## 🧪 Testing Code

### Console Testing

```typescript
// Add to window object for console access
(window as any).agent = this.agent;
(window as any).agentRenderer = this.agentRenderer;

// Test in browser console:
agent.moveTo({ x: 5, y: 5 });
agent.getTilePosition();
agent.getPosition();
agent.isMoving();
```

### Debug Visualization

```typescript
// Add to AgentRenderer.ts for debugging
private debugMode = true;

private drawDebugInfo(): void {
  if (!this.debugMode) return;
  
  // Draw tile grid at agent position
  const tilePos = this.agent.getTilePosition();
  const graphics = new Graphics();
  graphics.rect(
    tilePos.x * CONSTANTS.TILE_SIZE,
    tilePos.y * CONSTANTS.TILE_SIZE,
    CONSTANTS.TILE_SIZE,
    CONSTANTS.TILE_SIZE
  );
  graphics.stroke({ width: 2, color: 0xff0000 });
  this.container.addChild(graphics);
}
```

---

## 🐛 Common Issues & Solutions

### Issue 1: Agent doesn't move
**Problem**: Input not detected or collision check failing
**Solution**:
```typescript
// Add console logs
attemptMove(direction: Direction): boolean {
  console.log('Attempting move:', Direction[direction]);
  const targetTile = this.getTileInDirection(direction);
  console.log('Target tile:', targetTile);
  
  const canMove = this.agent.canMoveTo(targetTile);
  console.log('Can move?', canMove);
  
  // ...
}
```

### Issue 2: Agent moves but sprite doesn't
**Problem**: Position not updating in renderer
**Solution**:
```typescript
// Verify update is called
update(deltaTime: number): void {
  console.log('AgentRenderer.update', this.agent.getPosition());
  this.updatePosition();
  // ...
}
```

### Issue 3: Movement is jerky
**Problem**: Camera smoothing too high or deltaTime issues
**Solution**:
```typescript
// Reduce camera smoothing
this.camera.setSmoothing(0.1); // Lower = smoother

// Verify deltaTime
update(deltaTime: number): void {
  console.log('deltaTime:', deltaTime); // Should be ~0.016 at 60 FPS
  // ...
}
```

### Issue 4: Agent walks through walls
**Problem**: Collision detection not working
**Solution**:
```typescript
// Add more detailed logging in canMoveTo
canMoveTo(targetTile: Position): boolean {
  console.log('Checking tile:', targetTile);
  
  const tile = this.maze.tiles[targetTile.y][targetTile.x];
  console.log('Tile type:', tile.type);
  console.log('Tile walls:', tile.walls);
  
  // Check your wall detection logic
  // ...
}
```

---

## ⚡ Performance Tips

### 1. Minimize Object Creation
```typescript
// Bad: Creates new objects every frame
update() {
  const pos = { x: this.x, y: this.y };
  this.sprite.position.set(pos.x, pos.y);
}

// Good: Reuse existing reference
update() {
  this.sprite.position.set(this.currentPosition.x, this.currentPosition.y);
}
```

### 2. Batch Graphics Updates
```typescript
// Update position and rotation together
updateSprite() {
  this.sprite.x = this.position.x;
  this.sprite.y = this.position.y;
  this.sprite.rotation = this.rotation;
  // PixiJS batches these internally
}
```

### 3. Conditional Updates
```typescript
// Only update animation when moving
update(deltaTime: number): void {
  this.updatePosition(); // Always update position
  
  if (this.agent.isMoving()) {
    this.updateAnimation(deltaTime); // Only when needed
  }
}
```

---

## 📊 Metrics to Track

### During Development
- FPS (should stay at 60)
- Movement responsiveness (< 100ms from input to action)
- Collision accuracy (100% - no wall clipping)
- Animation smoothness (subjective but critical)

### Performance Budget
- Agent.update(): < 0.5ms
- AgentRenderer.update(): < 1ms
- AgentController.update(): < 0.5ms
- **Total**: < 2ms (leaves 14ms for other systems at 60 FPS)

---

## ✅ Day 5-6 Done Checklist

### Functionality
- [ ] Agent spawns at entrance
- [ ] W/A/S/D controls work
- [ ] Arrow keys work
- [ ] Agent moves smoothly between tiles
- [ ] Agent stops at tile centers
- [ ] Agent cannot walk through walls
- [ ] Agent cannot leave maze bounds
- [ ] Camera follows agent smoothly
- [ ] Direction indicator shows correctly
- [ ] Idle animation plays
- [ ] Walk animation plays

### Code Quality
- [ ] All files have proper comments
- [ ] No console errors
- [ ] TypeScript compiles without errors
- [ ] Code follows project conventions
- [ ] No magic numbers (use CONSTANTS)

### Performance
- [ ] 60 FPS maintained
- [ ] No visible lag or stutter
- [ ] Smooth camera following
- [ ] Responsive input

### Documentation
- [ ] Code comments added
- [ ] Day 5-6 summary created
- [ ] Known issues documented

---

## 🎓 Next Steps (Day 7+)

After completing Day 5-6:
1. Day 7: Lighting system & day/night cycle
2. Day 8: Fog of war & view modes
3. Day 9: UI polish & status display

---

**Quick Reference Version**: 1.0  
**Last Updated**: November 3, 2025
