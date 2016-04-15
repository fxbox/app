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
  var obj = evt.data ? evt.data.json() : {};
  console.log('Push received ', obj);

  if (obj && obj.message) {
    var message = JSON.parse(obj.message);
    console.log('Got the message ', message);
    evt.waitUntil(processNotification(message));
  } else {
    console.error('Notification doesnt contain a body, ignoring it: ');
  }
});

self.addEventListener('pushsubscriptionchange', function(evt) {
  console.log('Got subscription change event ', evt);
});

self.addEventListener('notificationclick', function(evt) {
  evt.notification.close();
  evt.waitUntil(clients.matchAll({
    type: "window"
  })
  .then(function(clients) {
    clients.forEach((client) => {
      if ('focus' in client) {
        client.focus();
      }
    });
  }));
});

function processNotification(obj) {
  return notifyClient(obj)
    .then(() => {
       return showNotification(obj);
    });
}

/**
 * Notify the foxlink library of the message received via push.
 * This will notify all the windows/tabs opened with the app.
 *
 * @param {Object} obj Payload coming from the push notification
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
 *
 * @param {object} obj Payload coming from the push notification
 * @return {Promise} Promise resolved once the notification is showed
 */
function showNotification(obj) {
  var title = 'Link: Notification';
  var body = obj.message;
  var icon = 'img/icon.svg';
  var tag = obj.resource || obj.tag || 'link-push';

  return self.registration.showNotification(title, {
    body: body,
    icon: icon,
    tag: tag
  });
}
