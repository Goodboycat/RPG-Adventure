// File: src/core/input.js
window.FILE_MANIFEST = window.FILE_MANIFEST || [];
window.FILE_MANIFEST.push({
  name: 'src/core/input.js',
  exports: ['Input', 'GestureRecognizer'],
  dependencies: []
});

// Input handling system with hybrid controls
window.Input = {
  // Keyboard input state
  keys: {},
  previousKeys: {},
  lastKeyPressed: null,
  
  // Mouse input state
  mouse: { x: 0, y: 0, left: false, right: false },
  
  // Touch input state
  touches: [],
  previousTouches: [],
  touchActive: false,
  
  // Gesture state
  gestures: {
    swipe: { active: false, direction: null, startX: 0, startY: 0, endX: 0, endY: 0 },
    tap: { active: false, count: 0, lastTap: 0, x: 0, y: 0 },
    longPress: { active: false, startTime: 0, x: 0, y: 0 },
    pinch: { active: false, distance: 0, scale: 1 },
    multiTouch: { count: 0, positions: [] }
  },
  
  // Touch-to-key mapping for hybrid controls
  touchKeyMap: {
    'dpad-up': 'ArrowUp',
    'dpad-down': 'ArrowDown',
    'dpad-left': 'ArrowLeft',
    'dpad-right': 'ArrowRight',
    'action-a': 'Enter',
    'action-b': 'Escape',
    'action-menu': 'Tab',
    'tap': 'Enter',
    'swipe-left': 'ArrowLeft',
    'swipe-right': 'ArrowRight',
    'swipe-up': 'ArrowUp',
    'swipe-down': 'ArrowDown'
  },
  
  // Configuration
  config: {
    tapThreshold: 10,        // Max distance for tap (pixels)
    tapTimeout: 300,         // Max time for tap (ms)
    longPressTimeout: 500,   // Time for long press (ms)
    swipeThreshold: 30,      // Min distance for swipe (pixels)
    swipeTimeout: 500,       // Max time for swipe (ms)
    pinchThreshold: 20,      // Min distance for pinch (pixels)
    multiTouchDelay: 50      // Delay between touch events for smoothing (ms)
  },
  
  // Initialize input listeners
  init: function() {
    this.setupKeyboardEvents();
    this.setupMouseEvents();
    this.setupTouchEvents();
    
    console.log('Input initialized with hybrid controls');
  },
  
  // Setup keyboard event listeners
  setupKeyboardEvents: function() {
    window.addEventListener('keydown', (e) => {
      this.previousKeys[e.key] = this.keys[e.key] || false;
      this.keys[e.key] = true;
      this.lastKeyPressed = e.key;
      
      // Prevent default for game keys
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Enter', ' ', 'Escape', 'Tab'].includes(e.key)) {
        e.preventDefault();
      }
    });

    window.addEventListener('keyup', (e) => {
      this.previousKeys[e.key] = this.keys[e.key];
      this.keys[e.key] = false;
    });
  },
  
  // Setup mouse event listeners
  setupMouseEvents: function() {
    const canvas = document.getElementById('gameCanvas');
    
    canvas.addEventListener('mousemove', (e) => {
      const pos = window.TouchScaler.scaleMouse(e);
      if (pos) {
        this.mouse.x = pos.x;
        this.mouse.y = pos.y;
      }
    });

    canvas.addEventListener('mousedown', (e) => {
      if (e.button === 0) this.mouse.left = true;
      if (e.button === 2) this.mouse.right = true;
    });

    canvas.addEventListener('mouseup', (e) => {
      if (e.button === 0) this.mouse.left = false;
      if (e.button === 2) this.mouse.right = false;
    });

    canvas.addEventListener('contextmenu', (e) => {
      e.preventDefault();
    });
  },
  
  // Setup touch event listeners
  setupTouchEvents: function() {
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
  },
  
  // Handle touch start events
  handleTouchStart: function(e) {
    this.previousTouches = [...this.touches];
    this.touches = [];
    this.touchActive = true;
    
    const scaledTouches = window.TouchScaler.scaleAllTouches(e);
    
    for (let i = 0; i < scaledTouches.length; i++) {
      const touch = {
        id: e.touches[i].identifier,
        x: scaledTouches[i].x,
        y: scaledTouches[i].y,
        startX: scaledTouches[i].x,
        startY: scaledTouches[i].y,
        startTime: Date.now()
      };
      this.touches.push(touch);
    }
    
    // Update multi-touch state
    this.gestures.multiTouch.count = this.touches.length;
    this.gestures.multiTouch.positions = this.touches.map(t => ({ x: t.x, y: t.y }));
    
    // Initialize gesture detection
    if (this.touches.length === 1) {
      const touch = this.touches[0];
      this.gestures.tap.x = touch.x;
      this.gestures.tap.y = touch.y;
      this.gestures.tap.active = true;
      this.gestures.longPress.active = true;
      this.gestures.longPress.startTime = Date.now();
      this.gestures.longPress.x = touch.x;
      this.gestures.longPress.y = touch.y;
      this.gestures.swipe.startX = touch.x;
      this.gestures.swipe.startY = touch.y;
    } else if (this.touches.length === 2) {
      this.initializePinchGesture();
    }
  },
  
  // Handle touch move events
  handleTouchMove: function(e) {
    if (!this.touchActive) return;
    
    this.previousTouches = [...this.touches];
    
    const scaledTouches = window.TouchScaler.scaleAllTouches(e);
    
    for (let i = 0; i < scaledTouches.length; i++) {
      const existingTouch = this.touches.find(t => t.id === e.touches[i].identifier);
      if (existingTouch) {
        existingTouch.x = scaledTouches[i].x;
        existingTouch.y = scaledTouches[i].y;
      }
    }
    
    // Update multi-touch positions
    this.gestures.multiTouch.positions = this.touches.map(t => ({ x: t.x, y: t.y }));
    
    // Process gestures
    this.processGestureMovement();
  },
  
  // Handle touch end events
  handleTouchEnd: function(e) {
    this.previousTouches = [...this.touches];
    
    // Remove ended touches
    const remainingTouchIds = Array.from(e.touches).map(t => t.identifier);
    this.touches = this.touches.filter(t => remainingTouchIds.includes(t.id));
    
    // Process gesture completion
    this.processGestureCompletion();
    
    // Update states
    this.gestures.multiTouch.count = this.touches.length;
    this.gestures.multiTouch.positions = this.touches.map(t => ({ x: t.x, y: t.y }));
    
    if (this.touches.length === 0) {
      this.touchActive = false;
      this.resetGestures();
    }
  },
  
  // Initialize pinch gesture
  initializePinchGesture: function() {
    if (this.touches.length === 2) {
      const dx = this.touches[0].x - this.touches[1].x;
      const dy = this.touches[0].y - this.touches[1].y;
      this.gestures.pinch.distance = Math.sqrt(dx * dx + dy * dy);
      this.gestures.pinch.active = true;
      this.gestures.pinch.scale = 1;
    }
  },
  
  // Process gesture movement
  processGestureMovement: function() {
    // Cancel tap if moved too far
    if (this.gestures.tap.active && this.touches.length === 1) {
      const touch = this.touches[0];
      const dx = touch.x - this.gestures.tap.x;
      const dy = touch.y - this.gestures.tap.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      if (distance > this.config.tapThreshold) {
        this.gestures.tap.active = false;
        this.gestures.longPress.active = false;
      }
    }
    
    // Update swipe
    if (this.touches.length === 1) {
      const touch = this.touches[0];
      const dx = touch.x - this.gestures.swipe.startX;
      const dy = touch.y - this.gestures.swipe.startY;
      
      if (Math.abs(dx) > this.config.swipeThreshold || Math.abs(dy) > this.config.swipeThreshold) {
        this.gestures.swipe.active = true;
        this.gestures.swipe.endX = touch.x;
        this.gestures.swipe.endY = touch.y;
        this.gestures.longPress.active = false; // Cancel long press on movement
      }
    }
    
    // Update pinch
    if (this.gestures.pinch.active && this.touches.length === 2) {
      const dx = this.touches[0].x - this.touches[1].x;
      const dy = this.touches[0].y - this.touches[1].y;
      const currentDistance = Math.sqrt(dx * dx + dy * dy);
      
      if (currentDistance > this.config.pinchThreshold) {
        this.gestures.pinch.scale = currentDistance / this.gestures.pinch.distance;
      }
    }
  },
  
  // Process gesture completion
  processGestureCompletion: function() {
    const now = Date.now();
    
    // Check for tap
    if (this.gestures.tap.active) {
      const timeSinceStart = now - (this.gestures.longPress.startTime || now);
      
      if (timeSinceStart <= this.config.tapTimeout) {
        // Check for double tap
        if (now - this.gestures.tap.lastTap < 300) {
          this.gestures.tap.count = 2;
        } else {
          this.gestures.tap.count = 1;
        }
        
        this.gestures.tap.lastTap = now;
        this.simulateKeyFromTouch('tap');
      }
    }
    
    // Check for long press
    if (this.gestures.longPress.active) {
      const timeSinceStart = now - this.gestures.longPress.startTime;
      
      if (timeSinceStart >= this.config.longPressTimeout) {
        this.onLongPress(this.gestures.longPress.x, this.gestures.longPress.y);
      }
    }
    
    // Check for swipe
    if (this.gestures.swipe.active) {
      const dx = this.gestures.swipe.endX - this.gestures.swipe.startX;
      const dy = this.gestures.swipe.endY - this.gestures.swipe.startY;
      const timeSinceStart = now - (this.touches[0]?.startTime || now);
      
      if (timeSinceStart <= this.config.swipeTimeout) {
        // Determine swipe direction
        if (Math.abs(dx) > Math.abs(dy)) {
          if (dx > 0) {
            this.gestures.swipe.direction = 'right';
            this.simulateKeyFromTouch('swipe-right');
          } else {
            this.gestures.swipe.direction = 'left';
            this.simulateKeyFromTouch('swipe-left');
          }
        } else {
          if (dy > 0) {
            this.gestures.swipe.direction = 'down';
            this.simulateKeyFromTouch('swipe-down');
          } else {
            this.gestures.swipe.direction = 'up';
            this.simulateKeyFromTouch('swipe-up');
          }
        }
        
        this.onSwipe(this.gestures.swipe.direction, this.gestures.swipe.startX, this.gestures.swipe.startY);
      }
    }
  },
  
  // Reset gesture state
  resetGestures: function() {
    this.gestures.tap.active = false;
    this.gestures.swipe.active = false;
    this.gestures.swipe.direction = null;
    this.gestures.longPress.active = false;
    this.gestures.pinch.active = false;
  },
  
  // Simulate keyboard input from touch
  simulateKeyFromTouch: function(touchAction) {
    const key = this.touchKeyMap[touchAction];
    if (key) {
      this.keys[key] = true;
      this.lastKeyPressed = key;
      
      // Schedule key release after one frame
      setTimeout(() => {
        this.keys[key] = false;
      }, 16); // ~60fps
    }
  },
  
  // Simulate touch action from UI controls
  simulateTouchAction: function(action) {
    this.simulateKeyFromTouch(action);
  },
  
  // Gesture callbacks (can be overridden by game systems)
  onTap: function(x, y, tapCount) {
    // Override in game systems
  },
  
  onSwipe: function(direction, startX, startY) {
    // Override in game systems
  },
  
  onLongPress: function(x, y) {
    // Override in game systems
  },
  
  onPinch: function(scale) {
    // Override in game systems
  },
  
  onMultiTouch: function(positions) {
    // Override in game systems
  },
  
  // Keyboard input methods
  isKeyDown: function(key) {
    return !!this.keys[key];
  },
  
  isKeyPressed: function(key) {
    return this.keys[key] && !this.previousKeys[key];
  },
  
  // Mouse input methods
  getMouseX: function() {
    return this.mouse.x;
  },
  
  getMouseY: function() {
    return this.mouse.y;
  },
  
  isMouseDown: function(button = 'left') {
    return this.mouse[button];
  },
  
  // Touch input methods
  getTouchCount: function() {
    return this.touches.length;
  },
  
  getTouchPosition: function(index = 0) {
    if (this.touches[index]) {
      return { x: this.touches[index].x, y: this.touches[index].y };
    }
    return null;
  },
  
  getAllTouchPositions: function() {
    return this.touches.map(t => ({ x: t.x, y: t.y }));
  },
  
  isTouchActive: function() {
    return this.touchActive;
  },
  
  // Gesture state methods
  getGestureState: function() {
    return {
      tap: { ...this.gestures.tap },
      swipe: { ...this.gestures.swipe },
      longPress: { ...this.gestures.longPress },
      pinch: { ...this.gestures.pinch },
      multiTouch: { ...this.gestures.multiTouch }
    };
  },
  
  isGesturing: function(gestureType) {
    return this.gestures[gestureType]?.active || false;
  },
  
  // Unified input methods for hybrid controls
  getAnyInputPosition: function() {
    // Priority: touch > mouse
    if (this.touches.length > 0) {
      return { x: this.touches[0].x, y: this.touches[0].y };
    }
    return { x: this.mouse.x, y: this.mouse.y };
  },
  
  isAnyInputPressed: function() {
    // Check keyboard, mouse, or touch
    const anyKeyDown = Object.values(this.keys).some(v => v);
    const anyMouseDown = this.mouse.left || this.mouse.right;
    const anyTouchActive = this.touches.length > 0;
    
    return anyKeyDown || anyMouseDown || anyTouchActive;
  },
  
  // Clear all input state
  clear: function() {
    // Clear keyboard
    this.previousKeys = { ...this.keys };
    this.keys = {};
    this.lastKeyPressed = null;
    
    // Clear mouse
    this.mouse.left = false;
    this.mouse.right = false;
    
    // Clear touch
    this.previousTouches = [...this.touches];
    this.touches = [];
    this.touchActive = false;
    
    // Clear gestures
    this.resetGestures();
    this.gestures.multiTouch.count = 0;
    this.gestures.multiTouch.positions = [];
  }
};

// Gesture recognition utility
window.GestureRecognizer = {
  // Recognize gesture from touch sequence
  recognize: function(touchSequence) {
    if (!touchSequence || touchSequence.length === 0) {
      return null;
    }
    
    const touches = touchSequence[0];
    
    if (touches.length === 1) {
      return this.recognizeSingleTouchGesture(touchSequence);
    } else if (touches.length === 2) {
      return this.recognizeTwoTouchGesture(touchSequence);
    } else {
      return { type: 'multi-touch', count: touches.length };
    }
  },
  
  // Recognize single touch gestures
  recognizeSingleTouchGesture: function(touchSequence) {
    if (touchSequence.length < 2) return null;
    
    const start = touchSequence[0][0];
    const end = touchSequence[touchSequence.length - 1][0];
    
    const dx = end.x - start.x;
    const dy = end.y - start.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const duration = end.time - start.time;
    
    // Tap
    if (distance < 10 && duration < 300) {
      return { type: 'tap', x: end.x, y: end.y };
    }
    
    // Long press
    if (distance < 10 && duration >= 500) {
      return { type: 'long-press', x: end.x, y: end.y };
    }
    
    // Swipe
    if (distance > 30 && duration < 500) {
      let direction;
      if (Math.abs(dx) > Math.abs(dy)) {
        direction = dx > 0 ? 'right' : 'left';
      } else {
        direction = dy > 0 ? 'down' : 'up';
      }
      
      return {
        type: 'swipe',
        direction: direction,
        startX: start.x,
        startY: start.y,
        endX: end.x,
        endY: end.y
      };
    }
    
    // Drag
    return {
      type: 'drag',
      startX: start.x,
      startY: start.y,
      endX: end.x,
      endY: end.y,
      distance: distance,
      duration: duration
    };
  },
  
  // Recognize two touch gestures
  recognizeTwoTouchGesture: function(touchSequence) {
    if (touchSequence.length < 2) return null;
    
    const start = touchSequence[0];
    const end = touchSequence[touchSequence.length - 1];
    
    const startDistance = this.getDistance(start[0], start[1]);
    const endDistance = this.getDistance(end[0], end[1]);
    
    if (Math.abs(startDistance - endDistance) > 20) {
      return {
        type: 'pinch',
        scale: endDistance / startDistance,
        centerX: (end[0].x + end[1].x) / 2,
        centerY: (end[0].y + end[1].y) / 2
      };
    }
    
    return {
      type: 'two-touch',
      distance: endDistance,
      centerX: (end[0].x + end[1].x) / 2,
      centerY: (end[0].y + end[1].y) / 2
    };
  },
  
  // Helper to calculate distance between two points
  getDistance: function(point1, point2) {
    const dx = point2.x - point1.x;
    const dy = point2.y - point1.y;
    return Math.sqrt(dx * dx + dy * dy);
  }
};