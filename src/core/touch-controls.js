// File: src/core/touch-controls.js
window.FILE_MANIFEST = window.FILE_MANIFEST || [];
window.FILE_MANIFEST.push({
  name: 'src/core/touch-controls.js',
  exports: ['TouchControls'],
  dependencies: ['Input', 'Mobile', 'TouchScaler']
});

// Hybrid touch control system for mobile devices
window.TouchControls = {
  // Control visibility
  isVisible: false,
  enabled: false,
  
  // Touch tracking
  touches: {},
  activeTouches: new Map(),
  
  // Control zones
  zones: {
    dpad: { x: 0, y: 0, radius: 80, active: false },
    actionA: { x: 0, y: 0, radius: 40, active: false },
    actionB: { x: 0, y: 0, radius: 40, active: false },
    actionMenu: { x: 0, y: 0, radius: 35, active: false },
    gestureArea: { x: 0, y: 0, width: 0, height: 0 }
  },
  
  // D-pad state
  dpadState: {
    up: false,
    down: false,
    left: false,
    right: false,
    center: false
  },
  
  // Gesture tracking
  gestures: {
    tapTimer: null,
    tapStartTime: 0,
    tapPosition: { x: 0, y: 0 },
    swipeStart: { x: 0, y: 0 },
    swipeThreshold: 50,
    tapThreshold: 200,
    longPressThreshold: 500
  },
  
  // Haptic feedback
  hapticEnabled: true,
  hapticPatterns: {
    light: [10],
    medium: [20],
    heavy: [30],
    success: [10, 50, 10],
    error: [50, 30, 50]
  },
  
  // Visual feedback
  opacity: 0.8,
  fadeDuration: 300,
  currentOpacity: 0,
  
  // Initialize touch controls
  init: function() {
    // Only initialize on mobile devices
    if (!window.Mobile.isMobile) {
      console.log('Touch controls disabled - not a mobile device');
      return;
    }
    
    this.enabled = true;
    this.setupControls();
    this.bindEvents();
    this.hide(); // Start hidden
    
    console.log('Touch controls initialized');
  },
  
  // Setup control positions and sizes
  setupControls: function() {
    const canvas = document.getElementById('gameCanvas');
    const canvasRect = canvas.getBoundingClientRect();
    
    // Scale zones based on canvas size and device scale
    const baseSize = Math.min(canvasRect.width, canvasRect.height);
    const scale = baseSize / 1080; // Scale from 1080p reference
    
    // D-pad - bottom left
    this.zones.dpad.x = 120 * scale;
    this.zones.dpad.y = canvasRect.height - 120 * scale;
    this.zones.dpad.radius = 80 * scale;
    
    // Action buttons - bottom right
    this.zones.actionA.x = canvasRect.width - 120 * scale;
    this.zones.actionA.y = canvasRect.height - 120 * scale;
    this.zones.actionA.radius = 40 * scale;
    
    this.zones.actionB.x = canvasRect.width - 200 * scale;
    this.zones.actionB.y = canvasRect.height - 120 * scale;
    this.zones.actionB.radius = 40 * scale;
    
    // Menu button - top right
    this.zones.actionMenu.x = canvasRect.width - 60 * scale;
    this.zones.actionMenu.y = 60 * scale;
    this.zones.actionMenu.radius = 35 * scale;
    
    // Gesture area - center of screen
    this.zones.gestureArea.x = canvasRect.width * 0.3;
    this.zones.gestureArea.y = 0;
    this.zones.gestureArea.width = canvasRect.width * 0.4;
    this.zones.gestureArea.height = canvasRect.height;
  },
  
  // Bind touch events
  bindEvents: function() {
    const canvas = document.getElementById('gameCanvas');
    
    // Touch start
    canvas.addEventListener('touchstart', (e) => {
      e.preventDefault();
      this.handleTouchStart(e);
    }, { passive: false });
    
    // Touch move
    canvas.addEventListener('touchmove', (e) => {
      e.preventDefault();
      this.handleTouchMove(e);
    }, { passive: false });
    
    // Touch end
    canvas.addEventListener('touchend', (e) => {
      e.preventDefault();
      this.handleTouchEnd(e);
    }, { passive: false });
    
    // Touch cancel
    canvas.addEventListener('touchcancel', (e) => {
      e.preventDefault();
      this.handleTouchEnd(e);
    }, { passive: false });
    
    // Handle window resize
    window.addEventListener('resize', () => {
      this.setupControls();
    });
  },
  
  // Handle touch start events
  handleTouchStart: function(e) {
    if (!this.enabled) return;
    
    this.show(); // Show controls on first touch
    
    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i];
      const canvasPos = window.Mobile.screenToCanvas(touch.clientX, touch.clientY);
      
      // Track touch
      this.activeTouches.set(touch.identifier, {
        id: touch.identifier,
        startX: canvasPos.x,
        startY: canvasPos.y,
        currentX: canvasPos.x,
        currentY: canvasPos.y,
        zone: null,
        startTime: Date.now()
      });
      
      // Determine which zone was touched
      const zone = this.getTouchZone(canvasPos.x, canvasPos.y);
      if (zone) {
        this.activeTouches.get(touch.identifier).zone = zone;
        this.handleZoneTouchStart(zone, canvasPos.x, canvasPos.y);
      } else {
        // Start gesture tracking
        this.startGesture(canvasPos.x, canvasPos.y);
      }
    }
  },
  
  // Handle touch move events
  handleTouchMove: function(e) {
    if (!this.enabled) return;
    
    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i];
      const touchData = this.activeTouches.get(touch.identifier);
      
      if (!touchData) continue;
      
      const canvasPos = window.Mobile.screenToCanvas(touch.clientX, touch.clientY);
      touchData.currentX = canvasPos.x;
      touchData.currentY = canvasPos.y;
      
      if (touchData.zone) {
        this.handleZoneTouchMove(touchData.zone, canvasPos.x, canvasPos.y);
      } else {
        this.updateGesture(canvasPos.x, canvasPos.y);
      }
    }
  },
  
  // Handle touch end events
  handleTouchEnd: function(e) {
    if (!this.enabled) return;
    
    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i];
      const touchData = this.activeTouches.get(touch.identifier);
      
      if (!touchData) continue;
      
      if (touchData.zone) {
        this.handleZoneTouchEnd(touchData.zone);
      } else {
        this.endGesture(touchData.startX, touchData.startY, touchData.currentX, touchData.currentY);
      }
      
      this.activeTouches.delete(touch.identifier);
    }
  },
  
  // Get which control zone was touched
  getTouchZone: function(x, y) {
    // Check D-pad
    if (this.isInCircle(x, y, this.zones.dpad.x, this.zones.dpad.y, this.zones.dpad.radius)) {
      return 'dpad';
    }
    
    // Check action A
    if (this.isInCircle(x, y, this.zones.actionA.x, this.zones.actionA.y, this.zones.actionA.radius)) {
      return 'actionA';
    }
    
    // Check action B
    if (this.isInCircle(x, y, this.zones.actionB.x, this.zones.actionB.y, this.zones.actionB.radius)) {
      return 'actionB';
    }
    
    // Check menu button
    if (this.isInCircle(x, y, this.zones.actionMenu.x, this.zones.actionMenu.y, this.zones.actionMenu.radius)) {
      return 'actionMenu';
    }
    
    return null;
  },
  
  // Check if point is within circle
  isInCircle: function(x, y, centerX, centerY, radius) {
    const dx = x - centerX;
    const dy = y - centerY;
    return dx * dx + dy * dy <= radius * radius;
  },
  
  // Handle zone touch start
  handleZoneTouchStart: function(zone, x, y) {
    this.zones[zone].active = true;
    
    switch (zone) {
      case 'dpad':
        this.updateDPad(x, y);
        break;
      case 'actionA':
        this.simulateKeyPress('Enter');
        this.triggerHaptic('light');
        break;
      case 'actionB':
        this.simulateKeyPress('Escape');
        this.triggerHaptic('light');
        break;
      case 'actionMenu':
        this.simulateKeyPress('m');
        this.triggerHaptic('medium');
        break;
    }
  },
  
  // Handle zone touch move
  handleZoneTouchMove: function(zone, x, y) {
    switch (zone) {
      case 'dpad':
        this.updateDPad(x, y);
        break;
    }
  },
  
  // Handle zone touch end
  handleZoneTouchEnd: function(zone) {
    this.zones[zone].active = false;
    
    switch (zone) {
      case 'dpad':
        this.resetDPad();
        break;
      case 'actionA':
        this.simulateKeyRelease('Enter');
        break;
      case 'actionB':
        this.simulateKeyRelease('Escape');
        break;
      case 'actionMenu':
        this.simulateKeyRelease('m');
        break;
    }
  },
  
  // Update D-pad state based on touch position
  updateDPad: function(x, y) {
    const centerX = this.zones.dpad.x;
    const centerY = this.zones.dpad.y;
    const radius = this.zones.dpad.radius;
    
    const dx = x - centerX;
    const dy = y - centerY;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    // Reset all directions
    this.resetDPad();
    
    if (distance < radius * 0.3) {
      // Center zone
      this.dpadState.center = true;
    } else {
      // Normalize direction
      const angle = Math.atan2(dy, dx);
      
      // Determine direction based on angle
      if (angle >= -Math.PI * 0.75 && angle < -Math.PI * 0.25) {
        this.dpadState.up = true;
        this.simulateKeyPress('ArrowUp');
      } else if (angle >= -Math.PI * 0.25 && angle < Math.PI * 0.25) {
        this.dpadState.right = true;
        this.simulateKeyPress('ArrowRight');
      } else if (angle >= Math.PI * 0.25 && angle < Math.PI * 0.75) {
        this.dpadState.down = true;
        this.simulateKeyPress('ArrowDown');
      } else {
        this.dpadState.left = true;
        this.simulateKeyPress('ArrowLeft');
      }
    }
  },
  
  // Reset D-pad state
  resetDPad: function() {
    if (this.dpadState.up) this.simulateKeyRelease('ArrowUp');
    if (this.dpadState.down) this.simulateKeyRelease('ArrowDown');
    if (this.dpadState.left) this.simulateKeyRelease('ArrowLeft');
    if (this.dpadState.right) this.simulateKeyRelease('ArrowRight');
    
    this.dpadState.up = false;
    this.dpadState.down = false;
    this.dpadState.left = false;
    this.dpadState.right = false;
    this.dpadState.center = false;
  },
  
  // Start gesture tracking
  startGesture: function(x, y) {
    this.gestures.tapStartTime = Date.now();
    this.gestures.tapPosition = { x, y };
    this.gestures.swipeStart = { x, y };
    
    // Clear any existing tap timer
    if (this.gestures.tapTimer) {
      clearTimeout(this.gestures.tapTimer);
    }
    
    // Start long press timer
    this.gestures.tapTimer = setTimeout(() => {
      this.handleLongPress(x, y);
    }, this.gestures.longPressThreshold);
  },
  
  // Update gesture tracking
  updateGesture: function(x, y) {
    const dx = x - this.gestures.swipeStart.x;
    const dy = y - this.gestures.swipeStart.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    // If moved beyond tap threshold, cancel tap
    if (distance > 10) {
      if (this.gestures.tapTimer) {
        clearTimeout(this.gestures.tapTimer);
        this.gestures.tapTimer = null;
      }
    }
  },
  
  // End gesture tracking
  endGesture: function(startX, startY, endX, endY) {
    if (this.gestures.tapTimer) {
      clearTimeout(this.gestures.tapTimer);
      this.gestures.tapTimer = null;
    }
    
    const duration = Date.now() - this.gestures.tapStartTime;
    const dx = endX - startX;
    const dy = endY - startY;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    if (duration < this.gestures.tapThreshold && distance < 10) {
      // Tap gesture
      this.handleTap(endX, endY);
    } else if (distance > this.gestures.swipeThreshold) {
      // Swipe gesture
      this.handleSwipe(startX, startY, endX, endY);
    }
  },
  
  // Handle tap gesture
  handleTap: function(x, y) {
    // Tap to interact (same as Enter key)
    this.simulateKeyPress('Enter');
    setTimeout(() => this.simulateKeyRelease('Enter'), 50);
    this.triggerHaptic('light');
  },
  
  // Handle long press gesture
  handleLongPress: function(x, y) {
    // Long press could be used for special actions
    this.simulateKeyPress(' ');
    setTimeout(() => this.simulateKeyRelease(' '), 50);
    this.triggerHaptic('heavy');
  },
  
  // Handle swipe gesture
  handleSwipe: function(startX, startY, endX, endY) {
    const dx = endX - startX;
    const dy = endY - startY;
    
    // Determine swipe direction
    if (Math.abs(dx) > Math.abs(dy)) {
      // Horizontal swipe
      if (dx > 0) {
        // Swipe right - next menu item
        this.simulateKeyPress('ArrowRight');
        setTimeout(() => this.simulateKeyRelease('ArrowRight'), 50);
      } else {
        // Swipe left - previous menu item
        this.simulateKeyPress('ArrowLeft');
        setTimeout(() => this.simulateKeyRelease('ArrowLeft'), 50);
      }
    } else {
      // Vertical swipe
      if (dy > 0) {
        // Swipe down - could be used for menus
        this.simulateKeyPress('ArrowDown');
        setTimeout(() => this.simulateKeyRelease('ArrowDown'), 50);
      } else {
        // Swipe up - could be used for special actions
        this.simulateKeyPress('ArrowUp');
        setTimeout(() => this.simulateKeyRelease('ArrowUp'), 50);
      }
    }
    
    this.triggerHaptic('medium');
  },
  
  // Simulate keyboard press (integration with Input system)
  simulateKeyPress: function(key) {
    if (!window.Input) return;
    
    // Update Input system to simulate key press
    window.Input.previousKeys[key] = window.Input.keys[key] || false;
    window.Input.keys[key] = true;
    window.Input.lastKeyPressed = key;
  },
  
  // Simulate keyboard release
  simulateKeyRelease: function(key) {
    if (!window.Input) return;
    
    window.Input.previousKeys[key] = window.Input.keys[key];
    window.Input.keys[key] = false;
  },
  
  // Trigger haptic feedback
  triggerHaptic: function(pattern) {
    if (!this.hapticEnabled || !navigator.vibrate) return;
    
    const vibrationPattern = this.hapticPatterns[pattern] || this.hapticPatterns.light;
    navigator.vibrate(vibrationPattern);
  },
  
  // Show touch controls with fade-in animation
  show: function() {
    if (this.isVisible) return;
    
    this.isVisible = true;
    this.animateOpacity(this.opacity);
  },
  
  // Hide touch controls with fade-out animation
  hide: function() {
    if (!this.isVisible) return;
    
    this.animateOpacity(0);
    setTimeout(() => {
      this.isVisible = false;
    }, this.fadeDuration);
  },
  
  // Animate opacity
  animateOpacity: function(targetOpacity) {
    const startOpacity = this.currentOpacity;
    const startTime = Date.now();
    
    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / this.fadeDuration, 1);
      
      this.currentOpacity = startOpacity + (targetOpacity - startOpacity) * progress;
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };
    
    animate();
  },
  
  // Render touch controls
  render: function(ctx) {
    if (!this.enabled || this.currentOpacity <= 0) return;
    
    ctx.save();
    ctx.globalAlpha = this.currentOpacity;
    
    // Render D-pad
    this.renderDPad(ctx);
    
    // Render action buttons
    this.renderActionButton(ctx, this.zones.actionA, 'A', '#4CAF50');
    this.renderActionButton(ctx, this.zones.actionB, 'B', '#2196F3');
    this.renderActionButton(ctx, this.zones.actionMenu, 'M', '#FF9800');
    
    ctx.restore();
  },
  
  // Render D-pad
  renderDPad: function(ctx) {
    const dpad = this.zones.dpad;
    
    // Background circle
    ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.lineWidth = 2;
    
    ctx.beginPath();
    ctx.arc(dpad.x, dpad.y, dpad.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    
    // Direction indicators
    const directions = [
      { x: 0, y: -1, active: this.dpadState.up, label: '↑' },
      { x: 1, y: 0, active: this.dpadState.right, label: '→' },
      { x: 0, y: 1, active: this.dpadState.down, label: '↓' },
      { x: -1, y: 0, active: this.dpadState.left, label: '←' }
    ];
    
    for (const dir of directions) {
      const x = dpad.x + dir.x * dpad.radius * 0.6;
      const y = dpad.y + dir.y * dpad.radius * 0.6;
      const radius = dpad.radius * 0.25;
      
      // Direction button
      ctx.fillStyle = dir.active ? 'rgba(76, 175, 80, 0.6)' : 'rgba(255, 255, 255, 0.3)';
      ctx.strokeStyle = dir.active ? '#4CAF50' : 'rgba(255, 255, 255, 0.6)';
      
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      
      // Direction arrow
      ctx.fillStyle = dir.active ? '#ffffff' : 'rgba(255, 255, 255, 0.8)';
      ctx.font = `${dpad.radius * 0.4}px Arial`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(dir.label, x, y);
    }
    
    // Center button
    if (this.dpadState.center) {
      ctx.fillStyle = 'rgba(255, 193, 7, 0.6)';
      ctx.strokeStyle = '#FFC107';
      ctx.beginPath();
      ctx.arc(dpad.x, dpad.y, dpad.radius * 0.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }
  },
  
  // Render action button
  renderActionButton: function(ctx, zone, label, color) {
    // Background circle
    ctx.fillStyle = zone.active ? `${color}99` : 'rgba(255, 255, 255, 0.2)';
    ctx.strokeStyle = zone.active ? color : 'rgba(255, 255, 255, 0.5)';
    ctx.lineWidth = 2;
    
    ctx.beginPath();
    ctx.arc(zone.x, zone.y, zone.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    
    // Button label
    ctx.fillStyle = zone.active ? '#ffffff' : 'rgba(255, 255, 255, 0.8)';
    ctx.font = `${zone.radius * 0.8}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(label, zone.x, zone.y);
  },
  
  // Update touch controls (call each frame)
  update: function(deltaTime) {
    // Update any animations or state changes here
  },
  
  // Enable/disable haptic feedback
  setHapticEnabled: function(enabled) {
    this.hapticEnabled = enabled;
  },
  
  // Check if touch controls are enabled
  isEnabled: function() {
    return this.enabled;
  },
  
  // Get current zone positions (for debugging)
  getZonePositions: function() {
    return { ...this.zones };
  },
  
  // Get current D-pad state
  getDPadState: function() {
    return { ...this.dpadState };
  }
};