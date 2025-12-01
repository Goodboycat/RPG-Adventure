// File: src/core/loop.js
window.FILE_MANIFEST = window.FILE_MANIFEST || [];
window.FILE_MANIFEST.push({
  name: 'src/core/loop.js',
  exports: ['gameLoop', 'startGame', 'stopGame'],
  dependencies: ['SceneManager', 'Input', 'Game', 'TouchControls', 'Performance', 'FrameRateLimiter']
});

window.lastTime = 0;
window.maxFPS = 60;
window.frameDelay = 1000 / window.maxFPS;  // ~16.67ms for 60fps
window.isRunning = false;
window.animationId = null;

// Performance tracking
window.frameCount = 0;
window.performanceReportInterval = 5000; // Report every 5 seconds
window.lastPerformanceReport = 0;

// Main game loop with delta time and frame rate capping
window.gameLoop = function(timestamp) {
  if (!window.isRunning) return;

  // Update performance metrics
  if (window.Performance) {
    window.Performance.updateMetrics(timestamp - window.lastTime);
  }

  // Use frame rate limiter if available
  if (window.FrameRateLimiter && !window.FrameRateLimiter.shouldRender(timestamp)) {
    window.animationId = requestAnimationFrame(window.gameLoop);
    return;
  }

  // Calculate delta time in milliseconds
  const deltaTime = timestamp - window.lastTime;

  // Get target FPS from performance system
  const targetFPS = window.Performance ? window.Performance.settings.targetFPS : 60;
  const frameDelay = 1000 / targetFPS;

  // Cap at target fps - skip frame if running too fast
  if (deltaTime < frameDelay) {
    window.animationId = requestAnimationFrame(window.gameLoop);
    return;
  }

  // Cap delta time to prevent spiral of death (if tab was inactive)
  const cappedDelta = Math.min(deltaTime, 100);  // Max 100ms (10fps minimum)

  // Apply quality multipliers to delta time
  const qualityMultiplier = window.Performance ? window.Performance.settings.updateQuality : 1.0;
  const adjustedDelta = cappedDelta * qualityMultiplier;

  // Update game time tracking
  if (window.Game && window.Game.updateTime) {
    window.Game.updateTime();
  }

  // Update game systems
  const updateStart = performance.now();
  window.TouchControls.update(adjustedDelta);
  window.SceneManager.update(adjustedDelta);
  const updateEnd = performance.now();

  // Update effects system
  if (window.Effects) {
    window.Effects.update(adjustedDelta);
  }

  // Render game
  const renderStart = performance.now();
  const canvas = document.getElementById('gameCanvas');
  const ctx = canvas.getContext('2d');
  
  // Apply render quality scaling
  if (window.Performance && window.Performance.settings.renderQuality !== 1.0) {
    ctx.save();
    ctx.scale(window.Performance.settings.renderQuality, window.Performance.settings.renderQuality);
  }
  
  // Render scene
  window.SceneManager.render(ctx);
  
  // Render effects
  if (window.Effects) {
    window.Effects.render(ctx);
  }
  
  // Render touch controls overlay
  window.TouchControls.render(ctx);
  
  if (window.Performance && window.Performance.settings.renderQuality !== 1.0) {
    ctx.restore();
  }
  
  const renderEnd = performance.now();

  // Update performance metrics
  if (window.Performance) {
    window.Performance.metrics.updateTime = updateEnd - updateStart;
    window.Performance.metrics.renderTime = renderEnd - renderStart;
  }

  // Performance reporting
  window.frameCount++;
  if (timestamp - window.lastPerformanceReport > window.performanceReportInterval) {
    if (window.Performance && window.Performance.monitoringEnabled) {
      const report = window.Performance.getPerformanceReport();
      console.log('Performance Report:', report);
    }
    window.lastPerformanceReport = timestamp;
  }

  window.lastTime = timestamp;

  window.animationId = requestAnimationFrame(window.gameLoop);
};

// Start the game loop
window.startGame = function() {
  if (window.isRunning) return;

  // Initialize performance systems
  if (window.Performance) {
    window.Performance.init();
  }
  
  if (window.FrameRateLimiter) {
    const targetFPS = window.Performance ? window.Performance.settings.targetFPS : 60;
    window.FrameRateLimiter.init(targetFPS);
  }
  
  if (window.MemoryManager) {
    window.MemoryManager.init();
  }
  
  if (window.QualityManager) {
    window.QualityManager.init();
  }

  window.isRunning = true;
  window.lastTime = performance.now();
  window.lastPerformanceReport = performance.now();
  window.frameCount = 0;
  window.animationId = requestAnimationFrame(window.gameLoop);
  console.log('Game loop started with performance optimizations');
};

// Stop the game loop
window.stopGame = function() {
  window.isRunning = false;
  
  if (window.animationId) {
    cancelAnimationFrame(window.animationId);
    window.animationId = null;
  }
  
  console.log('Game loop stopped');
};

// Initialize game systems
window.initGame = function() {
  console.log('Initializing game systems...');
  
  try {
    // Initialize mobile system first (for device detection)
    if (window.Mobile) {
      window.Mobile.init();
      console.log('Mobile system initialized');
    } else {
      console.warn('Mobile system not available');
    }
    
    // Initialize input system
    if (window.Input) {
      window.Input.init();
      console.log('Input system initialized');
    } else {
      console.error('Input system not available');
    }

    // Initialize touch controls (only on mobile devices)
    if (window.TouchControls) {
      window.TouchControls.init();
      console.log('Touch controls initialized');
    } else {
      console.warn('Touch controls not available');
    }

    // Start with default scene
    if (window.SceneManager && window.SceneManager.switchScene) {
      const success = window.SceneManager.switchScene('overworld');
      if (success) {
        console.log('Overworld scene loaded');
      } else {
        console.error('Failed to load overworld scene');
      }
    } else {
      console.error('SceneManager not available');
    }

    // Start the game loop (will initialize performance systems)
    window.startGame();
    console.log('Game initialization complete');
  } catch (error) {
    console.error('Game systems initialization failed:', error);
    throw error;
  }
};