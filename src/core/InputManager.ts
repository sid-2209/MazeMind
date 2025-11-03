// src/core/InputManager.ts
/**
 * InputManager - Centralized input handling
 * 
 * Tracks keyboard keys and mouse state
 * Provides clean API for querying input state
 */

import { Position } from '@/types/index';

export class InputManager {
  // Keyboard state
  private keys: Set<string> = new Set();
  private keysPressed: Map<string, boolean> = new Map();
  
  // Mouse state
  private mousePosition: Position = { x: 0, y: 0 };
  private mouseButtons: Set<number> = new Set();
  private mouseWheel: number = 0;
  
  // Event listeners (for cleanup)
  private listeners: Array<{ target: any; event: string; handler: any }> = [];
  
  constructor() {
    console.log('🎮 InputManager created');
  }
  
  /**
   * Initialize input listeners
   */
  init(): void {
    // Keyboard events
    this.addListener(window, 'keydown', this.handleKeyDown.bind(this));
    this.addListener(window, 'keyup', this.handleKeyUp.bind(this));
    
    // Mouse events
    this.addListener(window, 'mousemove', this.handleMouseMove.bind(this));
    this.addListener(window, 'mousedown', this.handleMouseDown.bind(this));
    this.addListener(window, 'mouseup', this.handleMouseUp.bind(this));
    this.addListener(window, 'wheel', this.handleWheel.bind(this));
    
    // Prevent context menu on right-click
    this.addListener(window, 'contextmenu', (e: Event) => e.preventDefault());
    
    console.log('   Event listeners attached');
  }
  
  /**
   * Add event listener and track for cleanup
   */
  private addListener(target: any, event: string, handler: any): void {
    target.addEventListener(event, handler);
    this.listeners.push({ target, event, handler });
  }
  
  /**
   * Handle keydown event
   */
  private handleKeyDown(e: KeyboardEvent): void {
    this.keys.add(e.key);
    
    // Track if this is a new press (not held)
    if (!this.keysPressed.has(e.key)) {
      this.keysPressed.set(e.key, true);
    }
  }
  
  /**
   * Handle keyup event
   */
  private handleKeyUp(e: KeyboardEvent): void {
    this.keys.delete(e.key);
    this.keysPressed.delete(e.key);
  }
  
  /**
   * Handle mousemove event
   */
  private handleMouseMove(e: MouseEvent): void {
    this.mousePosition = {
      x: e.clientX,
      y: e.clientY,
    };
  }
  
  /**
   * Handle mousedown event
   */
  private handleMouseDown(e: MouseEvent): void {
    this.mouseButtons.add(e.button);
  }
  
  /**
   * Handle mouseup event
   */
  private handleMouseUp(e: MouseEvent): void {
    this.mouseButtons.delete(e.button);
  }
  
  /**
   * Handle wheel event
   */
  private handleWheel(e: WheelEvent): void {
    this.mouseWheel = e.deltaY;
  }
  
  /**
   * Check if key is currently pressed
   * @param key - Key to check (e.g., 'w', 'ArrowUp', ' ')
   */
  isKeyPressed(key: string): boolean {
    return this.keys.has(key);
  }
  
  /**
   * Check if key was just pressed this frame
   * @param key - Key to check
   */
  isKeyJustPressed(key: string): boolean {
    return this.keysPressed.has(key);
  }
  
  /**
   * Check if any of the provided keys are pressed
   * @param keys - Array of keys to check
   */
  isAnyKeyPressed(keys: string[]): boolean {
    return keys.some((key) => this.keys.has(key));
  }
  
  /**
   * Get current mouse position
   */
  getMousePosition(): Position {
    return { ...this.mousePosition };
  }
  
  /**
   * Check if mouse button is pressed
   * @param button - Button number (0 = left, 1 = middle, 2 = right)
   */
  isMouseButtonPressed(button: number): boolean {
    return this.mouseButtons.has(button);
  }
  
  /**
   * Get mouse wheel delta
   */
  getMouseWheel(): number {
    return this.mouseWheel;
  }
  
  /**
   * Get movement direction from WASD or arrow keys
   * Returns normalized direction vector or null if not moving
   */
  getMovementDirection(): { x: number; y: number } | null {
    let dx = 0;
    let dy = 0;
    
    // WASD
    if (this.isKeyPressed('w') || this.isKeyPressed('W')) dy -= 1;
    if (this.isKeyPressed('s') || this.isKeyPressed('S')) dy += 1;
    if (this.isKeyPressed('a') || this.isKeyPressed('A')) dx -= 1;
    if (this.isKeyPressed('d') || this.isKeyPressed('D')) dx += 1;
    
    // Arrow keys
    if (this.isKeyPressed('ArrowUp')) dy -= 1;
    if (this.isKeyPressed('ArrowDown')) dy += 1;
    if (this.isKeyPressed('ArrowLeft')) dx -= 1;
    if (this.isKeyPressed('ArrowRight')) dx += 1;
    
    // No movement
    if (dx === 0 && dy === 0) return null;
    
    // Normalize diagonal movement
    const length = Math.sqrt(dx * dx + dy * dy);
    return {
      x: dx / length,
      y: dy / length,
    };
  }
  
  /**
   * Reset per-frame state (call at end of frame)
   */
  reset(): void {
    // Clear just-pressed keys
    this.keysPressed.clear();
    
    // Reset mouse wheel
    this.mouseWheel = 0;
  }
  
  /**
   * Cleanup and remove all listeners
   */
  destroy(): void {
    console.log('🗑️  Destroying InputManager...');
    
    // Remove all event listeners
    for (const { target, event, handler } of this.listeners) {
      target.removeEventListener(event, handler);
    }
    
    this.listeners = [];
    this.keys.clear();
    this.keysPressed.clear();
    this.mouseButtons.clear();
  }
}
