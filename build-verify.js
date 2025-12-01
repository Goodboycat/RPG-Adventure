// Build Verification Script
// Run this to verify the game is properly compiled for production

(function() {
  'use strict';
  
  console.log('🔍 Starting RPG Adventure Build Verification...');
  
  const checks = [];
  
  // Check 1: All required window objects exist
  function checkGlobalObjects() {
    const required = [
      'Game', 'SceneManager', 'Player', 'OverworldScene', 'BattleScene', 'TownScene',
      'Input', 'TouchControls', 'Renderer', 'Effects', 'SaveManager', 'Mobile', 'PWA'
    ];
    
    const missing = required.filter(name => !window[name]);
    
    if (missing.length === 0) {
      checks.push('✅ All global game objects loaded');
      return true;
    } else {
      checks.push(`❌ Missing global objects: ${missing.join(', ')}`);
      return false;
    }
  }
  
  // Check 2: Service Worker registration
  function checkServiceWorker() {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistration().then(registration => {
        if (registration) {
          checks.push('✅ Service worker registered');
        } else {
          checks.push('❌ Service worker not registered');
        }
      }).catch(() => {
        checks.push('❌ Service worker check failed');
      });
    } else {
      checks.push('❌ Service Worker not supported');
    }
  }
  
  // Check 3: PWA Manifest
  function checkManifest() {
    if (document.querySelector('link[rel="manifest"]')) {
      checks.push('✅ PWA manifest linked');
    } else {
      checks.push('❌ PWA manifest not linked');
    }
  }
  
  // Check 4: Game Canvas
  function checkCanvas() {
    const canvas = document.getElementById('gameCanvas');
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        checks.push(`✅ Game canvas ready (${canvas.width}x${canvas.height})`);
      } else {
        checks.push('❌ Canvas context unavailable');
      }
    } else {
      checks.push('❌ Game canvas not found');
    }
  }
  
  // Check 5: Loading screen
  function checkLoadingScreen() {
    const loadingScreen = document.getElementById('loadingScreen');
    if (loadingScreen) {
      const isVisible = loadingScreen.style.display !== 'none' && 
                        !loadingScreen.classList.contains('loading-hidden');
      if (!isVisible) {
        checks.push('✅ Loading screen hidden (game ready)');
      } else {
        checks.push('⚠️ Loading screen still visible');
      }
    } else {
      checks.push('❌ Loading screen not found');
    }
  }
  
  // Check 6: Scene Manager state
  function checkSceneManager() {
    if (window.SceneManager && window.SceneManager.currentScene) {
      checks.push(`✅ Scene active: ${window.SceneManager.getCurrentSceneName()}`);
    } else {
      checks.push('❌ No active scene');
    }
  }
  
  // Check 7: Game Loop
  function checkGameLoop() {
    if (window.isRunning === true) {
      checks.push('✅ Game loop running');
    } else {
      checks.push('❌ Game loop not running');
    }
  }
  
  // Check 8: Mobile responsiveness
  function checkMobileFeatures() {
    if (window.Mobile) {
      checks.push('✅ Mobile system ready');
      
      const isMobile = window.Mobile.isMobileDevice();
      if (isMobile) {
        checks.push('📱 Mobile device detected');
      } else {
        checks.push('🖥️ Desktop device detected');
      }
    } else {
      checks.push('❌ Mobile system not available');
    }
  }
  
  // Check 9: Save System
  function checkSaveSystem() {
    if (window.SaveManager) {
      const saveInfo = window.SaveManager.getSaveInfo();
      if (saveInfo) {
        checks.push(`✅ Save system ready (last save: ${saveInfo.lastSaved ? new Date(saveInfo.lastSaved).toLocaleString() : 'Never'})`);
      } else {
        checks.push('⚠️ Save system ready but no save data');
      }
    } else {
      checks.push('❌ Save system not available');
    }
  }
  
  // Check 10: Icon files (basic check)
  function checkIcons() {
    const icons = [
      'icons/icon-32x32.svg',
      'icons/icon-192x192.svg', 
      'icons/icon-512x512.svg'
    ];
    
    let loadedCount = 0;
    icons.forEach(icon => {
      const img = new Image();
      img.onload = () => loadedCount++;
      img.onerror = () => {}; // Ignore errors for now
      img.src = icon;
    });
    
    setTimeout(() => {
      if (loadedCount === icons.length) {
        checks.push('✅ All icons loaded');
      } else {
        checks.push(`⚠️ ${loadedCount}/${icons.length} icons loaded`);
      }
      reportResults();
    }, 2000);
  }
  
  // Run all checks
  function runChecks() {
    checkGlobalObjects();
    checkServiceWorker();
    checkManifest();
    checkCanvas();
    checkLoadingScreen();
    checkSceneManager();
    checkGameLoop();
    checkMobileFeatures();
    checkSaveSystem();
    checkIcons();
  }
  
  // Report results
  function reportResults() {
    console.log('\n📊 Build Verification Report:');
    console.log('================================');
    
    const passed = checks.filter(c => c.startsWith('✅')).length;
    const warnings = checks.filter(c => c.startsWith('⚠️')).length;
    const failed = checks.filter(c => c.startsWith('❌')).length;
    
    checks.forEach(check => console.log(check));
    
    console.log('\n📈 Summary:');
    console.log(`✅ Passed: ${passed}`);
    console.log(`⚠️ Warnings: ${warnings}`);
    console.log(`❌ Failed: ${failed}`);
    
    if (failed === 0) {
      console.log('\n🎉 Build verification PASSED! Game is ready for production.');
    } else {
      console.log('\n🚨 Build verification FAILED! Fix the issues before deploying.');
    }
    
    if (warnings > 0) {
      console.log('\n⚠️ Note: Warnings should be addressed for optimal performance.');
    }
  }
  
  // Start verification after page loads
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      setTimeout(runChecks, 2000); // Wait 2 seconds for game to initialize
    });
  } else {
    setTimeout(runChecks, 2000);
  }
  
  // Make available globally for manual testing
  window.verifyBuild = runChecks;
})();