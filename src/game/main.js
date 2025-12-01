// File: src/game/main.js
window.FILE_MANIFEST = window.FILE_MANIFEST || [];
window.FILE_MANIFEST.push({
  name: 'src/game/main.js',
  exports: ['Game'],
  dependencies: ['OverworldScene', 'BattleScene', 'Player', 'SceneManager', 'Renderer', 'SaveManager', 'ProgressionManager', 'Mobile', 'PWA']
});

// Main game object and initialization
window.Game = {
  player: null,
  canvas: null,
  ctx: null,
  startTime: Date.now(),
  playTime: 0,
  sessionTime: 0,
  lastUpdate: Date.now(),

  // Initialize game systems
  init: function() {
    console.log('Initializing RPG Game...');

    // Initialize mobile system first for responsive canvas
    window.Mobile.init();

    // Initialize save system first
    const hasSave = window.SaveManager.init();
    
    // Initialize renderer
    window.Renderer.init();
    this.canvas = window.Renderer.canvas;
    this.ctx = window.Renderer.ctx;

    // Load save data or create new player
    if (hasSave) {
      this.loadGame();
    } else {
      this.createNewGame();
    }

    // Register scenes
    window.SceneManager.registerScene('overworld', window.OverworldScene);
    window.SceneManager.registerScene('battle', window.BattleScene);
    window.SceneManager.registerScene('town', window.TownScene);

    console.log('Game initialized successfully');
  },
  
  // Create new game
  createNewGame: function() {
    console.log('Starting new game...');
    this.player = new window.Player();
    this.startTime = Date.now();
    this.playTime = 0;
  },
  
  // Load saved game
  loadGame: function() {
    console.log('Loading saved game...');
    const saveData = window.SaveManager.loadGame();
    
    if (saveData) {
      this.player = new window.Player();
      this.restorePlayerData(saveData.player);
      this.playTime = saveData.additional.playTime || 0;
      this.startTime = Date.now() - (saveData.additional.sessionTime || 0);
      
      console.log('Game loaded successfully');
      return true;
    } else {
      console.log('Save data corrupted, starting new game...');
      this.createNewGame();
      return false;
    }
  },
  
  // Restore player data from save
  restorePlayerData: function(playerData) {
    if (!this.player || !playerData) return;
    
    // Restore basic stats
    this.player.level = playerData.level;
    this.player.experience = playerData.experience;
    this.player.experienceToNext = playerData.experienceToNext;
    this.player.hp = playerData.hp;
    this.player.maxHP = playerData.maxHP;
    this.player.mp = playerData.mp;
    this.player.maxMP = playerData.maxMP;
    
    // Restore combat stats
    this.player.baseAttack = playerData.baseAttack;
    this.player.baseDefense = playerData.baseDefense;
    this.player.attack = playerData.attack;
    this.player.defense = playerData.defense;
    
    // Restore special attacks
    this.player.specialAttacks = playerData.specialAttacks;
    
    // Restore position
    this.player.x = playerData.x;
    this.player.y = playerData.y;
    this.player.facing = playerData.facing;
    
    // Restore inventory
    this.player.inventory = playerData.inventory;
    
    // Restore equipment
    this.player.equipment = playerData.equipment;
    
    // Restore other state
    this.player.combatCooldown = playerData.combatCooldown;
    
    // Restore progression data (if available)
    if (playerData.defeatedBosses) {
      this.player.defeatedBosses = playerData.defeatedBosses;
    }
    if (playerData.visitedAreas) {
      this.player.visitedAreas = new Set(playerData.visitedAreas);
    }
    
    // Update derived stats
    this.player.updateDerivedStats();
  },
  
  // Update game time tracking
  updateTime: function() {
    const now = Date.now();
    const deltaTime = now - this.lastUpdate;
    this.lastUpdate = now;
    
    this.sessionTime = now - this.startTime;
    this.playTime += deltaTime;
  },
  
  // Save game
  saveGame: function() {
    if (this.player) {
      return window.SaveManager.saveGame(this.player, {
        playTime: this.playTime,
        sessionTime: this.sessionTime
      });
    }
    return false;
  },
  
  // Get save info
  getSaveInfo: function() {
    return window.SaveManager.getSaveInfo();
  },
  
  // Check progression unlocks
  checkProgression: function() {
    if (this.player) {
      return window.ProgressionManager.getProgressionStatus(this.player);
    }
    return null;
  },
  
  // Handle URL parameters and PWA app shortcuts
  handleURLParameters: function() {
    const urlParams = new URLSearchParams(window.location.search);
    const action = urlParams.get('action');
    
    if (action === 'new') {
      console.log('PWA: New Game shortcut activated');
      this.createNewGame();
      this.saveGame(); // Auto-save new game
      
      // Show new game feedback if PWA is available
      if (window.PWA && window.PWA.showInstallSuccess) {
        window.PWA.showInstallSuccess('New game started!');
      }
      
    } else if (action === 'continue') {
      console.log('PWA: Continue shortcut activated');
      const hasSave = this.loadGame();
      
      if (!hasSave) {
        console.log('No save found, starting new game');
        this.createNewGame();
      }
      
    } else if (action === 'fullscreen') {
      console.log('PWA: Fullscreen mode requested');
      if (window.PWA) {
        window.PWA.requestFullscreen();
      }
    }
    
    // Track install source for analytics
    const source = urlParams.get('source');
    if (source && window.PWA) {
      console.log('PWA: Tracking install source:', source);
      // Could send this to analytics service
    }
    
    // Clean URL to remove parameters
    if (action || source) {
      const cleanURL = window.location.pathname;
      window.history.replaceState({}, '', cleanURL);
    }
  },
  
  // PWA-specific methods
  
  // Request fullscreen for immersive gameplay
  requestFullscreen: function() {
    if (window.PWA) {
      return window.PWA.requestFullscreen();
    }
    return Promise.reject('PWA not available');
  },
  
  // Exit fullscreen
  exitFullscreen: function() {
    if (window.PWA) {
      return window.PWA.exitFullscreen();
    }
    return Promise.reject('PWA not available');
  },
  
  // Get PWA installation info
  getInstallInfo: function() {
    if (window.PWA) {
      return window.PWA.getInstallInfo();
    }
    return {
      isInstalled: false,
      isStandalone: false,
      installSource: 'unknown',
      platform: navigator.platform,
      userAgent: navigator.userAgent
    };
  },
  
  // Enhanced save with PWA background sync
  saveGameWithSync: function() {
    const saved = this.saveGame();
    
    if (saved && 'serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration) {
      // Register background sync for cloud save
      navigator.serviceWorker.ready.then(registration => {
        return registration.sync.register('game-save');
      }).then(() => {
        console.log('Background sync registered for game save');
      }).catch(err => {
        console.log('Background sync registration failed:', err);
      });
    }
    
    return saved;
  },
  
  // Handle online/offline status changes
  handleNetworkChange: function() {
    if (navigator.onLine) {
      console.log('Network restored - checking for updates');
      if (window.PWA) {
        window.PWA.checkForUpdates();
      }
    } else {
      console.log('Network lost - playing in offline mode');
    }
  }
};

// Auto-initialize when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
  // Initialize game
  window.Game.init();
  
  // Start the game loop
  window.initGame();
  
  // Handle PWA app shortcuts and URL parameters
  window.Game.handleURLParameters();
  
  // Hide loading screen after initialization
  if (window.hideLoadingScreen) {
    setTimeout(() => {
      window.hideLoadingScreen();
    }, 1000);
  }
  
  // Add keyboard shortcut for saving
  document.addEventListener('keydown', function(e) {
    // Ctrl+S to save
    if (e.ctrlKey && e.key === 's') {
      e.preventDefault();
      const saved = window.Game.saveGame();
      if (saved) {
        console.log('Game saved manually!');
        // Could add visual feedback here
      }
    }
  });
  
  // Auto-save when leaving page
  window.addEventListener('beforeunload', function() {
    if (window.Game.player) {
      window.Game.saveGame();
    }
  });
  
  // Handle network status changes
  window.addEventListener('online', function() {
    if (window.Game) {
      window.Game.handleNetworkChange();
    }
  });
  
  window.addEventListener('offline', function() {
    if (window.Game) {
      window.Game.handleNetworkChange();
    }
  });
  
  // Handle app installation success
  window.addEventListener('appinstalled', function() {
    console.log('PWA: App was installed successfully');
    if (window.Game) {
      // Track installation in game statistics
      // Could unlock special achievement or item
      console.log('Installation tracked in game stats');
    }
  });
  
  // Handle fullscreen changes
  document.addEventListener('fullscreenchange', function() {
    if (window.Game && window.Game.canvas) {
      // Resize canvas for fullscreen mode
      setTimeout(() => {
        if (window.Mobile && window.Mobile.updateCanvasSize) {
          window.Mobile.updateCanvasSize();
        }
      }, 100);
    }
  });
  
  // Handle PWA specific shortcuts
  document.addEventListener('keydown', function(e) {
    // F11 for fullscreen (if supported)
    if (e.key === 'F11') {
      e.preventDefault();
      if (window.Game && !document.fullscreenElement) {
        window.Game.requestFullscreen();
      } else {
        window.Game.exitFullscreen();
      }
    }
    
    // Ctrl+Shift+S for enhanced save with sync
    if (e.ctrlKey && e.shiftKey && e.key === 'S') {
      e.preventDefault();
      const saved = window.Game.saveGameWithSync();
      if (saved) {
        console.log('Game saved with background sync!');
      }
    }
  });
  
  console.log('RPG Game started!');
});