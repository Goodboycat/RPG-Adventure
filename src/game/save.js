// File: src/game/save.js
window.FILE_MANIFEST = window.FILE_MANIFEST || [];
window.FILE_MANIFEST.push({
  name: 'src/game/save.js',
  exports: ['SaveManager', 'ProgressionManager'],
  dependencies: ['MathUtils', 'Player', 'EnemyFactory']
});

// Save game data management system
window.SaveManager = {
  SAVE_VERSION: '1.0',
  SAVE_KEY: 'rpg_adventure_save',
  
  // Auto-save settings
  autoSaveEnabled: true,
  autoSaveInterval: 60000, // 1 minute in milliseconds
  lastAutoSave: 0,
  
  // Initialize save system
  init: function() {
    console.log('Save system initialized');
    
    // Start auto-save timer
    if (this.autoSaveEnabled) {
      this.startAutoSave();
    }
    
    // Check for existing save
    const hasSave = this.hasSaveData();
    console.log('Save data exists:', hasSave);
    
    return hasSave;
  },
  
  // Check if save data exists
  hasSaveData: function() {
    const saveData = localStorage.getItem(this.SAVE_KEY);
    return saveData !== null && saveData !== '';
  },
  
  // Save current game state
  saveGame: function(player, additionalData = {}) {
    try {
      if (!player) {
        console.error('Cannot save: no player data');
        return false;
      }
      
      const saveData = {
        version: this.SAVE_VERSION,
        timestamp: Date.now(),
        player: this.serializePlayer(player),
        progression: this.serializeProgression(player),
        world: this.serializeWorldState(player),
        additional: additionalData
      };
      
      const saveJson = JSON.stringify(saveData);
      localStorage.setItem(this.SAVE_KEY, saveJson);
      
      this.lastAutoSave = Date.now();
      console.log('Game saved successfully');
      
      return true;
    } catch (error) {
      console.error('Save failed:', error);
      return false;
    }
  },
  
  // Load game state
  loadGame: function() {
    try {
      const saveJson = localStorage.getItem(this.SAVE_KEY);
      if (!saveJson) {
        console.log('No save data found');
        return null;
      }
      
      const saveData = JSON.parse(saveJson);
      
      // Check save version compatibility
      if (saveData.version !== this.SAVE_VERSION) {
        console.warn('Save version mismatch, attempting migration');
        // Could implement version migration here
      }
      
      console.log('Game loaded successfully');
      return saveData;
    } catch (error) {
      console.error('Load failed:', error);
      return null;
    }
  },
  
  // Delete save data
  deleteSave: function() {
    try {
      localStorage.removeItem(this.SAVE_KEY);
      console.log('Save data deleted');
      return true;
    } catch (error) {
      console.error('Delete save failed:', error);
      return false;
    }
  },
  
  // Get save info for display
  getSaveInfo: function() {
    try {
      const saveData = this.loadGame();
      if (!saveData) return null;
      
      const playerData = saveData.player;
      const date = new Date(saveData.timestamp);
      
      return {
        version: saveData.version,
        timestamp: saveData.timestamp,
        date: date.toLocaleDateString(),
        time: date.toLocaleTimeString(),
        playerLevel: playerData.level,
        playTime: saveData.additional.playTime || 0,
        defeatedBosses: saveData.progression.defeatedBosses.length,
        unlockedRegions: saveData.progression.unlockedRegions.length,
        gold: playerData.inventory.gold
      };
    } catch (error) {
      console.error('Failed to get save info:', error);
      return null;
    }
  },
  
  // Serialize player data for saving
  serializePlayer: function(player) {
    return {
      // Basic stats
      level: player.level,
      experience: player.experience,
      experienceToNext: player.experienceToNext,
      hp: player.hp,
      maxHP: player.maxHP,
      mp: player.mp,
      maxMP: player.maxMP,
      
      // Combat stats
      baseAttack: player.baseAttack,
      baseDefense: player.baseDefense,
      attack: player.attack,
      defense: player.defense,
      
      // Special attacks
      specialAttacks: player.specialAttacks,
      
      // Position and movement
      x: player.x,
      y: player.y,
      facing: player.facing,
      
      // Inventory and equipment
      inventory: {
        gold: player.inventory.gold,
        items: player.inventory.items.map(item => ({
          templateId: item.templateId,
          quantity: item.quantity,
          equipped: item.equipped
        }))
      },
      equipment: player.equipment,
      
      // Game state
      combatCooldown: player.combatCooldown
    };
  },
  
  // Serialize progression data
  serializeProgression: function(player) {
    return {
      defeatedBosses: player.defeatedBosses || [],
      visitedAreas: Array.from(player.visitedAreas || []),
      unlockedRegions: this.calculateUnlockedRegions(player.defeatedBosses || []),
      highestLevel: player.level,
      totalExperience: this.calculateTotalExperience(player.level, player.experience),
      totalGoldEarned: player.inventory.gold, // Simplified - could track separately
      enemiesDefeated: this.getEnemyDefeatCount()
    };
  },
  
  // Serialize world state
  serializeWorldState: function(player) {
    return {
      currentRegion: this.getCurrentPlayerRegion(player),
      lastTown: player.lastTown || null,
      unlockedTowns: this.calculateUnlockedTowns(player.defeatedBosses || []),
      worldFlags: player.worldFlags || {}
    };
  },
  
  // Calculate unlocked regions based on defeated bosses
  calculateUnlockedRegions: function(defeatedBosses) {
    const regions = ['plains']; // Always unlocked
    
    // Boss-based region unlocking
    if (defeatedBosses.includes('forest_guardian')) {
      regions.push('forest');
    }
    if (defeatedBosses.includes('mountain_titan')) {
      regions.push('mountains');
    }
    if (defeatedBosses.includes('castle_lord')) {
      regions.push('castle');
    }
    
    return regions;
  },
  
  // Calculate unlocked towns based on progression
  calculateUnlockedTowns: function(defeatedBosses) {
    const towns = ['riverside_village']; // Always unlocked
    
    if (defeatedBosses.includes('forest_guardian')) {
      towns.push('harbor_city');
    }
    if (defeatedBosses.includes('mountain_titan')) {
      towns.push('stone_peak');
    }
    
    return towns;
  },
  
  // Calculate total experience earned
  calculateTotalExperience: function(level, currentExp) {
    let totalExp = currentExp;
    for (let i = 1; i < level; i++) {
      totalExp += Math.floor(100 * Math.pow(1.2, i - 1));
    }
    return totalExp;
  },
  
  // Get enemy defeat count (simplified - would need proper tracking)
  getEnemyDefeatCount: function() {
    // This would need to be tracked during gameplay
    // For now, return 0
    return 0;
  },
  
  // Get current player region
  getCurrentPlayerRegion: function(player) {
    // This would be determined by player position and tilemap data
    // For now, return default
    return 'plains';
  },
  
  // Start auto-save timer
  startAutoSave: function() {
    setInterval(() => {
      if (window.game && window.game.player) {
        this.saveGame(window.game.player, {
          autoSave: true,
          playTime: window.game.playTime || 0
        });
      }
    }, this.autoSaveInterval);
  },
  
  // Export save data to string
  exportSave: function() {
    try {
      const saveData = localStorage.getItem(this.SAVE_KEY);
      if (!saveData) return null;
      
      // Base64 encode for easier sharing
      return btoa(saveData);
    } catch (error) {
      console.error('Export failed:', error);
      return null;
    }
  },
  
  // Import save data from string
  importSave: function(saveString) {
    try {
      const saveData = atob(saveString);
      localStorage.setItem(this.SAVE_KEY, saveData);
      console.log('Save data imported successfully');
      return true;
    } catch (error) {
      console.error('Import failed:', error);
      return false;
    }
  }
};

// Game progression management system
window.ProgressionManager = {
  // Level progression thresholds
  LEVEL_THRESHOLDS: {
    1: { unlock: ['slash'], description: 'Basic slash attack' },
    5: { unlock: ['fireball'], description: 'Fireball magic' },
    8: { unlock: ['heal'], description: 'Healing spell' },
    10: { unlock: ['harbor_city'], description: 'Access to Harbor City' },
    12: { unlock: ['ultimate'], description: 'Ultimate attack' },
    15: { unlock: ['stone_peak'], description: 'Access to Stone Peak' },
    20: { unlock: ['boss_essence_drops'], description: 'Boss essence drops' }
  },
  
  // Boss progression rewards
  BOSS_REWARDS: {
    forest_guardian: {
      region: 'forest',
      experience: 200,
      gold: 500,
      items: ['health_large', 'sword'],
      description: 'Forest region unlocked'
    },
    mountain_titan: {
      region: 'mountains',
      experience: 400,
      gold: 1000,
      items: ['chain_mail', 'mana_large'],
      description: 'Mountain region unlocked'
    },
    castle_lord: {
      region: 'castle',
      experience: 800,
      gold: 2000,
      items: ['plate_armor', 'greatsword'],
      description: 'Castle region unlocked'
    }
  },
  
  // Check and apply level-based unlocks
  checkLevelUnlocks: function(player) {
    const unlocks = [];
    
    for (const [level, data] of Object.entries(this.LEVEL_THRESHOLDS)) {
      const levelNum = parseInt(level);
      if (player.level >= levelNum) {
        unlocks.push(...data.unlock);
      }
    }
    
    return unlocks;
  },
  
  // Apply boss defeat rewards
  applyBossRewards: function(player, bossName) {
    const rewards = this.BOSS_REWARDS[bossName];
    if (!rewards) {
      console.warn('No rewards defined for boss:', bossName);
      return null;
    }
    
    // Mark boss as defeated
    if (!player.defeatedBosses.includes(bossName)) {
      player.defeatedBosses.push(bossName);
    }
    
    // Apply rewards
    player.gainExperience(rewards.experience);
    player.addGold(rewards.gold);
    
    // Add reward items
    rewards.items.forEach(itemTemplateId => {
      player.addItem(itemTemplateId, 1);
    });
    
    console.log(`Boss defeated: ${bossName}`);
    console.log(`Rewards: ${rewards.description}`);
    
    return rewards;
  },
  
  // Get progression status for UI
  getProgressionStatus: function(player) {
    const status = {
      currentLevel: player.level,
      nextUnlock: null,
      totalUnlocks: 0,
      availableUnlocks: [],
      bossProgress: {
        total: Object.keys(this.BOSS_REWARDS).length,
        defeated: player.defeatedBosses.length,
        nextBoss: this.getNextBoss(player.defeatedBosses)
      },
      regionProgress: {
        total: 4, // plains, forest, mountains, castle
        unlocked: this.getUnlockedRegions(player.defeatedBosses).length,
        nextRegion: this.getNextRegion(player.defeatedBosses)
      }
    };
    
    // Find next level unlock
    for (const [level, data] of Object.entries(this.LEVEL_THRESHOLDS)) {
      const levelNum = parseInt(level);
      if (player.level < levelNum) {
        status.nextUnlock = {
          level: levelNum,
          description: data.description,
          unlocks: data.unlock
        };
        break;
      }
    }
    
    // Get available unlocks
    status.availableUnlocks = this.checkLevelUnlocks(player);
    status.totalUnlocks = status.availableUnlocks.length;
    
    return status;
  },
  
  // Get next available boss
  getNextBoss: function(defeatedBosses) {
    const bossOrder = ['forest_guardian', 'mountain_titan', 'castle_lord'];
    
    for (const boss of bossOrder) {
      if (!defeatedBosses.includes(boss)) {
        return boss;
      }
    }
    
    return null; // All bosses defeated
  },
  
  // Get next available region
  getNextRegion: function(defeatedBosses) {
    const regionOrder = ['forest', 'mountains', 'castle'];
    
    for (let i = 0; i < regionOrder.length; i++) {
      const region = regionOrder[i];
      const requiredBoss = Object.keys(this.BOSS_REWARDS)[i];
      
      if (!defeatedBosses.includes(requiredBoss)) {
        return {
          region: region,
          requires: requiredBoss,
          description: `Defeat ${requiredBoss.replace('_', ' ')} to unlock`
        };
      }
    }
    
    return null; // All regions unlocked
  },
  
  // Get unlocked regions
  getUnlockedRegions: function(defeatedBosses) {
    const regions = ['plains']; // Always unlocked
    
    if (defeatedBosses.includes('forest_guardian')) regions.push('forest');
    if (defeatedBosses.includes('mountain_titan')) regions.push('mountains');
    if (defeatedBosses.includes('castle_lord')) regions.push('castle');
    
    return regions;
  },
  
  // Check if player can access content
  canAccessContent: function(player, contentType, contentId) {
    switch (contentType) {
      case 'region':
        return this.getUnlockedRegions(player.defeatedBosses).includes(contentId);
        
      case 'town':
        return this.getUnlockedTowns(player.defeatedBosses).includes(contentId);
        
      case 'boss':
        return !player.defeatedBosses.includes(contentId);
        
      case 'special_attack':
        const attack = player.specialAttacks[contentId];
        return attack && attack.learned;
        
      default:
        return true;
    }
  },
  
  // Get unlocked towns
  getUnlockedTowns: function(defeatedBosses) {
    const towns = ['riverside_village']; // Always unlocked
    
    if (defeatedBosses.includes('forest_guardian')) towns.push('harbor_city');
    if (defeatedBosses.includes('mountain_titan')) towns.push('stone_peak');
    
    return towns;
  },
  
  // Get progression milestones
  getMilestones: function(player) {
    const milestones = [];
    
    // Level milestones
    if (player.level >= 5) milestones.push('Apprentice Adventurer');
    if (player.level >= 10) milestones.push('Seasoned Warrior');
    if (player.level >= 15) milestones.push('Elite Hero');
    if (player.level >= 20) milestones.push('Legendary Champion');
    
    // Boss milestones
    if (player.defeatedBosses.includes('forest_guardian')) milestones.push('Forest Guardian Slayer');
    if (player.defeatedBosses.includes('mountain_titan')) milestones.push('Mountain Titan Conqueror');
    if (player.defeatedBosses.includes('castle_lord')) milestones.push('Castle Lord Vanquisher');
    
    // Wealth milestones
    if (player.inventory.gold >= 1000) milestones.push('Wealthy Explorer');
    if (player.inventory.gold >= 5000) milestones.push('Rich Merchant');
    if (player.inventory.gold >= 10000) milestones.push('Gold Tycoon');
    
    return milestones;
  },
  
  // Get save statistics
  getSaveStatistics: function(player) {
    return {
      totalPlayTime: window.game?.playTime || 0,
      currentSession: window.game?.sessionTime || 0,
      battlesWon: this.getBattleStat('won'),
      battlesFled: this.getBattleStat('fled'),
      itemsCollected: this.getItemStat('collected'),
      itemsUsed: this.getItemStat('used'),
      goldSpent: this.getGoldStat('spent'),
      goldEarned: this.getGoldStat('earned'),
      distanceTraveled: this.getMovementStat('distance'),
      areasDiscovered: player.visitedAreas.size,
      completionPercentage: this.calculateCompletion(player)
    };
  },
  
  // Get battle statistics (simplified)
  getBattleStat: function(type) {
    // These would need to be tracked during gameplay
    // For now, return placeholder values
    const stats = {
      won: 0,
      fled: 0
    };
    return stats[type] || 0;
  },
  
  // Get item statistics
  getItemStat: function(type) {
    const stats = {
      collected: 0,
      used: 0
    };
    return stats[type] || 0;
  },
  
  // Get gold statistics
  getGoldStat: function(type) {
    const stats = {
      spent: 0,
      earned: 0
    };
    return stats[type] || 0;
  },
  
  // Get movement statistics
  getMovementStat: function(type) {
    const stats = {
      distance: 0
    };
    return stats[type] || 0;
  },
  
  // Calculate game completion percentage
  calculateCompletion: function(player) {
    let completed = 0;
    let total = 0;
    
    // Level completion (max level 20)
    total += 20;
    completed += Math.min(player.level, 20);
    
    // Boss completion
    total += Object.keys(this.BOSS_REWARDS).length;
    completed += player.defeatedBosses.length;
    
    // Region completion
    total += 4;
    completed += this.getUnlockedRegions(player.defeatedBosses).length;
    
    // Special attack completion
    const totalAttacks = Object.keys(player.specialAttacks).length;
    const learnedAttacks = Object.values(player.specialAttacks).filter(a => a.learned).length;
    total += totalAttacks;
    completed += learnedAttacks;
    
    return Math.floor((completed / total) * 100);
  }
};