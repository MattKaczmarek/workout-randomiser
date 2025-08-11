const CACHE_NAME = 'workout-randomiser-v3.3.5';
const urlsToCache = [
  './',
  './index.html',
  './style.css',
  './script.js',
  './manifest.json'
];

// Instalacja Service Worker - od razu przejmij kontrolę
self.addEventListener('install', function(event) {
  event.waitUntil(
    // Najpierw wyczyść wszystkie stare cache
    caches.keys().then(function(cacheNames) {
      return Promise.all(
        cacheNames.map(function(cacheName) {
          if (cacheName !== CACHE_NAME) {
            console.log('Usuwam stary cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      return caches.open(CACHE_NAME);
    }).then(function(cache) {
      console.log('Cache opened:', CACHE_NAME);
      return cache.addAll(urlsToCache);
    }).then(() => {
      // Natychmiast aktywuj nowy Service Worker
      return self.skipWaiting();
    })
  );
});

// Obsługa żądań
self.addEventListener('fetch', function(event) {
  event.respondWith(
    caches.match(event.request)
      .then(function(response) {
        // Jeśli zasób jest w cache, zwróć go
        if (response) {
          return response;
        }
        
        // W przeciwnym razie pobierz z sieci
        return fetch(event.request).then(
          function(response) {
            // Sprawdź czy odpowiedź jest prawidłowa
            if(!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }

            // Sklonuj odpowiedź
            var responseToCache = response.clone();

            caches.open(CACHE_NAME)
              .then(function(cache) {
                cache.put(event.request, responseToCache);
              });

            return response;
          }
        );
      })
      .catch(function() {
        // Jeśli nie ma połączenia i brak w cache, pokaż główną stronę
        return caches.match('./index.html');
      })
    );
});

// Aktualizacja cache - usuń stare wersje i przejmij kontrolę
self.addEventListener('activate', function(event) {
  const cacheWhitelist = [CACHE_NAME];
  
  event.waitUntil(
    caches.keys().then(function(cacheNames) {
      return Promise.all(
        cacheNames.map(function(cacheName) {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            console.log('Usuwam stary cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      // Przejmij kontrolę nad wszystkimi klientami
      return self.clients.claim();
    })
  );
});

// Powiadomienie o dostępnej aktualizacji
self.addEventListener('message', function(event) {
  if (event.data.action === 'skipWaiting') {
    self.skipWaiting();
  }
});