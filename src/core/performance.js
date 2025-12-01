// File: src/core/performance.js
window.FILE_MANIFEST = window.FILE_MANIFEST || [];
window.FILE_MANIFEST.push({
  name: 'src/core/performance.js',
  exports: ['Performance', 'FrameRateLimiter', 'MemoryManager', 'QualityManager'],
  dependencies: ['Mobile']
});

// Mobile performance optimization system
window.Performance = {
  // Performance monitoring
  metrics: {
    fps: 60,
    frameTime: 16.67,
    memoryUsage: 0,
    activeParticles: 0,
    activeEffects: 0,
    drawCalls: 0,
    updateTime: 0,
    renderTime: 0
  },
  
  // Performance history for averaging
  history: {
    fps: [],
    frameTime: [],
    memoryUsage: []
  },
  
  // Adaptive settings
  settings: {
    targetFPS: 60,
    maxParticles: 50,
    maxEffects: 10,
    particleQuality: 'medium',  // low, medium, high
    effectQuality: 'medium',    // low, medium, high
    touchThrottle: 16,          // Touch event throttle in ms
    renderQuality: 1.0,         // Global render quality multiplier
    updateQuality: 1.0          // Global update quality multiplier
  },
  
  // Device-specific configurations
  deviceConfigs: {
    LOW: {
      targetFPS: 30,
      maxParticles: 20,
      maxEffects: 5,
      particleQuality: 'low',
      effectQuality: 'low',
      touchThrottle: 33,
      renderQuality: 0.7,
      updateQuality: 0.8
    },
    MEDIUM: {
      targetFPS: 45,
      maxParticles: 35,
      maxEffects: 7,
      particleQuality: 'medium',
      effectQuality: 'medium',
      touchThrottle: 22,
      renderQuality: 0.85,
      updateQuality: 0.9
    },
    HIGH: {
      targetFPS: 60,
      maxParticles: 50,
      maxEffects: 10,
      particleQuality: 'high',
      effectQuality: 'high',
      touchThrottle: 16,
      renderQuality: 1.0,
      updateQuality: 1.0
    },
    ULTRA: {
      targetFPS: 60,
      maxParticles: 75,
      maxEffects: 15,
      particleQuality: 'high',
      effectQuality: 'high',
      touchThrottle: 8,
      renderQuality: 1.2,
      updateQuality: 1.1
    }
  },
  
  // Touch event throttling
  touchThrottleTimer: null,
  lastTouchTime: 0,
  
  // Performance monitoring state
  monitoringEnabled: true,
  lastFrameTime: performance.now(),
  
  // Initialize performance system
  init: function() {
    this.loadDeviceConfiguration();
    this.setupPerformanceMonitoring();
    this.setupTouchThrottling();
    this.setupMemoryManagement();
    
    console.log(`Performance initialized for ${window.Mobile.deviceTier} device`);
    console.log('Target FPS:', this.settings.targetFPS);
    console.log('Max particles:', this.settings.maxParticles);
  },
  
  // Load device-specific configuration
  loadDeviceConfiguration: function() {
    const deviceTier = window.Mobile.deviceTier || 'MEDIUM';
    const config = this.deviceConfigs[deviceTier];
    
    if (config) {
      Object.assign(this.settings, config);
    }
  },
  
  // Setup performance monitoring
  setupPerformanceMonitoring: function() {
    // Monitor FPS
    this.frameTimeHistory = [];
    this.lastFrameTime = performance.now();
    
    // Monitor memory (if available)
    if (performance.memory) {
      this.startMemoryMonitoring();
    }
    
    // Monitor active entities
    this.startEntityMonitoring();
  },
  
  // Start memory monitoring
  startMemoryMonitoring: function() {
    setInterval(() => {
      if (performance.memory) {
        this.metrics.memoryUsage = performance.memory.usedJSHeapSize / 1048576; // MB
        this.history.memoryUsage.push(this.metrics.memoryUsage);
        
        // Keep only last 60 samples (1 minute at 1Hz)
        if (this.history.memoryUsage.length > 60) {
          this.history.memoryUsage.shift();
        }
        
        // Trigger garbage collection if memory is high
        if (this.metrics.memoryUsage > 100 && window.gc) {
          window.gc();
        }
      }
    }, 1000);
  },
  
  // Start entity monitoring
  startEntityMonitoring: function() {
    setInterval(() => {
      // Count active particles and effects
      if (window.Effects && window.Effects.activeEffects) {
        this.metrics.activeEffects = window.Effects.activeEffects.length;
      }
      
      // Average FPS over last second
      if (this.history.fps.length > 0) {
        const avgFPS = this.history.fps.reduce((a, b) => a + b, 0) / this.history.fps.length;
        this.metrics.fps = Math.round(avgFPS);
      }
    }, 1000);
  },
  
  // Setup touch event throttling
  setupTouchThrottling: function() {
    // Override input handlers with throttled versions
    const originalHandleTouchMove = window.Input.handleTouchMove;
    const originalHandleTouchStart = window.Input.handleTouchStart;
    
    window.Input.handleTouchStart = (e) => {
      this.throttledTouchHandler(originalHandleTouchStart, e);
    };
    
    window.Input.handleTouchMove = (e) => {
      this.throttledTouchHandler(originalHandleTouchMove, e);
    };
  },
  
  // Throttled touch handler
  throttledTouchHandler: function(originalHandler, event) {
    const now = Date.now();
    
    if (now - this.lastTouchTime >= this.settings.touchThrottle) {
      this.lastTouchTime = now;
      originalHandler.call(window.Input, event);
    }
  },
  
  // Setup memory management
  setupMemoryManagement: function() {
    // Periodic cleanup
    setInterval(() => {
      this.performMemoryCleanup();
    }, 30000); // Every 30 seconds
    
    // Memory pressure detection
    this.detectMemoryPressure();
  },
  
  // Perform memory cleanup
  performMemoryCleanup: function() {
    // Clear old performance history
    if (this.history.fps.length > 300) {
      this.history.fps = this.history.fps.slice(-300);
    }
    
    if (this.history.frameTime.length > 300) {
      this.history.frameTime = this.history.frameTime.slice(-300);
    }
    
    // Cleanup completed effects
    if (window.Effects) {
      window.Effects.activeEffects = window.Effects.activeEffects.filter(effect => {
        return !effect.isComplete();
      });
    }
    
    // Force garbage collection if available
    if (window.gc) {
      window.gc();
    }
  },
  
  // Detect memory pressure and adjust settings
  detectMemoryPressure: function() {
    if (!performance.memory) return;
    
    const memoryUsage = performance.memory.usedJSHeapSize / performance.memory.jsHeapSizeLimit;
    
    if (memoryUsage > 0.8) {
      // High memory pressure - reduce quality
      this.reduceQuality();
      console.warn('High memory pressure detected, reducing quality');
    } else if (memoryUsage < 0.5) {
      // Low memory pressure - can increase quality
      this.maybeIncreaseQuality();
    }
  },
  
  // Update performance metrics
  updateMetrics: function(deltaTime) {
    const now = performance.now();
    const frameTime = now - this.lastFrameTime;
    
    // Calculate FPS
    const fps = 1000 / frameTime;
    this.history.fps.push(fps);
    this.history.frameTime.push(frameTime);
    
    // Keep only last 60 samples
    if (this.history.fps.length > 60) {
      this.history.fps.shift();
      this.history.frameTime.shift();
    }
    
    this.lastFrameTime = now;
    
    // Adaptive quality adjustment
    this.adaptiveQualityAdjustment();
  },
  
  // Adaptive quality adjustment based on performance
  adaptiveQualityAdjustment: function() {
    if (!this.monitoringEnabled) return;
    
    const avgFPS = this.history.fps.length > 10 ? 
      this.history.fps.slice(-10).reduce((a, b) => a + b, 0) / 10 : 
      this.metrics.fps;
    
    const targetFPS = this.settings.targetFPS;
    const deviation = (avgFPS - targetFPS) / targetFPS;
    
    // If performance is significantly below target, reduce quality
    if (deviation < -0.2 && avgFPS < targetFPS - 10) {
      this.reduceQuality();
    } else if (deviation > 0.2 && avgFPS > targetFPS + 10) {
      // If performance is significantly above target, maybe increase quality
      this.maybeIncreaseQuality();
    }
  },
  
  // Reduce quality settings
  reduceQuality: function() {
    const currentQuality = this.getQualityLevel();
    
    if (currentQuality === 'high') {
      this.setQualityLevel('medium');
    } else if (currentQuality === 'medium') {
      this.setQualityLevel('low');
    }
  },
  
  // Maybe increase quality (only if memory is available)
  maybeIncreaseQuality: function() {
    const memoryUsage = performance.memory ? 
      performance.memory.usedJSHeapSize / performance.memory.jsHeapSizeLimit : 0.5;
    
    if (memoryUsage < 0.6) {
      const currentQuality = this.getQualityLevel();
      
      if (currentQuality === 'low') {
        this.setQualityLevel('medium');
      } else if (currentQuality === 'medium' && window.Mobile.deviceTier === 'HIGH') {
        this.setQualityLevel('high');
      }
    }
  },
  
  // Get current quality level
  getQualityLevel: function() {
    if (this.settings.particleQuality === 'low' && this.settings.effectQuality === 'low') {
      return 'low';
    } else if (this.settings.particleQuality === 'high' && this.settings.effectQuality === 'high') {
      return 'high';
    }
    return 'medium';
  },
  
  // Set quality level
  setQualityLevel: function(level) {
    const configs = {
      low: {
        maxParticles: 15,
        maxEffects: 3,
        particleQuality: 'low',
        effectQuality: 'low',
        renderQuality: 0.6
      },
      medium: {
        maxParticles: 35,
        maxEffects: 7,
        particleQuality: 'medium',
        effectQuality: 'medium',
        renderQuality: 0.85
      },
      high: {
        maxParticles: 50,
        maxEffects: 10,
        particleQuality: 'high',
        effectQuality: 'high',
        renderQuality: 1.0
      }
    };
    
    const config = configs[level];
    if (config) {
      Object.assign(this.settings, config);
      console.log(`Quality set to ${level}`);
    }
  },
  
  // Check if particle effect should be created
  shouldCreateParticle: function(priority = 'normal') {
    if (!window.Effects || !window.Effects.activeEffects) return false;
    
    const particleCount = window.Effects.activeEffects.filter(e => e instanceof window.Particle).length;
    
    // Adjust threshold based on priority and quality
    let maxParticles = this.settings.maxParticles;
    if (priority === 'high') maxParticles *= 1.5;
    if (priority === 'low') maxParticles *= 0.7;
    
    return particleCount < maxParticles;
  },
  
  // Check if effect should be created
  shouldCreateEffect: function(priority = 'normal') {
    if (!window.Effects || !window.Effects.activeEffects) return false;
    
    const effectCount = window.Effects.activeEffects.length;
    
    // Adjust threshold based on priority and quality
    let maxEffects = this.settings.maxEffects;
    if (priority === 'high') maxEffects *= 1.5;
    if (priority === 'low') maxEffects *= 0.7;
    
    return effectCount < maxEffects;
  },
  
  // Get performance metrics
  getMetrics: function() {
    return {
      ...this.metrics,
      qualityLevel: this.getQualityLevel(),
      targetFPS: this.settings.targetFPS,
      maxParticles: this.settings.maxParticles,
      maxEffects: this.settings.maxEffects,
      deviceTier: window.Mobile.deviceTier
    };
  },
  
  // Get performance report
  getPerformanceReport: function() {
    const avgFPS = this.history.fps.length > 0 ? 
      this.history.fps.reduce((a, b) => a + b, 0) / this.history.fps.length : 0;
    
    const avgFrameTime = this.history.frameTime.length > 0 ? 
      this.history.frameTime.reduce((a, b) => a + b, 0) / this.history.frameTime.length : 0;
    
    return {
      averageFPS: Math.round(avgFPS),
      targetFPS: this.settings.targetFPS,
      averageFrameTime: Math.round(avgFrameTime * 100) / 100,
      currentMemoryUsage: Math.round(this.metrics.memoryUsage),
      qualityLevel: this.getQualityLevel(),
      deviceTier: window.Mobile.deviceTier,
      activeParticles: this.metrics.activeParticles,
      activeEffects: this.metrics.activeEffects
    };
  },
  
  // Enable/disable performance monitoring
  setMonitoringEnabled: function(enabled) {
    this.monitoringEnabled = enabled;
  },
  
  // Reset performance metrics
  resetMetrics: function() {
    this.history.fps = [];
    this.history.frameTime = [];
    this.history.memoryUsage = [];
    this.metrics = {
      fps: 60,
      frameTime: 16.67,
      memoryUsage: 0,
      activeParticles: 0,
      activeEffects: 0,
      drawCalls: 0,
      updateTime: 0,
      renderTime: 0
    };
  }
};

// Frame rate limiter
window.FrameRateLimiter = {
  targetFPS: 60,
  frameDelay: 1000 / 60,
  lastFrameTime: 0,
  
  // Initialize with target FPS
  init: function(targetFPS = 60) {
    this.targetFPS = targetFPS;
    this.frameDelay = 1000 / targetFPS;
    this.lastFrameTime = performance.now();
  },
  
  // Check if frame should be rendered
  shouldRender: function(timestamp) {
    const deltaTime = timestamp - this.lastFrameTime;
    
    if (deltaTime >= this.frameDelay) {
      this.lastFrameTime = timestamp;
      return true;
    }
    
    return false;
  },
  
  // Get current FPS
  getCurrentFPS: function() {
    return this.targetFPS;
  },
  
  // Update target FPS
  setTargetFPS: function(fps) {
    this.targetFPS = Math.max(1, Math.min(fps, 120));
    this.frameDelay = 1000 / this.targetFPS;
  }
};

// Memory manager for mobile constraints
window.MemoryManager = {
  // Memory thresholds (in MB)
  thresholds: {
    warning: 50,
    critical: 80,
    emergency: 100
  },
  
  // Cache management
  imageCache: new Map(),
  soundCache: new Map(),
  
  // Initialize memory management
  init: function() {
    this.setupMemoryMonitoring();
    this.setupCacheCleanup();
  },
  
  // Setup memory monitoring
  setupMemoryMonitoring: function() {
    if (!performance.memory) {
      console.warn('Memory monitoring not available');
      return;
    }
    
    setInterval(() => {
      this.checkMemoryUsage();
    }, 5000);
  },
  
  // Check memory usage and take action
  checkMemoryUsage: function() {
    if (!performance.memory) return;
    
    const usedMB = performance.memory.usedJSHeapSize / 1048576;
    
    if (usedMB > this.thresholds.emergency) {
      this.emergencyCleanup();
    } else if (usedMB > this.thresholds.critical) {
      this.criticalCleanup();
    } else if (usedMB > this.thresholds.warning) {
      this.warningCleanup();
    }
  },
  
  // Warning level cleanup
  warningCleanup: function() {
    console.log('Performing warning level memory cleanup');
    this.clearExpiredCache();
    this.reduceEffectQuality();
  },
  
  // Critical level cleanup
  criticalCleanup: function() {
    console.log('Performing critical level memory cleanup');
    this.clearCache();
    this.clearEffects();
    window.Performance.setQualityLevel('low');
  },
  
  // Emergency level cleanup
  emergencyCleanup: function() {
    console.log('Performing emergency memory cleanup');
    this.clearAllCaches();
    this.clearEffects();
    this.forceGarbageCollection();
    
    // Notify user if needed
    if (window.Game && window.Game.showMemoryWarning) {
      window.Game.showMemoryWarning();
    }
  },
  
  // Clear expired cache entries
  clearExpiredCache: function() {
    const now = Date.now();
    
    for (const [key, value] of this.imageCache.entries()) {
      if (value.expiry && now > value.expiry) {
        this.imageCache.delete(key);
      }
    }
    
    for (const [key, value] of this.soundCache.entries()) {
      if (value.expiry && now > value.expiry) {
        this.soundCache.delete(key);
      }
    }
  },
  
  // Clear cache
  clearCache: function() {
    this.imageCache.clear();
    this.soundCache.clear();
  },
  
  // Clear all caches
  clearAllCaches: function() {
    this.clearCache();
    
    // Clear other potential caches
    if (window.renderer && window.renderer.clearCache) {
      window.renderer.clearCache();
    }
  },
  
  // Clear effects
  clearEffects: function() {
    if (window.Effects) {
      window.Effects.clear();
    }
  },
  
  // Reduce effect quality
  reduceEffectQuality: function() {
    window.Performance.reduceQuality();
  },
  
  // Force garbage collection
  forceGarbageCollection: function() {
    if (window.gc) {
      window.gc();
    }
  },
  
  // Setup periodic cache cleanup
  setupCacheCleanup: function() {
    setInterval(() => {
      this.clearExpiredCache();
    }, 60000); // Every minute
  },
  
  // Cache an image
  cacheImage: function(key, image, expiry = null) {
    this.imageCache.set(key, {
      data: image,
      expiry: expiry ? Date.now() + expiry : null
    });
  },
  
  // Get cached image
  getCachedImage: function(key) {
    const cached = this.imageCache.get(key);
    return cached ? cached.data : null;
  },
  
  // Get memory usage info
  getMemoryInfo: function() {
    if (!performance.memory) {
      return { available: false };
    }
    
    return {
      available: true,
      used: Math.round(performance.memory.usedJSHeapSize / 1048576),
      total: Math.round(performance.memory.totalJSHeapSize / 1048576),
      limit: Math.round(performance.memory.jsHeapSizeLimit / 1048576),
      percentage: Math.round((performance.memory.usedJSHeapSize / performance.memory.jsHeapSizeLimit) * 100)
    };
  }
};

// Quality manager for dynamic adjustment
window.QualityManager = {
  currentProfile: 'auto',
  
  profiles: {
    power: {
      name: 'Power Saving',
      targetFPS: 30,
      particleQuality: 'low',
      effectQuality: 'low',
      renderQuality: 0.6
    },
    balanced: {
      name: 'Balanced',
      targetFPS: 45,
      particleQuality: 'medium',
      effectQuality: 'medium',
      renderQuality: 0.8
    },
    performance: {
      name: 'High Performance',
      targetFPS: 60,
      particleQuality: 'high',
      effectQuality: 'high',
      renderQuality: 1.0
    },
    auto: {
      name: 'Auto (Adaptive)',
      targetFPS: null, // Uses device detection
      particleQuality: null,
      effectQuality: null,
      renderQuality: null
    }
  },
  
  // Initialize quality manager
  init: function() {
    this.loadSavedProfile();
    this.applyCurrentProfile();
  },
  
  // Load saved quality profile
  loadSavedProfile: function() {
    const saved = localStorage.getItem('qualityProfile');
    if (saved && this.profiles[saved]) {
      this.currentProfile = saved;
    }
  },
  
  // Apply current quality profile
  applyCurrentProfile: function() {
    const profile = this.profiles[this.currentProfile];
    
    if (!profile) return;
    
    if (this.currentProfile === 'auto') {
      // Use device-specific settings
      window.Performance.loadDeviceConfiguration();
    } else {
      // Apply manual profile
      if (profile.targetFPS) {
        window.Performance.settings.targetFPS = profile.targetFPS;
        window.FrameRateLimiter.setTargetFPS(profile.targetFPS);
      }
      if (profile.particleQuality) {
        window.Performance.settings.particleQuality = profile.particleQuality;
      }
      if (profile.effectQuality) {
        window.Performance.settings.effectQuality = profile.effectQuality;
      }
      if (profile.renderQuality) {
        window.Performance.settings.renderQuality = profile.renderQuality;
      }
    }
    
    // Save profile
    localStorage.setItem('qualityProfile', this.currentProfile);
    
    console.log(`Quality profile set to: ${profile.name}`);
  },
  
  // Set quality profile
  setProfile: function(profileName) {
    if (this.profiles[profileName]) {
      this.currentProfile = profileName;
      this.applyCurrentProfile();
      return true;
    }
    return false;
  },
  
  // Get available profiles
  getAvailableProfiles: function() {
    return Object.keys(this.profiles).map(key => ({
      id: key,
      name: this.profiles[key].name
    }));
  },
  
  // Get current profile
  getCurrentProfile: function() {
    return this.currentProfile;
  }
};