// File: src/game/battle.js
window.FILE_MANIFEST = window.FILE_MANIFEST || [];
window.FILE_MANIFEST.push({
  name: 'src/game/battle.js',
  exports: ['BattleScene'],
  dependencies: ['Scene', 'MathUtils', 'Renderer', 'ItemTypes', 'Effects', 'UI']
});

// Turn-based battle scene with zoom effects and special attacks
window.BattleScene = class BattleScene extends window.Scene {
  constructor() {
    super();
    this.player = null;
    this.enemy = null;
    this.turn = 'player'; // 'player' or 'enemy'
    this.turnOrder = [];
    this.currentTurnIndex = 0;
    this.battleLog = ['Battle Started!', 'Choose your action.'];
    this.selectedAction = 0;
    this.actions = ['Attack', 'Defend', 'Special', 'Item', 'Run'];
    this.battleOver = false;
    
    // Battle animations and effects
    this.animations = [];
    this.zoomLevel = 1.0;
    this.targetZoom = 2.5;
    this.zoomSpeed = 3.0;
    this.battleStarted = false;
    
    // Battle state
    this.playerDefending = false;
    this.enemyDefending = false;
    this.victory = false;
    
    // UI Components
    this.actionMenu = null;
    this.battleLogUI = null;
    this.playerStatus = null;
    this.enemyStatus = null;
    
    // Enemy types
    this.enemyTypes = [
      { name: 'Goblin', hp: 30, attack: 8, defense: 2, exp: 25, gold: 15, color: '#8b4513' },
      { name: 'Wolf', hp: 40, attack: 12, defense: 1, exp: 35, gold: 20, color: '#696969' },
      { name: 'Orc', hp: 60, attack: 15, defense: 4, exp: 50, gold: 35, color: '#556b2f' },
      { name: 'Dark Mage', hp: 45, attack: 18, defense: 2, exp: 60, gold: 40, color: '#4b0082' }
    ];
  }

  enter(data) {
    super.enter(data);
    console.log('Entering battle scene');
    
    // Get player reference
    this.player = window.game?.player || new window.Player();
    
    // Initialize enemy
    this.spawnEnemy();
    
    // Reset battle state
    this.resetBattle();
    
    // Initialize UI components
    this.initializeUI();
    
    // Start zoom-in animation
    this.startZoomIn();
  }

  spawnEnemy() {
    // Select random enemy type (with level scaling)
    const baseIndex = Math.min(Math.floor(this.player.level / 3), this.enemyTypes.length - 1);
    const enemyType = this.enemyTypes[window.MathUtils.randomInt(baseIndex, Math.min(baseIndex + 1, this.enemyTypes.length - 1))];
    
    // Scale enemy stats with player level
    const levelScale = 1 + (this.player.level * 0.1);
    
    this.enemy = {
      ...enemyType,
      maxHP: Math.floor(enemyType.hp * levelScale),
      hp: Math.floor(enemyType.hp * levelScale),
      attack: Math.floor(enemyType.attack * levelScale),
      defense: enemyType.defense,
      exp: Math.floor(enemyType.exp * levelScale),
      gold: Math.floor(enemyType.gold * levelScale)
    };
  }

  initializeUI() {
    // Initialize UI components
    this.actionMenu = new window.ActionMenu(50, 500, this.actions);
    this.battleLogUI = new window.BattleLog(window.Renderer.canvas.width - 350, 500);
    this.playerStatus = new window.StatusBar(50, 50, this.player);
    this.enemyStatus = new window.StatusBar(window.Renderer.canvas.width - 250, 50, this.enemy);
    
    // Set up action menu callbacks
    this.actionMenu.setCallback('Attack', () => this.executePlayerAction('Attack'));
    this.actionMenu.setCallback('Defend', () => this.executePlayerAction('Defend'));
    this.actionMenu.setCallback('Special', () => this.executePlayerAction('Special'));
    this.actionMenu.setCallback('Item', () => this.executePlayerAction('Item'));
    this.actionMenu.setCallback('Run', () => this.executePlayerAction('Run'));
    
    // Initialize battle log
    this.battleLog.forEach(message => this.battleLogUI.addMessage(message));
  }

  resetBattle() {
    this.turn = 'player';
    this.turnOrder = ['player', 'enemy'];
    this.currentTurnIndex = 0;
    this.battleLog = ['Battle Started!', 'Choose your action.'];
    this.selectedAction = 0;
    this.battleOver = false;
    this.playerDefending = false;
    this.enemyDefending = false;
    this.animations = [];
    this.victory = false;
    
    // Filter actions based on player level
    this.updateAvailableActions();
  }

  updateAvailableActions() {
    // Always have basic actions
    this.actions = ['Attack', 'Defend', 'Item', 'Run'];
    
    // Add special attacks based on player level
    if (this.player.level >= 1) {
      this.actions.splice(2, 0, 'Special'); // Insert before Item
    }
  }

  startZoomIn() {
    this.zoomLevel = 1.0;
    this.battleStarted = false;
    
    // Start zoom animation
    setTimeout(() => {
      this.battleStarted = true;
    }, 500);
  }

  update(deltaTime) {
    const dt = deltaTime / 1000; // Convert to seconds
    
    // Update zoom animation
    if (this.battleStarted && this.zoomLevel < this.targetZoom) {
      this.zoomLevel += this.zoomSpeed * dt;
      if (this.zoomLevel >= this.targetZoom) {
        this.zoomLevel = this.targetZoom;
      }
    }
    
    // Update animations
    this.updateAnimations(dt);
    
    // Update effects
    window.Effects.update(deltaTime);
    
    // Update UI components
    if (this.actionMenu) this.actionMenu.update(dt);
    if (this.battleLogUI) this.battleLogUI.update(dt);
    if (this.playerStatus) this.playerStatus.update(dt);
    if (this.enemyStatus) this.enemyStatus.update(dt);
    
    if (this.battleOver) {
      if (window.Input.isKeyPressed('Enter')) {
        // Return to overworld or game over
        if (this.victory) {
          // Rewards already applied above
          window.SceneManager.switchScene('overworld');
        } else {
          // Game over - could implement proper game over scene
          window.SceneManager.switchScene('overworld');
        }
      }
      return;
    }

    if (this.turn === 'player') {
      this.handlePlayerInput();
    } else {
      this.handleEnemyTurn();
    }
  }

  updateAnimations(dt) {
    // Update existing animations
    this.animations = this.animations.filter(anim => {
      anim.elapsed += dt;
      return anim.elapsed < anim.duration;
    });
  }

  addAnimation(type, data) {
    this.animations.push({
      type,
      data,
      duration: data.duration || 0.5,
      elapsed: 0
    });
  }

  handlePlayerInput() {
    // Navigate action menu
    if (window.Input.isKeyPressed('ArrowUp')) {
      this.selectedAction = (this.selectedAction - 1 + this.actions.length) % this.actions.length;
    }
    if (window.Input.isKeyPressed('ArrowDown')) {
      this.selectedAction = (this.selectedAction + 1) % this.actions.length;
    }

    // Execute selected action
    if (window.Input.isKeyPressed('Enter')) {
      this.executePlayerAction(this.actions[this.selectedAction]);
    }
  }

  executePlayerAction(action) {
    this.playerDefending = false;
    let success = true;

    switch (action) {
      case 'Attack':
        const damage = this.calculateDamage(this.player.attack, this.enemy.defense);
        this.enemy.hp = Math.max(0, this.enemy.hp - damage);
        this.battleLog.push(`Player attacks for ${damage} damage!`);
        this.addAnimation('attack', { source: 'player', target: 'enemy', damage });
        this.addScreenShake(0.2);
        break;
      
      case 'Defend':
        this.playerDefending = true;
        this.battleLog.push('Player defends!');
        this.addAnimation('defend', { source: 'player' });
        break;
      
      case 'Special':
        // Use the first available special attack
        const specialAttack = this.getAvailableSpecialAttack();
        if (specialAttack) {
          const result = this.player.useSpecialAttack(specialAttack);
          if (result.success) {
            const specialDamage = this.calculateDamage(result.damage, this.enemy.defense);
            this.enemy.hp = Math.max(0, this.enemy.hp - specialDamage);
            this.battleLog.push(`Player uses ${specialAttack} for ${specialDamage} damage!`);
            this.addAnimation('special', { 
              source: 'player', 
              target: 'enemy', 
              damage: specialDamage,
              attackName: specialAttack 
            });
            this.addScreenShake(0.3);
          } else {
            this.battleLog.push(result.message);
            success = false;
          }
        } else {
          this.battleLog.push('No special attacks available!');
          success = false;
        }
        break;
      
      case 'Item':
        // Use item from inventory
        if (this.player.inventory.items.length > 0) {
          // Create inventory instance if not exists
          if (!this.inventorySystem) {
            this.inventorySystem = new window.Inventory(this.player);
            // Copy items from player's inventory
            this.player.inventory.items.forEach(item => {
              this.inventorySystem.addItem(item.templateId, item.quantity);
            });
          }
          
          // Use first available consumable item
          const usableItem = this.inventorySystem.items.find(item => {
            const template = window.ItemTypes[item.templateId];
            return template && template.type === 'consumable' && template.effect === 'heal';
          });
          
          if (usableItem) {
            const result = this.inventorySystem.useItem(
              this.inventorySystem.items.indexOf(usableItem), 1
            );
            
            if (result.success) {
              this.battleLog.push(result.message);
              this.battleLogUI.addMessage(result.message, '#00ff00');
              // Sync back to player inventory
              this.player.inventory.items = this.inventorySystem.items;
              window.Effects.addHealEffect(250, 250);
              this.addAnimation('heal', { source: 'player', amount: result.value || 0 });
            } else {
              this.battleLog.push(result.message);
              this.battleLogUI.addMessage(result.message, '#ff6666');
              success = false;
            }
          } else {
            this.battleLog.push('No usable items available!');
            this.battleLogUI.addMessage('No usable items available!', '#ff6666');
            success = false;
          }
        } else {
          this.battleLog.push('No items available!');
          this.battleLogUI.addMessage('No items available!', '#ff6666');
          success = false;
        }
        break;
      
      case 'Run':
        const fleeChance = 50 + (this.player.level * 5);
        if (window.MathUtils.randomInt(1, 100) <= fleeChance) {
          this.battleLog.push('Player fled from battle!');
          this.endBattle(false);
          return;
        } else {
          this.battleLog.push('Could not escape!');
        }
        break;
    }

    if (!success) return;

    // Check if enemy defeated
    if (this.enemy.hp <= 0) {
      this.battleLog.push(`${this.enemy.name} defeated! Victory!`);
      this.battleLogUI.addMessage(`${this.enemy.name} defeated! Victory!`, '#00ff00');
      
      // Apply rewards
      const oldLevel = this.player.level;
      this.player.gainExperience(this.enemy.exp);
      this.player.addGold(this.enemy.gold);
      
      // Check for level up
      if (this.player.level > oldLevel) {
        window.Effects.addLevelUpEffect(250, 250);
        this.battleLogUI.addMessage(`LEVEL UP! You are now level ${this.player.level}!`, '#ffff00');
      }
      
      // Track kill for mission progress
      if (window.SceneManager.currentScene instanceof window.TownScene) {
        window.SceneManager.currentScene.trackKill(this.enemy.name.toLowerCase());
      } else if (window.SceneManager.scenes.town) {
        // Store kill data for when returning to town
        const townScene = new window.TownScene();
        townScene.playerMissions.killCounts = townScene.playerMissions.killCounts || {};
        townScene.playerMissions.killCounts[this.enemy.name.toLowerCase()] = 
          (townScene.playerMissions.killCounts[this.enemy.name.toLowerCase()] || 0) + 1;
        // Save to global storage for town scene access
        window.game.townMissionKills = townScene.playerMissions.killCounts;
      }
      
      // Apply boss rewards if this was a boss
      if (this.enemy.isBoss) {
        const bossRewards = window.ProgressionManager.applyBossRewards(this.player, this.enemy.name);
        if (bossRewards) {
          this.battleLog.push(bossRewards.description);
          this.battleLogUI.addMessage(bossRewards.description, '#ffff00');
        }
      }
      
      // Generate and add loot using EnemyFactory
      const loot = window.EnemyFactory.generateLoot(this.enemy, 1.0);
      
      if (loot.items.length > 0) {
        this.battleLog.push(`Found items:`);
        this.battleLogUI.addMessage('Found items:', '#ffff00');
        loot.items.forEach(item => {
          const template = window.ItemTypes[item.templateId];
          if (template) {
            this.player.addItem(item.templateId, item.quantity);
            this.battleLog.push(`  ${template.name} x${item.quantity}`);
            this.battleLogUI.addMessage(`  ${template.name} x${item.quantity}`, '#88ff88');
          }
        });
      }
      
      // Check for progression unlocks
      const progression = window.ProgressionManager.getProgressionStatus(this.player);
      const newUnlocks = progression.availableUnlocks;
      if (newUnlocks.length > 0) {
        this.battleLog.push('New content unlocked!');
        this.battleLogUI.addMessage('New content unlocked!', '#00ffff');
      }
      
      this.battleLog.push(`Gained ${this.enemy.exp} EXP and ${this.enemy.gold} gold!`);
      this.battleLogUI.addMessage(`Gained ${this.enemy.exp} EXP and ${this.enemy.gold} gold!`, '#ffff00');
      
      // Victory celebration effect
      window.Effects.addParticleBurst(window.Renderer.canvas.width / 2, 300, 20, '#ffff00', 150);
      
      this.victory = true;
      this.endBattle(true);
      return;
    }

    // Switch to enemy turn
    this.turn = 'enemy';
  }

  getAvailableSpecialAttack() {
    // Return the highest level available special attack
    const attacks = ['slash', 'fireball', 'heal', 'ultimate'];
    for (let i = attacks.length - 1; i >= 0; i--) {
      const attack = attacks[i];
      if (this.player.specialAttacks[attack].learned) {
        return attack;
      }
    }
    return null;
  }

  calculateDamage(attack, defense) {
    const baseDamage = attack + window.MathUtils.randomInt(-2, 2);
    const defenseReduction = defense * 0.5;
    return Math.max(1, Math.floor(baseDamage - defenseReduction));
  }

  handleEnemyTurn() {
    this.enemyDefending = false;
    
    // Simple AI: 60% attack, 20% defend, 20% special
    const action = window.MathUtils.randomInt(1, 100);
    
    setTimeout(() => {
      if (action <= 60) {
        // Enemy attack
        const damage = this.calculateDamage(this.enemy.attack, this.player.defense * (this.playerDefending ? 2 : 1));
        this.player.takeDamage(damage);
        this.battleLog.push(`${this.enemy.name} attacks for ${damage} damage!`);
        this.battleLogUI.addMessage(`${this.enemy.name} attacks for ${damage} damage!`, '#ff4444');
        window.Effects.addAttackEffect(window.Renderer.canvas.width - 250, 250, 250, 250, '#ff0000');
        window.Effects.addScreenShake(5, 0.2);
        this.addAnimation('attack', { source: 'enemy', target: 'player', damage });
      } else if (action <= 80) {
        // Enemy defend
        this.enemyDefending = true;
        this.battleLog.push(`${this.enemy.name} defends!`);
        this.battleLogUI.addMessage(`${this.enemy.name} defends!`, '#00ffff');
        window.Effects.addParticleBurst(window.Renderer.canvas.width - 250, 250, 8, '#00ffff', 50);
        this.addAnimation('defend', { source: 'enemy' });
      } else {
        // Enemy special attack
        const damage = this.calculateDamage(Math.floor(this.enemy.attack * 1.5), this.player.defense * (this.playerDefending ? 2 : 1));
        this.player.takeDamage(damage);
        this.battleLog.push(`${this.enemy.name} uses special attack for ${damage} damage!`);
        this.battleLogUI.addMessage(`${this.enemy.name} uses special attack for ${damage} damage!`, '#ff00ff');
        window.Effects.addAttackEffect(window.Renderer.canvas.width - 250, 250, 250, 250, '#ff00ff');
        window.Effects.addParticleBurst(250, 250, 15, '#ff00ff', 100);
        window.Effects.addScreenShake(10, 0.4);
        this.addAnimation('special', { source: 'enemy', target: 'player', damage });
      }

      // Check if player defeated
      if (this.player.hp <= 0) {
        this.battleLog.push('Player defeated! Game Over!');
        this.battleLogUI.addMessage('Player defeated! Game Over!', '#ff0000');
        window.Effects.addParticleBurst(250, 250, 15, '#ff0000', 100);
        window.Effects.addScreenShake(15, 0.8);
        this.victory = false;
        this.endBattle(false);
        return;
      }

      // Switch back to player turn
      this.turn = 'player';
    }, 1500); // 1.5 second delay for dramatic effect
  }

  addScreenShake(duration) {
    this.addAnimation('shake', { duration });
  }

  endBattle(victory) {
    this.battleOver = true;
    
    // Sync inventory back to player
    if (this.inventorySystem) {
      this.player.inventory.items = this.inventorySystem.items;
    }
    
    if (!victory) {
      this.battleLog.push('Press Enter to continue...');
    } else {
      this.battleLog.push('Press Enter to return to overworld...');
    }
  }
  
  // Setup quick slots with first few usable items
  setupQuickSlots() {
    if (!this.inventorySystem) return;
    
    // Find first 4 usable items for quick slots
    let slotIndex = 0;
    for (let i = 0; i < this.inventorySystem.items.length && slotIndex < 4; i++) {
      const item = this.inventorySystem.items[i];
      const template = window.ItemTypes[item.templateId];
      
      if (template && template.type === 'consumable') {
        this.quickSlots[slotIndex] = i;
        slotIndex++;
      }
    }
  }
  
  // Use quick slot item
  useQuickSlot(slotNum) {
    if (slotNum < 1 || slotNum > 4) return;
    
    const inventorySlot = this.quickSlots[slotNum - 1];
    if (inventorySlot !== null && inventorySlot < this.inventorySystem.items.length) {
      const result = this.inventorySystem.useItem(inventorySlot, 1);
      
      if (result.success) {
        this.battleLog.push(`Quick slot ${slotNum}: ${result.message}`);
        this.addAnimation('heal', { source: 'player', amount: result.value || 0 });
      } else {
        this.battleLog.push(`Quick slot ${slotNum}: ${result.message}`);
      }
    } else {
      this.battleLog.push(`Quick slot ${slotNum} is empty!`);
    }
  }

  render(ctx) {
    // Apply zoom effect
    ctx.save();
    
    if (this.zoomLevel > 1.0) {
      const centerX = ctx.canvas.width / 2;
      const centerY = ctx.canvas.height / 2;
      const scale = this.zoomLevel;
      
      ctx.translate(centerX, centerY);
      ctx.scale(scale, scale);
      ctx.translate(-centerX, -centerY);
    }
    
    // Apply screen shake from animations
    const shakeAnim = this.animations.find(a => a.type === 'shake');
    if (shakeAnim) {
      const shakeIntensity = 5 * (1 - shakeAnim.elapsed / shakeAnim.duration);
      const shakeX = (Math.random() - 0.5) * shakeIntensity;
      const shakeY = (Math.random() - 0.5) * shakeIntensity;
      ctx.translate(shakeX, shakeY);
    }

    // Clear canvas
    window.Renderer.clear('#2c1810');

    // Draw battle background with pattern
    this.drawBattleBackground(ctx);

    // Draw battle characters
    this.drawBattleCharacters(ctx);

    // Draw HP bars
    this.drawHPBars(ctx);

    // Draw animations
    this.drawAnimations(ctx);

    // Draw effects (not affected by zoom)
    window.Effects.render(ctx);

    ctx.restore();

    // Draw UI components (not affected by zoom)
    if (this.actionMenu) this.actionMenu.render(ctx);
    if (this.battleLogUI) this.battleLogUI.render(ctx);
    if (this.playerStatus) this.playerStatus.render(ctx);
    if (this.enemyStatus) this.enemyStatus.render(ctx);
    
    // Draw legacy UI (transition to new components)
    this.drawBattleUI(ctx);
  }

  drawBattleBackground(ctx) {
    // Gradient background
    const gradient = ctx.createLinearGradient(0, 0, 0, ctx.canvas.height);
    gradient.addColorStop(0, '#4a2c1a');
    gradient.addColorStop(1, '#2c1810');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);

    // Add some decorative circles for depth
    ctx.globalAlpha = 0.1;
    for (let i = 0; i < 5; i++) {
      const x = (i * 200) + 100;
      const y = 150 + Math.sin(i) * 50;
      window.Renderer.drawCircle(x, y, 80, '#8b4513');
    }
    ctx.globalAlpha = 1.0;
  }

  drawBattleCharacters(ctx) {
    // Draw enemy
    const enemyX = ctx.canvas.width - 250;
    const enemyY = 250;
    
    // Enemy shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.ellipse(enemyX, enemyY + 60, 40, 15, 0, 0, Math.PI * 2);
    ctx.fill();
    
    // Enemy body
    ctx.fillStyle = this.enemy.color;
    ctx.beginPath();
    ctx.arc(enemyX, enemyY, 45, 0, Math.PI * 2);
    ctx.fill();
    
    // Enemy details
    ctx.fillStyle = '#000000';
    ctx.beginPath();
    ctx.arc(enemyX - 15, enemyY - 10, 5, 0, Math.PI * 2);
    ctx.arc(enemyX + 15, enemyY - 10, 5, 0, Math.PI * 2);
    ctx.fill();
    
    // Enemy name
    window.Renderer.drawCenteredText(this.enemy.name, enemyX, enemyY + 100, 
      { color: '#ffffff', font: 'bold 18px sans-serif' });

    // Draw player
    const playerX = 250;
    const playerY = 250;
    
    // Player shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.ellipse(playerX, playerY + 60, 35, 12, 0, 0, Math.PI * 2);
    ctx.fill();
    
    // Player body
    ctx.fillStyle = this.player.hp > 0 ? '#4a90e2' : '#ff4444';
    ctx.beginPath();
    ctx.arc(playerX, playerY, 40, 0, Math.PI * 2);
    ctx.fill();
    
    // Player details
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(playerX - 12, playerY - 8, 4, 0, Math.PI * 2);
    ctx.arc(playerX + 12, playerY - 8, 4, 0, Math.PI * 2);
    ctx.fill();
    
    // Player name
    window.Renderer.drawCenteredText(`Player Lv.${this.player.level}`, playerX, playerY + 100, 
      { color: '#ffffff', font: 'bold 18px sans-serif' });
  }

  drawHPBars(ctx) {
    // Enemy HP bar
    const enemyX = ctx.canvas.width - 250;
    const enemyY = 250;
    this.drawHPBar(ctx, enemyX - 60, enemyY + 120, 120, 12, this.enemy.hp, this.enemy.maxHP);

    // Player HP bar
    const playerX = 250;
    const playerY = 250;
    this.drawHPBar(ctx, playerX - 60, playerY + 120, 120, 12, this.player.hp, this.player.maxHP);
    
    // Player MP bar
    this.drawMPBar(ctx, playerX - 60, playerY + 140, 120, 8, this.player.mp, this.player.maxMP);
  }

  drawHPBar(ctx, x, y, width, height, currentHP, maxHP) {
    // Background
    ctx.fillStyle = '#333333';
    ctx.fillRect(x, y, width, height);
    
    // HP fill
    const hpPercentage = currentHP / maxHP;
    const hpColor = hpPercentage > 0.5 ? '#00ff00' : hpPercentage > 0.25 ? '#ffff00' : '#ff0000';
    ctx.fillStyle = hpColor;
    ctx.fillRect(x, y, width * hpPercentage, height);
    
    // Border
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.strokeRect(x, y, width, height);
    
    // HP text
    window.Renderer.drawText(`${currentHP}/${maxHP}`, x + width/2 - 25, y - 15, 
      { color: '#ffffff', align: 'center', font: '14px monospace' });
  }

  drawMPBar(ctx, x, y, width, height, currentMP, maxMP) {
    // Background
    ctx.fillStyle = '#333333';
    ctx.fillRect(x, y, width, height);
    
    // MP fill
    const mpPercentage = currentMP / maxMP;
    ctx.fillStyle = '#0088ff';
    ctx.fillRect(x, y, width * mpPercentage, height);
    
    // Border
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1;
    ctx.strokeRect(x, y, width, height);
    
    // MP text
    window.Renderer.drawText(`MP: ${currentMP}/${maxMP}`, x + width/2 - 30, y - 12, 
      { color: '#88ccff', align: 'center', font: '12px monospace' });
  }

  drawAnimations(ctx) {
    this.animations.forEach(anim => {
      switch (anim.type) {
        case 'attack':
          this.drawAttackAnimation(ctx, anim);
          break;
        case 'special':
          this.drawSpecialAnimation(ctx, anim);
          break;
        case 'defend':
          this.drawDefendAnimation(ctx, anim);
          break;
        case 'heal':
          this.drawHealAnimation(ctx, anim);
          break;
      }
    });
  }

  drawAttackAnimation(ctx, anim) {
    const progress = anim.elapsed / anim.duration;
    const targetX = anim.target === 'enemy' ? ctx.canvas.width - 250 : 250;
    const targetY = 250;
    
    // Draw slash effect
    ctx.save();
    ctx.translate(targetX, targetY);
    ctx.rotate(progress * Math.PI);
    ctx.globalAlpha = 1 - progress;
    
    ctx.strokeStyle = '#ffff00';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(-30, 0);
    ctx.lineTo(30, 0);
    ctx.stroke();
    
    ctx.restore();
  }

  drawSpecialAnimation(ctx, anim) {
    const progress = anim.elapsed / anim.duration;
    const targetX = anim.target === 'enemy' ? ctx.canvas.width - 250 : 250;
    const targetY = 250;
    
    // Draw magical explosion effect
    const radius = progress * 60;
    ctx.save();
    ctx.globalAlpha = 1 - progress;
    
    // Multiple colored circles for explosion effect
    const colors = ['#ff0000', '#ff8800', '#ffff00', '#ffffff'];
    colors.forEach((color, i) => {
      ctx.strokeStyle = color;
      ctx.lineWidth = 3 - i;
      ctx.beginPath();
      ctx.arc(targetX, targetY, radius + i * 10, 0, Math.PI * 2);
      ctx.stroke();
    });
    
    ctx.restore();
  }

  drawDefendAnimation(ctx, anim) {
    const progress = anim.elapsed / anim.duration;
    const targetX = anim.source === 'player' ? 250 : ctx.canvas.width - 250;
    const targetY = 250;
    
    // Draw shield effect
    ctx.save();
    ctx.globalAlpha = Math.sin(progress * Math.PI) * 0.7;
    
    ctx.strokeStyle = '#00ffff';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(targetX, targetY, 60, 0, Math.PI * 2);
    ctx.stroke();
    
    ctx.restore();
  }

  drawHealAnimation(ctx, anim) {
    const progress = anim.elapsed / anim.duration;
    const targetX = 250;
    const targetY = 250 - progress * 30;
    
    // Draw healing sparkles
    ctx.save();
    ctx.globalAlpha = 1 - progress;
    
    for (let i = 0; i < 5; i++) {
      const angle = (i / 5) * Math.PI * 2 + progress * Math.PI;
      const x = targetX + Math.cos(angle) * 40;
      const y = targetY + Math.sin(angle) * 40;
      
      ctx.fillStyle = '#00ff00';
      ctx.beginPath();
      ctx.arc(x, y, 3, 0, Math.PI * 2);
      ctx.fill();
    }
    
    ctx.restore();
  }

  drawBattleUI(ctx) {
    // Draw action menu
    this.drawActionMenu(ctx);

    // Draw battle log
    this.drawBattleLog(ctx);
    
    // Draw quick slots
    this.drawQuickSlots(ctx);

    // Draw turn indicator
    if (!this.battleOver) {
      window.Renderer.drawText(`${this.turn === 'player' ? 'Your' : "Enemy's"} Turn`, 
        ctx.canvas.width / 2 - 60, 30, { color: '#ffff00', font: 'bold 24px sans-serif' });
    }
    
    // Draw special attack info if available
    if (this.turn === 'player' && !this.battleOver) {
      this.drawSpecialAttackInfo(ctx);
    }
  }

  drawActionMenu(ctx) {
    // Legacy action menu - now handled by ActionMenu component
    // This method kept for compatibility
    if (this.turn !== 'player' || this.battleOver) return;

    // Synchronize selection with action menu
    if (this.actionMenu && this.actionMenu.selectedIndex !== this.selectedAction) {
      this.actionMenu.setSelected(this.selectedAction);
    }
  }

  drawSpecialAttackInfo(ctx) {
    const specialAttack = this.getAvailableSpecialAttack();
    if (specialAttack) {
      const attack = this.player.specialAttacks[specialAttack];
      const infoX = ctx.canvas.width - 250;
      const infoY = 150;
      
      window.Renderer.drawText('Special Attack:', infoX, infoY, { color: '#ff8800', font: 'bold 14px sans-serif' });
      window.Renderer.drawText(`${specialAttack.toUpperCase()}`, infoX, infoY + 20, { color: '#ffff00', font: '14px sans-serif' });
      window.Renderer.drawText(`Damage: ${Math.floor(attack.damage * 100)}%`, infoX, infoY + 40, { color: '#88ff88', font: '12px sans-serif' });
      window.Renderer.drawText(`Cost: ${attack.cost} MP`, infoX, infoY + 55, { color: '#8888ff', font: '12px sans-serif' });
    }
  }

  drawBattleLog(ctx) {
    // Legacy battle log - now handled by BattleLog component
    // This method kept for compatibility
  }
  
  drawQuickSlots(ctx) {
    if (this.turn !== 'player' || this.battleOver) return;
    
    const startX = 50;
    const startY = 350;
    const slotSize = 50;
    const spacing = 10;
    
    window.Renderer.drawText('Quick Slots:', startX, startY - 10, { color: '#ffffff', font: 'bold 14px sans-serif' });
    
    for (let i = 0; i < 4; i++) {
      const x = startX + i * (slotSize + spacing);
      const y = startY;
      
      // Draw slot background
      ctx.fillStyle = this.quickSlots[i] !== null ? 'rgba(0, 100, 0, 0.5)' : 'rgba(50, 50, 50, 0.5)';
      ctx.fillRect(x, y, slotSize, slotSize);
      
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.strokeRect(x, y, slotSize, slotSize);
      
      // Draw item if slot has one
      if (this.quickSlots[i] !== null && this.inventorySystem) {
        const itemIndex = this.quickSlots[i];
        if (itemIndex < this.inventorySystem.items.length) {
          const item = this.inventorySystem.items[itemIndex];
          const template = window.ItemTypes[item.templateId];
          
          if (template) {
            // Draw item icon (simplified - just use first letter of name)
            ctx.fillStyle = '#ffff00';
            ctx.font = 'bold 20px sans-serif';
            ctx.fillText(template.name.charAt(0), x + slotSize/2 - 10, y + slotSize/2 + 7);
            
            // Draw quantity if > 1
            if (item.quantity > 1) {
              ctx.fillStyle = '#ffffff';
              ctx.font = '10px sans-serif';
              ctx.fillText(item.quantity.toString(), x + slotSize - 12, y + slotSize - 5);
            }
          }
        }
      }
      
      // Draw key number
      ctx.fillStyle = '#cccccc';
      ctx.font = '12px sans-serif';
      ctx.fillText((i + 1).toString(), x + 5, y + 15);
    }
  }
};