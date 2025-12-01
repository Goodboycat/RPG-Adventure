// File: src/engine/renderer.js
window.FILE_MANIFEST = window.FILE_MANIFEST || [];
window.FILE_MANIFEST.push({
  name: 'src/engine/renderer.js',
  exports: ['Renderer'],
  dependencies: ['MathUtils']
});

// Rendering system for canvas operations
window.Renderer = {
  canvas: null,
  ctx: null,

  // Initialize renderer
  init: function() {
    this.canvas = document.getElementById('gameCanvas');
    this.ctx = this.canvas.getContext('2d');
    
    // Enable image smoothing for pixel art
    this.ctx.imageSmoothingEnabled = false;
  },

  // Clear the entire canvas
  clear: function(color = '#000000') {
    this.ctx.fillStyle = color;
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
  },

  // Draw rectangle
  drawRect: function(x, y, width, height, color = '#ffffff', filled = true) {
    this.ctx.fillStyle = color;
    if (filled) {
      this.ctx.fillRect(x, y, width, height);
    } else {
      this.ctx.strokeStyle = color;
      this.ctx.strokeRect(x, y, width, height);
    }
  },

  // Draw circle
  drawCircle: function(x, y, radius, color = '#ffffff', filled = true) {
    this.ctx.beginPath();
    this.ctx.arc(x, y, radius, 0, Math.PI * 2);
    
    if (filled) {
      this.ctx.fillStyle = color;
      this.ctx.fill();
    } else {
      this.ctx.strokeStyle = color;
      this.ctx.stroke();
    }
  },

  // Draw text
  drawText: function(text, x, y, options = {}) {
    const {
      font = '16px monospace',
      color = '#ffffff',
      align = 'left',
      baseline = 'top'
    } = options;

    this.ctx.font = font;
    this.ctx.fillStyle = color;
    this.ctx.textAlign = align;
    this.ctx.textBaseline = baseline;
    this.ctx.fillText(text, x, y);
  },

  // Draw centered text
  drawCenteredText: function(text, centerX, centerY, options = {}) {
    const { font = '16px monospace', color = '#ffffff' } = options;
    
    this.ctx.font = font;
    this.ctx.fillStyle = color;
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
    this.ctx.fillText(text, centerX, centerY);
  },

  // Draw image
  drawImage: function(image, x, y, width = null, height = null) {
    if (width && height) {
      this.ctx.drawImage(image, x, y, width, height);
    } else {
      this.ctx.drawImage(image, x, y);
    }
  },

  // Draw sprite sheet frame
  drawSpriteFrame: function(image, sourceX, sourceY, sourceWidth, sourceHeight, destX, destY, destWidth = null, destHeight = null) {
    const drawWidth = destWidth || sourceWidth;
    const drawHeight = destHeight || sourceHeight;
    
    this.ctx.drawImage(
      image,
      sourceX, sourceY, sourceWidth, sourceHeight,
      destX, destY, drawWidth, drawHeight
    );
  },

  // Set global alpha
  setAlpha: function(alpha) {
    this.ctx.globalAlpha = alpha;
  },

  // Reset alpha to full opacity
  resetAlpha: function() {
    this.ctx.globalAlpha = 1;
  }
};