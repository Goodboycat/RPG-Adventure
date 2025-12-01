// File: src/utils/math.js
window.FILE_MANIFEST = window.FILE_MANIFEST || [];
window.FILE_MANIFEST.push({
  name: 'src/utils/math.js',
  exports: ['MathUtils'],
  dependencies: []
});

// Utility math functions for game calculations
window.MathUtils = {
  // Clamp value between min and max
  clamp: function(value, min, max) {
    return Math.max(min, Math.min(max, value));
  },

  // Linear interpolation
  lerp: function(start, end, t) {
    return start + (end - start) * t;
  },

  // Distance between two points
  distance: function(x1, y1, x2, y2) {
    const dx = x2 - x1;
    const dy = y2 - y1;
    return Math.sqrt(dx * dx + dy * dy);
  },

  // Random integer between min and max (inclusive)
  randomInt: function(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  },

  // Random float between min and max
  randomFloat: function(min, max) {
    return Math.random() * (max - min) + min;
  },

  // Check if point is in rectangle
  pointInRect: function(px, py, rx, ry, rw, rh) {
    return px >= rx && px <= rx + rw && py >= ry && py <= ry + rh;
  },

  // Convert grid coordinates to pixel position
  gridToPixel: function(gridX, gridY, tileSize) {
    return {
      x: gridX * tileSize,
      y: gridY * tileSize
    };
  },

  // Convert pixel position to grid coordinates
  pixelToGrid: function(pixelX, pixelY, tileSize) {
    return {
      x: Math.floor(pixelX / tileSize),
      y: Math.floor(pixelY / tileSize)
    };
  }
};