// File: src/engine/tilemap.js
window.FILE_MANIFEST = window.FILE_MANIFEST || [];
window.FILE_MANIFEST.push({
  name: 'src/engine/tilemap.js',
  exports: ['Tilemap', 'TileAtlas'],
  dependencies: ['MathUtils', 'Renderer']
});

// Tile atlas system for managing tile textures
window.TileAtlas = class TileAtlas {
  constructor(tileSize = 32) {
    this.tileSize = tileSize;
    this.tiles = new Map();
    this.image = null;
  }

  // Load tile atlas from image
  loadImage(imagePath) {
    this.image = new Image();
    this.image.src = imagePath;
    return new Promise((resolve, reject) => {
      this.image.onload = () => resolve();
      this.image.onerror = () => reject(new Error(`Failed to load tile atlas: ${imagePath}`));
    });
  }

  // Add tile definition with source coordinates
  addTile(id, sourceX, sourceY, collision = false, region = null, bossRequired = null) {
    this.tiles.set(id, {
      id,
      sourceX,
      sourceY,
      collision,
      region,
      bossRequired
    });
  }

  // Get tile definition
  getTile(id) {
    return this.tiles.get(id);
  }

  // Draw tile at screen position
  drawTile(ctx, tileId, screenX, screenY) {
    const tile = this.getTile(tileId);
    if (!tile) return;

    // If no image loaded, draw colored rectangles as fallback
    if (!this.image) {
      const colors = {
        1: '#4CAF50', // Grass
        2: '#8B4513', // Wall
        3: '#D2691E', // Path
        4: '#2196F3', // Water
        5: '#228B22', // Forest
        6: '#696969'  // Mountain
      };
      
      const color = colors[tileId] || '#ffffff';
      window.Renderer.drawRect(screenX, screenY, this.tileSize, this.tileSize, color);
      
      // Add subtle border for tiles
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.2)';
      ctx.strokeRect(screenX, screenY, this.tileSize, this.tileSize);
      return;
    }

    // Use image if available
    window.Renderer.drawSpriteFrame(
      this.image,
      tile.sourceX,
      tile.sourceY,
      this.tileSize,
      this.tileSize,
      screenX,
      screenY,
      this.tileSize,
      this.tileSize
    );
  }
};

// Main tilemap system
window.Tilemap = class Tilemap {
  constructor(width, height, tileSize = 32) {
    this.width = width;
    this.height = height;
    this.tileSize = tileSize;
    this.layers = [];
    this.atlas = null;
    this.camera = { x: 0, y: 0 };
    
    // Collision and region data
    this.collisionLayer = null;
    this.regions = new Map(); // region name -> { x, y, width, height, bossRequired }
  }

  // Set tile atlas
  setAtlas(atlas) {
    this.atlas = atlas;
  }

  // Add map layer
  addLayer(name, data = null) {
    const layer = {
      name,
      data: data || this.generateEmptyLayer(),
      visible: true
    };
    this.layers.push(layer);
    return layer;
  }

  // Generate empty layer data
  generateEmptyLayer() {
    return Array(this.height).fill(null).map(() => Array(this.width).fill(0));
  }

  // Get layer by name
  getLayer(name) {
    return this.layers.find(layer => layer.name === name);
  }

  // Set tile at position on specific layer
  setTile(layerName, x, y, tileId) {
    if (x < 0 || x >= this.width || y < 0 || y >= this.height) return;
    
    const layer = this.getLayer(layerName);
    if (layer) {
      layer.data[y][x] = tileId;
    }
  }

  // Get tile at position on specific layer
  getTile(layerName, x, y) {
    if (x < 0 || x >= this.width || y < 0 || y >= this.height) return null;
    
    const layer = this.getLayer(layerName);
    return layer ? layer.data[y][x] : null;
  }

  // Check collision at world position
  checkCollision(worldX, worldY) {
    if (!this.atlas) return false;

    const gridX = Math.floor(worldX / this.tileSize);
    const gridY = Math.floor(worldY / this.tileSize);

    // Check bounds
    if (gridX < 0 || gridX >= this.width || gridY < 0 || gridY >= this.height) {
      return true; // Out of bounds is considered collision
    }

    // Get tile from collision layer
    const tileId = this.getTile('collision', gridX, gridY);
    if (tileId === null || tileId === 0) return false;

    const tile = this.atlas.getTile(tileId);
    return tile ? tile.collision : false;
  }

  // Get region at world position
  getRegion(worldX, worldY) {
    const gridX = Math.floor(worldX / this.tileSize);
    const gridY = Math.floor(worldY / this.tileSize);

    for (const [regionName, region] of this.regions) {
      if (gridX >= region.x && gridX < region.x + region.width &&
          gridY >= region.y && gridY < region.y + region.height) {
        return { name: regionName, ...region };
      }
    }
    return null;
  }

  // Add region with boss requirement
  addRegion(name, x, y, width, height, bossRequired = null) {
    this.regions.set(name, {
      name,
      x, y, width, height,
      bossRequired
    });
  }

  // Check if player can access region based on boss defeated
  canAccessRegion(regionName, defeatedBosses = []) {
    const region = this.regions.get(regionName);
    if (!region) return true;
    
    if (!region.bossRequired) return true;
    return defeatedBosses.includes(region.bossRequired);
  }

  // Update camera to follow target with smooth interpolation
  updateCamera(targetX, targetY, smoothing = 0.1) {
    const idealX = targetX - window.Renderer.canvas.width / 2;
    const idealY = targetY - window.Renderer.canvas.height / 2;

    // Smooth camera movement
    this.camera.x = window.MathUtils.lerp(this.camera.x, idealX, smoothing);
    this.camera.y = window.MathUtils.lerp(this.camera.y, idealY, smoothing);

    // Keep camera in bounds
    this.camera.x = window.MathUtils.clamp(this.camera.x, 0, 
      this.width * this.tileSize - window.Renderer.canvas.width);
    this.camera.y = window.MathUtils.clamp(this.camera.y, 0, 
      this.height * this.tileSize - window.Renderer.canvas.height);
  }

  // Convert world coordinates to screen coordinates
  worldToScreen(worldX, worldY) {
    return {
      x: worldX - this.camera.x,
      y: worldY - this.camera.y
    };
  }

  // Render all visible layers
  render(ctx, targetX = null, targetY = null) {
    if (!this.atlas) return;

    // Update camera if target provided
    if (targetX !== null && targetY !== null) {
      this.updateCamera(targetX, targetY);
    }

    // Calculate visible tile range
    const startTileX = Math.floor(this.camera.x / this.tileSize);
    const endTileX = Math.ceil((this.camera.x + ctx.canvas.width) / this.tileSize);
    const startTileY = Math.floor(this.camera.y / this.tileSize);
    const endTileY = Math.ceil((this.camera.y + ctx.canvas.height) / this.tileSize);

    // Render each layer
    for (const layer of this.layers) {
      if (!layer.visible) continue;

      for (let y = startTileY; y < endTileY && y < this.height; y++) {
        for (let x = startTileX; x < endTileX && x < this.width; x++) {
          if (x < 0 || y < 0) continue;

          const tileId = layer.data[y][x];
          if (tileId === 0 || tileId === null) continue;

          const screenPos = this.worldToScreen(x * this.tileSize, y * this.tileSize);
          this.atlas.drawTile(ctx, tileId, screenPos.x, screenPos.y);
        }
      }
    }
  }

  // Render debug information
  renderDebug(ctx, playerX, playerY, defeatedBosses = []) {
    // Draw collision layer overlay
    ctx.fillStyle = 'rgba(255, 0, 0, 0.3)';
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        const tileId = this.getTile('collision', x, y);
        if (tileId && this.checkCollision(x * this.tileSize, y * this.tileSize)) {
          const screenPos = this.worldToScreen(x * this.tileSize, y * this.tileSize);
          window.Renderer.drawRect(screenPos.x, screenPos.y, this.tileSize, this.tileSize, ctx.fillStyle);
        }
      }
    }

    // Draw region boundaries
    ctx.strokeStyle = 'rgba(255, 255, 0, 0.8)';
    ctx.lineWidth = 2;
    for (const [regionName, region] of this.regions) {
      const canAccess = this.canAccessRegion(regionName, defeatedBosses);
      ctx.strokeStyle = canAccess ? 'rgba(0, 255, 0, 0.8)' : 'rgba(255, 0, 0, 0.8)';
      
      const screenPos = this.worldToScreen(region.x * this.tileSize, region.y * this.tileSize);
      const screenWidth = region.width * this.tileSize;
      const screenHeight = region.height * this.tileSize;
      
      window.Renderer.drawRect(screenPos.x, screenPos.y, screenWidth, screenHeight, ctx.strokeStyle, false);
      
      // Draw region name
      window.Renderer.drawText(regionName, screenPos.x + 5, screenPos.y + 5, { 
        color: canAccess ? '#00ff00' : '#ff0000' 
      });
    }

    // Draw player position
    const playerScreen = this.worldToScreen(playerX, playerY);
    ctx.fillStyle = 'rgba(0, 255, 255, 0.8)';
    window.Renderer.drawCircle(playerScreen.x, playerScreen.y, 5, ctx.fillStyle);
  }
};