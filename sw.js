const CACHE_VERSION = '2.0.0';
const CACHE_NAME = `rpg-adventure-v${CACHE_VERSION}`;
const STATIC_CACHE = `rpg-static-v${CACHE_VERSION}`;
const GAME_CACHE = `rpg-game-v${CACHE_VERSION}`;
const ASSETS_CACHE = `rpg-assets-v${CACHE_VERSION}`;

// Core files that need to be cached for offline functionality
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/style.css',
  '/manifest.json',
  '/src/utils/math.js',
  '/src/core/mobile.js',
  '/src/core/input.js',
  '/src/core/touch-controls.js',
  '/src/core/scene.js',
  '/src/core/loop.js',
  '/src/core/pwa.js',
  '/src/engine/renderer.js',
  '/src/engine/tilemap.js',
  '/src/engine/effects.js',
  '/src/game/ui.js',
  '/src/game/inventory.js',
  '/src/game/enemies.js',
  '/src/game/player.js',
  '/src/game/overworld.js',
  '/src/game/battle.js',
  '/src/game/town.js',
  '/src/game/main.js'
];

// App icons and assets
const ICON_ASSETS = [
  '/icons/icon-32x32.svg',
  '/icons/icon-192x192.svg',
  '/icons/icon-512x512.svg',
  '/icons/new-game.svg',
  '/icons/continue.svg',
  '/icons/explore.svg',
  '/icons/dismiss.svg'
];

// Install event - cache static assets
self.addEventListener('install', event => {
  console.log('SW: Install event - version', CACHE_VERSION);
  
  event.waitUntil(
    Promise.all([
      // Cache static assets
      caches.open(STATIC_CACHE)
        .then(cache => {
          console.log('SW: Caching static assets');
          return cache.addAll(STATIC_ASSETS);
        }),
      // Cache icons
      caches.open(ASSETS_CACHE)
        .then(cache => {
          console.log('SW: Caching icon assets');
          return cache.addAll(ICON_ASSETS);
        })
    ])
      .then(() => {
        console.log('SW: All assets cached successfully');
        return self.skipWaiting();
      })
      .catch(error => {
        console.error('SW: Failed to cache assets:', error);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
  console.log('SW: Activate event - version', CACHE_VERSION);
  
  event.waitUntil(
    caches.keys()
      .then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => {
            // Delete old caches that don't match current version
            if (!cacheName.includes(CACHE_VERSION)) {
              console.log('SW: Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('SW: Activation complete - version', CACHE_VERSION);
        return self.clients.claim();
      })
      .then(() => {
        // Notify all clients that the service worker is ready
        return self.clients.matchAll().then(clients => {
          clients.forEach(client => {
            client.postMessage({
              type: 'SW_ACTIVATED',
              version: CACHE_VERSION
            });
          });
        });
      })
  );
});

// Fetch event - serve from cache when offline with network-first strategy for dynamic content
self.addEventListener('fetch', event => {
  const { request } = event;
  
  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }
  
  // Handle different types of requests
  if (request.url.includes('icons/') || request.url.includes('screenshots/')) {
    // Cache-first for icons and screenshots
    event.respondWith(cacheFirst(request, ASSETS_CACHE));
  } else if (STATIC_ASSETS.some(asset => request.url.endsWith(asset.split('/').pop()))) {
    // Cache-first for static game assets
    event.respondWith(cacheFirst(request, STATIC_CACHE));
  } else if (request.url.startsWith(self.location.origin)) {
    // Network-first for game content (HTML, JS files)
    event.respondWith(networkFirst(request, GAME_CACHE));
  } else {
    // Skip external requests
    return;
  }
});

// Cache-first strategy
async function cacheFirst(request, cacheName) {
  try {
    const cachedResponse = await caches.match(request);
    
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // If not in cache, fetch from network and cache
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.error('SW: Cache-first failed:', error);
    
    // Return fallback for images
    if (request.url.match(/\.(png|jpg|jpeg|gif|webp)$/)) {
      return new Response('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIiIGhlaWdodD0iMzIiIHZpZXdCb3g9IjAgMCAzMiAzMiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjMyIiBoZWlnaHQ9IjMyIiBmaWxsPSIjMzMzIi8+CjxwYXRoIGQ9Ik04IDE2SDE2VjI0SDhWMTZaIiBmaWxsPSIjNjY2Ii8+CjxwYXRoIGQ9Ik0xNiA4SDI0VjE2SDE2VjhaIiBmaWxsPSIjNjY2Ii8+Cjwvc3ZnPgo=', {
        headers: { 'Content-Type': 'image/svg+xml' }
      });
    }
    
    throw error;
  }
}

// Network-first strategy
async function networkFirst(request, cacheName) {
  try {
    const networkResponse = await fetch(request);
    
    // Cache successful responses
    if (networkResponse.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.log('SW: Network failed, trying cache:', request.url);
    
    // Try to serve from cache
    const cachedResponse = await caches.match(request);
    
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // For HTML requests, serve the main app
    if (request.headers.get('accept').includes('text/html')) {
      const mainPage = await caches.match('/index.html');
      if (mainPage) {
        return mainPage;
      }
    }
    
    // Return offline page for other requests
    return new Response(createOfflinePage(request.url), {
      status: 503,
      statusText: 'Service Unavailable',
      headers: {
        'Content-Type': 'text/html',
        'Cache-Control': 'no-cache'
      }
    });
  }
}

// Create offline page
function createOfflinePage(requestedUrl) {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Offline - RPG Adventure</title>
      <style>
        body {
          background: #000;
          color: #fff;
          font-family: 'Courier New', monospace;
          display: flex;
          justify-content: center;
          align-items: center;
          min-height: 100vh;
          margin: 0;
          padding: 20px;
          text-align: center;
        }
        .offline-container {
          max-width: 400px;
        }
        .offline-icon {
          font-size: 64px;
          margin-bottom: 20px;
          opacity: 0.5;
        }
        .offline-title {
          font-size: 24px;
          margin-bottom: 16px;
          color: #4a90e2;
        }
        .offline-text {
          font-size: 14px;
          color: #aaa;
          line-height: 1.5;
          margin-bottom: 24px;
        }
        .retry-button {
          background: linear-gradient(135deg, #4a90e2, #63b3ed);
          color: white;
          border: none;
          padding: 12px 24px;
          border-radius: 8px;
          font-family: 'Courier New', monospace;
          font-size: 14px;
          font-weight: bold;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .retry-button:hover {
          transform: translateY(-1px);
        }
      </style>
    </head>
    <body>
      <div class="offline-container">
        <div class="offline-icon">📱</div>
        <h1 class="offline-title">You're Offline</h1>
        <p class="offline-text">
          RPG Adventure requires an internet connection for the first time. 
          Once loaded, you can play offline.
        </p>
        <button class="retry-button" onclick="window.location.reload()">
          Try Again
        </button>
      </div>
    </body>
    </html>
  `;
}

// Background sync for game saves
self.addEventListener('sync', event => {
  console.log('SW: Background sync event:', event.tag);
  
  if (event.tag === 'game-save') {
    event.waitUntil(syncGameSave());
  } else if (event.tag === 'game-update') {
    event.waitUntil(checkForUpdates());
  }
});

// Sync game saves to server
async function syncGameSave() {
  try {
    // Get all game save data from IndexedDB
    const saveData = await getPendingSaves();
    
    if (saveData.length > 0) {
      console.log(`SW: Syncing ${saveData.length} game saves`);
      
      for (const save of saveData) {
        try {
          // Send to cloud storage (placeholder)
          await uploadSaveToCloud(save);
          await removePendingSave(save.id);
        } catch (error) {
          console.error('SW: Failed to sync save:', error);
        }
      }
    }
  } catch (error) {
    console.error('SW: Game save sync failed:', error);
  }
}

// Check for updates
async function checkForUpdates() {
  try {
    // Check for new app version
    const response = await fetch('/manifest.json', { cache: 'no-cache' });
    
    if (response.ok) {
      const manifest = await response.json();
      console.log('SW: Latest version:', manifest.version || 'unknown');
    }
  } catch (error) {
    console.error('SW: Update check failed:', error);
  }
}

// Placeholder functions for cloud save
async function getPendingSaves() {
  // Would implement IndexedDB logic here
  return [];
}

async function uploadSaveToCloud(saveData) {
  // Would implement cloud upload logic here
  console.log('SW: Uploading save to cloud:', saveData.id);
}

async function removePendingSave(saveId) {
  // Would implement IndexedDB cleanup here
  console.log('SW: Removed pending save:', saveId);
}

// Handle push notifications
self.addEventListener('push', event => {
  console.log('SW: Push event received');
  
  const options = {
    body: event.data ? event.data.text() : 'Your adventure awaits! Come back to continue your quest.',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-32x32.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {
        action: 'explore',
        title: 'Continue Adventure',
        icon: '/icons/explore.png'
      },
      {
        action: 'dismiss',
        title: 'Later',
        icon: '/icons/dismiss.png'
      }
    ],
    requireInteraction: true,
    silent: false
  };
  
  event.waitUntil(
    self.registration.showNotification('RPG Adventure', options)
  );
});

// Handle notification clicks
self.addEventListener('notificationclick', event => {
  console.log('SW: Notification click:', event.action);
  
  event.notification.close();
  
  if (event.action === 'explore') {
    event.waitUntil(
      clients.matchAll({ type: 'window' })
        .then(clientList => {
          // Focus existing window if open
          for (const client of clientList) {
            if (client.url === '/' && 'focus' in client) {
              return client.focus();
            }
          }
          // Open new window
          if (clients.openWindow) {
            return clients.openWindow('/');
          }
        })
    );
  } else if (event.action === 'dismiss') {
    // Just close the notification
    return;
  } else {
    // Default action - open app
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});

// Handle notification close
self.addEventListener('notificationclose', event => {
  console.log('SW: Notification closed:', event.notification.data);
});

// Handle messages from clients
self.addEventListener('message', event => {
  console.log('SW: Message received:', event.data);
  
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'CACHE_UPDATE') {
    updateCache();
  }
  
  if (event.data && event.data.type === 'GET_VERSION') {
    event.ports[0].postMessage({
      type: 'VERSION_INFO',
      version: CACHE_VERSION,
      cacheName: CACHE_NAME
    });
  }
  
  if (event.data && event.data.type === 'ORIENTATION_CHANGE') {
    handleOrientationChange(event.data.orientation);
  }
});

// Force cache update for game updates
async function updateCache() {
  try {
    console.log('SW: Updating cache...');
    
    const [staticCache, assetsCache] = await Promise.all([
      caches.open(STATIC_CACHE),
      caches.open(ASSETS_CACHE)
    ]);
    
    await Promise.all([
      staticCache.addAll(STATIC_ASSETS),
      assetsCache.addAll(ICON_ASSETS)
    ]);
    
    console.log('SW: Cache updated successfully');
    
    // Notify clients
    const clients = await self.clients.matchAll();
    clients.forEach(client => {
      client.postMessage({
        type: 'CACHE_UPDATED',
        version: CACHE_VERSION
      });
    });
  } catch (error) {
    console.error('SW: Cache update failed:', error);
  }
}

// Handle orientation changes
function handleOrientationChange(orientation) {
  console.log('SW: Orientation changed to:', orientation);
  
  // Could implement orientation-specific optimizations here
  // For now, just log the change
}

// Periodic background sync for updates (if supported)
self.addEventListener('periodicsync', event => {
  if (event.tag === 'update-check') {
    event.waitUntil(checkForUpdates());
  }
});

// Cleanup old caches periodically
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (!cacheName.includes(CACHE_VERSION)) {
            console.log('SW: Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Handle network status changes
self.addEventListener('online', event => {
  console.log('SW: Client is online');
  
  // Trigger background sync when coming back online
  if ('sync' in self.registration) {
    self.registration.sync.register('game-save');
  }
});

self.addEventListener('offline', event => {
  console.log('SW: Client is offline');
});

console.log('SW: Service worker loaded - version', CACHE_VERSION);