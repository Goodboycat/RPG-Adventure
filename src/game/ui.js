// File: src/game/ui.js
window.FILE_MANIFEST = window.FILE_MANIFEST || [];
window.FILE_MANIFEST.push({
  name: 'src/game/ui.js',
  exports: ['UI', 'HealthBar', 'StatusBar', 'ActionMenu', 'BattleLog', 'InventoryUI'],
  dependencies: ['Renderer', 'MathUtils', 'Effects', 'Mobile', 'TouchScaler']
});

// UI system for game interfaces
window.UI = {
  // UI elements registry
  elements: [],
  
  // Mobile touch configuration
  mobile: {
    minTouchTarget: 44, // Minimum touch target size in pixels
    touchPadding: 8,    // Extra padding around touch targets
    scaleFactor: 1,     // Dynamic scale factor for mobile
    isTouchDevice: false,
    hoverStates: new Map() // Track hover states for touch feedback
  },

  // Initialize UI system
  init: function() {
    // Detect touch device
    this.mobile.isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    
    // Calculate mobile scale factor
    if (window.Mobile && window.Mobile.scale) {
      this.mobile.scaleFactor = Math.max(1.2, window.Mobile.scale);
    }
    
    // Add touch listeners to canvas
    this.setupTouchListeners();
    
    console.log(`UI initialized: Touch device=${this.mobile.isTouchDevice}, Scale factor=${this.mobile.scaleFactor}`);
  },

  // Setup touch event listeners
  setupTouchListeners: function() {
    if (!this.mobile.isTouchDevice) return;
    
    const canvas = document.getElementById('gameCanvas');
    
    // Touch start for hover effects
    canvas.addEventListener('touchstart', (e) => {
      const touch = window.TouchScaler.scaleTouch(e);
      if (!touch) return;
      
      this.elements.forEach(element => {
        if (element.handleTouchStart) {
          element.handleTouchStart(touch.x, touch.y);
        }
      });
    });
    
    // Touch end for hover cleanup
    canvas.addEventListener('touchend', (e) => {
      this.elements.forEach(element => {
        if (element.handleTouchEnd) {
          element.handleTouchEnd();
        }
      });
    });
    
    // Touch move for hover tracking
    canvas.addEventListener('touchmove', (e) => {
      const touch = window.TouchScaler.scaleTouch(e);
      if (!touch) return;
      
      this.elements.forEach(element => {
        if (element.handleTouchMove) {
          element.handleTouchMove(touch.x, touch.y);
        }
      });
    });
  },

  // Update all UI elements
  update: function(deltaTime) {
    const dt = deltaTime / 1000; // Convert to seconds
    
    this.elements.forEach(element => {
      if (element.update) {
        element.update(dt);
      }
    });
  },

  // Render all UI elements
  render: function(ctx) {
    this.elements.forEach(element => {
      if (element.render) {
        element.render(ctx);
      }
    });
  },

  // Add UI element
  addElement: function(element) {
    this.elements.push(element);
    
    // Initialize mobile settings for the element
    if (element.initMobile) {
      element.initMobile(this.mobile);
    }
    
    return element;
  },

  // Remove UI element
  removeElement: function(element) {
    const index = this.elements.indexOf(element);
    if (index >= 0) {
      this.elements.splice(index, 1);
    }
  },

  // Clear all elements
  clear: function() {
    this.elements = [];
    this.mobile.hoverStates.clear();
  },

  // Find element by type
  findByType: function(type) {
    return this.elements.find(element => element instanceof type);
  },
  
  // Get scaled touch target size
  getScaledTouchSize: function(baseSize) {
    const scaled = baseSize * this.mobile.scaleFactor;
    return Math.max(this.mobile.minTouchTarget, scaled);
  }
};

// Health bar component with mobile optimization
window.HealthBar = class HealthBar {
  constructor(x, y, width, height, current, max, options = {}) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.current = current;
    this.max = max;
    this.targetCurrent = current;
    this.options = {
      backgroundColor: '#333333',
      fillColor: '#00ff00',
      borderColor: '#ffffff',
      textColor: '#ffffff',
      showText: true,
      animated: true,
      mobileOptimized: true,
      ...options
    };
    this.animationSpeed = 2.0;
    
    // Mobile touch state
    this.mobile = {
      isHovered: false,
      touchPadding: 0,
      originalHeight: height
    };
  }

  // Initialize mobile settings
  initMobile(mobileConfig) {
    if (!mobileConfig.isTouchDevice) return;
    
    // Increase height for better touch visibility
    this.mobile.originalHeight = this.height;
    this.height = window.UI.getScaledTouchSize(this.height);
    this.mobile.touchPadding = mobileConfig.touchPadding;
    
    // Increase font size for better readability
    this.options.mobileFontSize = Math.max(14, this.options.fontSize || 12) * mobileConfig.scaleFactor;
  }

  update(dt) {
    if (this.options.animated && this.current !== this.targetCurrent) {
      const diff = this.targetCurrent - this.current;
      const change = diff * this.animationSpeed * dt;
      
      if (Math.abs(diff) < 0.1) {
        this.current = this.targetCurrent;
      } else {
        this.current += change;
      }
    }
  }

  render(ctx) {
    const percentage = Math.max(0, Math.min(1, this.current / this.max));
    
    // Choose color based on health percentage
    let fillColor = this.options.fillColor;
    if (percentage <= 0.25) {
      fillColor = '#ff0000';
    } else if (percentage <= 0.5) {
      fillColor = '#ffff00';
    }
    
    // Draw background with touch padding on mobile
    const bgY = this.mobile.isHovered ? this.y - 2 : this.y;
    const bgHeight = this.height + (this.mobile.isHovered ? 4 : 0);
    
    ctx.fillStyle = this.options.backgroundColor;
    ctx.fillRect(this.x, bgY, this.width, bgHeight);
    
    // Draw fill with hover effect
    if (this.mobile.isHovered) {
      ctx.shadowColor = fillColor;
      ctx.shadowBlur = 10;
    }
    
    ctx.fillStyle = fillColor;
    ctx.fillRect(this.x, bgY, this.width * percentage, bgHeight);
    
    ctx.shadowBlur = 0;
    
    // Draw border with hover effect
    ctx.strokeStyle = this.mobile.isHovered ? '#ffff00' : this.options.borderColor;
    ctx.lineWidth = this.mobile.isHovered ? 3 : 2;
    ctx.strokeRect(this.x, bgY, this.width, bgHeight);
    
    // Draw text with mobile optimization
    if (this.options.showText) {
      ctx.fillStyle = this.options.textColor;
      const fontSize = this.options.mobileFontSize || 12;
      ctx.font = `${fontSize}px monospace`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(
        `${Math.floor(this.current)}/${this.max}`,
        this.x + this.width / 2,
        bgY + bgHeight / 2
      );
    }
  }

  // Touch event handlers
  handleTouchStart(x, y) {
    if (x >= this.x && x <= this.x + this.width &&
        y >= this.y && y <= this.y + this.height) {
      this.mobile.isHovered = true;
    }
  }

  handleTouchEnd() {
    this.mobile.isHovered = false;
  }

  handleTouchMove(x, y) {
    this.mobile.isHovered = (x >= this.x && x <= this.x + this.width &&
                             y >= this.y && y <= this.y + this.height);
  }

  setCurrent(value) {
    this.targetCurrent = Math.max(0, Math.min(this.max, value));
  }

  setMax(value) {
    this.max = value;
    this.current = Math.min(this.current, value);
    this.targetCurrent = Math.min(this.targetCurrent, value);
  }
};

// Status bar for character stats with mobile optimization
window.StatusBar = class StatusBar {
  constructor(x, y, character) {
    this.x = x;
    this.y = y;
    this.character = character;
    this.width = 200;
    this.height = 80;
    
    // Mobile optimization
    this.mobile = {
      isTouchDevice: false,
      scaleFactor: 1,
      isHovered: false
    };
    
    // Create health and mana bars
    this.healthBar = new window.HealthBar(
      x + 10, y + 10, 180, 12,
      character.hp, character.maxHP,
      { fillColor: '#00ff00', showText: false }
    );
    
    this.manaBar = new window.HealthBar(
      x + 10, y + 28, 180, 8,
      character.mp, character.maxMP,
      { fillColor: '#0088ff', showText: false, borderColor: '#88ccff' }
    );
  }

  // Initialize mobile settings
  initMobile(mobileConfig) {
    this.mobile.isTouchDevice = mobileConfig.isTouchDevice;
    this.mobile.scaleFactor = mobileConfig.scaleFactor;
    
    // Scale dimensions for mobile
    if (mobileConfig.isTouchDevice) {
      this.width = window.UI.getScaledTouchSize(this.width);
      this.height = window.UI.getScaledTouchSize(this.height);
    }
    
    // Initialize child components
    this.healthBar.initMobile(mobileConfig);
    this.manaBar.initMobile(mobileConfig);
  }

  update(dt) {
    // Update bars with current character stats
    this.healthBar.setCurrent(this.character.hp);
    this.healthBar.setMax(this.character.maxHP);
    this.healthBar.update(dt);
    
    this.manaBar.setCurrent(this.character.mp);
    this.manaBar.setMax(this.character.maxMP);
    this.manaBar.update(dt);
  }

  render(ctx) {
    // Draw background with hover effect
    const bgAlpha = this.mobile.isHovered ? 0.85 : 0.7;
    ctx.fillStyle = `rgba(0, 0, 0, ${bgAlpha})`;
    ctx.fillRect(this.x, this.y, this.width, this.height);
    
    ctx.strokeStyle = this.mobile.isHovered ? '#ffff00' : '#ffffff';
    ctx.lineWidth = this.mobile.isHovered ? 3 : 2;
    ctx.strokeRect(this.x, this.y, this.width, this.height);
    
    // Draw character name and level with mobile font scaling
    const nameFontSize = this.mobile.isTouchDevice ? 16 * this.mobile.scaleFactor : 14;
    const levelFontSize = this.mobile.isTouchDevice ? 14 * this.mobile.scaleFactor : 12;
    
    ctx.fillStyle = '#ffffff';
    ctx.font = `bold ${nameFontSize}px sans-serif`;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText(this.character.name || 'Player', this.x + 10, this.y - 20);
    
    // Draw level
    ctx.font = `${levelFontSize}px sans-serif`;
    ctx.fillStyle = '#ffff00';
    ctx.fillText(`Lv.${this.character.level}`, this.x + 120, this.y - 20);
    
    // Draw health and mana bars
    this.healthBar.render(ctx);
    this.manaBar.render(ctx);
    
    // Draw HP/MP text with mobile scaling
    const textFontSize = this.mobile.isTouchDevice ? 12 * this.mobile.scaleFactor : 10;
    ctx.font = `${textFontSize}px monospace`;
    ctx.textAlign = 'left';
    
    ctx.fillStyle = '#ffffff';
    ctx.fillText(`HP: ${Math.floor(this.character.hp)}/${this.character.maxHP}`, this.x + 10, this.y + 45);
    
    ctx.fillStyle = '#88ccff';
    ctx.fillText(`MP: ${Math.floor(this.character.mp)}/${this.character.maxMP}`, this.x + 10, this.y + 58);
  }

  // Touch event handlers
  handleTouchStart(x, y) {
    this.mobile.isHovered = (x >= this.x && x <= this.x + this.width &&
                             y >= this.y && y <= this.y + this.height);
    this.healthBar.handleTouchStart(x, y);
    this.manaBar.handleTouchStart(x, y);
  }

  handleTouchEnd() {
    this.mobile.isHovered = false;
    this.healthBar.handleTouchEnd();
    this.manaBar.handleTouchEnd();
  }

  handleTouchMove(x, y) {
    this.mobile.isHovered = (x >= this.x && x <= this.x + this.width &&
                             y >= this.y && y <= this.y + this.height);
    this.healthBar.handleTouchMove(x, y);
    this.manaBar.handleTouchMove(x, y);
  }
};

// Action menu for battle system with mobile optimization
window.ActionMenu = class ActionMenu {
  constructor(x, y, actions = ['Attack', 'Defend', 'Special', 'Item', 'Run']) {
    this.x = x;
    this.y = y;
    this.actions = actions;
    this.selectedIndex = 0;
    this.width = 180;
    this.lineHeight = 35;
    this.enabled = true;
    this.callbacks = {};
    
    // Mobile optimization
    this.mobile = {
      isTouchDevice: false,
      scaleFactor: 1,
      touchTargets: [], // Store touch target rectangles
      hoveredIndex: -1,
      minTouchHeight: 44
    };
  }

  // Initialize mobile settings
  initMobile(mobileConfig) {
    this.mobile.isTouchDevice = mobileConfig.isTouchDevice;
    this.mobile.scaleFactor = mobileConfig.scaleFactor;
    
    if (mobileConfig.isTouchDevice) {
      // Increase dimensions for better touch interaction
      this.width = window.UI.getScaledTouchSize(this.width);
      this.lineHeight = Math.max(this.mobile.minTouchHeight, window.UI.getScaledTouchSize(this.lineHeight));
      
      // Add extra padding
      this.width += mobileConfig.touchPadding * 2;
      this.lineHeight += mobileConfig.touchPadding;
    }
    
    this.height = this.actions.length * this.lineHeight + 40;
    this.calculateTouchTargets();
  }

  // Calculate touch target rectangles for each action
  calculateTouchTargets() {
    this.mobile.touchTargets = [];
    
    this.actions.forEach((action, index) => {
      const actionY = this.y + 40 + index * this.lineHeight;
      
      this.mobile.touchTargets.push({
        x: this.x + 5,
        y: actionY - 5,
        width: this.width - 10,
        height: this.lineHeight + 10, // Extra height for touch
        index: index
      });
    });
  }

  update(dt) {
    // Handle keyboard input (for desktop)
    if (!this.mobile.isTouchDevice) {
      this.handleKeyboardInput();
    }
  }

  // Handle keyboard input
  handleKeyboardInput() {
    if (!this.enabled) return;
    
    if (window.Input.isKeyPressed('ArrowUp')) {
      this.selectedIndex = (this.selectedIndex - 1 + this.actions.length) % this.actions.length;
      this.mobile.hoveredIndex = this.selectedIndex;
    }
    if (window.Input.isKeyPressed('ArrowDown')) {
      this.selectedIndex = (this.selectedIndex + 1) % this.actions.length;
      this.mobile.hoveredIndex = this.selectedIndex;
    }
    if (window.Input.isKeyPressed('Enter')) {
      this.executeAction();
    }
  }

  render(ctx) {
    // Draw background
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.fillRect(this.x, this.y, this.width, this.height);
    
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.strokeRect(this.x, this.y, this.width, this.height);
    
    // Draw title with mobile scaling
    const titleFontSize = this.mobile.isTouchDevice ? 18 * this.mobile.scaleFactor : 16;
    ctx.fillStyle = '#ffffff';
    ctx.font = `bold ${titleFontSize}px sans-serif`;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText('Actions:', this.x + 10, this.y + 10);
    
    // Draw actions
    this.actions.forEach((action, index) => {
      const actionY = this.y + 40 + index * this.lineHeight;
      const isSelected = index === this.selectedIndex;
      const isHovered = index === this.mobile.hoveredIndex;
      const isEnabled = this.enabled && this.isActionEnabled(action);
      
      // Draw selection highlight
      if (isSelected || isHovered) {
        ctx.fillStyle = isHovered ? 'rgba(100, 200, 255, 0.3)' : 'rgba(255, 255, 100, 0.2)';
        ctx.fillRect(this.x + 5, actionY - 5, this.width - 10, this.lineHeight + 10);
        
        ctx.strokeStyle = isHovered ? '#64c8ff' : '#ffff00';
        ctx.lineWidth = isHovered ? 3 : 2;
        ctx.strokeRect(this.x + 5, actionY - 5, this.width - 10, this.lineHeight + 10);
      }
      
      // Draw action text with mobile scaling
      const actionFontSize = this.mobile.isTouchDevice ? 16 * this.mobile.scaleFactor : 14;
      ctx.fillStyle = isSelected ? '#ffff00' : (isHovered ? '#64c8ff' : (isEnabled ? '#ffffff' : '#666666'));
      ctx.font = `${actionFontSize}px sans-serif`;
      ctx.fillText(action, this.x + 15, actionY);
    });
  }

  isActionEnabled(action) {
    // Check if action is available based on game state
    return true;
  }

  executeAction() {
    const action = this.actions[this.selectedIndex];
    if (this.isActionEnabled(action) && this.callbacks[action]) {
      this.callbacks[action]();
    }
  }

  setCallback(action, callback) {
    this.callbacks[action] = callback;
  }

  setEnabled(enabled) {
    this.enabled = enabled;
  }

  setSelected(index) {
    this.selectedIndex = Math.max(0, Math.min(index, this.actions.length - 1));
    this.mobile.hoveredIndex = this.selectedIndex;
  }

  // Touch event handlers
  handleTouchStart(x, y) {
    if (!this.enabled || !this.mobile.isTouchDevice) return;
    
    // Check which action was touched
    for (const target of this.mobile.touchTargets) {
      if (x >= target.x && x <= target.x + target.width &&
          y >= target.y && y <= target.y + target.height) {
        this.mobile.hoveredIndex = target.index;
        this.selectedIndex = target.index;
        return;
      }
    }
    
    this.mobile.hoveredIndex = -1;
  }

  handleTouchEnd() {
    if (!this.enabled || !this.mobile.isTouchDevice) return;
    
    // Execute action if we have a hovered item
    if (this.mobile.hoveredIndex >= 0) {
      this.executeAction();
      this.mobile.hoveredIndex = -1;
    }
  }

  handleTouchMove(x, y) {
    if (!this.enabled || !this.mobile.isTouchDevice) return;
    
    // Update hover state
    let newHoveredIndex = -1;
    for (const target of this.mobile.touchTargets) {
      if (x >= target.x && x <= target.x + target.width &&
          y >= target.y && y <= target.y + target.height) {
        newHoveredIndex = target.index;
        break;
      }
    }
    
    this.mobile.hoveredIndex = newHoveredIndex;
  }
};

// Battle log for displaying combat messages with mobile optimization
window.BattleLog = class BattleLog {
  constructor(x, y, width = 300, height = 150, maxLines = 6) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.maxLines = maxLines;
    this.messages = [];
    this.lineHeight = 20;
    this.scrollOffset = 0;
    
    // Mobile optimization
    this.mobile = {
      isTouchDevice: false,
      scaleFactor: 1,
      minTouchHeight: 44,
      isDragging: false,
      dragStartY: 0,
      dragStartOffset: 0
    };
  }

  // Initialize mobile settings
  initMobile(mobileConfig) {
    this.mobile.isTouchDevice = mobileConfig.isTouchDevice;
    this.mobile.scaleFactor = mobileConfig.scaleFactor;
    
    if (mobileConfig.isTouchDevice) {
      // Increase dimensions for better touch interaction
      this.width = window.UI.getScaledTouchSize(this.width);
      this.height = window.UI.getScaledTouchSize(this.height);
      this.lineHeight = Math.max(this.mobile.minTouchHeight / 2, window.UI.getScaledTouchSize(this.lineHeight));
    }
  }

  addMessage(message, color = '#ffffff') {
    this.messages.push({
      text: message,
      color: color,
      timestamp: Date.now()
    });
    
    // Auto-scroll to bottom
    if (this.messages.length > this.maxLines) {
      this.messages.shift();
    }
  }

  update(dt) {
    // Handle scroll for desktop
    if (!this.mobile.isTouchDevice) {
      if (window.Input.isKeyPressed('PageUp')) {
        this.scrollOffset = Math.max(0, this.scrollOffset - 1);
      }
      if (window.Input.isKeyPressed('PageDown')) {
        this.scrollOffset = Math.min(0, this.scrollOffset + 1);
      }
    }
  }

  render(ctx) {
    // Draw background
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.fillRect(this.x, this.y, this.width, this.height);
    
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1;
    ctx.strokeRect(this.x, this.y, this.width, this.height);
    
    // Draw title with mobile scaling
    const titleFontSize = this.mobile.isTouchDevice ? 16 * this.mobile.scaleFactor : 14;
    ctx.fillStyle = '#ffffff';
    ctx.font = `bold ${titleFontSize}px sans-serif`;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText('Battle Log:', this.x + 10, this.y + 5);
    
    // Draw messages
    const messageFontSize = this.mobile.isTouchDevice ? 14 * this.mobile.scaleFactor : 12;
    ctx.font = `${messageFontSize}px sans-serif`;
    const startIdx = Math.max(0, this.messages.length - this.maxLines + this.scrollOffset);
    
    for (let i = 0; i < Math.min(this.maxLines, this.messages.length - startIdx); i++) {
      const message = this.messages[startIdx + i];
      const y = this.y + 25 + i * this.lineHeight;
      
      ctx.fillStyle = message.color;
      ctx.fillText(message.text, this.x + 10, y);
    }
  }

  clear() {
    this.messages = [];
    this.scrollOffset = 0;
  }

  // Touch event handlers for scrolling
  handleTouchStart(x, y) {
    if (!this.mobile.isTouchDevice) return;
    
    if (x >= this.x && x <= this.x + this.width &&
        y >= this.y && y <= this.y + this.height) {
      this.mobile.isDragging = true;
      this.mobile.dragStartY = y;
      this.mobile.dragStartOffset = this.scrollOffset;
    }
  }

  handleTouchEnd() {
    this.mobile.isDragging = false;
  }

  handleTouchMove(x, y) {
    if (!this.mobile.isDragging || !this.mobile.isTouchDevice) return;
    
    const deltaY = y - this.mobile.dragStartY;
    const scrollDelta = Math.floor(deltaY / this.lineHeight);
    
    this.scrollOffset = Math.max(
      -(this.messages.length - this.maxLines),
      Math.min(0, this.mobile.dragStartOffset + scrollDelta)
    );
  }
};

// Inventory UI component with mobile optimization
window.InventoryUI = class InventoryUI {
  constructor(x, y, inventory) {
    this.x = x;
    this.y = y;
    this.inventory = inventory;
    this.selectedIndex = 0;
    this.slotSize = 40;
    this.slotsPerRow = 5;
    this.padding = 5;
    this.enabled = true;
    this.showTooltip = false;
    this.tooltipItem = null;
    this.tooltipX = 0;
    this.tooltipY = 0;
    
    // Mobile optimization
    this.mobile = {
      isTouchDevice: false,
      scaleFactor: 1,
      minTouchSize: 44,
      touchTargets: [], // Store touch target rectangles
      hoveredSlot: -1,
      isDragging: false
    };
  }

  // Initialize mobile settings
  initMobile(mobileConfig) {
    this.mobile.isTouchDevice = mobileConfig.isTouchDevice;
    this.mobile.scaleFactor = mobileConfig.scaleFactor;
    
    if (mobileConfig.isTouchDevice) {
      // Increase slot size for better touch interaction
      this.slotSize = Math.max(this.mobile.minTouchSize, window.UI.getScaledTouchSize(this.slotSize));
      this.padding = Math.max(8, mobileConfig.touchPadding);
      this.slotsPerRow = Math.min(4, Math.floor(window.innerWidth / (this.slotSize + this.padding))); // Fewer slots per row on mobile
    }
    
    this.calculateTouchTargets();
  }

  // Calculate touch target rectangles for each slot
  calculateTouchTargets() {
    this.mobile.touchTargets = [];
    const totalSlots = 20;
    
    for (let i = 0; i < totalSlots; i++) {
      const x = this.x + (i % this.slotsPerRow) * (this.slotSize + this.padding);
      const y = this.y + Math.floor(i / this.slotsPerRow) * (this.slotSize + this.padding);
      
      this.mobile.touchTargets.push({
        x: x,
        y: y,
        width: this.slotSize,
        height: this.slotSize,
        index: i
      });
    }
  }

  update(dt) {
    if (!this.enabled) return;
    
    if (!this.mobile.isTouchDevice) {
      // Handle keyboard navigation for desktop
      this.handleKeyboardInput();
    } else {
      // Handle mouse hover for tooltip on mobile
      this.handleMouseHover();
    }
  }

  // Handle keyboard input for desktop
  handleKeyboardInput() {
    const totalSlots = Math.ceil(this.inventory.items.length / this.slotsPerRow) * this.slotsPerRow;
    
    if (window.Input.isKeyPressed('ArrowLeft')) {
      this.selectedIndex = (this.selectedIndex - 1 + totalSlots) % totalSlots;
    }
    if (window.Input.isKeyPressed('ArrowRight')) {
      this.selectedIndex = (this.selectedIndex + 1) % totalSlots;
    }
    if (window.Input.isKeyPressed('ArrowUp')) {
      this.selectedIndex = Math.max(0, this.selectedIndex - this.slotsPerRow);
    }
    if (window.Input.isKeyPressed('ArrowDown')) {
      this.selectedIndex = Math.min(totalSlots - 1, this.selectedIndex + this.slotsPerRow);
    }
  }

  // Handle mouse hover for tooltip
  handleMouseHover() {
    const mouseX = window.Input.getMouseX();
    const mouseY = window.Input.getMouseY();
    
    this.showTooltip = false;
    for (let i = 0; i < this.inventory.items.length; i++) {
      const target = this.mobile.touchTargets[i];
      if (target) {
        if (mouseX >= target.x && mouseX <= target.x + target.width &&
            mouseY >= target.y && mouseY <= target.y + target.height) {
          this.showTooltip = true;
          this.tooltipItem = this.inventory.items[i];
          this.tooltipX = mouseX + 10;
          this.tooltipY = mouseY - 30;
          break;
        }
      }
    }
  }

  render(ctx) {
    // Draw inventory slots
    for (let i = 0; i < 20; i++) { // 20 slots total
      const target = this.mobile.touchTargets[i];
      if (!target) continue;
      
      const x = target.x;
      const y = target.y;
      const isHovered = i === this.mobile.hoveredSlot;
      const isSelected = i === this.selectedIndex;
      const hasItem = i < this.inventory.items.length;
      
      // Draw slot background with hover effect
      ctx.fillStyle = hasItem ? 'rgba(0, 100, 0, 0.5)' : 'rgba(50, 50, 50, 0.5)';
      if (isHovered) {
        ctx.fillStyle = hasItem ? 'rgba(0, 150, 0, 0.7)' : 'rgba(100, 100, 100, 0.7)';
      }
      ctx.fillRect(x, y, this.slotSize, this.slotSize);
      
      // Draw selection/hover border
      if (isSelected && this.enabled) {
        ctx.strokeStyle = '#ffff00';
        ctx.lineWidth = 3;
      } else if (isHovered) {
        ctx.strokeStyle = '#64c8ff';
        ctx.lineWidth = 2;
      } else {
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1;
      }
      ctx.strokeRect(x, y, this.slotSize, this.slotSize);
      
      // Draw item if exists
      if (hasItem) {
        const item = this.inventory.items[i];
        const template = window.ItemTypes ? window.ItemTypes[item.templateId] : null;
        
        if (template) {
          // Draw item icon with mobile scaling
          const iconFontSize = Math.max(16, this.slotSize * 0.4) * this.mobile.scaleFactor;
          ctx.fillStyle = this.getItemColor(template.type);
          ctx.font = `bold ${iconFontSize}px sans-serif`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(template.name.charAt(0).toUpperCase(), x + this.slotSize/2, y + this.slotSize/2);
          
          // Draw quantity if > 1
          if (item.quantity > 1) {
            const quantityFontSize = Math.max(10, this.slotSize * 0.25) * this.mobile.scaleFactor;
            ctx.fillStyle = '#ffffff';
            ctx.font = `${quantityFontSize}px sans-serif`;
            ctx.fillText(item.quantity.toString(), x + this.slotSize - 8, y + this.slotSize - 8);
          }
        }
      }
      
      // Draw slot number (for debugging)
      ctx.fillStyle = '#666666';
      ctx.font = '8px sans-serif';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';
      ctx.fillText((i + 1).toString(), x + 2, y + 2);
    }
    
    // Draw tooltip
    if (this.showTooltip && this.tooltipItem) {
      this.renderTooltip(ctx);
    }
  }

  renderTooltip(ctx) {
    const template = window.ItemTypes ? window.ItemTypes[this.tooltipItem.templateId] : null;
    if (!template) return;
    
    // Draw tooltip background with mobile scaling
    const tooltipWidth = this.mobile.isTouchDevice ? 250 : 200;
    const tooltipHeight = this.mobile.isTouchDevice ? 100 : 80;
    const x = Math.min(this.tooltipX, ctx.canvas.width - tooltipWidth - 10);
    const y = Math.max(10, this.tooltipY);
    
    ctx.fillStyle = 'rgba(0, 0, 0, 0.9)';
    ctx.fillRect(x, y, tooltipWidth, tooltipHeight);
    
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1;
    ctx.strokeRect(x, y, tooltipWidth, tooltipHeight);
    
    // Draw item info with mobile scaling
    const nameFontSize = this.mobile.isTouchDevice ? 16 * this.mobile.scaleFactor : 14;
    const infoFontSize = this.mobile.isTouchDevice ? 13 * this.mobile.scaleFactor : 12;
    
    ctx.fillStyle = '#ffffff';
    ctx.font = `bold ${nameFontSize}px sans-serif`;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText(template.name, x + 10, y + 10);
    
    ctx.font = `${infoFontSize}px sans-serif`;
    ctx.fillStyle = '#cccccc';
    ctx.fillText(`Type: ${template.type}`, x + 10, y + 30);
    ctx.fillText(`Quantity: ${this.tooltipItem.quantity}`, x + 10, y + 45);
    
    if (template.description) {
      const maxLength = this.mobile.isTouchDevice ? 30 : 25;
      ctx.fillText(template.description.substring(0, maxLength) + '...', x + 10, y + 60);
    }
  }

  getItemColor(type) {
    switch (type) {
      case 'weapon': return '#ff6600';
      case 'armor': return '#0066ff';
      case 'consumable': return '#00ff00';
      case 'material': return '#ff00ff';
      case 'accessory': return '#ffff00';
      default: return '#ffffff';
    }
  }

  getSelectedItem() {
    if (this.selectedIndex < this.inventory.items.length) {
      return this.inventory.items[this.selectedIndex];
    }
    return null;
  }

  setEnabled(enabled) {
    this.enabled = enabled;
  }

  // Touch event handlers
  handleTouchStart(x, y) {
    if (!this.enabled || !this.mobile.isTouchDevice) return;
    
    // Check which slot was touched
    for (const target of this.mobile.touchTargets) {
      if (x >= target.x && x <= target.x + target.width &&
          y >= target.y && y <= target.y + target.height) {
        this.mobile.hoveredSlot = target.index;
        this.selectedIndex = target.index;
        this.mobile.isDragging = true;
        
        // Show tooltip for mobile
        if (target.index < this.inventory.items.length) {
          this.showTooltip = true;
          this.tooltipItem = this.inventory.items[target.index];
          this.tooltipX = x + 10;
          this.tooltipY = y - 30;
        }
        return;
      }
    }
    
    this.mobile.hoveredSlot = -1;
    this.showTooltip = false;
  }

  handleTouchEnd() {
    this.mobile.isDragging = false;
    
    // Hide tooltip after a delay
    setTimeout(() => {
      this.showTooltip = false;
    }, 2000);
  }

  handleTouchMove(x, y) {
    if (!this.enabled || !this.mobile.isTouchDevice) return;
    
    // Update hover state
    let newHoveredSlot = -1;
    for (const target of this.mobile.touchTargets) {
      if (x >= target.x && x <= target.x + target.width &&
          y >= target.y && y <= target.y + target.height) {
        newHoveredSlot = target.index;
        
        // Update selection if dragging
        if (this.mobile.isDragging) {
          this.selectedIndex = target.index;
        }
        
        // Update tooltip
        if (target.index < this.inventory.items.length) {
          this.showTooltip = true;
          this.tooltipItem = this.inventory.items[target.index];
          this.tooltipX = x + 10;
          this.tooltipY = y - 30;
        }
        break;
      }
    }
    
    this.mobile.hoveredSlot = newHoveredSlot;
    
    if (newHoveredSlot === -1) {
      this.showTooltip = false;
    }
  }
};