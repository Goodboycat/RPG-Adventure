// File: src/game/overworld.js
window.FILE_MANIFEST = window.FILE_MANIFEST || [];
window.FILE_MANIFEST.push({
  name: 'src/game/overworld.js',
  exports: ['OverworldScene'],
  dependencies: ['Scene', 'SceneManager', 'Player', 'Tilemap', 'TileAtlas', 'Input', 'EnemyFactory', 'MathUtils', 'Inventory']
});

// Overworld exploration scene
window.OverworldScene = class OverworldScene extends window.Scene {
  constructor() {
    super();
    
    // Game state
    this.player = null;
    this.tilemap = null;
    this.tileAtlas = null;
    
    // Encounter system
    this.encounterRate = 0.02; // 2% chance per frame while moving
    this.encounterCooldown = 0;
    this.minEncounterInterval = 3000; // 3 seconds minimum between encounters
    
    // Area transitions
    this.transitionPoints = [];
    this.currentRegion = null;
    this.lastPosition = { x: 0, y: 0 };
    
    // Town and battle triggers
    this.townPositions = [
      { x: 5, y: 5, name: 'starter_town', region: 'plains' },
      { x: 15, y: 8, name: 'port_town', region: 'forest', bossRequired: 'forest_guardian' },
      { x: 25, y: 3, name: 'mountain_town', region: 'mountains', bossRequired: 'mountain_titan' }
    ];
    
    this.bossAreas = [
      { x: 12, y: 12, name: 'Forest Guardian', region: 'forest', bossId: 'forest_guardian' },
      { x: 22, y: 15, name: 'Mountain Titan', region: 'mountains', bossId: 'mountain_titan' },
      { x: 30, y: 10, name: 'Final Boss', region: 'castle', bossRequired: 'mountain_titan', bossId: 'dark_lord' }
    ];
    
    // Debug mode
    this.debugMode = false;
  }
  
  // Initialize scene
  enter(data) {
    super.enter(data);
    
    console.log('Entering overworld scene');
    
    // Create player
    this.player = new window.Player();
    
    // Restore player state from transition data if available
    if (data && data.playerState) {
      Object.assign(this.player, data.playerState);
    }
    
    // Initialize tilemap system
    this.initializeTilemap();
    
    // Set up collision detection for player
    this.player.currentTilemap = this.tilemap;
    
    // Set initial camera position
    this.tilemap.updateCamera(this.player.x, this.player.y);
  }
  
  // Clean up scene
  exit() {
    // Save player state for next scene
    const playerState = {
      x: this.player.x,
      y: this.player.y,
      level: this.player.level,
      hp: this.player.hp,
      maxHP: this.player.maxHP,
      mp: this.player.mp,
      maxMP: this.player.maxMP,
      experience: this.player.experience,
      experienceToNext: this.player.experienceToNext,
      attack: this.player.attack,
      defense: this.player.defense,
      inventory: this.player.inventory,
      equipment: this.player.equipment,
      defeatedBosses: this.player.defeatedBosses,
      specialAttacks: this.player.specialAttacks
    };
    
    // Store for potential return
    this.savedPlayerState = playerState;
    
    // Clean up references
    this.player.currentTilemap = null;
    this.player = null;
    
    console.log('Exiting overworld scene');
  }
  
  // Initialize tilemap with basic world layout
  initializeTilemap() {
    // Create tile atlas
    this.tileAtlas = new window.TileAtlas(32);
    
    // Define basic tiles (colors for now, could use actual textures)
    this.tileAtlas.addTile(1, 0, 0, false); // Grass
    this.tileAtlas.addTile(2, 32, 0, true); // Wall
    this.tileAtlas.addTile(3, 64, 0, false); // Path
    this.tileAtlas.addTile(4, 96, 0, true); // Water
    this.tileAtlas.addTile(5, 128, 0, false); // Forest
    this.tileAtlas.addTile(6, 160, 0, true); // Mountain
    
    // Create tilemap
    this.tilemap = new window.Tilemap(40, 25, 32);
    this.tilemap.setAtlas(this.tileAtlas);
    
    // Generate world layout
    this.generateWorldLayout();
    
    // Set up regions
    this.setupRegions();
  }
  
  // Generate basic world layout
  generateWorldLayout() {
    // Add layers
    const groundLayer = this.tilemap.addLayer('ground');
    const decorationLayer = this.tilemap.addLayer('decoration');
    const collisionLayer = this.tilemap.addLayer('collision');
    
    // Fill with grass
    for (let y = 0; y < this.tilemap.height; y++) {
      for (let x = 0; x < this.tilemap.width; x++) {
        this.tilemap.setTile('ground', x, y, 1);
      }
    }
    
    // Add path network
    this.createPathNetwork();
    
    // Add water boundaries
    this.createWaterBoundaries();
    
    // Add forest and mountain areas
    this.createTerrainFeatures();
    
    // Add town tiles
    this.createTownTiles();
    
    // Add collision for mountains and water
    this.updateCollisionLayer();
  }
  
  // Create path network connecting towns
  createPathNetwork() {
    // Main horizontal path
    for (let x = 0; x < this.tilemap.width; x++) {
      this.tilemap.setTile('ground', x, 10, 3);
    }
    
    // Vertical paths to towns
    for (let y = 0; y < 11; y++) {
      this.tilemap.setTile('ground', 5, y, 3);
      this.tilemap.setTile('ground', 15, y, 3);
      this.tilemap.setTile('ground', 25, y, 3);
    }
  }
  
  // Create water boundaries around the map
  createWaterBoundaries() {
    // Top and bottom borders
    for (let x = 0; x < this.tilemap.width; x++) {
      this.tilemap.setTile('ground', x, 0, 4);
      this.tilemap.setTile('ground', x, this.tilemap.height - 1, 4);
    }
    
    // Left and right borders
    for (let y = 0; y < this.tilemap.height; y++) {
      this.tilemap.setTile('ground', 0, y, 4);
      this.tilemap.setTile('ground', this.tilemap.width - 1, y, 4);
    }
  }
  
  // Create terrain features (forests, mountains)
  createTerrainFeatures() {
    // Forest area
    for (let y = 8; y < 18; y++) {
      for (let x = 10; x < 18; x++) {
        if (Math.random() > 0.3) {
          this.tilemap.setTile('decoration', x, y, 5);
        }
      }
    }
    
    // Mountain area
    for (let y = 5; y < 20; y++) {
      for (let x = 20; x < 28; x++) {
        if (Math.random() > 0.4) {
          this.tilemap.setTile('decoration', x, y, 6);
        }
      }
    }
  }
  
  // Create special tiles for towns
  createTownTiles() {
    for (const town of this.townPositions) {
      // Create town square (3x3 special tiles)
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          this.tilemap.setTile('decoration', town.x + dx, town.y + dy, 3);
        }
      }
    }
  }
  
  // Update collision layer based on tile types
  updateCollisionLayer() {
    for (let y = 0; y < this.tilemap.height; y++) {
      for (let x = 0; x < this.tilemap.width; x++) {
        const groundTile = this.tilemap.getTile('ground', x, y);
        const decorTile = this.tilemap.getTile('decoration', x, y);
        
        // Set collision for water, mountains
        if (groundTile === 4 || decorTile === 6) {
          this.tilemap.setTile('collision', x, y, 2);
        }
      }
    }
  }
  
  // Set up world regions with boss requirements
  setupRegions() {
    // Plains region (starting area)
    this.tilemap.addRegion('plains', 1, 1, 10, 15);
    
    // Forest region (requires forest guardian)
    this.tilemap.addRegion('forest', 10, 8, 10, 12, 'forest_guardian');
    
    // Mountain region (requires mountain titan)
    this.tilemap.addRegion('mountains', 20, 5, 10, 18, 'mountain_titan');
    
    // Castle region (final area, requires mountain titan)
    this.tilemap.addRegion('castle', 28, 8, 8, 10, 'mountain_titan');
  }
  
  // Update game logic
  update(deltaTime) {
    // Update player
    this.player.update(deltaTime);
    
    // Update camera to follow player
    this.tilemap.updateCamera(this.player.x, this.player.y);
    
    // Check for random encounters
    this.checkRandomEncounters(deltaTime);
    
    // Check for area transitions
    this.checkAreaTransitions();
    
    // Check for town entry
    this.checkTownEntry();
    
    // Check for boss area entry
    this.checkBossAreaEntry();
    
    // Update current region
    this.updateCurrentRegion();
    
    // Update encounter cooldown
    if (this.encounterCooldown > 0) {
      this.encounterCooldown -= deltaTime;
    }
    
    // Handle debug input
    this.handleDebugInput();
  }
  
  // Check for random monster encounters
  checkRandomEncounters(deltaTime) {
    // Only check if player is moving
    if (!this.player.isMoving) return;
    
    // Check cooldown
    if (this.encounterCooldown > 0) return;
    
    // Random encounter chance
    if (Math.random() < this.encounterRate) {
      this.startRandomEncounter();
    }
  }
  
  // Start a random battle
  startRandomEncounter() {
    console.log('Random encounter started!');
    
    // Set cooldown to prevent immediate re-encounter
    this.encounterCooldown = this.minEncounterInterval;
    
    // Get current region for enemy selection
    const region = this.getCurrentRegion();
    const enemies = this.getEnemiesForRegion(region);
    
    // Switch to battle scene with encounter data
    window.SceneManager.switchScene('battle', {
      playerState: this.getPlayerState(),
      areaLevel: this.getAreaLevel(this.getCurrentRegion()),
      fromOverworld: true
    });
  }
  
  // Get enemy list based on current region
  getEnemiesForRegion(region) {
    const regionLevels = {
      plains: 3,
      forest: 6,
      mountains: 10,
      castle: 15
    };
    
    const areaLevel = regionLevels[region] || 3;
    
    // Get available monsters for this area using EnemyFactory
    const availableMonsters = window.EnemyFactory.getMonstersForArea(areaLevel);
    
    // Return 1-3 random enemies
    const enemyCount = window.MathUtils.randomInt(1, 3);
    const selectedEnemies = [];
    
    for (let i = 0; i < enemyCount; i++) {
      const monsterType = availableMonsters[window.MathUtils.randomInt(0, availableMonsters.length - 1)];
      const enemy = window.EnemyFactory.createMonster(monsterType, this.player.level);
      selectedEnemies.push(enemy);
    }
    
    return selectedEnemies;
  }
  
  // Check for area transitions and restrictions
  checkAreaTransitions() {
    const gridPos = this.player.getGridPosition();
    const region = this.tilemap.getRegion(this.player.x, this.player.y);
    
    if (region && region.name !== this.currentRegion) {
      // Check if player can access this region
      if (!this.player.canAccessRegion(region.name)) {
        // Block access
        console.log(`Cannot access ${region.name} - need to defeat ${region.bossRequired}`);
        
        // Push player back to last valid position
        this.player.x = this.lastPosition.x;
        this.player.y = this.lastPosition.y;
      } else {
        // Allow access - update current region
        this.currentRegion = region.name;
        console.log(`Entered region: ${region.name}`);
      }
    }
    
    // Update last position if valid
    if (!region || this.player.canAccessRegion(region.name)) {
      this.lastPosition = { x: this.player.x, y: this.player.y };
    }
  }
  
  // Check for town entry
  checkTownEntry() {
    const gridPos = this.player.getGridPosition();
    
    for (const town of this.townPositions) {
      if (gridPos.x === town.x && gridPos.y === town.y) {
        // Check region access
        if (!town.bossRequired || this.player.defeatedBosses.includes(town.bossRequired)) {
          // Enter town
          const townData = this.getTownData(town.name);
          console.log(`Entering ${townData.name}`);
          window.SceneManager.switchScene('town', {
            townName: town.name,
            playerState: this.getPlayerState(),
            fromOverworld: true
          });
        } else {
          console.log(`Cannot enter ${town.name} - need to defeat ${town.bossRequired}`);
        }
        break;
      }
    }
  }
  
  // Check for boss area entry
  checkBossAreaEntry() {
    const gridPos = this.player.getGridPosition();
    
    for (const bossArea of this.bossAreas) {
      if (gridPos.x === bossArea.x && gridPos.y === bossArea.y) {
        // Check if player can access this boss area
        if (!bossArea.bossRequired || this.player.defeatedBosses.includes(bossArea.bossRequired)) {
          // Check if boss is already defeated
          if (this.player.defeatedBosses.includes(bossArea.bossId)) {
            console.log(`${bossArea.name} already defeated`);
          } else {
            // Start boss battle
            console.log(`Entering ${bossArea.name} battle!`);
            window.SceneManager.switchScene('battle', {
              playerState: this.getPlayerState(),
              isBossBattle: true,
              bossType: bossArea.bossId,
              fromOverworld: true
            });
          }
        } else {
          console.log(`Cannot access ${bossArea.name} - need to defeat ${bossArea.bossRequired}`);
        }
        break;
      }
    }
  }
  
  // Update current region tracking
  updateCurrentRegion() {
    const region = this.tilemap.getRegion(this.player.x, this.player.y);
    if (region && region.name !== this.currentRegion) {
      this.currentRegion = region.name;
      console.log(`Current region: ${region.name}`);
    }
  }
  
  // Get current region name
  getCurrentRegion() {
    return this.currentRegion || 'plains';
  }
  
  // Get area level for enemy scaling
  getAreaLevel(region) {
    const regionLevels = {
      plains: 3,
      forest: 6,
      mountains: 10,
      castle: 15
    };
    
    return regionLevels[region] || 3;
  }
  
  // Get player state for scene transitions
  getPlayerState() {
    return {
      x: this.player.x,
      y: this.player.y,
      level: this.player.level,
      hp: this.player.hp,
      maxHP: this.player.maxHP,
      mp: this.player.mp,
      maxMP: this.player.maxMP,
      experience: this.player.experience,
      experienceToNext: this.player.experienceToNext,
      attack: this.player.attack,
      defense: this.player.defense,
      inventory: this.player.inventory,
      equipment: this.player.equipment,
      defeatedBosses: this.player.defeatedBosses,
      specialAttacks: this.player.specialAttacks
    };
  }
  
  // Get town data by name
  getTownData(townName) {
    const towns = {
      starter_town: { name: 'Riverside Village' },
      port_town: { name: 'Harbor City' },
      mountain_town: { name: 'Stone Peak' }
    };
    return towns[townName] || { name: 'Unknown Town' };
  }
  
  // Handle debug input
  handleDebugInput() {
    // Toggle debug mode with D key
    if (window.Input.isKeyPressed('d')) {
      this.debugMode = !this.debugMode;
      console.log(`Debug mode: ${this.debugMode ? 'ON' : 'OFF'}`);
    }
    
    // Force battle with B key (for testing)
    if (window.Input.isKeyPressed('b')) {
      console.log('Force starting battle...');
      this.startRandomEncounter();
    }
    
    // Teleport to boss with number keys (for testing)
    if (window.Input.isKeyPressed('1')) {
      this.player.x = 12 * 32 + 16;
      this.player.y = 12 * 32 + 16;
      console.log('Teleported to Forest Guardian');
    }
    if (window.Input.isKeyPressed('2')) {
      this.player.x = 22 * 32 + 16;
      this.player.y = 15 * 32 + 16;
      console.log('Teleported to Mountain Titan');
    }
  }
  
  // Render the overworld
  render(ctx) {
    // Clear canvas
    ctx.fillStyle = '#87CEEB'; // Sky blue background
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    
    // Render tilemap
    this.tilemap.render(ctx, this.player.x, this.player.y);
    
    // Render player
    this.player.render(ctx);
    
    // Render UI overlay
    this.renderUI(ctx);
    
    // Render debug information if enabled
    if (this.debugMode) {
      this.renderDebug(ctx);
    }
  }
  
  // Render UI overlay
  renderUI(ctx) {
    // UI background
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(10, 10, 300, 80);
    
    // Player stats
    ctx.fillStyle = '#ffffff';
    ctx.font = '14px monospace';
    ctx.fillText(`Level: ${this.player.level}`, 20, 30);
    ctx.fillText(`HP: ${Math.floor(this.player.hp)}/${this.player.maxHP}`, 20, 50);
    ctx.fillText(`MP: ${Math.floor(this.player.mp)}/${this.player.maxMP}`, 20, 70);
    
    ctx.fillText(`Gold: ${this.player.inventory.gold}`, 150, 30);
    ctx.fillText(`Region: ${this.getCurrentRegion()}`, 150, 50);
    ctx.fillText(`Position: ${this.player.getGridPosition().x}, ${this.player.getGridPosition().y}`, 150, 70);
    
    // Instructions
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.font = '12px monospace';
    ctx.fillText('Arrow Keys: Move | Enter: Interact | B: Force Battle | D: Debug', 10, ctx.canvas.height - 20);
    
    // Show if area is restricted
    const region = this.tilemap.getRegion(this.player.x, this.player.y);
    if (region && region.bossRequired && !this.player.defeatedBosses.includes(region.bossRequired)) {
      ctx.fillStyle = '#ff0000';
      ctx.font = '16px monospace';
      ctx.fillText(`AREA RESTRICTED - Defeat ${region.bossRequired} to enter!`, ctx.canvas.width / 2 - 200, 100);
    }
  }
  
  // Render debug information
  renderDebug(ctx) {
    // Debug overlay
    ctx.fillStyle = 'rgba(0, 255, 0, 0.8)';
    ctx.font = '12px monospace';
    ctx.fillText('DEBUG MODE', ctx.canvas.width - 100, 20);
    
    // Render tilemap debug info
    this.tilemap.renderDebug(ctx, this.player.x, this.player.y, this.player.defeatedBosses);
    
    // Show encounter info
    ctx.fillStyle = 'rgba(255, 255, 0, 0.8)';
    ctx.fillText(`Encounter Rate: ${(this.encounterRate * 100).toFixed(1)}%`, ctx.canvas.width - 200, 40);
    ctx.fillText(`Encounter Cooldown: ${(this.encounterCooldown / 1000).toFixed(1)}s`, ctx.canvas.width - 200, 60);
    
    // Show town and boss positions
    ctx.strokeStyle = 'rgba(0, 255, 255, 0.8)';
    ctx.lineWidth = 2;
    
    // Town positions
    for (const town of this.townPositions) {
      const screenPos = this.tilemap.worldToScreen(town.x * 32, town.y * 32);
      ctx.strokeRect(screenPos.x, screenPos.y, 32, 32);
      
      ctx.fillStyle = 'rgba(0, 255, 255, 0.8)';
      ctx.font = '10px monospace';
      ctx.fillText('T', screenPos.x + 12, screenPos.y + 20);
    }
    
    // Boss positions
    for (const bossArea of this.bossAreas) {
      const screenPos = this.tilemap.worldToScreen(bossArea.x * 32, bossArea.y * 32);
      ctx.strokeStyle = 'rgba(255, 0, 255, 0.8)';
      ctx.strokeRect(screenPos.x, screenPos.y, 32, 32);
      
      ctx.fillStyle = 'rgba(255, 0, 255, 0.8)';
      ctx.font = '10px monospace';
      ctx.fillText('B', screenPos.x + 12, screenPos.y + 20);
    }
  }
};