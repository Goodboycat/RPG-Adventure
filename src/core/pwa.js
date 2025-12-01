window.FILE_MANIFEST = window.FILE_MANIFEST || [];
window.FILE_MANIFEST.push({
  name: 'src/core/pwa.js',
  exports: ['PWA', 'installPrompt'],
  dependencies: []
});

// Progressive Web App functionality
window.PWA = class PWA {
  constructor() {
    this.installPrompt = null;
    this.isInstalled = false;
    this.isStandalone = this.checkStandalone();
    
    this.init();
  }
  
  init() {
    this.setupInstallPrompt();
    this.setupAppInstallBanner();
    this.handleVisibilityChange();
    this.setupBeforeInstallPrompt();
    this.detectInstallSource();
  }
  
  // Check if app is running in standalone mode
  checkStandalone() {
    return (
      window.matchMedia('(display-mode: standalone)').matches ||
      window.navigator.standalone === true ||
      document.referrer.includes('android-app://')
    );
  }
  
  // Setup install prompt for PWA installation
  setupInstallPrompt() {
    window.addEventListener('beforeinstallprompt', (event) => {
      // Prevent the mini-infobar from appearing on mobile
      event.preventDefault();
      
      // Stash the event so it can be triggered later
      window.installPrompt = event;
      
      console.log('PWA: Install prompt ready');
      
      // Show custom install banner after delay
      setTimeout(() => {
        this.showInstallBanner();
      }, 30000); // Show after 30 seconds of gameplay
    });
  }
  
  // Setup custom app install banner
  setupAppInstallBanner() {
    // Create install banner if not already present
    if (!document.getElementById('installBanner')) {
      const banner = document.createElement('div');
      banner.id = 'installBanner';
      banner.innerHTML = `
        <div class="install-banner-content">
          <div class="install-banner-icon">
            <img src="icons/icon-192x192.png" alt="RPG Adventure" />
          </div>
          <div class="install-banner-text">
            <div class="install-banner-title">Install RPG Adventure</div>
            <div class="install-banner-subtitle">Play offline and get the full experience</div>
          </div>
          <div class="install-banner-actions">
            <button id="installBtn" class="install-button-primary">Install</button>
            <button id="installDismiss" class="install-button-secondary">Not now</button>
          </div>
        </div>
      `;
      
      // Add banner styles
      const style = document.createElement('style');
      style.textContent = `
        #installBanner {
          position: fixed;
          bottom: -100px;
          left: 0;
          right: 0;
          background: linear-gradient(135deg, rgba(16, 18, 24, 0.95) 0%, rgba(32, 36, 48, 0.95) 100%);
          backdrop-filter: blur(20px);
          border-top: 1px solid rgba(255, 255, 255, 0.1);
          padding: 16px;
          z-index: 10001;
          transition: bottom 0.3s ease-out;
          box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.3);
        }
        
        #installBanner.show {
          bottom: 0;
        }
        
        .install-banner-content {
          display: flex;
          align-items: center;
          gap: 16px;
          max-width: 600px;
          margin: 0 auto;
        }
        
        .install-banner-icon img {
          width: 48px;
          height: 48px;
          border-radius: 12px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
        }
        
        .install-banner-text {
          flex: 1;
        }
        
        .install-banner-title {
          color: #fff;
          font-family: 'Courier New', monospace;
          font-size: 16px;
          font-weight: bold;
          margin-bottom: 4px;
        }
        
        .install-banner-subtitle {
          color: #aaa;
          font-family: 'Courier New', monospace;
          font-size: 13px;
        }
        
        .install-banner-actions {
          display: flex;
          gap: 8px;
        }
        
        .install-button-primary {
          background: linear-gradient(135deg, #4a90e2, #63b3ed);
          color: white;
          border: none;
          padding: 10px 20px;
          border-radius: 8px;
          font-family: 'Courier New', monospace;
          font-size: 14px;
          font-weight: bold;
          cursor: pointer;
          transition: all 0.2s ease;
          box-shadow: 0 2px 8px rgba(74, 144, 226, 0.3);
        }
        
        .install-button-primary:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(74, 144, 226, 0.4);
        }
        
        .install-button-primary:active {
          transform: translateY(0);
        }
        
        .install-button-secondary {
          background: transparent;
          color: #aaa;
          border: 1px solid rgba(255, 255, 255, 0.2);
          padding: 10px 16px;
          border-radius: 8px;
          font-family: 'Courier New', monospace;
          font-size: 14px;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        
        .install-button-secondary:hover {
          color: #fff;
          border-color: rgba(255, 255, 255, 0.3);
        }
        
        /* Mobile adjustments */
        @media (max-width: 480px) {
          .install-banner-content {
            gap: 12px;
            padding: 0 8px;
          }
          
          .install-banner-icon img {
            width: 40px;
            height: 40px;
          }
          
          .install-banner-title {
            font-size: 14px;
          }
          
          .install-banner-subtitle {
            font-size: 12px;
          }
          
          .install-button-primary {
            padding: 8px 16px;
            font-size: 13px;
          }
          
          .install-button-secondary {
            padding: 8px 12px;
            font-size: 13px;
          }
        }
        
        /* Landscape mobile adjustments */
        @media (orientation: landscape) and (max-height: 500px) {
          #installBanner {
            padding: 12px;
          }
          
          .install-banner-content {
            gap: 12px;
          }
          
          .install-banner-icon img {
            width: 36px;
            height: 36px;
          }
          
          .install-banner-title {
            font-size: 14px;
            margin-bottom: 2px;
          }
          
          .install-banner-subtitle {
            font-size: 11px;
          }
          
          .install-button-primary,
          .install-button-secondary {
            padding: 6px 12px;
            font-size: 12px;
          }
        }
      `;
      
      document.head.appendChild(style);
      document.body.appendChild(banner);
      
      // Setup banner button handlers
      this.setupBannerHandlers();
    }
  }
  
  // Setup install banner button handlers
  setupBannerHandlers() {
    const installBtn = document.getElementById('installBtn');
    const installDismiss = document.getElementById('installDismiss');
    const installBanner = document.getElementById('installBanner');
    
    if (installBtn) {
      installBtn.addEventListener('click', () => {
        this.promptInstall();
        this.hideInstallBanner();
      });
    }
    
    if (installDismiss) {
      installDismiss.addEventListener('click', () => {
        this.hideInstallBanner();
        // Don't show again for this session
        localStorage.setItem('installBannerDismissed', Date.now());
      });
    }
  }
  
  // Show install banner
  showInstallBanner() {
    // Check if user has dismissed recently
    const dismissedTime = localStorage.getItem('installBannerDismissed');
    if (dismissedTime && Date.now() - parseInt(dismissedTime) < 86400000) { // 24 hours
      return;
    }
    
    // Don't show if already installed or in standalone mode
    if (this.isInstalled || this.isStandalone) {
      return;
    }
    
    const banner = document.getElementById('installBanner');
    if (banner) {
      banner.classList.add('show');
    }
  }
  
  // Hide install banner
  hideInstallBanner() {
    const banner = document.getElementById('installBanner');
    if (banner) {
      banner.classList.remove('show');
    }
  }
  
  // Prompt for PWA installation
  async promptInstall() {
    if (!window.installPrompt) {
      console.log('PWA: Install prompt not available');
      return;
    }
    
    try {
      const result = await window.installPrompt.prompt();
      console.log('PWA: Install prompt result:', result);
      
      // Clear the prompt
      window.installPrompt = null;
      
      // Track installation outcome
      if (result.outcome === 'accepted') {
        console.log('PWA: User accepted install prompt');
        this.isInstalled = true;
        this.hideInstallBanner();
      } else {
        console.log('PWA: User dismissed install prompt');
      }
    } catch (error) {
      console.error('PWA: Error during install prompt:', error);
    }
  }
  
  // Setup before install prompt handling
  setupBeforeInstallPrompt() {
    window.addEventListener('appinstalled', () => {
      console.log('PWA: App was installed');
      this.isInstalled = true;
      this.hideInstallBanner();
      
      // Show success message
      this.showInstallSuccess();
    });
  }
  
  // Show install success message
  showInstallSuccess() {
    const successMessage = document.createElement('div');
    successMessage.innerHTML = `
      <div class="install-success">
        <div class="install-success-content">
          <div class="install-success-icon">✓</div>
          <div class="install-success-text">RPG Adventure installed successfully!</div>
        </div>
      </div>
    `;
    
    const style = document.createElement('style');
    style.textContent = `
      .install-success {
        position: fixed;
        top: 20px;
        left: 50%;
        transform: translateX(-50%);
        background: linear-gradient(135deg, rgba(74, 144, 226, 0.9), rgba(99, 179, 237, 0.9));
        color: white;
        padding: 16px 24px;
        border-radius: 12px;
        font-family: 'Courier New', monospace;
        font-size: 14px;
        font-weight: bold;
        z-index: 10002;
        box-shadow: 0 4px 20px rgba(74, 144, 226, 0.3);
        animation: slideDown 0.3s ease-out;
      }
      
      .install-success-content {
        display: flex;
        align-items: center;
        gap: 12px;
      }
      
      .install-success-icon {
        font-size: 18px;
        font-weight: bold;
      }
      
      @keyframes slideDown {
        from {
          opacity: 0;
          transform: translateX(-50%) translateY(-20px);
        }
        to {
          opacity: 1;
          transform: translateX(-50%) translateY(0);
        }
      }
    `;
    
    document.head.appendChild(style);
    document.body.appendChild(successMessage);
    
    // Remove after 3 seconds
    setTimeout(() => {
      successMessage.remove();
      style.remove();
    }, 3000);
  }
  
  // Handle page visibility changes
  handleVisibilityChange() {
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) {
        // Page became visible again
        this.checkForUpdates();
      }
    });
  }
  
  // Check for app updates
  async checkForUpdates() {
    if ('serviceWorker' in navigator) {
      const registration = await navigator.serviceWorker.ready;
      
      if (registration.waiting) {
        // New version is available
        this.showUpdateBanner();
      }
    }
  }
  
  // Show update banner
  showUpdateBanner() {
    const updateBanner = document.createElement('div');
    updateBanner.id = 'updateBanner';
    updateBanner.innerHTML = `
      <div class="update-banner-content">
        <div class="update-banner-text">
          <div class="update-banner-title">Update Available</div>
          <div class="update-banner-subtitle">A new version of RPG Adventure is ready</div>
        </div>
        <div class="update-banner-actions">
          <button id="updateBtn" class="update-button">Update</button>
          <button id="updateDismiss" class="update-dismiss">Later</button>
        </div>
      </div>
    `;
    
    const style = document.createElement('style');
    style.textContent = `
      #updateBanner {
        position: fixed;
        top: -100px;
        left: 0;
        right: 0;
        background: linear-gradient(135deg, rgba(16, 18, 24, 0.95) 0%, rgba(32, 36, 48, 0.95) 100%);
        backdrop-filter: blur(20px);
        border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        padding: 16px;
        z-index: 10001;
        transition: top 0.3s ease-out;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
      }
      
      #updateBanner.show {
        top: 0;
      }
      
      .update-banner-content {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 16px;
        max-width: 600px;
        margin: 0 auto;
      }
      
      .update-banner-text {
        flex: 1;
      }
      
      .update-banner-title {
        color: #fff;
        font-family: 'Courier New', monospace;
        font-size: 16px;
        font-weight: bold;
        margin-bottom: 4px;
      }
      
      .update-banner-subtitle {
        color: #aaa;
        font-family: 'Courier New', monospace;
        font-size: 13px;
      }
      
      .update-banner-actions {
        display: flex;
        gap: 8px;
      }
      
      .update-button {
        background: linear-gradient(135deg, #e74c3c, #c0392b);
        color: white;
        border: none;
        padding: 10px 20px;
        border-radius: 8px;
        font-family: 'Courier New', monospace;
        font-size: 14px;
        font-weight: bold;
        cursor: pointer;
        transition: all 0.2s ease;
        box-shadow: 0 2px 8px rgba(231, 76, 60, 0.3);
      }
      
      .update-button:hover {
        transform: translateY(-1px);
        box-shadow: 0 4px 12px rgba(231, 76, 60, 0.4);
      }
      
      .update-dismiss {
        background: transparent;
        color: #aaa;
        border: 1px solid rgba(255, 255, 255, 0.2);
        padding: 10px 16px;
        border-radius: 8px;
        font-family: 'Courier New', monospace;
        font-size: 14px;
        cursor: pointer;
        transition: all 0.2s ease;
      }
      
      .update-dismiss:hover {
        color: #fff;
        border-color: rgba(255, 255, 255, 0.3);
      }
      
      /* Mobile adjustments */
      @media (max-width: 480px) {
        .update-banner-content {
          gap: 12px;
          padding: 0 8px;
        }
        
        .update-banner-title {
          font-size: 14px;
        }
        
        .update-banner-subtitle {
          font-size: 12px;
        }
        
        .update-button,
        .update-dismiss {
          padding: 8px 16px;
          font-size: 13px;
        }
      }
    `;
    
    document.head.appendChild(style);
    document.body.appendChild(updateBanner);
    
    // Setup update handlers
    document.getElementById('updateBtn').addEventListener('click', () => {
      this.applyUpdate();
    });
    
    document.getElementById('updateDismiss').addEventListener('click', () => {
      updateBanner.classList.remove('show');
    });
    
    // Show banner after delay
    setTimeout(() => {
      updateBanner.classList.add('show');
    }, 1000);
  }
  
  // Apply update
  async applyUpdate() {
    if ('serviceWorker' in navigator) {
      const registration = await navigator.serviceWorker.ready;
      if (registration.waiting) {
        // Tell the waiting service worker to skip waiting
        registration.waiting.postMessage({ type: 'SKIP_WAITING' });
        
        // Reload the page to get the new version
        window.location.reload();
      }
    }
  }
  
  // Detect how the app was installed
  detectInstallSource() {
    const urlParams = new URLSearchParams(window.location.search);
    const source = urlParams.get('source');
    
    if (source) {
      console.log('PWA: Install source detected:', source);
      localStorage.setItem('installSource', source);
    }
  }
  
  // Get app installation info
  getInstallInfo() {
    return {
      isInstalled: this.isInstalled,
      isStandalone: this.isStandalone,
      installSource: localStorage.getItem('installSource') || 'unknown',
      platform: navigator.platform,
      userAgent: navigator.userAgent
    };
  }
  
  // Request fullscreen for immersive experience
  async requestFullscreen() {
    try {
      const element = document.documentElement;
      
      if (element.requestFullscreen) {
        await element.requestFullscreen();
      } else if (element.webkitRequestFullscreen) {
        await element.webkitRequestFullscreen();
      } else if (element.msRequestFullscreen) {
        await element.msRequestFullscreen();
      }
      
      console.log('PWA: Fullscreen mode activated');
    } catch (error) {
      console.error('PWA: Failed to enter fullscreen:', error);
    }
  }
  
  // Exit fullscreen
  async exitFullscreen() {
    try {
      if (document.exitFullscreen) {
        await document.exitFullscreen();
      } else if (document.webkitExitFullscreen) {
        await document.webkitExitFullscreen();
      } else if (document.msExitFullscreen) {
        await document.msExitFullscreen();
      }
      
      console.log('PWA: Exited fullscreen mode');
    } catch (error) {
      console.error('PWA: Failed to exit fullscreen:', error);
    }
  }
  
  // Handle orientation changes for fullscreen
  handleOrientationChange() {
    window.addEventListener('orientationchange', () => {
      setTimeout(() => {
        // Re-request fullscreen after orientation change
        if (document.fullscreenElement) {
          console.log('PWA: Orientation changed, maintaining fullscreen');
        }
      }, 100);
    });
  }
};

// Initialize PWA functionality
window.installPrompt = null;

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    window.PWA = new window.PWA();
  });
} else {
  window.PWA = new window.PWA();
}