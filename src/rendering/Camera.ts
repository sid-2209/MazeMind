// src/rendering/Camera.ts
/**
 * Camera - Viewport management (Updated for Day 5-6)
 *
 * Manages:
 * - World to screen coordinate transformation
 * - Zoom in/out
 * - Pan/scroll
 * - Target following (NEW in Day 5-6)
 * - Smooth interpolation
 * - Bounds checking
 */

import { Container } from 'pixi.js';
import { Position, Bounds } from '@/types/index';

export class Camera {
  // Target to render
  private worldContainer: Container;

  // Viewport dimensions (screen space)
  private viewportWidth: number;
  private viewportHeight: number;

  // World dimensions
  private worldWidth: number;
  private worldHeight: number;

  // Camera state
  private position: Position;        // Camera center in world space
  private targetPosition: Position;  // Target position for smooth following (NEW)
  private zoomLevel: number;

  // Configuration
  private smoothing: number = 0.1;   // 0-1, lower = smoother but slower
  private minZoom: number = 0.25;
  private maxZoom: number = 3.0;

  constructor(
    worldContainer: Container,
    viewportWidth: number,
    viewportHeight: number,
    worldWidth: number,
    worldHeight: number
  ) {
    this.worldContainer = worldContainer;
    this.viewportWidth = viewportWidth;
    this.viewportHeight = viewportHeight;
    this.worldWidth = worldWidth;
    this.worldHeight = worldHeight;

    // Fixed camera mode: Camera focal point at world center
    // This way the world center appears at screen center
    this.position = {
      x: worldWidth / 2,
      y: worldHeight / 2
    };
    this.targetPosition = { ...this.position };

    this.zoomLevel = 1.0;

    // Apply initial transform
    this.applyTransform();

    console.log('📷 Camera created (Fixed centered view)');
    console.log(`   Viewport: ${viewportWidth}×${viewportHeight}`);
    console.log(`   World: ${worldWidth}×${worldHeight}`);
    console.log(`   Camera at world center: (${this.position.x}, ${this.position.y})`);
  }

  /**
   * Update camera (called every frame)
   * Fixed camera mode - position never changes (Day 8)
   */
  update(_deltaTime: number): void {
    // Camera is fixed at maze center - no interpolation needed
    // position was set once in constructor and never changes

    // Apply transform to world container
    this.applyTransform();
  }

  /**
   * Set target position for camera to follow (NEW in Day 5-6)
   * @param target - Position in world space to follow
   * @param immediate - If true, snap to position instead of smooth following
   */
  followTarget(target: Position, immediate: boolean = false): void {
    this.targetPosition = { ...target };

    if (immediate) {
      this.position = { ...target };
      this.applyTransform();
    }
  }

  /**
   * Pan camera by delta
   * @param dx - Delta x in screen space
   * @param dy - Delta y in screen space
   */
  pan(dx: number, dy: number): void {
    // Convert screen space delta to world space
    const worldDx = dx / this.zoomLevel;
    const worldDy = dy / this.zoomLevel;

    // Update target position (for smooth following)
    this.targetPosition.x += worldDx;
    this.targetPosition.y += worldDy;

    // Also update current position for immediate pan
    this.position.x += worldDx;
    this.position.y += worldDy;

    this.clampToBounds();
    this.applyTransform();
  }

  /**
   * Zoom in/out
   * @param factor - Zoom factor (e.g., 1.1 = zoom in 10%, 0.9 = zoom out 10%)
   */
  zoom(factor: number): void {
    const newZoom = this.zoomLevel * factor;

    // Clamp to min/max
    this.zoomLevel = Math.max(this.minZoom, Math.min(this.maxZoom, newZoom));

    // Fixed camera mode - no position clamping needed
    // this.clampToBounds();
    this.applyTransform();

    console.log(`📷 Zoom: ${(this.zoomLevel * 100).toFixed(0)}%`);
  }

  /**
   * Set zoom level directly
   */
  setZoom(zoom: number): void {
    this.zoomLevel = Math.max(this.minZoom, Math.min(this.maxZoom, zoom));
    // Fixed camera mode - no position clamping needed
    // this.clampToBounds();
    this.applyTransform();
  }

  /**
   * Set camera position directly (in world space)
   */
  setPosition(x: number, y: number, immediate: boolean = true): void {
    this.targetPosition = { x, y };

    if (immediate) {
      this.position = { x, y };
      this.clampToBounds();
      this.applyTransform();
    }
  }

  /**
   * Reset camera to center of world
   */
  reset(): void {
    this.position = {
      x: this.worldWidth / 2,
      y: this.worldHeight / 2
    };
    this.targetPosition = { ...this.position };
    this.zoomLevel = 1.0;

    this.applyTransform();

    console.log('📷 Camera reset');
  }

  /**
   * Apply camera transform to world container
   * Fixed camera mode - keeps maze centered during zoom
   */
  private applyTransform(): void {
    // Calculate screen center
    const centerX = this.viewportWidth / 2;
    const centerY = this.viewportHeight / 2;

    // Calculate position to keep camera focal point centered at all zoom levels
    // Formula: screenCenter - (cameraWorldPosition × zoomLevel)
    // This prevents the shift that occurs when pivot is scaled
    const finalX = centerX - (this.position.x * this.zoomLevel);
    const finalY = centerY - (this.position.y * this.zoomLevel);

    // Debug logging (only on zoom change)
    if (Math.abs(this.worldContainer.scale.x - this.zoomLevel) > 0.01) {
      console.log(`📷 Zoom changed: ${this.worldContainer.scale.x.toFixed(2)} → ${this.zoomLevel.toFixed(2)}`);
      console.log(`   Viewport: (${this.viewportWidth} × ${this.viewportHeight})`);
      console.log(`   Screen center: (${centerX}, ${centerY})`);
      console.log(`   Camera world pos: (${this.position.x}, ${this.position.y})`);
      console.log(`   Final container pos: (${finalX.toFixed(1)}, ${finalY.toFixed(1)})`);
      console.log(`   World size: (${this.worldWidth} × ${this.worldHeight})`);
    }

    // IMPORTANT: Reset pivot first to ensure clean transform
    this.worldContainer.pivot.set(0, 0);

    // Apply scale
    this.worldContainer.scale.set(this.zoomLevel, this.zoomLevel);

    // Apply position last
    this.worldContainer.position.set(finalX, finalY);
  }

  /**
   * Clamp camera position to world bounds
   */
  private clampToBounds(): void {
    // Calculate visible world area at current zoom
    const visibleWidth = this.viewportWidth / this.zoomLevel;
    const visibleHeight = this.viewportHeight / this.zoomLevel;

    // Calculate bounds
    const minX = visibleWidth / 2;
    const maxX = this.worldWidth - visibleWidth / 2;
    const minY = visibleHeight / 2;
    const maxY = this.worldHeight - visibleHeight / 2;

    // Clamp position
    this.position.x = Math.max(minX, Math.min(maxX, this.position.x));
    this.position.y = Math.max(minY, Math.min(maxY, this.position.y));

    // Also clamp target
    this.targetPosition.x = Math.max(minX, Math.min(maxX, this.targetPosition.x));
    this.targetPosition.y = Math.max(minY, Math.min(maxY, this.targetPosition.y));
  }

  /**
   * Convert screen coordinates to world coordinates
   */
  screenToWorld(screenX: number, screenY: number): Position {
    const centerX = this.viewportWidth / 2;
    const centerY = this.viewportHeight / 2;

    const worldX = (screenX - centerX) / this.zoomLevel + this.position.x;
    const worldY = (screenY - centerY) / this.zoomLevel + this.position.y;

    return { x: worldX, y: worldY };
  }

  /**
   * Convert world coordinates to screen coordinates
   */
  worldToScreen(worldX: number, worldY: number): Position {
    const centerX = this.viewportWidth / 2;
    const centerY = this.viewportHeight / 2;

    const screenX = (worldX - this.position.x) * this.zoomLevel + centerX;
    const screenY = (worldY - this.position.y) * this.zoomLevel + centerY;

    return { x: screenX, y: screenY };
  }

  /**
   * Check if world position is visible in viewport
   */
  isVisible(worldX: number, worldY: number, margin: number = 0): boolean {
    const visibleWidth = this.viewportWidth / this.zoomLevel;
    const visibleHeight = this.viewportHeight / this.zoomLevel;

    const minX = this.position.x - visibleWidth / 2 - margin;
    const maxX = this.position.x + visibleWidth / 2 + margin;
    const minY = this.position.y - visibleHeight / 2 - margin;
    const maxY = this.position.y + visibleHeight / 2 + margin;

    return worldX >= minX && worldX <= maxX && worldY >= minY && worldY <= maxY;
  }

  /**
   * Get visible bounds in world space
   */
  getVisibleBounds(): Bounds {
    const visibleWidth = this.viewportWidth / this.zoomLevel;
    const visibleHeight = this.viewportHeight / this.zoomLevel;

    return {
      left: this.position.x - visibleWidth / 2,
      right: this.position.x + visibleWidth / 2,
      top: this.position.y - visibleHeight / 2,
      bottom: this.position.y + visibleHeight / 2,
    };
  }

  /**
   * Set smoothing factor for target following
   * @param smoothing - 0-1, lower = smoother but slower (0.05-0.2 recommended)
   */
  setSmoothing(smoothing: number): void {
    this.smoothing = Math.max(0.01, Math.min(1, smoothing));
    console.log(`📷 Camera smoothing: ${(this.smoothing * 100).toFixed(0)}%`);
  }

  /**
   * Set zoom limits
   */
  setZoomLimits(min: number, max: number): void {
    this.minZoom = min;
    this.maxZoom = max;

    // Clamp current zoom if needed
    this.zoomLevel = Math.max(min, Math.min(max, this.zoomLevel));
  }

  /**
   * Handle viewport resize
   */
  handleResize(newWidth: number, newHeight: number): void {
    this.viewportWidth = newWidth;
    this.viewportHeight = newHeight;

    this.clampToBounds();
    this.applyTransform();

    console.log(`📷 Camera viewport resized: ${newWidth}×${newHeight}`);
  }

  // Getters
  getPosition(): Position {
    return { ...this.position };
  }

  getTargetPosition(): Position {
    return { ...this.targetPosition };
  }

  getZoom(): number {
    return this.zoomLevel;
  }

  getViewportSize(): { width: number; height: number } {
    return {
      width: this.viewportWidth,
      height: this.viewportHeight
    };
  }

  getWorldSize(): { width: number; height: number } {
    return {
      width: this.worldWidth,
      height: this.worldHeight
    };
  }
}
