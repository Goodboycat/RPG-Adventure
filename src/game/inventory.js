// File: src/game/inventory.js
window.FILE_MANIFEST = window.FILE_MANIFEST || [];
window.FILE_MANIFEST.push({
  name: 'src/game/inventory.js',
  exports: ['Inventory', 'ItemTypes', 'ItemEffects'],
  dependencies: ['MathUtils', 'Renderer']
});

// Item type definitions with properties and behaviors
window.ItemTypes = {
  // Consumable items
  health_small: {
    name: 'Small Health Potion',
    type: 'consumable',
    category: 'potion',
    effect: 'heal',
    value: 25,
    rarity: 'common',
    description: 'Restores 25 HP',
    stackSize: 10,
    useTime: 500
  },
  
  health_medium: {
    name: 'Medium Health Potion',
    type: 'consumable',
    category: 'potion',
    effect: 'heal',
    value: 50,
    rarity: 'uncommon',
    description: 'Restores 50 HP',
    stackSize: 5,
    useTime: 500
  },
  
  health_large: {
    name: 'Large Health Potion',
    type: 'consumable',
    category: 'potion',
    effect: 'heal',
    value: 100,
    rarity: 'rare',
    description: 'Restores 100 HP',
    stackSize: 3,
    useTime: 500
  },
  
  mana_small: {
    name: 'Small Mana Potion',
    type: 'consumable',
    category: 'potion',
    effect: 'mana',
    value: 25,
    rarity: 'common',
    description: 'Restores 25 MP',
    stackSize: 10,
    useTime: 500
  },
  
  mana_medium: {
    name: 'Medium Mana Potion',
    type: 'consumable',
    category: 'potion',
    effect: 'mana',
    value: 50,
    rarity: 'uncommon',
    description: 'Restores 50 MP',
    stackSize: 5,
    useTime: 500
  },
  
  strength_potion: {
    name: 'Strength Potion',
    type: 'consumable',
    category: 'potion',
    effect: 'strength_boost',
    value: 5,
    duration: 300000, // 5 minutes
    rarity: 'uncommon',
    description: '+5 Attack for 5 minutes',
    stackSize: 3,
    useTime: 500
  },
  
  defense_potion: {
    name: 'Defense Potion',
    type: 'consumable',
    category: 'potion',
    effect: 'defense_boost',
    value: 5,
    duration: 300000, // 5 minutes
    rarity: 'uncommon',
    description: '+5 Defense for 5 minutes',
    stackSize: 3,
    useTime: 500
  },
  
  elixir_power: {
    name: 'Elixir of Power',
    type: 'consumable',
    category: 'potion',
    effect: 'all_stats',
    value: 3,
    duration: 600000, // 10 minutes
    rarity: 'rare',
    description: '+3 All Stats for 10 minutes',
    stackSize: 1,
    useTime: 1000
  },
  
  phoenix_down: {
    name: 'Phoenix Down',
    type: 'consumable',
    category: 'special',
    effect: 'revive',
    value: 1,
    rarity: 'rare',
    description: 'Revives with 50% HP',
    stackSize: 3,
    useTime: 2000
  },
  
  // Materials
  herb: {
    name: 'Herb',
    type: 'material',
    category: 'ingredient',
    rarity: 'common',
    description: 'Common healing ingredient',
    stackSize: 20
  },
  
  crystal_shard: {
    name: 'Crystal Shard',
    type: 'material',
    category: 'ingredient',
    rarity: 'common',
    description: 'Fragment of magic crystal',
    stackSize: 10
  },
  
  monster_part: {
    name: 'Monster Part',
    type: 'material',
    category: 'ingredient',
    rarity: 'common',
    description: 'Dropped by monsters',
    stackSize: 15
  },
  
  magic_herb: {
    name: 'Magic Herb',
    type: 'material',
    category: 'ingredient',
    rarity: 'uncommon',
    description: 'Enchanted healing plant',
    stackSize: 10
  },
  
  fire_crystal: {
    name: 'Fire Crystal',
    type: 'material',
    category: 'ingredient',
    rarity: 'uncommon',
    description: 'Contains fire energy',
    stackSize: 5
  },
  
  rare_essence: {
    name: 'Rare Essence',
    type: 'material',
    category: 'ingredient',
    rarity: 'uncommon',
    description: 'Valuable magical essence',
    stackSize: 3
  },
  
  dragon_scale: {
    name: 'Dragon Scale',
    type: 'material',
    category: 'ingredient',
    rarity: 'rare',
    description: 'Tough dragon scale',
    stackSize: 2
  },
  
  soul_crystal: {
    name: 'Soul Crystal',
    type: 'material',
    category: 'ingredient',
    rarity: 'rare',
    description: 'Contains soul energy',
    stackSize: 2
  },
  
  ancient_rune: {
    name: 'Ancient Rune',
    type: 'material',
    category: 'ingredient',
    rarity: 'rare',
    description: 'Mysterious ancient rune',
    stackSize: 1
  },
  
  boss_essence: {
    name: 'Boss Essence',
    type: 'material',
    category: 'special',
    rarity: 'unique',
    description: 'Essence of a defeated boss',
    stackSize: 1
  },
  
  // Equipment
  dagger: {
    name: 'Dagger',
    type: 'equipment',
    category: 'weapon',
    equipSlot: 'weapon',
    attackBonus: 5,
    rarity: 'common',
    description: 'Basic dagger +5 ATK',
    equipText: 'Equipped: Quick and reliable dagger'
  },
  
  sword: {
    name: 'Sword',
    type: 'equipment',
    category: 'weapon',
    equipSlot: 'weapon',
    attackBonus: 10,
    rarity: 'uncommon',
    description: 'Well-balanced sword +10 ATK',
    equipText: 'Equipped: Solid steel sword'
  },
  
  greatsword: {
    name: 'Greatsword',
    type: 'equipment',
    category: 'weapon',
    equipSlot: 'weapon',
    attackBonus: 18,
    rarity: 'rare',
    description: 'Heavy greatsword +18 ATK',
    equipText: 'Equipped: Mighty two-handed blade'
  },
  
  leather_armor: {
    name: 'Leather Armor',
    type: 'equipment',
    category: 'armor',
    equipSlot: 'armor',
    defenseBonus: 8,
    rarity: 'common',
    description: 'Basic leather armor +8 DEF',
    equipText: 'Equipped: Light leather protection'
  },
  
  chain_mail: {
    name: 'Chain Mail',
    type: 'equipment',
    category: 'armor',
    equipSlot: 'armor',
    defenseBonus: 15,
    rarity: 'uncommon',
    description: 'Chain mail armor +15 DEF',
    equipText: 'Equipped: Interlocking metal chains'
  },
  
  plate_armor: {
    name: 'Plate Armor',
    type: 'equipment',
    category: 'armor',
    equipSlot: 'armor',
    defenseBonus: 25,
    rarity: 'rare',
    description: 'Heavy plate armor +25 DEF',
    equipText: 'Equipped: Full plate protection'
  },
  
  ring: {
    name: 'Ring',
    type: 'equipment',
    category: 'accessory',
    equipSlot: 'accessory',
    attackBonus: 2,
    defenseBonus: 2,
    rarity: 'common',
    description: 'Simple ring +2 ATK/DEF',
    equipText: 'Equipped: Basic magical ring'
  },
  
  amulet: {
    name: 'Amulet',
    type: 'equipment',
    category: 'accessory',
    equipSlot: 'accessory',
    attackBonus: 5,
    defenseBonus: 3,
    rarity: 'uncommon',
    description: 'Protective amulet +5 ATK/3 DEF',
    equipText: 'Equipped: Enchanted protection amulet'
  },
  
  magic_ring: {
    name: 'Magic Ring',
    type: 'equipment',
    category: 'accessory',
    equipSlot: 'accessory',
    attackBonus: 8,
    defenseBonus: 5,
    rarity: 'rare',
    description: 'Magic ring +8 ATK/5 DEF',
    equipText: 'Equipped: Ring of mystical power'
  },
  
  boots: {
    name: 'Boots',
    type: 'equipment',
    category: 'accessory',
    equipSlot: 'accessory',
    defenseBonus: 4,
    rarity: 'uncommon',
    description: 'Sturdy boots +4 DEF',
    equipText: 'Equipped: Reinforced leather boots'
  },
  
  dragon_helm: {
    name: 'Dragon Helm',
    type: 'equipment',
    category: 'armor',
    equipSlot: 'armor',
    defenseBonus: 20,
    rarity: 'rare',
    description: 'Dragon scale helm +20 DEF',
    equipText: 'Equipped: Helm forged from dragon scales'
  },
  
  // Special items
  skill_book: {
    name: 'Skill Book',
    type: 'special',
    category: 'special',
    rarity: 'unique',
    description: 'Contains hidden knowledge',
    stackSize: 1
  },
  
  stat_orb: {
    name: 'Stat Orb',
    type: 'special',
    category: 'special',
    rarity: 'unique',
    description: 'Permanently increases stats',
    stackSize: 1
  },
  
  legendary_weapon: {
    name: 'Legendary Weapon',
    type: 'equipment',
    category: 'weapon',
    equipSlot: 'weapon',
    attackBonus: 30,
    rarity: 'unique',
    description: 'Legendary blade +30 ATK',
    equipText: 'Equipped: Weapon of ancient heroes'
  },
  
  legendary_armor: {
    name: 'Legendary Armor',
    type: 'equipment',
    category: 'armor',
    equipSlot: 'armor',
    defenseBonus: 35,
    rarity: 'unique',
    description: 'Legendary armor +35 DEF',
    equipText: 'Equipped: Armor of the chosen one'
  },
  
  artifact: {
    name: 'Ancient Artifact',
    type: 'equipment',
    category: 'accessory',
    equipSlot: 'accessory',
    attackBonus: 15,
    defenseBonus: 15,
    rarity: 'unique',
    description: 'Ancient artifact +15 ATK/DEF',
    equipText: 'Equipped: Artifact from a lost age'
  }
};

// Item effects and their implementations
window.ItemEffects = {
  heal: function(player, item, quantity = 1) {
    const totalHeal = item.value * quantity;
    const actualHeal = player.heal(totalHeal);
    return {
      success: true,
      message: `Healed for ${actualHeal} HP!`,
      value: actualHeal
    };
  },
  
  mana: function(player, item, quantity = 1) {
    const totalMana = item.value * quantity;
    const actualRestore = player.restoreMP(totalMana);
    return {
      success: true,
      message: `Restored ${actualRestore} MP!`,
      value: actualRestore
    };
  },
  
  strength_boost: function(player, item, quantity = 1) {
    const boostAmount = item.value * quantity;
    player.attack += boostAmount;
    
    // Set timer to remove boost
    setTimeout(() => {
      player.attack -= boostAmount;
    }, item.duration);
    
    return {
      success: true,
      message: `+${boostAmount} Attack for ${item.duration / 60000} minutes!`,
      duration: item.duration
    };
  },
  
  defense_boost: function(player, item, quantity = 1) {
    const boostAmount = item.value * quantity;
    player.defense += boostAmount;
    
    // Set timer to remove boost
    setTimeout(() => {
      player.defense -= boostAmount;
    }, item.duration);
    
    return {
      success: true,
      message: `+${boostAmount} Defense for ${item.duration / 60000} minutes!`,
      duration: item.duration
    };
  },
  
  all_stats: function(player, item, quantity = 1) {
    const boostAmount = item.value * quantity;
    player.attack += boostAmount;
    player.defense += boostAmount;
    player.maxHP += boostAmount * 5;
    player.maxMP += boostAmount * 3;
    player.hp += boostAmount * 5;
    player.mp += boostAmount * 3;
    
    // Set timer to remove boost
    setTimeout(() => {
      player.attack -= boostAmount;
      player.defense -= boostAmount;
      player.maxHP -= boostAmount * 5;
      player.maxMP -= boostAmount * 3;
      player.hp = Math.min(player.hp, player.maxHP);
      player.mp = Math.min(player.mp, player.maxMP);
    }, item.duration);
    
    return {
      success: true,
      message: `+${boostAmount} All Stats for ${item.duration / 60000} minutes!`,
      duration: item.duration
    };
  },
  
  revive: function(player, item, quantity = 1) {
    if (player.hp > 0) {
      return {
        success: false,
        message: "Cannot use while alive!"
      };
    }
    
    player.hp = Math.floor(player.maxHP * 0.5);
    player.mp = Math.floor(player.maxMP * 0.5);
    
    return {
      success: true,
      message: "Revived with 50% HP and MP!"
    };
  }
};

// Main inventory management system
window.Inventory = class Inventory {
  constructor(player) {
    this.player = player;
    this.items = [];
    this.maxSize = 20;
    this.gold = 0;
    this.sortMode = 'type'; // 'type', 'name', 'rarity', 'quantity'
    this.selectedSlot = 0;
    this.quickSlots = [0, 1, 2, 3]; // Quick access slots (number keys 1-4)
    this.usingItem = false;
    this.useStartTime = 0;
    this.lastEquipText = '';
    this.equipTextTimer = 0;
  }
  
  // Add item to inventory with stacking
  addItem(itemTemplate, quantity = 1) {
    if (this.items.length >= this.maxSize) {
      return { success: false, message: "Inventory is full!" };
    }
    
    // Check if item can stack
    if (itemTemplate.stackSize > 1) {
      const existingStack = this.items.find(invItem => 
        invItem.templateId === itemTemplate && 
        invItem.quantity < itemTemplate.stackSize
      );
      
      if (existingStack) {
        const canAdd = Math.min(quantity, itemTemplate.stackSize - existingStack.quantity);
        existingStack.quantity += canAdd;
        quantity -= canAdd;
        
        if (quantity <= 0) {
          return { success: true, message: `Added to stack!` };
        }
      }
    }
    
    // Add new item(s)
    while (quantity > 0 && this.items.length < this.maxSize) {
      const stackSize = Math.min(quantity, itemTemplate.stackSize || 1);
      this.items.push({
        id: this.generateItemId(),
        templateId: itemTemplate,
        quantity: stackSize,
        equipped: false
      });
      quantity -= stackSize;
    }
    
    if (quantity > 0) {
      return { success: true, message: "Added items (inventory full for some)!" };
    }
    
    return { success: true, message: "Item added!" };
  }
  
  // Remove item from inventory
  removeItem(slotIndex, quantity = 1) {
    if (slotIndex < 0 || slotIndex >= this.items.length) {
      return { success: false, message: "Invalid slot!" };
    }
    
    const item = this.items[slotIndex];
    if (item.quantity <= quantity) {
      this.items.splice(slotIndex, 1);
      return { success: true, message: "Item removed!" };
    } else {
      item.quantity -= quantity;
      return { success: true, message: "Removed from stack!" };
    }
  }
  
  // Use item from inventory
  useItem(slotIndex, quantity = 1) {
    if (slotIndex < 0 || slotIndex >= this.items.length) {
      return { success: false, message: "Invalid slot!" };
    }
    
    const item = this.items[slotIndex];
    const template = window.ItemTypes[item.templateId];
    
    if (!template) {
      return { success: false, message: "Unknown item!" };
    }
    
    if (item.quantity < quantity) {
      return { success: false, message: "Not enough items!" };
    }
    
    // Check if item is usable
    if (template.type === 'equipment') {
      return this.equipItem(slotIndex);
    }
    
    if (template.type === 'material' || template.type === 'special') {
      return { success: false, message: "Cannot use this item!" };
    }
    
    if (this.usingItem) {
      return { success: false, message: "Already using an item!" };
    }
    
    // Start item use
    this.usingItem = true;
    this.useStartTime = Date.now();
    
    setTimeout(() => {
      this.usingItem = false;
      
      // Apply item effect
      const effect = window.ItemEffects[template.effect];
      if (effect) {
        const result = effect(this.player, template, quantity);
        
        if (result.success) {
          this.removeItem(slotIndex, quantity);
          console.log(result.message);
        } else {
          console.log(result.message);
        }
      }
    }, template.useTime || 500);
    
    return { success: true, message: `Using ${template.name}...` };
  }
  
  // Equip item
  equipItem(slotIndex) {
    const item = this.items[slotIndex];
    const template = window.ItemTypes[item.templateId];
    
    if (!template || !template.equipSlot) {
      return { success: false, message: "Cannot equip this item!" };
    }
    
    // Unequip current item if any
    const currentEquip = this.player.equipment[template.equipSlot];
    if (currentEquip) {
      this.addItem(currentEquip.templateId, 1);
    }
    
    // Equip new item
    this.player.equipment[template.equipSlot] = {
      templateId: item.templateId,
      name: template.name
    };
    
    this.player.updateDerivedStats();
    
    // Remove from inventory
    this.items.splice(slotIndex, 1);
    
    // Show equip text
    this.lastEquipText = template.equipText || `Equipped ${template.name}`;
    this.equipTextTimer = 3000;
    
    return { success: true, message: this.lastEquipText };
  }
  
  // Unequip item
  unequipItem(slot) {
    const currentEquip = this.player.equipment[slot];
    if (!currentEquip) {
      return { success: false, message: "Nothing equipped!" };
    }
    
    const result = this.addItem(currentEquip.templateId, 1);
    if (result.success) {
      this.player.equipment[slot] = null;
      this.player.updateDerivedStats();
      return { success: true, message: "Item unequipped!" };
    }
    
    return result;
  }
  
  // Sort inventory
  sortInventory(mode = this.sortMode) {
    this.sortMode = mode;
    
    this.items.sort((a, b) => {
      const templateA = window.ItemTypes[a.templateId];
      const templateB = window.ItemTypes[b.templateId];
      
      switch (mode) {
        case 'type':
          const typeOrder = ['consumable', 'equipment', 'material', 'special'];
          const typeA = typeOrder.indexOf(templateA.type);
          const typeB = typeOrder.indexOf(templateB.type);
          if (typeA !== typeB) return typeA - typeB;
          break;
          
        case 'name':
          return templateA.name.localeCompare(templateB.name);
          
        case 'rarity':
          const rarityOrder = ['common', 'uncommon', 'rare', 'unique'];
          const rarityA = rarityOrder.indexOf(templateA.rarity);
          const rarityB = rarityOrder.indexOf(templateB.rarity);
          if (rarityA !== rarityB) return rarityB - rarityA; // Descending rarity
          break;
          
        case 'quantity':
          return b.quantity - a.quantity; // Descending quantity
      }
      
      return 0;
    });
  }
  
  // Use quick slot item
  useQuickSlot(slotNum) {
    if (slotNum < 1 || slotNum > 4) return;
    
    const inventorySlot = this.quickSlots[slotNum - 1];
    if (inventorySlot < this.items.length) {
      return this.useItem(inventorySlot);
    }
    
    return { success: false, message: "Quick slot is empty!" };
  }
  
  // Set quick slot
  setQuickSlot(slotNum, inventorySlot) {
    if (slotNum >= 1 && slotNum <= 4) {
      this.quickSlots[slotNum - 1] = inventorySlot;
    }
  }
  
  // Get inventory for display
  getInventoryDisplay() {
    return this.items.map((item, index) => {
      const template = window.ItemTypes[item.templateId];
      return {
        index,
        template,
        quantity: item.quantity,
        isQuickSlot: this.quickSlots.includes(index)
      };
    });
  }
  
  // Get item by slot
  getItem(slotIndex) {
    if (slotIndex >= 0 && slotIndex < this.items.length) {
      const item = this.items[slotIndex];
      return {
        ...item,
        template: window.ItemTypes[item.templateId]
      };
    }
    return null;
  }
  
  // Check if can add more items
  canAddItems(count = 1) {
    return this.items.length < this.maxSize;
  }
  
  // Get empty slots count
  getEmptySlots() {
    return this.maxSize - this.items.length;
  }
  
  // Generate unique item ID
  generateItemId() {
    return 'item_' + Date.now() + '_' + window.MathUtils.randomInt(1000, 9999);
  }
  
  // Update equip text timer
  update(deltaTime) {
    if (this.equipTextTimer > 0) {
      this.equipTextTimer -= deltaTime;
    }
  }
  
  // Get current equip text
  getEquipText() {
    return this.equipTextTimer > 0 ? this.lastEquipText : '';
  }
  
  // Get usage progress
  getUsageProgress() {
    if (!this.usingItem) return 0;
    
    const elapsed = Date.now() - this.useStartTime;
    const item = this.items[this.selectedSlot];
    if (!item) return 0;
    
    const template = window.ItemTypes[item.templateId];
    const duration = template.useTime || 500;
    
    return Math.min(elapsed / duration, 1.0);
  }
};