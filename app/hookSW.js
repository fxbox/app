/**
 * This file will be appended in the automatic generation of the offline
 * cache.
 * We can use the SWW library, or directly write vanilla ServiceWorker
 * code.
 * We will have a variable defined, worker, that is an instance of
 * ServiceWorkerWare uninitialized.
 */

/* global worker */

// In our case we will write vanilla ServiceWorker code

self.addEventListener('push', function(evt) {
  console.log('Push received ', JSON.stringify(evt.data));
  var obj = evt.data ? evt.data.json() : {};

  if (obj && obj.body) {
    showNotification(obj, evt);
  } else {
    console.log('Discarding notification');
  }
});

self.addEventListener('pushsubscriptionchange', function(evt) {
  console.log('Got subscription change event ', evt);
});

function showNotification(obj, evt) {
  var title = 'Link: Notification';
  var body = obj.body;
  var icon = 'img/icons/128.png';
  var tag = 'link-push';

  evt.waitUntil(self.registration.showNotification(title, {
    body: body,
    icon: icon,
    tag: tag
  }));
}