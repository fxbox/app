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

  if (obj && obj.message) {
    notifyClient(obj)
      .then(() => {
        showNotification(obj, evt);
      });
  } else {
    console.log('Discarding notification: ' + JSON.stringify(obj));
  }
});

self.addEventListener('pushsubscriptionchange', function(evt) {
  console.log('Got subscription change event ', evt);
});

self.addEventListener('notificationclick', function(evt) {
  evt.notification.close();
  evt.waitUntil(clients.matchAll({
    type: "window"
  }).then(function(clients) {
    clients.forEach((client) => {
      if ('focus' in client) {
        client.focus();
      }
    });
  }));
});

/**
 * Notify the foxlink library of the message received via push.
 * This will notify all the windows/tabs opened with the app.
 * @param {object} obj Payload coming from the push notification
 */
function notifyClient(obj) {
  return self.clients.matchAll()
    .then((clients) => {
      clients.forEach((client) => {
        client.postMessage(obj);
      });
    });
}

/**
 * Displays a notification based on the data coming from the
 * push.
 * @param {object} obj Payload coming from the push notification
 * @param {event} evt Original event generated
 * @return {Promise} Promise resolved once the notification is showed
 */
function showNotification(obj, evt) {
  var title = 'Link: Notification';
  var body = obj.message;
  var icon = 'img/icon.svg';
  var tag = obj.resource || obj.tag || 'link-push';

  return evt.waitUntil(self.registration.showNotification(title, {
    body: body,
    icon: icon,
    tag: tag
  }));
}
