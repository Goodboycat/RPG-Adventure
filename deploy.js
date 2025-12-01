// RPG Adventure Deployment Script
// Prepares the game for production deployment

(function() {
  'use strict';
  
  console.log('🚀 Preparing RPG Adventure for deployment...');
  
  const DeploymentManager = {
    
    // Optimization settings
    settings: {
      enableServiceWorker: true,
      enableCaching: true,
      enableCompression: false, // Server-side
      enableMinification: false, // Build-time only
      productionMode: true
    },
    
    // Initialize deployment
    init: function() {
      console.log('🔧 Applying production optimizations...');
      
      this.optimizePerformance();
      this.setupServiceWorker();
      this.verifyAssets();
      this.configurePWA();
      this.finalizeDeployment();
    },
    
    // Optimize game performance
    optimizePerformance: function() {
      console.log('⚡ Optimizing performance settings...');
      
      // Reduce console logging in production
      if (this.settings.productionMode) {
        const originalLog = console.log;
        const originalWarn = console.warn;
        const originalError = console.error;
        
        // Only allow errors and warnings in production
        console.log = function() {};
        console.warn = originalWarn;
        console.error = originalError;
        
        // Add back debug logging for development
        if (localStorage.getItem('debug') === 'true') {
          console.log = originalLog;
        }
      }
      
      // Optimize frame rate for mobile
      if (window.Mobile && window.Mobile.isMobileDevice()) {
        if (window.Performance) {
          window.Performance.settings.targetFPS = 30;
          window.Performance.settings.renderQuality = 0.8;
          window.Performance.settings.updateQuality = 0.9;
        }
      }
      
      console.log('✅ Performance optimizations applied');
    },
    
    // Setup service worker for production
    setupServiceWorker: function() {
      if (!this.settings.enableServiceWorker || !('serviceWorker' in navigator)) {
        console.log('⚠️ Service Worker disabled or not supported');
        return;
      }
      
      console.log('🔄 Configuring Service Worker...');
      
      // Force service worker update
      navigator.serviceWorker.getRegistration().then(registration => {
        if (registration) {
          registration.update().then(() => {
            console.log('✅ Service Worker updated to latest version');
          });
        }
      });
    },
    
    // Verify all assets are available
    verifyAssets: function() {
      console.log('🔍 Verifying game assets...');
      
      const criticalAssets = [
        'src/utils/math.js',
        'src/core/scene.js',
        'src/core/loop.js',
        'src/engine/renderer.js',
        'src/game/main.js',
        'src/game/player.js',
        'src/game/overworld.js',
        'src/game/battle.js',
        'src/game/town.js'
      ];
      
      const icons = [
        'icons/icon-32x32.svg',
        'icons/icon-192x192.svg',
        'icons/icon-512x512.svg'
      ];
      
      let loadedAssets = 0;
      const totalAssets = criticalAssets.length + icons.length;
      
      // Check JavaScript files (they should already be loaded)
      criticalAssets.forEach(asset => {
        if (document.querySelector(`script[src="${asset}"]`)) {
          loadedAssets++;
        }
      });
      
      // Check icons
      icons.forEach(icon => {
        const img = new Image();
        img.onload = () => loadedAssets++;
        img.onerror = () => console.warn(`⚠️ Failed to load: ${icon}`);
        img.src = icon;
      });
      
      setTimeout(() => {
        if (loadedAssets === totalAssets) {
          console.log('✅ All critical assets verified');
        } else {
          console.warn(`⚠️ ${loadedAssets}/${totalAssets} assets loaded`);
        }
      }, 3000);
    },
    
    // Configure PWA features
    configurePWA: function() {
      console.log('📱 Configuring PWA features...');
      
      if (window.PWA) {
        // Enable install prompts
        if (window.PWA.deferredPrompt) {
          setTimeout(() => {
            window.PWA.showInstallPrompt();
          }, 5000);
        }
        
        // Check if app is installed
        const isInstalled = window.PWA.isAppInstalled();
        if (isInstalled) {
          console.log('✅ App is installed');
        } else {
          console.log('ℹ️ App not installed (will show install prompt)');
        }
        
        // Setup app shortcuts
        if ('shortcuts' in navigator) {
          console.log('✅ App shortcuts available');
        }
      }
    },
    
    // Finalize deployment
    finalizeDeployment: function() {
      console.log('🎯 Finalizing deployment...');
      
      // Add production meta tags
      this.addProductionMeta();
      
      // Setup analytics (placeholder)
      this.setupAnalytics();
      
      // Add version info
      this.addVersionInfo();
      
      console.log('✅ RPG Adventure deployment ready!');
      console.log('🌐 Game is live and ready for players');
      
      // Show deployment notification
      this.showDeploymentNotification();
    },
    
    // Add production meta tags
    addProductionMeta: function() {
      const metaTags = [
        { name: 'robots', content: 'index, follow' },
        { name: 'author', content: 'RPG Adventure Team' },
        { property: 'og:title', content: 'RPG Adventure' },
        { property: 'og:description', content: 'A mobile-friendly RPG adventure game' },
        { property: 'og:type', content: 'website' },
        { name: 'twitter:card', content: 'summary_large_image' }
      ];
      
      metaTags.forEach(tag => {
        let meta;
        if (tag.property) {
          meta = document.querySelector(`meta[property="${tag.property}"]`);
          if (!meta) {
            meta = document.createElement('meta');
            meta.setAttribute('property', tag.property);
            document.head.appendChild(meta);
          }
        } else {
          meta = document.querySelector(`meta[name="${tag.name}"]`);
          if (!meta) {
            meta = document.createElement('meta');
            meta.setAttribute('name', tag.name);
            document.head.appendChild(meta);
          }
        }
        meta.setAttribute('content', tag.content);
      });
      
      console.log('✅ Production meta tags added');
    },
    
    // Setup analytics (placeholder)
    setupAnalytics: function() {
      // Add Google Analytics or other analytics here
      console.log('ℹ️ Analytics setup (placeholder)');
    },
    
    // Add version info
    addVersionInfo: function() {
      const version = '2.0.0';
      const buildDate = new Date().toISOString();
      
      window.GAME_VERSION = version;
      window.BUILD_DATE = buildDate;
      
      console.log(`📦 Version: ${version} | Built: ${buildDate}`);
    },
    
    // Show deployment notification
    showDeploymentNotification: function() {
      if (window.PWA && window.PWA.showInstallSuccess) {
        window.PWA.showInstallSuccess('RPG Adventure is ready! Your adventure awaits.');
      }
    }
  };
  
  // Auto-initialize deployment when ready
  function initDeployment() {
    // Wait for game to be fully loaded
    setTimeout(() => {
      DeploymentManager.init();
    }, 3000);
  }
  
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initDeployment);
  } else {
    initDeployment();
  }
  
  // Make available globally
  window.DeploymentManager = DeploymentManager;
})();