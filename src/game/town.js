// File: src/game/town.js
window.FILE_MANIFEST = window.FILE_MANIFEST || [];
window.FILE_MANIFEST.push({
  name: 'src/game/town.js',
  exports: ['TownScene'],
  dependencies: ['Scene', 'Renderer', 'ItemTypes']
});

// Town scene with tabbed UI for market, missions, and inn
window.TownScene = class TownScene extends window.Scene {
  constructor() {
    super();
    this.player = null;
    this.currentTown = 'starter_town';
    this.currentTab = 0; // 0: Market, 1: Missions, 2: Inn
    this.tabs = ['Market', 'Missions', 'Inn'];
    this.marketItems = [];
    this.missions = [];
    this.selectedItem = 0;
    this.selectedMission = 0;
    this.innCost = 50;
    this.message = '';
    this.messageTimer = 0;
    
    // Town data with different inventories
    this.towns = {
      starter_town: {
        name: 'Riverside Village',
        description: 'A peaceful village by the river',
        marketInventory: ['health_small', 'mana_small', 'herb', 'dagger', 'leather_armor'],
        missionBoard: [
          { 
            id: 'gather_herbs', 
            name: 'Gather Herbs', 
            description: 'Collect 5 herbs for the healer',
            requirement: { type: 'item', id: 'herb', quantity: 5 },
            reward: { gold: 50, exp: 25, item: 'health_medium' },
            difficulty: 'Easy'
          },
          { 
            id: 'slay_goblins', 
            name: 'Goblin Trouble', 
            description: 'Defeat 3 goblins threatening the village',
            requirement: { type: 'kill', id: 'goblin', quantity: 3 },
            reward: { gold: 100, exp: 50 },
            difficulty: 'Medium'
          }
        ]
      },
      port_town: {
        name: 'Harbor City',
        description: 'A bustling port with exotic goods',
        marketInventory: ['health_medium', 'mana_medium', 'crystal_shard', 'sword', 'chain_mail', 'ring'],
        missionBoard: [
          { 
            id: 'patrol_docks', 
            name: 'Dock Patrol', 
            description: 'Patrol the docks and deal with troublemakers',
            requirement: { type: 'kill', id: 'thief', quantity: 5 },
            reward: { gold: 150, exp: 75 },
            difficulty: 'Medium'
          },
          { 
            id: 'rare_delivery', 
            name: 'Rare Delivery', 
            description: 'Deliver a rare package to the merchant guild',
            requirement: { type: 'item', id: 'rare_essence', quantity: 1 },
            reward: { gold: 300, exp: 100, item: 'amulet' },
            difficulty: 'Hard'
          }
        ]
      },
      mountain_town: {
        name: 'Stone Peak',
        description: 'A fortified town in the mountains',
        marketInventory: ['health_large', 'strength_potion', 'defense_potion', 'greatsword', 'plate_armor', 'magic_ring'],
        missionBoard: [
          { 
            id: 'dragon_slayer', 
            name: 'Dragon Slayer', 
            description: 'Defeat the mountain dragon terrorizing the region',
            requirement: { type: 'kill', id: 'dragon', quantity: 1 },
            reward: { gold: 1000, exp: 500, item: 'dragon_helm' },
            difficulty: 'Legendary'
          },
          { 
            id: 'mining_expedition', 
            name: 'Mining Expedition', 
            description: 'Gather rare minerals from the deep mines',
            requirement: { type: 'item', id: 'dragon_scale', quantity: 2 },
            reward: { gold: 500, exp: 200, item: 'fire_crystal' },
            difficulty: 'Hard'
          }
        ]
      }
    };
    
    // Player mission progress
    this.playerMissions = {
      active: [],
      completed: [],
      killCounts: {}, // Track kills for missions
      itemCollection: {} // Track item collection for missions
    };
  }

  enter(data) {
    super.enter(data);
    console.log('Entering town scene');
    
    // Get player reference
    this.player = window.game?.player || new window.Player();
    
    // Set current town if provided
    if (data && data.townName) {
      this.currentTown = data.townName;
    }
    
    // Initialize town data
    this.initializeTown();
    
    // Initialize inventory system if needed
    if (!this.player.inventorySystem) {
      this.player.inventorySystem = new window.Inventory(this.player);
    }
  }

  initializeTown() {
    const town = this.towns[this.currentTown];
    if (!town) return;
    
    // Load mission kill data from global storage
    if (window.game && window.game.townMissionKills) {
      this.playerMissions.killCounts = window.game.townMissionKills;
    }
    
    // Generate market items with dynamic pricing
    this.marketItems = town.marketInventory.map(itemId => {
      const itemTemplate = window.ItemTypes[itemId];
      if (!itemTemplate) return null;
      
      // Calculate price based on rarity and town type
      const basePrice = this.getBasePrice(itemTemplate);
      const townMultiplier = this.getTownPriceMultiplier(this.currentTown);
      const price = Math.floor(basePrice * townMultiplier);
      
      return {
        templateId: itemId,
        template: itemTemplate,
        price: price,
        stock: this.getItemStock(itemTemplate)
      };
    }).filter(item => item !== null);
    
    // Copy missions from town data
    this.missions = [...town.missionBoard];
    
    this.showMessage(`Welcome to ${town.name}!`);
  }

  getBasePrice(itemTemplate) {
    // Base pricing by item type and rarity
    const rarityPrices = {
      common: 25,
      uncommon: 75,
      rare: 200,
      unique: 500
    };
    
    const typeMultipliers = {
      consumable: 1.0,
      equipment: 2.0,
      material: 0.5,
      special: 3.0
    };
    
    const basePrice = rarityPrices[itemTemplate.rarity] || 25;
    const typeMultiplier = typeMultipliers[itemTemplate.type] || 1.0;
    
    return Math.floor(basePrice * typeMultiplier);
  }

  getTownPriceMultiplier(townName) {
    // Different towns have different economic conditions
    const multipliers = {
      starter_town: 1.0,   // Normal prices
      port_town: 1.2,      // More expensive (import goods)
      mountain_town: 1.5   // Very expensive (remote location)
    };
    
    return multipliers[townName] || 1.0;
  }

  getItemStock(itemTemplate) {
    // Stock based on item rarity
    const stockByRarity = {
      common: window.MathUtils.randomInt(5, 15),
      uncommon: window.MathUtils.randomInt(2, 8),
      rare: window.MathUtils.randomInt(1, 3),
      unique: 1
    };
    
    return stockByRarity[itemTemplate.rarity] || 5;
  }

  update(deltaTime) {
    // Update message timer
    if (this.messageTimer > 0) {
      this.messageTimer -= deltaTime;
      if (this.messageTimer <= 0) {
        this.message = '';
      }
    }
    
    // Handle input
    this.handleInput();
    
    // Update inventory system
    if (this.player.inventorySystem) {
      this.player.inventorySystem.update(deltaTime);
    }
  }

  handleInput() {
    // Tab navigation
    if (window.Input.isKeyPressed('ArrowLeft')) {
      this.currentTab = (this.currentTab - 1 + this.tabs.length) % this.tabs.length;
      this.selectedItem = 0;
      this.selectedMission = 0;
    }
    if (window.Input.isKeyPressed('ArrowRight')) {
      this.currentTab = (this.currentTab + 1) % this.tabs.length;
      this.selectedItem = 0;
      this.selectedMission = 0;
    }

    switch (this.currentTab) {
      case 0: // Market
        this.handleMarketInput();
        break;
      case 1: // Missions
        this.handleMissionInput();
        break;
      case 2: // Inn
        this.handleInnInput();
        break;
    }

    // Leave town
    if (window.Input.isKeyPressed('Escape')) {
      window.SceneManager.switchScene('overworld');
    }
  }

  handleMarketInput() {
    // Navigate market items
    if (window.Input.isKeyPressed('ArrowUp')) {
      this.selectedItem = Math.max(0, this.selectedItem - 1);
    }
    if (window.Input.isKeyPressed('ArrowDown')) {
      this.selectedItem = Math.min(this.marketItems.length - 1, this.selectedItem + 1);
    }

    // Buy item
    if (window.Input.isKeyPressed('Enter')) {
      this.buyItem(this.selectedItem);
    }

    // Sell item
    if (window.Input.isKeyPressed('S')) {
      this.sellItem(this.selectedItem);
    }
  }

  handleMissionInput() {
    // Navigate missions
    if (window.Input.isKeyPressed('ArrowUp')) {
      this.selectedMission = Math.max(0, this.selectedMission - 1);
    }
    if (window.Input.isKeyPressed('ArrowDown')) {
      this.selectedMission = Math.min(this.missions.length - 1, this.selectedMission + 1);
    }

    // Accept mission
    if (window.Input.isKeyPressed('Enter')) {
      this.acceptMission(this.selectedMission);
    }

    // Complete mission
    if (window.Input.isKeyPressed('C')) {
      this.completeMission(this.selectedMission);
    }
  }

  handleInnInput() {
    // Rest at inn
    if (window.Input.isKeyPressed('Enter')) {
      this.restAtInn();
    }
  }

  buyItem(itemIndex) {
    if (itemIndex < 0 || itemIndex >= this.marketItems.length) return;
    
    const marketItem = this.marketItems[itemIndex];
    const price = marketItem.price;
    
    if (marketItem.stock <= 0) {
      this.showMessage('Out of stock!');
      return;
    }
    
    if (this.player.inventory.gold < price) {
      this.showMessage('Not enough gold!');
      return;
    }
    
    // Check inventory space
    if (!this.player.inventorySystem.canAddItems()) {
      this.showMessage('Inventory full!');
      return;
    }
    
    // Purchase item
    this.player.spendGold(price);
    const result = this.player.inventorySystem.addItem(marketItem.template, 1);
    
    if (result.success) {
      marketItem.stock--;
      this.showMessage(`Purchased ${marketItem.template.name}!`);
      
      // Sync inventory
      this.player.inventory.items = this.player.inventorySystem.items;
    } else {
      // Refund if add failed
      this.player.addGold(price);
      this.showMessage(result.message);
    }
  }

  sellItem(itemIndex) {
    // Selling from inventory (simplified - sells first item)
    if (this.player.inventory.items.length === 0) {
      this.showMessage('No items to sell!');
      return;
    }
    
    const inventoryItem = this.player.inventory.items[0];
    const template = window.ItemTypes[inventoryItem.templateId];
    
    if (!template) return;
    
    // Calculate sell price (50% of buy price)
    const basePrice = this.getBasePrice(template);
    const sellPrice = Math.floor(basePrice * 0.5);
    
    // Remove item and add gold
    this.player.inventorySystem.removeItem(0, 1);
    this.player.addGold(sellPrice);
    
    this.showMessage(`Sold ${template.name} for ${sellPrice} gold!`);
    
    // Sync inventory
    this.player.inventory.items = this.player.inventorySystem.items;
  }

  acceptMission(missionIndex) {
    if (missionIndex < 0 || missionIndex >= this.missions.length) return;
    
    const mission = this.missions[missionIndex];
    
    // Check if already active
    if (this.playerMissions.active.some(m => m.id === mission.id)) {
      this.showMessage('Mission already active!');
      return;
    }
    
    // Check if already completed
    if (this.playerMissions.completed.some(m => m.id === mission.id)) {
      this.showMessage('Mission already completed!');
      return;
    }
    
    // Add to active missions
    this.playerMissions.active.push({
      ...mission,
      progress: 0,
      acceptedAt: Date.now()
    });
    
    this.showMessage(`Accepted mission: ${mission.name}`);
  }

  completeMission(missionIndex) {
    if (missionIndex < 0 || missionIndex >= this.missions.length) return;
    
    const missionTemplate = this.missions[missionIndex];
    const activeMission = this.playerMissions.active.find(m => m.id === missionTemplate.id);
    
    if (!activeMission) {
      this.showMessage('Mission not active!');
      return;
    }
    
    // Check requirements
    const canComplete = this.checkMissionRequirements(activeMission);
    
    if (!canComplete) {
      this.showMessage('Requirements not met!');
      return;
    }
    
    // Award rewards
    if (activeMission.reward.gold) {
      this.player.addGold(activeMission.reward.gold);
    }
    
    if (activeMission.reward.exp) {
      this.player.gainExperience(activeMission.reward.exp);
    }
    
    if (activeMission.reward.item) {
      const itemTemplate = window.ItemTypes[activeMission.reward.item];
      if (itemTemplate) {
        this.player.inventorySystem.addItem(itemTemplate, 1);
      }
    }
    
    // Move to completed missions
    this.playerMissions.active = this.playerMissions.active.filter(m => m.id !== missionTemplate.id);
    this.playerMissions.completed.push({
      ...activeMission,
      completedAt: Date.now()
    });
    
    this.showMessage(`Completed mission: ${activeMission.name}!`);
    
    // Sync inventory
    this.player.inventory.items = this.player.inventorySystem.items;
  }

  checkMissionRequirements(mission) {
    const req = mission.requirement;
    
    if (req.type === 'item') {
      // Check if player has required items
      const itemCount = this.player.inventory.items.reduce((total, item) => {
        if (item.templateId === req.id) {
          return total + item.quantity;
        }
        return total;
      }, 0);
      
      return itemCount >= req.quantity;
    }
    
    if (req.type === 'kill') {
      // Check kill count
      const currentKills = this.playerMissions.killCounts[req.id] || 0;
      return currentKills >= req.quantity;
    }
    
    return false;
  }

  restAtInn() {
    if (this.player.inventory.gold < this.innCost) {
      this.showMessage(`Not enough gold! Need ${this.innCost} gold.`);
      return;
    }
    
    // Pay and heal
    this.player.spendGold(this.innCost);
    this.player.hp = this.player.maxHP;
    this.player.mp = this.player.maxMP;
    
    this.showMessage('Rested and fully recovered!');
  }

  // Call this when enemies are defeated to track mission progress
  trackKill(enemyType) {
    if (!this.playerMissions.killCounts[enemyType]) {
      this.playerMissions.killCounts[enemyType] = 0;
    }
    this.playerMissions.killCounts[enemyType]++;
  }

  showMessage(msg) {
    this.message = msg;
    this.messageTimer = 3000;
  }

  render(ctx) {
    // Clear canvas
    window.Renderer.clear('#2a4d3a');

    // Draw town background
    this.drawTownBackground(ctx);

    // Draw main UI panels
    this.drawTownUI(ctx);

    // Draw current tab content
    switch (this.currentTab) {
      case 0:
        this.drawMarket(ctx);
        break;
      case 1:
        this.drawMissions(ctx);
        break;
      case 2:
        this.drawInn(ctx);
        break;
    }

    // Draw message
    if (this.message && this.messageTimer > 0) {
      this.drawMessage(ctx);
    }
  }

  drawTownBackground(ctx) {
    const town = this.towns[this.currentTown];
    
    // Gradient background
    const gradient = ctx.createLinearGradient(0, 0, 0, ctx.canvas.height);
    gradient.addColorStop(0, '#87ceeb');
    gradient.addColorStop(0.7, '#98d982');
    gradient.addColorStop(1, '#2a4d3a');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);

    // Draw simple town buildings
    ctx.fillStyle = '#8b7355';
    for (let i = 0; i < 5; i++) {
      const x = 200 + i * 250;
      const y = 200;
      const width = 120;
      const height = 150;
      
      // Building
      ctx.fillRect(x, y, width, height);
      
      // Roof
      ctx.fillStyle = '#654321';
      ctx.beginPath();
      ctx.moveTo(x - 20, y);
      ctx.lineTo(x + width / 2, y - 60);
      ctx.lineTo(x + width + 20, y);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#8b7355';
    }
  }

  drawTownUI(ctx) {
    const town = this.towns[this.currentTown];
    
    // Town header
    window.Renderer.drawText(town.name, 50, 40, { color: '#ffffff', font: 'bold 28px sans-serif' });
    window.Renderer.drawText(town.description, 50, 70, { color: '#cccccc', font: '16px sans-serif' });
    
    // Player stats
    window.Renderer.drawText(`Gold: ${this.player.inventory.gold}`, ctx.canvas.width - 200, 40, 
      { color: '#ffff00', font: 'bold 18px sans-serif' });
    window.Renderer.drawText(`Level ${this.player.level}`, ctx.canvas.width - 200, 65, 
      { color: '#ffffff', font: '16px sans-serif' });
    
    // Tab navigation
    this.drawTabs(ctx);
    
    // Instructions
    window.Renderer.drawText('Arrow Keys: Navigate | Enter: Select | Escape: Leave Town', 
      ctx.canvas.width / 2 - 250, ctx.canvas.height - 30, 
      { color: '#cccccc', font: '14px sans-serif' });
  }

  drawTabs(ctx) {
    const tabY = 120;
    const tabWidth = 200;
    const tabHeight = 40;
    const startX = (ctx.canvas.width - (this.tabs.length * tabWidth)) / 2;

    this.tabs.forEach((tab, index) => {
      const x = startX + index * tabWidth;
      const isActive = index === this.currentTab;
      
      // Tab background
      ctx.fillStyle = isActive ? '#4a90e2' : '#666666';
      ctx.fillRect(x, tabY, tabWidth, tabHeight);
      
      // Tab border
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.strokeRect(x, tabY, tabWidth, tabHeight);
      
      // Tab text
      window.Renderer.drawText(tab, x + tabWidth / 2 - 40, tabY + 25, 
        { color: '#ffffff', font: 'bold 16px sans-serif' });
    });
  }

  drawMarket(ctx) {
    const startY = 180;
    const itemHeight = 80;
    
    window.Renderer.drawText('Market - Press Enter to Buy, S to Sell', 50, startY - 20, 
      { color: '#ffffff', font: 'bold 18px sans-serif' });

    // Draw market items
    this.marketItems.forEach((item, index) => {
      const y = startY + index * itemHeight;
      const isSelected = index === this.selectedItem;
      
      // Selection background
      if (isSelected) {
        ctx.fillStyle = 'rgba(255, 255, 100, 0.2)';
        ctx.fillRect(40, y - 10, ctx.canvas.width - 80, itemHeight);
      }
      
      // Item name and description
      window.Renderer.drawText(item.template.name, 60, y, 
        { color: isSelected ? '#ffff00' : '#ffffff', font: 'bold 16px sans-serif' });
      window.Renderer.drawText(item.template.description, 60, y + 25, 
        { color: '#cccccc', font: '14px sans-serif' });
      
      // Price and stock
      window.Renderer.drawText(`Price: ${item.price} gold`, 400, y, 
        { color: '#ffff00', font: '14px sans-serif' });
      window.Renderer.drawText(`Stock: ${item.stock}`, 400, y + 25, 
        { color: item.stock > 0 ? '#00ff00' : '#ff0000', font: '14px sans-serif' });
      
      // Rarity indicator
      const rarityColors = {
        common: '#ffffff',
        uncommon: '#00ff00',
        rare: '#0088ff',
        unique: '#ff00ff'
      };
      window.Renderer.drawText(`[${item.template.rarity.toUpperCase()}]`, 600, y, 
        { color: rarityColors[item.template.rarity] || '#ffffff', font: '12px sans-serif' });
    });
  }

  drawMissions(ctx) {
    const startY = 180;
    const missionHeight = 100;
    
    window.Renderer.drawText('Mission Board - Enter: Accept, C: Complete', 50, startY - 20, 
      { color: '#ffffff', font: 'bold 18px sans-serif' });

    // Draw missions
    this.missions.forEach((mission, index) => {
      const y = startY + index * missionHeight;
      const isSelected = index === this.selectedMission;
      const isActive = this.playerMissions.active.some(m => m.id === mission.id);
      const isCompleted = this.playerMissions.completed.some(m => m.id === mission.id);
      
      // Selection background
      if (isSelected) {
        ctx.fillStyle = 'rgba(255, 255, 100, 0.2)';
        ctx.fillRect(40, y - 10, ctx.canvas.width - 80, missionHeight);
      }
      
      // Mission status indicator
      let statusColor = '#ffffff';
      let statusText = '';
      if (isCompleted) {
        statusColor = '#00ff00';
        statusText = '[COMPLETED]';
      } else if (isActive) {
        statusColor = '#ffff00';
        statusText = '[ACTIVE]';
      }
      
      window.Renderer.drawText(`${statusText} ${mission.name}`, 60, y, 
        { color: isSelected ? '#ffff00' : statusColor, font: 'bold 16px sans-serif' });
      window.Renderer.drawText(mission.description, 60, y + 25, 
        { color: '#cccccc', font: '14px sans-serif' });
      
      // Requirements
      window.Renderer.drawText(`Requires: ${this.formatRequirement(mission.requirement)}`, 60, y + 50, 
        { color: '#ffaa00', font: '12px sans-serif' });
      
      // Rewards
      window.Renderer.drawText(`Reward: ${this.formatReward(mission.reward)}`, 60, y + 70, 
        { color: '#00ff00', font: '12px sans-serif' });
      
      // Difficulty
      window.Renderer.drawText(`[${mission.difficulty}]`, ctx.canvas.width - 150, y, 
        { color: this.getDifficultyColor(mission.difficulty), font: 'bold 14px sans-serif' });
    });
  }

  drawInn(ctx) {
    const startY = 200;
    
    window.Renderer.drawText('The Rusty Flask Inn', ctx.canvas.width / 2 - 100, startY, 
      { color: '#ffffff', font: 'bold 24px sans-serif' });
    
    window.Renderer.drawText('A warm fire and comfortable beds await weary travelers.', 
      ctx.canvas.width / 2 - 200, startY + 40, 
      { color: '#cccccc', font: '16px sans-serif', align: 'center' });
    
    window.Renderer.drawText(`Full recovery for only ${this.innCost} gold!`, 
      ctx.canvas.width / 2 - 100, startY + 80, 
      { color: '#ffff00', font: 'bold 18px sans-serif', align: 'center' });
    
    // Current status
    window.Renderer.drawText(`HP: ${this.player.hp}/${this.player.maxHP}`, 
      ctx.canvas.width / 2 - 50, startY + 120, 
      { color: this.player.hp === this.player.maxHP ? '#00ff00' : '#ff6666', font: '16px sans-serif' });
    
    window.Renderer.drawText(`MP: ${this.player.mp}/${this.player.maxMP}`, 
      ctx.canvas.width / 2 - 50, startY + 145, 
      { color: this.player.mp === this.player.maxMP ? '#0088ff' : '#6666ff', font: '16px sans-serif' });
    
    window.Renderer.drawText('Press Enter to rest and recover', 
      ctx.canvas.width / 2 - 120, startY + 190, 
      { color: '#ffffff', font: 'bold 16px sans-serif' });
    
    // Draw simple bed illustration
    ctx.fillStyle = '#8b4513';
    ctx.fillRect(ctx.canvas.width / 2 - 60, startY + 220, 120, 80);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(ctx.canvas.width / 2 - 55, startY + 225, 110, 70);
    ctx.fillStyle = '#ffcccc';
    ctx.fillRect(ctx.canvas.width / 2 - 50, startY + 230, 100, 60);
  }

  drawMessage(ctx) {
    const messageX = ctx.canvas.width / 2 - 200;
    const messageY = ctx.canvas.height / 2 - 50;
    const messageWidth = 400;
    const messageHeight = 60;
    
    // Background
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.fillRect(messageX, messageY, messageWidth, messageHeight);
    
    // Border
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.strokeRect(messageX, messageY, messageWidth, messageHeight);
    
    // Text
    window.Renderer.drawText(this.message, messageX + messageWidth / 2 - 100, messageY + 35, 
      { color: '#ffffff', font: 'bold 16px sans-serif', align: 'center' });
  }

  formatRequirement(requirement) {
    if (requirement.type === 'item') {
      const template = window.ItemTypes[requirement.id];
      const itemName = template ? template.name : requirement.id;
      return `${requirement.quantity}x ${itemName}`;
    } else if (requirement.type === 'kill') {
      return `Defeat ${requirement.quantity}x ${requirement.id}`;
    }
    return 'Unknown requirement';
  }

  formatReward(reward) {
    let parts = [];
    if (reward.gold) parts.push(`${reward.gold} gold`);
    if (reward.exp) parts.push(`${reward.exp} exp`);
    if (reward.item) {
      const template = window.ItemTypes[reward.item];
      if (template) parts.push(template.name);
    }
    return parts.join(', ') || 'No reward';
  }

  getDifficultyColor(difficulty) {
    const colors = {
      Easy: '#00ff00',
      Medium: '#ffff00',
      Hard: '#ff8800',
      Legendary: '#ff0000'
    };
    return colors[difficulty] || '#ffffff';
  }
};