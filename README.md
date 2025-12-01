# RPG Adventure

A simple turn-based RPG game with tilemap exploration, combat, and town systems built with HTML5 Canvas.

## Architecture

Scene-based architecture with 60fps game loop and modular systems:
- **Scene Management**: Switch between Overworld, Battle, and Town scenes
- **Game Loop**: Frame-rate independent with delta time
- **Input System**: Keyboard and mouse input handling
- **Rendering**: Canvas-based 2D graphics engine

## File Structure

### Core Systems
- `src/core/scene.js` - Scene manager for switching between game states
- `src/core/loop.js` - 60fps game loop with delta time
- `src/core/input.js` - Keyboard and mouse input handling
- `src/core/mobile.js` - Mobile-responsive canvas system with dynamic resolution scaling

### Engine Systems
- `src/engine/renderer.js` - Canvas 2D rendering utilities
- `src/engine/tilemap.js` - Tile-based map rendering with collision detection and camera system
- `src/engine/effects.js` - Visual effects system with particles, screen shake, and animations
- `src/utils/math.js` - Math utilities and helper functions

### Game Scenes
- `src/game/overworld.js` - Exploration and map navigation
- `src/game/battle.js` - Turn-based combat system with enhanced visual effects
- `src/game/town.js` - Town interactions and NPCs
- `src/game/player.js` - Player character with stats, progression, inventory, and equipment
- `src/game/enemies.js` - Monster types, boss enemies, and loot drop system
- `src/game/ui.js` - UI components including health bars, action menus, battle logs, and inventory
- `src/game/main.js` - Game initialization and save system integration
- `src/game/save.js` - Save/load functionality with persistent game state and progression
- `src/game/inventory.js` - Item types, effects, and comprehensive inventory management

### Frontend
- `index.html` - Game entry point with 1920x1080 canvas
- `style.css` - Game styling and responsive design

## Features

### ✅ Complete
- Scene management system (Overworld, Battle, Town)
- 60fps game loop with delta time
- Tile-based map system with collision detection
- Multi-layer rendering with tile atlas support
- Camera follow system with smooth interpolation
- Region-based area access with boss requirements
- Player movement and navigation with collision
- Turn-based combat system with enhanced visual effects
- Town with buildings and NPCs
- Player stats and progression with leveling system
- Inventory management system with item storage
- Equipment system with weapon, armor, and accessory slots
- Special attack system unlocked by level thresholds
- Experience and gold mechanics
- Input handling (keyboard and mouse controls)
- **Mobile-responsive design with dynamic canvas scaling**
- **Hybrid touch control system with on-screen D-pad and action buttons**
- **Gesture support for tap, swipe, and long-press actions**
- **Haptic feedback integration for tactile response**
- **Visual effects system with particles, screen shake, and transitions**
- **Comprehensive UI system with health bars, action menus, and battle logs**
- **Enhanced battle animations and effects**
- **Level up celebrations and victory animations**
- **Monster and Boss system with varied enemy types and unique loot**
- **Save and load system with persistent game state**
- **Progressive Web App (PWA) with offline capability**
- **App install prompts and standalone mode support**
- **Background sync for cloud saves (future feature)**
- **Push notification support for game updates**
- **Fullscreen immersive mode with orientation handling**
- **App shortcuts for quick access to New Game and Continue**
- **Automatic cache management and update detection**
- **Cross-browser PWA compatibility with fallback support**
- **Game progression system with area unlocking and milestones**
- **Auto-save functionality with manual save shortcuts**
- **Comprehensive statistics tracking and completion percentage**
- **Mobile performance optimization with adaptive quality settings**
- **Dynamic frame rate limiting based on device capabilities**
- **Touch event throttling for improved responsiveness**
- **Memory management with automatic cleanup and garbage collection**
- **Particle and effect density adjustment for mobile constraints**
- **Device capability detection and quality profile management**
- **Real-time performance monitoring and adaptive adjustments**

### 🚧 In-Progress
- Quest system
- More advanced boss mechanics
- Equipment enchantment system

## Controls

### Overworld
- **Arrow Keys**: Move player
- **Enter**: Interact (enter town)
- **B**: Start random battle

### Battle
- **Arrow Keys**: Navigate action menu
- **Enter**: Select action

### Town
- **Arrow Keys**: Navigate locations
- **Enter**: Interact
- **Escape**: Leave town

### System
- **Ctrl+S**: Manual save game
- **Ctrl+Shift+S**: Save with background sync (PWA)
- **F11**: Toggle fullscreen mode (PWA)
- **Auto-save**: Every 60 seconds
- **Auto-save**: When leaving page

### PWA Features
- **Install Prompt**: Automatic install banner after 30 seconds
- **App Shortcuts**: New Game and Continue shortcuts on home screen
- **Offline Mode**: Play without internet connection after first load
- **Background Sync**: Automatic save sync when coming back online
- **Push Notifications**: Game updates and reminders (future)
- **Fullscreen**: Immersive gameplay experience

## Technical Details

- **Canvas Size**: Dynamic resolution scaling (720p to 1080p based on device capabilities)
- **Mobile Responsive**: Automatic canvas resizing and touch event scaling
- **Frame Rate**: 60fps capped with delta time
- **Architecture**: Global namespace pattern (window.*)
- **Scene System**: Modular scene switching
- **Tilemap System**: Multi-layer rendering with collision detection and camera system
- **Region System**: Area access control based on defeated bosses
- **Inventory System**: 20-slot capacity with item stacking and quick access
- **Equipment System**: Weapon, armor, and accessory slots with stat bonuses
- **Item Types**: Consumables, materials, equipment, and special items
- **Loot System**: Procedural loot generation with rarity tiers
- **Town Economy**: Dynamic pricing with town-specific multipliers
- **Mission System**: Progressive quests with item collection and kill tracking
- **File Size**: All files under 100 lines for maintainability

## Getting Started

1. Open `index.html` in a web browser
2. The game starts in the overworld scene
3. Navigate using arrow keys and interact with Enter key
4. Explore the town, fight battles, and progress your character