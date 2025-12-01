// File: src/core/scene.js
window.FILE_MANIFEST = window.FILE_MANIFEST || [];
window.FILE_MANIFEST.push({
  name: 'src/core/scene.js',
  exports: ['SceneManager'],
  dependencies: []
});

// Scene management system for switching between game states
window.SceneManager = {
  currentScene: null,
  scenes: {},
  transitionData: null,

  // Register a new scene
  registerScene: function(name, sceneClass) {
    this.scenes[name] = sceneClass;
  },

  // Switch to a different scene
  switchScene: function(sceneName, data = null) {
    // Clean up current scene if it exists
    if (this.currentScene && this.currentScene.exit) {
      this.currentScene.exit();
    }

    // Store transition data for new scene
    this.transitionData = data;

    // Create and initialize new scene
    const SceneClass = this.scenes[sceneName];
    if (!SceneClass) {
      console.error('Scene not found:', sceneName);
      return false;
    }

    this.currentScene = new SceneClass();
    
    // Update UI indicator
    const indicator = document.getElementById('sceneIndicator');
    if (indicator) {
      indicator.textContent = sceneName.charAt(0).toUpperCase() + sceneName.slice(1);
    }

    // Initialize new scene with transition data
    if (this.currentScene.enter) {
      this.currentScene.enter(data);
    }

    return true;
  },

  // Update current scene
  update: function(deltaTime) {
    if (this.currentScene && this.currentScene.update) {
      this.currentScene.update(deltaTime);
    }
  },

  // Render current scene
  render: function(ctx) {
    if (this.currentScene && this.currentScene.render) {
      this.currentScene.render(ctx);
    }
  },

  // Get current scene name
  getCurrentSceneName: function() {
    for (const [name, SceneClass] of Object.entries(this.scenes)) {
      if (this.currentScene instanceof SceneClass) {
        return name;
      }
    }
    return null;
  }
};

// Base scene class that all scenes should extend
window.Scene = class Scene {
  constructor() {
    this.isActive = false;
  }

  // Called when scene becomes active
  enter(data) {
    this.isActive = true;
  }

  // Called when scene becomes inactive
  exit() {
    this.isActive = false;
  }

  // Update game logic (called every frame)
  update(deltaTime) {
    // Override in derived classes
  }

  // Render graphics (called every frame)
  render(ctx) {
    // Override in derived classes
  }
};