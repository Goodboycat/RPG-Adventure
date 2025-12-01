// File: src/core/mobile.js
window.FILE_MANIFEST = window.FILE_MANIFEST || [];
window.FILE_MANIFEST.push({
  name: 'src/core/mobile.js',
  exports: ['Mobile', 'TouchScaler'],
  dependencies: []
});

// Mobile-responsive canvas system
window.Mobile = {
  // Device detection
  isMobile: false,
  isTablet: false,
  devicePixelRatio: 1,
  screenWidth: 0,
  screenHeight: 0,
  canvasWidth: 1920,
  canvasHeight: 1080,
  
  // Scaling factors
  scale: 1,
  touchScaleX: 1,
  touchScaleY: 1,
  
  // Resolution tiers for performance optimization
  RESOLUTION_TIERS: {
    LOW: { width: 1280, height: 720 },    // 720p for low-end devices
    MEDIUM: { width: 1920, height: 1080 }, // 1080p for mid-range
    HIGH: null,                           // Native for high-end devices
    ULTRA: null                           // Native for flagship devices
  },
  
  // Device performance indicators
  deviceTier: 'MEDIUM',
  
  // Initialize mobile system
  init: function() {
    this.detectDevice();
    this.setupViewport();
    this.setupCanvas();
    this.bindEvents();
    
    console.log(`Mobile initialized: ${this.deviceTier} tier, ${this.canvasWidth}x${this.canvasHeight}, scale: ${this.scale}`);
  },
  
  // Detect device type and capabilities
  detectDevice: function() {
    // Basic device detection
    this.isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    this.isTablet = /iPad|Android/i.test(navigator.userAgent) && window.innerWidth > 768;
    
    // Device pixel ratio detection
    this.devicePixelRatio = window.devicePixelRatio || 1;
    
    // Screen dimensions
    this.screenWidth = window.innerWidth;
    this.screenHeight = window.innerHeight;
    
    // Determine device tier based on capabilities
    this.determineDeviceTier();
  },
  
  // Determine device performance tier
  determineDeviceTier: function() {
    const memory = navigator.deviceMemory || 4; // Default to 4GB if unknown
    const cores = navigator.hardwareConcurrency || 4; // Default to 4 cores if unknown
    const pixelRatio = this.devicePixelRatio;
    const isMobile = this.isMobile;
    
    // Scoring system for device tier
    let score = 0;
    
    // Memory scoring (0-3 points)
    if (memory >= 8) score += 3;
    else if (memory >= 4) score += 2;
    else score += 1;
    
    // CPU cores scoring (0-3 points)
    if (cores >= 8) score += 3;
    else if (cores >= 4) score += 2;
    else score += 1;
    
    // Pixel ratio penalty for mobile (mobile devices with high pixel ratios are demanding)
    if (isMobile) {
      if (pixelRatio <= 2) score += 2;
      else if (pixelRatio <= 3) score += 1;
      else score += 0; // Very high pixel ratio = performance hit
    } else {
      score += 3; // Desktop gets bonus
    }
    
    // Screen size consideration for mobile
    if (isMobile) {
      if (this.screenWidth >= 1080 && this.screenHeight >= 1920) score += 1;
      else if (this.screenWidth >= 720 && this.screenHeight >= 1280) score += 2;
      else score += 1;
    } else {
      score += 2; // Desktop bonus
    }
    
    // Determine tier based on score (0-10 scale)
    if (score >= 9) {
      this.deviceTier = 'ULTRA';
    } else if (score >= 7) {
      this.deviceTier = 'HIGH';
    } else if (score >= 5) {
      this.deviceTier = 'MEDIUM';
    } else {
      this.deviceTier = 'LOW';
    }
  },
  
  // Setup viewport meta tag for mobile
  setupViewport: function() {
    // Check if viewport meta tag exists
    let viewport = document.querySelector('meta[name="viewport"]');
    
    if (!viewport) {
      viewport = document.createElement('meta');
      viewport.name = 'viewport';
      document.head.appendChild(viewport);
    }
    
    // Set viewport content for mobile optimization
    viewport.content = 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover';
    
    // Add theme-color meta tag for PWA
    let themeColor = document.querySelector('meta[name="theme-color"]');
    if (!themeColor) {
      themeColor = document.createElement('meta');
      themeColor.name = 'theme-color';
      themeColor.content = '#000000';
      document.head.appendChild(themeColor);
    }
  },
  
  // Setup canvas with appropriate resolution
  setupCanvas: function() {
    const canvas = document.getElementById('gameCanvas');
    if (!canvas) {
      console.error('Canvas element not found!');
      return;
    }
    
    // Determine optimal resolution based on device tier
    const resolution = this.getOptimalResolution();
    
    if (resolution) {
      // Use predefined resolution for performance
      this.canvasWidth = resolution.width;
      this.canvasHeight = resolution.height;
    } else {
      // Use native resolution scaled by device pixel ratio
      this.canvasWidth = Math.min(window.innerWidth * this.devicePixelRatio, 1920);
      this.canvasHeight = Math.min(window.innerHeight * this.devicePixelRatio, 1080);
    }
    
    // Set canvas internal resolution
    canvas.width = this.canvasWidth;
    canvas.height = this.canvasHeight;
    
    // Calculate CSS scaling for proper display
    this.calculateScaling(canvas);
    
    // Apply CSS scaling
    canvas.style.width = `${this.canvasWidth * this.scale}px`;
    canvas.style.height = `${this.canvasHeight * this.scale}px`;
    
    // Calculate touch scaling factors
    this.calculateTouchScaling(canvas);
  },
  
  // Get optimal resolution for device
  getOptimalResolution: function() {
    switch (this.deviceTier) {
      case 'LOW':
        return this.RESOLUTION_TIERS.LOW;
      case 'MEDIUM':
        return this.RESOLUTION_TIERS.MEDIUM;
      case 'HIGH':
        return this.RESOLUTION_TIERS.HIGH; // null = native
      case 'ULTRA':
        return this.RESOLUTION_TIERS.ULTRA; // null = native
      default:
        return this.RESOLUTION_TIERS.MEDIUM;
    }
  },
  
  // Calculate scaling factors for canvas display
  calculateScaling: function(canvas) {
    // Get available space
    const containerWidth = window.innerWidth;
    const containerHeight = window.innerHeight - 120; // Account for UI elements
    
    // Calculate scale to fit screen while maintaining aspect ratio
    const scaleX = containerWidth / this.canvasWidth;
    const scaleY = containerHeight / this.canvasHeight;
    
    // Use the smaller scale to ensure canvas fits
    this.scale = Math.min(scaleX, scaleY, 1); // Cap at 1x for quality
    
    // Ensure minimum scale for usability
    this.scale = Math.max(this.scale, 0.3);
  },
  
  // Calculate touch event scaling factors
  calculateTouchScaling: function(canvas) {
    const canvasRect = canvas.getBoundingClientRect();
    
    // Touch coordinates need to be scaled from screen space to canvas space
    this.touchScaleX = this.canvasWidth / canvasRect.width;
    this.touchScaleY = this.canvasHeight / canvasRect.height;
  },
  
  // Bind window resize events
  bindEvents: function() {
    // Debounced resize handler
    let resizeTimeout;
    
    const handleResize = () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => {
        this.screenWidth = window.innerWidth;
        this.screenHeight = window.innerHeight;
        this.setupCanvas();
        console.log('Canvas resized for new dimensions');
      }, 250); // Debounce resize events
    };
    
    // Bind resize event
    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);
  },
  
  // Convert screen touch coordinates to canvas coordinates
  screenToCanvas: function(x, y) {
    return {
      x: x * this.touchScaleX,
      y: y * this.touchScaleY
    };
  },
  
  // Convert canvas coordinates to screen coordinates
  canvasToScreen: function(x, y) {
    return {
      x: x / this.touchScaleX,
      y: y / this.touchScaleY
    };
  },
  
  // Get device info for debugging
  getDeviceInfo: function() {
    return {
      isMobile: this.isMobile,
      isTablet: this.isTablet,
      deviceTier: this.deviceTier,
      screenWidth: this.screenWidth,
      screenHeight: this.screenHeight,
      canvasWidth: this.canvasWidth,
      canvasHeight: this.canvasHeight,
      scale: this.scale,
      devicePixelRatio: this.devicePixelRatio,
      deviceMemory: navigator.deviceMemory || 'unknown',
      hardwareConcurrency: navigator.hardwareConcurrency || 'unknown'
    };
  }
};

// Touch event scaling utility
window.TouchScaler = {
  // Scale touch event coordinates
  scaleTouch: function(touchEvent) {
    if (!touchEvent.touches || touchEvent.touches.length === 0) {
      return null;
    }
    
    const touch = touchEvent.touches[0];
    return window.Mobile.screenToCanvas(touch.clientX, touch.clientY);
  },
  
  // Scale mouse event coordinates (for hybrid input)
  scaleMouse: function(mouseEvent) {
    return window.Mobile.screenToCanvas(mouseEvent.clientX, mouseEvent.clientY);
  },
  
  // Get all scaled touch points
  scaleAllTouches: function(touchEvent) {
    if (!touchEvent.touches) {
      return [];
    }
    
    const touches = [];
    for (let i = 0; i < touchEvent.touches.length; i++) {
      const touch = touchEvent.touches[i];
      touches.push(window.Mobile.screenToCanvas(touch.clientX, touch.clientY));
    }
    
    return touches;
  }
};