// File: src/game/player.js
window.FILE_MANIFEST = window.FILE_MANIFEST || [];
window.FILE_MANIFEST.push({
  name: 'src/game/player.js',
  exports: ['Player'],
  dependencies: ['MathUtils', 'Input', 'Inventory', 'ProgressionManager']
});

// Player character with stats, progression, and inventory
window.Player = class Player {
  constructor() {
    // Position and movement
    this.x = 100;  // World position in pixels
    this.y = 100;
    this.tileSize = 32;
    this.speed = 200; // Pixels per second
    
    // Character stats
    this.level = 1;
    this.experience = 0;
    this.experienceToNext = 100;
    this.maxHP = 50;
    this.hp = 50;
    this.baseAttack = 10;
    this.baseDefense = 5;
    
    // Derived stats (affected by equipment)
    this.attack = this.baseAttack;
    this.defense = this.baseDefense;
    
    // Special attacks (unlocked by level)
    this.specialAttacks = {
      slash: { level: 1, damage: 1.5, cost: 10, learned: true },
      fireball: { level: 5, damage: 2.0, cost: 20, learned: false },
      heal: { level: 8, damage: 0, cost: 15, learned: false },
      ultimate: { level: 12, damage: 3.0, cost: 30, learned: false }
    };
    
    // Inventory system (will be initialized with Inventory class)
    this.inventory = {
      gold: 100,
      items: [],
      maxSize: 20
    };
    this.inventorySystem = null;
    
    // Equipment system
    this.equipment = {
      weapon: null,
      armor: null,
      accessory: null
    };
    
    // Game progression
    this.defeatedBosses = [];
    this.visitedAreas = new Set();
    
    // Movement state
    this.isMoving = false;
    this.facing = 'down';
    this.moveTimer = 0;
    
    // Combat state
    this.mp = 50;
    this.maxMP = 50;
    this.combatCooldown = 0;
    
    console.log('Player character created');
  }
  
  // Update player logic
  update(deltaTime) {
    const dt = deltaTime / 1000; // Convert to seconds
    
    // Update combat cooldowns
    if (this.combatCooldown > 0) {
      this.combatCooldown -= dt;
    }
    
    // Handle movement
    this.handleMovement(dt);
    
    // Regenerate MP slowly
    if (this.mp < this.maxMP) {
      this.mp = Math.min(this.maxMP, this.mp + 1 * dt);
    }
  }
  
  // Handle player movement with tilemap collision
  handleMovement(deltaTime) {
    let dx = 0;
    let dy = 0;
    let moved = false;
    
    // Get input
    if (window.Input.isKeyDown('ArrowUp')) {
      dy = -this.speed * deltaTime;
      this.facing = 'up';
      moved = true;
    }
    if (window.Input.isKeyDown('ArrowDown')) {
      dy = this.speed * deltaTime;
      this.facing = 'down';
      moved = true;
    }
    if (window.Input.isKeyDown('ArrowLeft')) {
      dx = -this.speed * deltaTime;
      this.facing = 'left';
      moved = true;
    }
    if (window.Input.isKeyDown('ArrowRight')) {
      dx = this.speed * deltaTime;
      this.facing = 'right';
      moved = true;
    }
    
    this.isMoving = moved;
    
    // Check collision before moving
    if (moved && this.canMoveTo(this.x + dx, this.y + dy)) {
      this.x += dx;
      this.y += dy;
    }
  }
  
  // Check if position is valid for movement
  canMoveTo(newX, newY) {
    // Check tilemap collision (will be set by scene)
    if (this.currentTilemap) {
      // Check all four corners of player's bounding box
      const margin = 8; // Player collision margin
      const positions = [
        { x: newX - margin, y: newY - margin },
        { x: newX + margin, y: newY - margin },
        { x: newX - margin, y: newY + margin },
        { x: newX + margin, y: newY + margin }
      ];
      
      for (const pos of positions) {
        if (this.currentTilemap.checkCollision(pos.x, pos.y)) {
          return false;
        }
      }
    }
    
    return true;
  }
  
  // Get player's grid position
  getGridPosition() {
    return {
      x: Math.floor(this.x / this.tileSize),
      y: Math.floor(this.y / this.tileSize)
    };
  }
  
  // Experience and leveling system
  gainExperience(amount) {
    this.experience += amount;
    
    // Check for level up
    while (this.experience >= this.experienceToNext) {
      this.levelUp();
    }
  }
  
  // Level up and update stats
  levelUp() {
    this.experience -= this.experienceToNext;
    this.level++;
    
    // Calculate new experience requirement
    this.experienceToNext = Math.floor(100 * Math.pow(1.2, this.level - 1));
    
    // Increase base stats
    this.maxHP += 10;
    this.hp = this.maxHP; // Full heal on level up
    this.baseAttack += 3;
    this.baseDefense += 2;
    this.maxMP += 5;
    this.mp = this.maxMP;
    
    // Update derived stats
    this.updateDerivedStats();
    
    // Check for new special attacks
    this.checkSpecialAttackUnlocks();
    
    console.log(`Player leveled up to ${this.level}!`);
  }
  
  // Update derived stats based on equipment
  updateDerivedStats() {
    this.attack = this.baseAttack;
    this.defense = this.baseDefense;
    
    // Apply equipment bonuses
    if (this.equipment.weapon) {
      this.attack += this.equipment.weapon.attackBonus || 0;
    }
    if (this.equipment.armor) {
      this.defense += this.equipment.armor.defenseBonus || 0;
    }
    if (this.equipment.accessory) {
      this.attack += this.equipment.accessory.attackBonus || 0;
      this.defense += this.equipment.accessory.defenseBonus || 0;
    }
  }
  
  // Check and unlock special attacks based on level
  checkSpecialAttackUnlocks() {
    const unlocks = window.ProgressionManager.checkLevelUnlocks(this);
    
    for (const [name, attack] of Object.entries(this.specialAttacks)) {
      if (!attack.learned && this.level >= attack.level) {
        attack.learned = true;
        console.log(`Unlocked special attack: ${name}!`);
      }
    }
    
    // Check for other level-based unlocks
    if (unlocks.length > 0) {
      console.log('Level unlocks:', unlocks);
    }
  }
  
  // Use special attack
  useSpecialAttack(attackName) {
    const attack = this.specialAttacks[attackName];
    if (!attack || !attack.learned) {
      return { success: false, message: "Attack not learned" };
    }
    
    if (this.mp < attack.cost) {
      return { success: false, message: "Not enough MP" };
    }
    
    if (this.combatCooldown > 0) {
      return { success: false, message: "Attack on cooldown" };
    }
    
    // Consume MP and set cooldown
    this.mp -= attack.cost;
    this.combatCooldown = 0.5; // 0.5 second cooldown
    
    // Calculate damage
    let damage = Math.floor(this.attack * attack.damage);
    
    return { success: true, damage, attack };
  }
  
  // Take damage
  takeDamage(damage) {
    const actualDamage = Math.max(1, damage - this.defense);
    this.hp = Math.max(0, this.hp - actualDamage);
    
    if (this.hp === 0) {
      console.log('Player defeated!');
    }
    
    return actualDamage;
  }
  
  // Heal player
  heal(amount) {
    const actualHeal = Math.min(amount, this.maxHP - this.hp);
    this.hp += actualHeal;
    return actualHeal;
  }
  
  // Restore MP
  restoreMP(amount) {
    const actualRestore = Math.min(amount, this.maxMP - this.mp);
    this.mp += actualRestore;
    return actualRestore;
  }
  
  // Add item to inventory using new inventory system
  addItem(itemTemplate, quantity = 1) {
    if (!this.inventorySystem) {
      this.inventorySystem = new window.Inventory(this);
    }
    
    const result = this.inventorySystem.addItem(itemTemplate, quantity);
    
    // Sync back to player data
    this.inventory.items = this.inventorySystem.items;
    
    return result.success;
  }
  
  // Remove item from inventory using new inventory system
  removeItem(itemIndex, quantity = 1) {
    if (!this.inventorySystem) {
      return null;
    }
    
    const result = this.inventorySystem.removeItem(itemIndex, quantity);
    
    // Sync back to player data
    this.inventory.items = this.inventorySystem.items;
    
    return result.success;
  }
  
  // Equip item using new inventory system
  equipItem(itemIndex) {
    if (!this.inventorySystem) {
      return false;
    }
    
    const result = this.inventorySystem.equipItem(itemIndex);
    
    // Sync back to player data
    this.inventory.items = this.inventorySystem.items;
    
    return result.success;
  }
  
  // Add gold
  addGold(amount) {
    this.inventory.gold += amount;
  }
  
  // Spend gold
  spendGold(amount) {
    if (this.inventory.gold >= amount) {
      this.inventory.gold -= amount;
      return true;
    }
    return false;
  }
  
  // Mark boss as defeated
  defeatBoss(bossName) {
    if (!this.defeatedBosses.includes(bossName)) {
      this.defeatedBosses.push(bossName);
      this.gainExperience(50); // Bonus experience for boss
      this.addGold(100); // Bonus gold for boss
    }
  }
  
  // Check if player can access region
  canAccessRegion(regionName) {
    // This will be checked against tilemap regions
    return this.currentTilemap ? 
      this.currentTilemap.canAccessRegion(regionName, this.defeatedBosses) : 
      true;
  }
  
  // Get player status for UI
  getStatus() {
    return {
      level: this.level,
      hp: this.hp,
      maxHP: this.maxHP,
      mp: this.mp,
      maxMP: this.maxMP,
      experience: this.experience,
      experienceToNext: this.experienceToNext,
      attack: this.attack,
      defense: this.defense,
      gold: this.inventory.gold,
      position: { x: this.x, y: this.y }
    };
  }
  
  // Render player (simple colored rectangle for now)
  render(ctx) {
    // Get screen position
    let screenX = this.x;
    let screenY = this.y;
    
    if (this.currentTilemap) {
      const screenPos = this.currentTilemap.worldToScreen(this.x, this.y);
      screenX = screenPos.x;
      screenY = screenPos.y;
    }
    
    // Draw player as colored rectangle
    ctx.fillStyle = this.hp > 0 ? '#00ff00' : '#ff0000';
    window.Renderer.drawRect(screenX - 12, screenY - 12, 24, 24, ctx.fillStyle);
    
    // Draw facing direction indicator
    ctx.fillStyle = '#ffffff';
    let indicatorX = screenX;
    let indicatorY = screenY;
    
    switch (this.facing) {
      case 'up': indicatorY -= 15; break;
      case 'down': indicatorY += 15; break;
      case 'left': indicatorX -= 15; break;
      case 'right': indicatorX += 15; break;
    }
    
    window.Renderer.drawCircle(indicatorX, indicatorY, 3, ctx.fillStyle);
  }
};