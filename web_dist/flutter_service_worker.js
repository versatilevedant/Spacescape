'use strict';
const MANIFEST = 'flutter-app-manifest';
const TEMP = 'flutter-temp-cache';
const CACHE_NAME = 'flutter-app-cache';
const RESOURCES = {
  "assets/AssetManifest.json": "528df41a48f56a669ceb5fe5e7ca422b",
"assets/assets/audio/9.-Space-Invaders.ogg": "421abb1f7f022f447b7094b0e21de7bf",
"assets/assets/audio/laser1.ogg": "5f78bb9295b713822b54fdf8a9757c68",
"assets/assets/audio/laserSmall_001.ogg": "c457887d5ce38f76eeb046798ed4007f",
"assets/assets/audio/powerUp6.ogg": "0f918c50021cbf1e17e8c9a74426b6c7",
"assets/assets/fonts/BungeeInline/BungeeInline-Regular.ttf": "b5db0222ce5354b7eb01874198685d71",
"assets/assets/images/freeze.png": "81a43a868c5333621bf1f1d17e921c53",
"assets/assets/images/icon_plusSmall.png": "c99a3838b059d914f8a87189187d8378",
"assets/assets/images/multi_fire.png": "6b846707b372079a4871e8ac14425ea4",
"assets/assets/images/nuke.png": "e927ed65e2d664e6789acb3988a534c6",
"assets/assets/images/ship_A.png": "b1edcfb82c9195cc8bf944fd6211e357",
"assets/assets/images/ship_B.png": "ce3f46234c1497eb50eaf2fa9368b56f",
"assets/assets/images/ship_C.png": "bf2f3d304737c51e05c92fa080b20fb0",
"assets/assets/images/ship_D.png": "b79d92dc288461b09733033babbdc96b",
"assets/assets/images/ship_E.png": "51a727a8d7f5c74d1647e39011312ac6",
"assets/assets/images/ship_F.png": "5c684f7e7a4e7f345e5f3a591638bd6e",
"assets/assets/images/ship_G.png": "3156250a6cb215c2d2b77a3a4aa98d2a",
"assets/assets/images/ship_H.png": "1e023a0b69de617989ec2baafb39df56",
"assets/assets/images/simpleSpace_tilesheet.png": "9aeb8100998a0681b6626644d69c2cd7",
"assets/assets/images/simpleSpace_tilesheet@2.png": "cb4276060e56f7c1e711d6529e8eb905",
"assets/assets/images/stars1.png": "c25761cd6cade2f6dde20d36fde8218c",
"assets/assets/images/stars2.png": "0e6a04e3e9e5a615233411e7b103e4bb",
"assets/FontManifest.json": "66decfe0364b843cd039e0e780828fb8",
"assets/fonts/MaterialIcons-Regular.otf": "95db9098c58fd6db106f1116bae85a0b",
"assets/NOTICES": "4b505d1d5aa015eaeb314e57287df315",
"assets/packages/cupertino_icons/assets/CupertinoIcons.ttf": "6d342eb68f170c97609e9da345464e5e",
"assets/shaders/ink_sparkle.frag": "47170f0c679bbde399adfea242c79443",
"canvaskit/canvaskit.js": "2bc454a691c631b07a9307ac4ca47797",
"canvaskit/canvaskit.wasm": "bf50631470eb967688cca13ee181af62",
"canvaskit/profiling/canvaskit.js": "38164e5a72bdad0faa4ce740c9b8e564",
"canvaskit/profiling/canvaskit.wasm": "95a45378b69e77af5ed2bc72b2209b94",
"favicon.png": "5dcef449791fa27946b3d35ad8803796",
"flutter.js": "f85e6fb278b0fd20c349186fb46ae36d",
"icons/Icon-192.png": "ac9a721a12bbc803b44f645561ecb1e1",
"icons/Icon-512.png": "96e752610906ba2a93c65f8abe1645f1",
"icons/Icon-maskable-192.png": "c457ef57daa1d16f64b27b786ec2ea3c",
"icons/Icon-maskable-512.png": "301a7604d45b3e739efc881eb04896ea",
"index.html": "443585a27d2e0a89876150b7e7fd0916",
"/": "443585a27d2e0a89876150b7e7fd0916",
"main.dart.js": "c969eb82ab99aafb6fdc754c128ebce8",
"manifest.json": "dad325df89cc5981181b51aa51176c68",
"version.json": "23653a0d90ff309629653e8bd7247e3f"
};

// The application shell files that are downloaded before a service worker can
// start.
const CORE = [
  "main.dart.js",
"index.html",
"assets/AssetManifest.json",
"assets/FontManifest.json"];
// During install, the TEMP cache is populated with the application shell files.
self.addEventListener("install", (event) => {
  self.skipWaiting();
  return event.waitUntil(
    caches.open(TEMP).then((cache) => {
      return cache.addAll(
        CORE.map((value) => new Request(value, {'cache': 'reload'})));
    })
  );
});

// During activate, the cache is populated with the temp files downloaded in
// install. If this service worker is upgrading from one with a saved
// MANIFEST, then use this to retain unchanged resource files.
self.addEventListener("activate", function(event) {
  return event.waitUntil(async function() {
    try {
      var contentCache = await caches.open(CACHE_NAME);
      var tempCache = await caches.open(TEMP);
      var manifestCache = await caches.open(MANIFEST);
      var manifest = await manifestCache.match('manifest');
      // When there is no prior manifest, clear the entire cache.
      if (!manifest) {
        await caches.delete(CACHE_NAME);
        contentCache = await caches.open(CACHE_NAME);
        for (var request of await tempCache.keys()) {
          var response = await tempCache.match(request);
          await contentCache.put(request, response);
        }
        await caches.delete(TEMP);
        // Save the manifest to make future upgrades efficient.
        await manifestCache.put('manifest', new Response(JSON.stringify(RESOURCES)));
        return;
      }
      var oldManifest = await manifest.json();
      var origin = self.location.origin;
      for (var request of await contentCache.keys()) {
        var key = request.url.substring(origin.length + 1);
        if (key == "") {
          key = "/";
        }
        // If a resource from the old manifest is not in the new cache, or if
        // the MD5 sum has changed, delete it. Otherwise the resource is left
        // in the cache and can be reused by the new service worker.
        if (!RESOURCES[key] || RESOURCES[key] != oldManifest[key]) {
          await contentCache.delete(request);
        }
      }
      // Populate the cache with the app shell TEMP files, potentially overwriting
      // cache files preserved above.
      for (var request of await tempCache.keys()) {
        var response = await tempCache.match(request);
        await contentCache.put(request, response);
      }
      await caches.delete(TEMP);
      // Save the manifest to make future upgrades efficient.
      await manifestCache.put('manifest', new Response(JSON.stringify(RESOURCES)));
      return;
    } catch (err) {
      // On an unhandled exception the state of the cache cannot be guaranteed.
      console.error('Failed to upgrade service worker: ' + err);
      await caches.delete(CACHE_NAME);
      await caches.delete(TEMP);
      await caches.delete(MANIFEST);
    }
  }());
});

// The fetch handler redirects requests for RESOURCE files to the service
// worker cache.
self.addEventListener("fetch", (event) => {
  if (event.request.method !== 'GET') {
    return;
  }
  var origin = self.location.origin;
  var key = event.request.url.substring(origin.length + 1);
  // Redirect URLs to the index.html
  if (key.indexOf('?v=') != -1) {
    key = key.split('?v=')[0];
  }
  if (event.request.url == origin || event.request.url.startsWith(origin + '/#') || key == '') {
    key = '/';
  }
  // If the URL is not the RESOURCE list then return to signal that the
  // browser should take over.
  if (!RESOURCES[key]) {
    return;
  }
  // If the URL is the index.html, perform an online-first request.
  if (key == '/') {
    return onlineFirst(event);
  }
  event.respondWith(caches.open(CACHE_NAME)
    .then((cache) =>  {
      return cache.match(event.request).then((response) => {
        // Either respond with the cached resource, or perform a fetch and
        // lazily populate the cache only if the resource was successfully fetched.
        return response || fetch(event.request).then((response) => {
          if (response && Boolean(response.ok)) {
            cache.put(event.request, response.clone());
          }
          return response;
        });
      })
    })
  );
});

self.addEventListener('message', (event) => {
  // SkipWaiting can be used to immediately activate a waiting service worker.
  // This will also require a page refresh triggered by the main worker.
  if (event.data === 'skipWaiting') {
    self.skipWaiting();
    return;
  }
  if (event.data === 'downloadOffline') {
    downloadOffline();
    return;
  }
});

// Download offline will check the RESOURCES for all files not in the cache
// and populate them.
async function downloadOffline() {
  var resources = [];
  var contentCache = await caches.open(CACHE_NAME);
  var currentContent = {};
  for (var request of await contentCache.keys()) {
    var key = request.url.substring(origin.length + 1);
    if (key == "") {
      key = "/";
    }
    currentContent[key] = true;
  }
  for (var resourceKey of Object.keys(RESOURCES)) {
    if (!currentContent[resourceKey]) {
      resources.push(resourceKey);
    }
  }
  return contentCache.addAll(resources);
}

// Attempt to download the resource online before falling back to
// the offline cache.
function onlineFirst(event) {
  return event.respondWith(
    fetch(event.request).then((response) => {
      return caches.open(CACHE_NAME).then((cache) => {
        cache.put(event.request, response.clone());
        return response;
      });
    }).catch((error) => {
      return caches.open(CACHE_NAME).then((cache) => {
        return cache.match(event.request).then((response) => {
          if (response != null) {
            return response;
          }
          throw error;
        });
      });
    })
  );
}
