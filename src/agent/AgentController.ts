// src/agent/AgentController.ts
/**
 * AgentController - Input handling and agent control
 * 
 * Manages:
 * - User input processing (WASD/Arrow keys)
 * - Movement validation
 * - Camera following
 * - Input buffering
 * 
 * Week 1, Day 5-6: Manual keyboard control
 * Week 2+: AI-driven autonomous control (replaces this)
 */

import { Agent } from './Agent';
import { InputManager } from '../core/InputManager';
import { Camera } from '../rendering/Camera';
import { Direction, Position } from '../types';

export class AgentController {
  private agent: Agent;
  private inputManager: InputManager;
  // @ts-ignore - Kept for future use when camera follow is re-enabled
  private _camera: Camera;
  
  // Input configuration
  private inputCooldown: number = 0;
  private readonly INPUT_COOLDOWN_TIME = 0.05; // Prevent input spam (50ms)

  // Configuration
  private enabled: boolean = true;
  
  constructor(agent: Agent, inputManager: InputManager, camera: Camera) {
    this.agent = agent;
    this.inputManager = inputManager;
    this._camera = camera;

    console.log('🎮 AgentController created (Fixed camera mode)');
  }
  
  /**
   * Update controller (called every frame)
   */
  update(deltaTime: number): void {
    if (!this.enabled) return;
    
    // Update input cooldown
    if (this.inputCooldown > 0) {
      this.inputCooldown -= deltaTime;
    }
    
    // Handle movement input (only when not moving or cooldown expired)
    if (!this.agent.isMoving() && this.inputCooldown <= 0) {
      this.handleMovementInput();
    }
    
    // Update camera to follow agent
    this.updateCamera();
  }
  
  /**
   * Handle WASD/Arrow key input for movement
   */
  private handleMovementInput(): void {
    const direction = this.getDesiredDirection();
    
    if (direction !== null) {
      this.attemptMove(direction);
    }
  }
  
  /**
   * Get desired movement direction from current input state
   * Priority: Most recently pressed key
   */
  private getDesiredDirection(): Direction | null {
    // Check WASD keys
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
   * Attempt to move agent in specified direction
   * @returns true if movement started, false if blocked
   */
  private attemptMove(direction: Direction): boolean {
    const targetTile = this.getTileInDirection(direction);
    
    // Validate move
    if (!this.agent.canMoveTo(targetTile)) {
      // Movement blocked - could play sound or show feedback here
      console.log(`🚫 Movement blocked: ${Direction[direction]}`);
      return false;
    }
    
    // Start movement
    const success = this.agent.moveTo(targetTile);
    
    if (success) {
      // Start input cooldown to prevent movement spam
      this.inputCooldown = this.INPUT_COOLDOWN_TIME;
      
      console.log(`✓ Moving ${Direction[direction]} to (${targetTile.x}, ${targetTile.y})`);
    }
    
    return success;
  }
  
  /**
   * Get tile coordinates in specified direction from agent's current position
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
   * Update camera to smoothly follow agent
   * NOTE: Disabled for fixed camera view - camera stays centered on maze
   */
  private updateCamera(): void {
    // Camera follow disabled - using fixed camera view
    // const agentPos = this.agent.getPosition();
    // this.camera.followTarget(agentPos);
  }
  
  /**
   * Enable/disable controller
   */
  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
    console.log(enabled ? '✓ Controller enabled' : '⏸️  Controller disabled');
  }
  
  /**
   * Check if controller is enabled
   */
  isEnabled(): boolean {
    return this.enabled;
  }
  
  /**
   * Force stop agent movement (useful for pause, cutscenes, etc.)
   */
  stopMovement(): void {
    this.agent.stopMovement();
    this.inputCooldown = 0;
  }
  
  // ============================================
  // Future: AI Control (Week 2+)
  // ============================================
  
  /**
   * Move agent to specific tile (for AI control in Week 2+)
   * This bypasses input and directly commands movement
   */
  moveToTile(targetTile: Position): boolean {
    // Check if tile is adjacent
    const currentTile = this.agent.getTilePosition();
    const dx = Math.abs(targetTile.x - currentTile.x);
    const dy = Math.abs(targetTile.y - currentTile.y);
    
    if (dx + dy !== 1) {
      console.error('❌ AI move: Target tile not adjacent');
      return false;
    }
    
    // Attempt move
    return this.agent.moveTo(targetTile);
  }
  
  /**
   * Queue next movement direction (for AI path following in Week 2+)
   */
  queueMove(_direction: Direction): void {
    // TODO: Week 2+ - Implement movement queue for AI path following
  }
  
  // ============================================
  // Debug
  // ============================================
  
  /**
   * Get debug info
   */
  getDebugInfo(): string {
    const currentInput = this.getDesiredDirection();
    return `Controller: ${this.enabled ? 'Enabled' : 'Disabled'}
Input: ${currentInput !== null ? Direction[currentInput] : 'None'}
Cooldown: ${this.inputCooldown > 0 ? this.inputCooldown.toFixed(2) + 's' : 'Ready'}`;
  }
}
