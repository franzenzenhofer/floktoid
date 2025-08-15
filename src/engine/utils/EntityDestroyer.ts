/**
 * EntityDestroyer - DRY entity destruction utility
 * Safely handles entity cleanup without crashes or memory leaks
 */

import * as PIXI from 'pixi.js';

type DestroyableSprite = PIXI.Graphics | PIXI.Sprite | PIXI.Container | PIXI.Text;

/**
 * Safely destroy a PIXI display object and remove from parent
 * @param sprite - The display object to destroy
 * @param parent - Optional parent container to remove from
 */
export function safeDestroySprite(sprite: DestroyableSprite | null | undefined, parent?: PIXI.Container): void {
  if (!sprite) return;
  
  try {
    // Remove from parent if it has one
    if (sprite.parent) {
      sprite.parent.removeChild(sprite);
    } else if (parent && parent.children.includes(sprite)) {
      parent.removeChild(sprite);
    }
    
    // Destroy if not already destroyed
    if ('destroyed' in sprite && !sprite.destroyed) {
      sprite.destroy();
    }
  } catch (e) {
    console.warn('[EntityDestroyer] Failed to destroy sprite:', e);
  }
}

/**
 * Safely remove a ticker callback
 * @param ticker - The PIXI ticker
 * @param callback - The callback function to remove
 */
export function safeRemoveTickerCallback(ticker: PIXI.Ticker, callback: () => void): void {
  if (!ticker || !callback) return;
  
  try {
    ticker.remove(callback);
  } catch (e) {
    console.warn('[EntityDestroyer] Failed to remove ticker callback:', e);
  }
}

/**
 * Batch destroy multiple sprites
 * @param sprites - Array of sprites to destroy
 * @param parent - Optional parent container
 */
export function batchDestroySprites(sprites: (DestroyableSprite | null | undefined)[], parent?: PIXI.Container): void {
  sprites.forEach(sprite => safeDestroySprite(sprite, parent));
}

/**
 * Complete entity destruction pattern
 * Handles ticker callbacks, sprites, and cleanup
 */
export class EntityDestroyer {
  /**
   * Destroy an entity with all its resources
   * @param entity - The entity object
   * @param options - Destruction options
   */
  static destroyEntity(
    entity: {
      sprite?: DestroyableSprite;
      glowSprite?: DestroyableSprite;
      trailSprite?: DestroyableSprite;
      sprites?: DestroyableSprite[];
      app?: PIXI.Application;
      ticker?: PIXI.Ticker;
      update?: () => void;
      draw?: () => void;
      destroyed?: boolean;
      alive?: boolean;
    },
    options: {
      removeTickerCallbacks?: boolean;
      markAsDestroyed?: boolean;
    } = {}
  ): void {
    // Early exit if already destroyed
    if (entity.destroyed) return;
    
    // Mark as dead/destroyed first to prevent further updates
    if (options.markAsDestroyed) {
      entity.destroyed = true;
      if ('alive' in entity) {
        entity.alive = false;
      }
    }
    
    // Remove ticker callbacks
    if (options.removeTickerCallbacks) {
      const ticker = entity.app?.ticker || entity.ticker;
      if (ticker) {
        if (entity.update) safeRemoveTickerCallback(ticker, entity.update);
        if (entity.draw) safeRemoveTickerCallback(ticker, entity.draw);
      }
    }
    
    // Destroy sprites
    const parent = entity.app?.stage;
    if (entity.sprite) safeDestroySprite(entity.sprite, parent);
    if (entity.glowSprite) safeDestroySprite(entity.glowSprite, parent);
    if (entity.trailSprite) safeDestroySprite(entity.trailSprite, parent);
    if (entity.sprites) batchDestroySprites(entity.sprites, parent);
  }
  
  /**
   * Destroy multiple entities in batch
   * @param entities - Array of entities
   * @param options - Destruction options
   */
  static batchDestroy<T extends object>(
    entities: T[],
    options: Parameters<typeof EntityDestroyer.destroyEntity>[1] = {}
  ): void {
    entities.forEach(entity => this.destroyEntity(entity, options));
  }
}