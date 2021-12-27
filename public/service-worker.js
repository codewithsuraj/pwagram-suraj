importScripts('workbox-sw.prod.v2.1.3.js');
importScripts('/src/js/idb.min.js')
importScripts('/src/js/utility.min.js')

const workboxSW = new self.WorkboxSW();

workboxSW.router.registerRoute(/.*(?:googleapis|gstatic)\.com.*$/, workboxSW.strategies.staleWhileRevalidate({
    cacheName: 'google-fonts',
    cacheExpiration: {
        maxEntries: 3,
        maxAgeSeconds: 60 * 60 * 24 * 30
    }
}));

workboxSW.router.registerRoute("https://cdnjs.cloudflare.com/ajax/libs/material-design-lite/1.3.0/material.indigo-pink.min.css", workboxSW.strategies.staleWhileRevalidate({
    cacheName: 'material-css'
}));

// workboxSW.router.registerRoute(/.*(?:firebasestorage\.googleapis)\.com.*$/, workboxSW.strategies.staleWhileRevalidate({
//     cacheName: 'post-images'
// }));

workboxSW.router.registerRoute(_apiBaseUrl + '/posts/', (args) => {
    return fetch(args.event.request)
        .then((res) => {
            var clonedRes = res.clone();
            clearAllData('posts')
                .then(() => {
                    return clonedRes.json()
                }).then((data) => {
                    for (var key in data) {
                        writeData('posts', data[key])
                    }
                })
            return res
        })
});

workboxSW.router.registerRoute((routeData) => {
    return (routeData.event.request.headers.get('accept').includes('text/html'))
}, (args) => {
    return caches.match(args.event.request)
        .then(function (response) {
            if (response) {
                return response;
            } else {
                return fetch(args.event.request)
                    .then(function (res) {
                        return caches.open('dynamic')
                            .then(function (cache) {
                                cache.put(args.event.request.url, res.clone());
                                return res;
                            })
                    })
                    .catch(function (err) {
                        return caches.match('/offline.html')
                            .then(function (res) {
                                return res;
                            });
                    });
            }
        })
});

workboxSW.precache([
  {
    "url": "favicon.ico",
    "revision": "2cab47d9e04d664d93c8d91aec59e812"
  },
  {
    "url": "index.html",
    "revision": "1f80ceccab4d5490c59ab2eeeb0c9569"
  },
  {
    "url": "manifest.json",
    "revision": "d11c7965f5cfba711c8e74afa6c703d7"
  },
  {
    "url": "offline.html",
    "revision": "45352e71a80a5c75d25e226e7330871b"
  },
  {
    "url": "src/css/app.css",
    "revision": "6d09f74487baae2843eb6b8983064f6f"
  },
  {
    "url": "src/css/feed.css",
    "revision": "959fd92824005d1ecbd17e5f2b4a4046"
  },
  {
    "url": "src/css/help.css",
    "revision": "1c6d81b27c9d423bece9869b07a7bd73"
  },
  {
    "url": "src/js/material.min.js.map",
    "revision": "3817e20bd704457b5e74a39596a40d3e"
  },
  {
    "url": "workbox-sw.prod.v2.1.3.js.map",
    "revision": "1cbd1bf8f8f05f7504355e0f7674b67e"
  },
  {
    "url": "src/images/main-image-lg.jpg",
    "revision": "31b19bffae4ea13ca0f2178ddb639403"
  },
  {
    "url": "src/images/main-image-sm.jpg",
    "revision": "c6bb733c2f39c60e3c139f814d2d14bb"
  },
  {
    "url": "src/images/main-image.jpg",
    "revision": "5c66d091b0dc200e8e89e56c589821fb"
  },
  {
    "url": "src/images/sf-boat.jpg",
    "revision": "0f282d64b0fb306daf12050e812d6a19"
  },
  {
    "url": "src/js/app.min.js",
    "revision": "31a13eb4717bfcb63bb5b6833c20ff4b"
  },
  {
    "url": "src/js/feed.min.js",
    "revision": "620ff4f47f3f2c38f0522edf848333eb"
  },
  {
    "url": "src/js/fetch.min.js",
    "revision": "d32864ad91e53425397226bd2bab6729"
  },
  {
    "url": "src/js/idb.min.js",
    "revision": "741857752710b399a90d31d1d249f8d8"
  },
  {
    "url": "src/js/material.min.js",
    "revision": "713af0c6ce93dbbce2f00bf0a98d0541"
  },
  {
    "url": "src/js/promise.min.js",
    "revision": "1aa3981e1dca61086f377068aeb5e5e1"
  },
  {
    "url": "src/js/utility.min.js",
    "revision": "9bae712bdbf6391045d77bcda374dbb8"
  }
]);

self.addEventListener('sync', (event) => {
    console.log('[Service Worker] Background syncing', event);

    if (event.tag == 'sync-new-post') {
        console.log('[Service Worker] Syncing new Posts');
        event.waitUntil(
            readAllData('sync-posts')
                .then((data) => {
                    for (var dt of data) {
                        var postData = new FormData();
                        postData.append('id', dt.id);
                        postData.append('title', dt.title);
                        postData.append('location', dt.location);
                        postData.append('rawLocationLat', dt.rawLocation.lat);
                        postData.append('rawLocationLng', dt.rawLocation.lng);
                        postData.append('file', dt.picture, dt.id + '.png');

                        fetch(_apiBaseUrl + '/posts/', {
                            method: 'POST',
                            body: postData
                        }).then((res) => {
                            console.log('Sent data', res);
                            if (res.ok) {
                                res.json()
                                    .then(function (resData) {
                                        deleteItemFromData('sync-posts', resData.id);
                                    });
                            }
                        }).catch((err) => {
                            console.log('Error while sending data', err);
                        })
                    }

                })
        )
    }
})

self.addEventListener('notificationclick', (event) => {
    var notification = event.notification;
    var action = event.action

    console.log(notification);

    if (action === 'confirm') {
        console.log('Confirm was chosen');
        notification.close();
    } else {
        console.log(action);
        event.waitUntil(
            clients.matchAll()
                .then((clis) => {
                    var client = clis.find((c) => {
                        return c.visibilityState === 'visible'
                    })

                    if (client !== undefined) {
                        client.navigate(notification.data.url);
                        client.focus();
                    } else {
                        client.openWindow(notification.data.url)
                    }
                    notification.close();
                })
        )
    }
})

self.addEventListener('notificationclose', (event) => {
    console.log('Notification was closed ', event);
})

self.addEventListener('push', (event) => {
    console.log('Push Notification received', event);

    var data = { title: 'New!', content: 'Something new happened!', openUrl: '/' }

    if (event.data) {
        data = JSON.parse(event.data.text());
    }

    var options = {
        body: data.content,
        icon: '/src/images/icons/app-icon-96x96.png',
        badge: '/src/images/icons/app-icon-96x96.png',
        data: {
            url: data.openUrl
        }
    }

    event.waitUntil(
        self.registration.showNotification(data.title, options)
    );
})