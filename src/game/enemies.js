// File: src/game/enemies.js
window.FILE_MANIFEST = window.FILE_MANIFEST || [];
window.FILE_MANIFEST.push({
  name: 'src/game/enemies.js',
  exports: ['EnemyFactory', 'MonsterTypes', 'BossTypes', 'LootTables'],
  dependencies: ['MathUtils', 'ItemTypes']
});

// Monster type definitions with stats and behaviors
window.MonsterTypes = {
  // Common monsters - easy to defeat, basic loot
  goblin: {
    name: 'Goblin',
    level: 1,
    baseHP: 25,
    baseAttack: 6,
    baseDefense: 2,
    speed: 1.0,
    color: '#8b4513',
    expReward: 15,
    goldReward: 8,
    attackPatterns: ['basic_attack', 'quick_strike'],
    description: 'Weak but numerous forest creatures',
    rarity: 'common'
  },
  
  slime: {
    name: 'Slime',
    level: 2,
    baseHP: 30,
    baseAttack: 4,
    baseDefense: 4,
    speed: 0.8,
    color: '#90ee90',
    expReward: 20,
    goldReward: 12,
    attackPatterns: ['basic_attack', 'acid_spit'],
    description: 'Gelatinous creatures resistant to physical damage',
    rarity: 'common'
  },
  
  wolf: {
    name: 'Wolf',
    level: 3,
    baseHP: 35,
    baseAttack: 10,
    baseDefense: 1,
    speed: 1.5,
    color: '#696969',
    expReward: 30,
    goldReward: 18,
    attackPatterns: ['basic_attack', 'pack_hunt'],
    description: 'Fast predators that hunt in groups',
    rarity: 'common'
  },
  
  // Uncommon monsters - moderate difficulty, better loot
  orc: {
    name: 'Orc',
    level: 5,
    baseHP: 50,
    baseAttack: 14,
    baseDefense: 5,
    speed: 0.9,
    color: '#556b2f',
    expReward: 45,
    goldReward: 25,
    attackPatterns: ['basic_attack', 'heavy_strike', 'battle_cry'],
    description: 'Tough warriors with high HP',
    rarity: 'uncommon'
  },
  
  skeleton: {
    name: 'Skeleton',
    level: 6,
    baseHP: 40,
    baseAttack: 12,
    baseDefense: 3,
    speed: 1.1,
    color: '#f5f5dc',
    expReward: 50,
    goldReward: 30,
    attackPatterns: ['basic_attack', 'bone_throw'],
    description: 'Undead warriors immune to poison',
    rarity: 'uncommon'
  },
  
  dark_mage: {
    name: 'Dark Mage',
    level: 7,
    baseHP: 35,
    baseAttack: 16,
    baseDefense: 2,
    speed: 0.7,
    color: '#4b0082',
    expReward: 60,
    goldReward: 35,
    attackPatterns: ['basic_attack', 'shadow_bolt', 'curse'],
    description: 'Magic users with powerful spells',
    rarity: 'uncommon'
  },
  
  // Rare monsters - difficult, valuable loot
  golem: {
    name: 'Golem',
    level: 10,
    baseHP: 80,
    baseAttack: 18,
    baseDefense: 8,
    speed: 0.5,
    color: '#708090',
    expReward: 100,
    goldReward: 60,
    attackPatterns: ['basic_attack', 'earthquake', 'stone_throw'],
    description: 'Ancient stone guardians with immense defense',
    rarity: 'rare'
  },
  
  dragon: {
    name: 'Dragon',
    level: 12,
    baseHP: 70,
    baseAttack: 22,
    baseDefense: 6,
    speed: 1.2,
    color: '#ff4500',
    expReward: 120,
    goldReward: 80,
    attackPatterns: ['basic_attack', 'fire_breath', 'tail_swipe'],
    description: 'Legendary beasts with devastating attacks',
    rarity: 'rare'
  },
  
  demon: {
    name: 'Demon',
    level: 15,
    baseHP: 60,
    baseAttack: 25,
    baseDefense: 4,
    speed: 1.3,
    color: '#8b0000',
    expReward: 150,
    goldReward: 100,
    attackPatterns: ['basic_attack', 'hell_fire', 'soul_drain'],
    description: 'Powerful demonic entities from the underworld',
    rarity: 'rare'
  }
};

// Boss definitions with unique abilities and mechanics
window.BossTypes = {
  forest_guardian: {
    name: 'Forest Guardian',
    title: 'Ancient Protector',
    level: 8,
    baseHP: 200,
    baseAttack: 20,
    baseDefense: 12,
    speed: 0.8,
    color: '#228b22',
    expReward: 300,
    goldReward: 200,
    region: 'forest',
    requiredLevel: 5,
    attackPatterns: ['basic_attack', 'vine_whip', 'nature_heal', 'entangle'],
    specialAbilities: {
      regeneration: 5, // HP regenerated per turn
      phaseShift: true // Changes attack pattern at 50% HP
    },
    description: 'Ancient tree spirit protecting the forest',
    defeatUnlock: 'mountain_pass'
  },
  
  mountain_titan: {
    name: 'Mountain Titan',
    title: 'Stone Colossus',
    level: 12,
    baseHP: 350,
    baseAttack: 30,
    baseDefense: 15,
    speed: 0.4,
    color: '#696969',
    expReward: 500,
    goldReward: 400,
    region: 'mountain',
    requiredLevel: 10,
    attackPatterns: ['basic_attack', 'boulder_throw', 'stomp', 'avalanche'],
    specialAbilities: {
      damageReduction: 0.3, // 30% damage reduction
      enrage: true // Attack increases when HP < 30%
    },
    description: 'Massive stone giant blocking the mountain path',
    defeatUnlock: 'volcano_region'
  },
  
  shadow_lord: {
    name: 'Shadow Lord',
    title: 'Master of Darkness',
    level: 18,
    baseHP: 280,
    baseAttack: 35,
    baseDefense: 8,
    speed: 1.5,
    color: '#191970',
    expReward: 800,
    goldReward: 600,
    region: 'shadow_realm',
    requiredLevel: 15,
    attackPatterns: ['basic_attack', 'shadow_blast', 'teleport', 'darkness_wave'],
    specialAbilities: {
      invisibility: true, // Can become invisible for one turn
      lifeSteal: 0.25 // Heals 25% of damage dealt
    },
    description: 'Mysterious ruler of the shadow realm',
    defeatUnlock: 'final_dungeon'
  },
  
  ice_queen: {
    name: 'Ice Queen',
    title: 'Frozen Sovereign',
    level: 20,
    baseHP: 300,
    baseAttack: 32,
    baseDefense: 10,
    speed: 1.0,
    color: '#00ced1',
    expReward: 1000,
    goldReward: 800,
    region: 'frozen_palace',
    requiredLevel: 18,
    attackPatterns: ['basic_attack', 'ice_shard', 'blizzard', 'freeze_time'],
    specialAbilities: {
      freezeImmunity: true,
      aura: { damage: 5, range: 'all' } // Damages all enemies each turn
    },
    description: 'Beautiful but deadly ruler of the frozen lands',
    defeatUnlock: 'sky_castle'
  },
  
  chaos_dragon: {
    name: 'Chaos Dragon',
    title: 'World Ender',
    level: 25,
    baseHP: 500,
    baseAttack: 45,
    baseDefense: 12,
    speed: 1.8,
    color: '#ff1493',
    expReward: 2000,
    goldReward: 1500,
    region: 'chaos_realm',
    requiredLevel: 22,
    attackPatterns: ['basic_attack', 'chaos_breath', 'dimension_tear', 'reality_warp'],
    specialAbilities: {
      multiAttack: 3, // Attacks 3 times per turn
      statusImmunity: true, // Immune to all status effects
      ultimateForm: true // Transforms at 25% HP
    },
    description: 'Ancient dragon capable of destroying reality',
    defeatUnlock: 'new_game_plus'
  }
};

// Loot table definitions for monsters and bosses
window.LootTables = {
  // Common item drops
  common: {
    potions: {
      health_small: { chance: 30, quantity: [1, 2] },
      mana_small: { chance: 20, quantity: [1, 1] }
    },
    materials: {
      herb: { chance: 40, quantity: [1, 3] },
      crystal_shard: { chance: 15, quantity: [1, 1] },
      monster_part: { chance: 25, quantity: [1, 2] }
    },
    equipment: {
      dagger: { chance: 5, quality: 'common' },
      leather_armor: { chance: 3, quality: 'common' },
      ring: { chance: 2, quality: 'common' }
    }
  },
  
  // Uncommon item drops
  uncommon: {
    potions: {
      health_medium: { chance: 25, quantity: [1, 1] },
      mana_medium: { chance: 20, quantity: [1, 1] },
      strength_potion: { chance: 10, quantity: [1, 1] },
      defense_potion: { chance: 10, quantity: [1, 1] }
    },
    materials: {
      magic_herb: { chance: 30, quantity: [1, 2] },
      fire_crystal: { chance: 20, quantity: [1, 1] },
      rare_essence: { chance: 15, quantity: [1, 1] }
    },
    equipment: {
      sword: { chance: 10, quality: 'uncommon' },
      chain_mail: { chance: 8, quality: 'uncommon' },
      amulet: { chance: 5, quality: 'uncommon' },
      boots: { chance: 6, quality: 'uncommon' }
    }
  },
  
  // Rare item drops
  rare: {
    potions: {
      health_large: { chance: 20, quantity: [1, 1] },
      elixir_power: { chance: 15, quantity: [1, 1] },
      phoenix_down: { chance: 5, quantity: [1, 1] }
    },
    materials: {
      dragon_scale: { chance: 25, quantity: [1, 1] },
      soul_crystal: { chance: 20, quantity: [1, 1] },
      ancient_rune: { chance: 15, quantity: [1, 1] }
    },
    equipment: {
      greatsword: { chance: 15, quality: 'rare' },
      plate_armor: { chance: 12, quality: 'rare' },
      magic_ring: { chance: 10, quality: 'rare' },
      dragon_helm: { chance: 8, quality: 'rare' }
    }
  },
  
  // Unique boss drops
  unique: {
    materials: {
      boss_essence: { chance: 100, quantity: [1, 1] }
    },
    equipment: {
      legendary_weapon: { chance: 40, quality: 'unique', bossSpecific: true },
      legendary_armor: { chance: 30, quality: 'unique', bossSpecific: true },
      artifact: { chance: 20, quality: 'unique', bossSpecific: true }
    },
    special: {
      skill_book: { chance: 15, quantity: [1, 1] },
      stat_orb: { chance: 10, quantity: [1, 1] }
    }
  }
};

// Enemy factory for creating and managing enemies
window.EnemyFactory = {
  // Create a regular monster based on type and level scaling
  createMonster: function(monsterType, playerLevel) {
    const template = window.MonsterTypes[monsterType];
    if (!template) {
      console.error(`Monster type '${monsterType}' not found`);
      return null;
    }
    
    // Scale stats based on player level
    const levelScale = 1 + (playerLevel * 0.1);
    const varianceScale = window.MathUtils.randomFloat(0.9, 1.1); // ±10% variance
    
    return {
      ...template,
      id: this.generateEnemyId(),
      hp: Math.floor(template.baseHP * levelScale * varianceScale),
      maxHP: Math.floor(template.baseHP * levelScale * varianceScale),
      attack: Math.floor(template.baseAttack * levelScale * varianceScale),
      defense: Math.floor(template.baseDefense * levelScale * varianceScale),
      expReward: Math.floor(template.expReward * levelScale),
      goldReward: Math.floor(template.goldReward * levelScale),
      currentAttackPattern: template.attackPatterns[0],
      statusEffects: [],
      isBoss: false
    };
  },
  
  // Create a boss enemy
  createBoss: function(bossType, playerLevel) {
    const template = window.BossTypes[bossType];
    if (!template) {
      console.error(`Boss type '${bossType}' not found`);
      return null;
    }
    
    // Bosses have less scaling to maintain difficulty
    const levelScale = 1 + (playerLevel * 0.05);
    
    return {
      ...template,
      id: this.generateEnemyId(),
      hp: template.baseHP,
      maxHP: template.baseHP,
      attack: Math.floor(template.baseAttack * levelScale),
      defense: Math.floor(template.baseDefense * levelScale),
      expReward: template.expReward,
      goldReward: template.goldReward,
      currentAttackPattern: template.attackPatterns[0],
      statusEffects: [],
      isBoss: true,
      currentPhase: 'normal', // For bosses with multiple phases
      turnCount: 0
    };
  },
  
  // Generate random monster based on area and player level
  generateRandomMonster: function(areaLevel, playerLevel) {
    // Filter monsters by appropriate level range
    const availableMonsters = Object.entries(window.MonsterTypes).filter(
      ([key, monster]) => monster.level <= areaLevel + 2
    );
    
    if (availableMonsters.length === 0) {
      return this.createMonster('goblin', playerLevel); // Fallback
    }
    
    // Weight towards appropriate level monsters
    const weightedMonsters = availableMonsters.map(([key, monster]) => {
      const levelDiff = Math.abs(monster.level - areaLevel);
      const weight = Math.max(1, 5 - levelDiff); // Higher weight for closer level
      return { key, weight };
    });
    
    // Select monster based on weights
    const totalWeight = weightedMonsters.reduce((sum, m) => sum + m.weight, 0);
    let random = window.MathUtils.randomInt(1, totalWeight);
    
    for (const { key, weight } of weightedMonsters) {
      random -= weight;
      if (random <= 0) {
        return this.createMonster(key, playerLevel);
      }
    }
    
    // Fallback
    return this.createMonster(availableMonsters[0][0], playerLevel);
  },
  
  // Generate loot based on enemy type and luck factor
  generateLoot: function(enemy, luckFactor = 1.0) {
    const loot = {
      gold: enemy.goldReward,
      items: []
    };
    
    // Determine loot table based on enemy rarity
    let lootTable = 'common';
    if (enemy.rarity === 'uncommon') lootTable = 'uncommon';
    else if (enemy.rarity === 'rare') lootTable = 'rare';
    else if (enemy.isBoss) lootTable = 'unique';
    
    const table = window.LootTables[lootTable];
    
    // Generate items from each category
    for (const [category, items] of Object.entries(table)) {
      for (const [itemName, itemData] of Object.entries(items)) {
        // Apply luck factor to drop chance
        const adjustedChance = itemData.chance * luckFactor;
        
        if (window.MathUtils.randomInt(1, 100) <= adjustedChance) {
          const quantity = window.MathUtils.randomInt(
            itemData.quantity[0], 
            itemData.quantity[1]
          );
          
          const lootItem = this.createItem(itemName, itemData, category, quantity);
          if (lootItem) {
            loot.items.push(lootItem);
          }
        }
      }
    }
    
    return loot;
  },
  
  // Create item object from loot data using inventory system
  createItem: function(itemName, itemData, category, quantity) {
    // Use the inventory system's item definitions
    const template = window.ItemTypes[itemName];
    if (!template) return null;
    
    return {
      templateId: itemName,
      quantity: quantity || 1,
      id: this.generateItemId()
    };
  },
  
  // Get available monsters for an area
  getMonstersForArea: function(areaLevel, maxMonsters = 3) {
    const availableMonsters = Object.entries(window.MonsterTypes).filter(
      ([key, monster]) => Math.abs(monster.level - areaLevel) <= 3
    );
    
    return availableMonsters
      .sort((a, b) => a[1].level - b[1].level)
      .slice(0, maxMonsters)
      .map(([key, monster]) => key);
  },
  
  // Get available bosses and their requirements
  getAvailableBosses: function(playerLevel, defeatedBosses) {
    return Object.entries(window.BossTypes)
      .filter(([key, boss]) => 
        playerLevel >= boss.requiredLevel && 
        !defeatedBosses.includes(key)
      )
      .map(([key, boss]) => ({
        id: key,
        ...boss
      }));
  },
  
  // Check if player can fight a boss
  canFightBoss: function(bossId, playerLevel, defeatedBosses) {
    const boss = window.BossTypes[bossId];
    return boss && 
           playerLevel >= boss.requiredLevel && 
           !defeatedBosses.includes(bossId);
  },
  
  // Get boss defeat rewards including area unlocks
  getBossRewards: function(boss) {
    return {
      exp: boss.expReward,
      gold: boss.goldReward,
      unlockRegion: boss.defeatUnlock || null,
      loot: this.generateLoot(boss, 1.5) // Bosses have better loot
    };
  },
  
  // Generate unique ID for enemies
  generateEnemyId: function() {
    return 'enemy_' + Date.now() + '_' + window.MathUtils.randomInt(1000, 9999);
  },
  
  // Generate unique ID for items
  generateItemId: function() {
    return 'item_' + Date.now() + '_' + window.MathUtils.randomInt(1000, 9999);
  }
};