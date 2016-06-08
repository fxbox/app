/**
 * This file will be appended in the automatic generation of the offline
 * cache.
 * We can use the SWW library, or directly write vanilla ServiceWorker
 * code.
 * We will have a variable defined, worker, that is an instance of
 * ServiceWorkerWare uninitialized.
 */

/* eslint-env serviceworker */

// In our case we will write vanilla ServiceWorker code

self.addEventListener('push', (evt) => {
  const obj = evt.data ? evt.data.json() : {};
  console.log('Push received ', obj);

  if (obj && obj.message) {
    const message = JSON.parse(obj.message);
    console.log('Got the message ', message);
    evt.waitUntil(processNotification(message));
  } else {
    console.error('Notification doesnt contain a body, ignoring it: ');
  }
});

self.addEventListener('pushsubscriptionchange', (evt) => {
  console.log('Got subscription change event ', evt);
});

self.addEventListener('notificationclick', (evt) => {
  evt.notification.close();
  evt.waitUntil(
    self.clients.matchAll({ type: 'window' })
      .then((clients) => {
        clients.forEach((client) => {
          if ('focus' in client) {
            client.focus();
          }
        });
      })
  );
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
 * @param {Object} obj Payload coming from the push notification.
 * @return {Promise}
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
 * @param {Object} obj Payload coming from the push notification.
 * @return {Promise} Promise resolved once the notification is showed.
 */
function showNotification(obj) {
  const title = 'Link: Notification';
  const body = obj.message;
  const icon = 'img/icons/512.png';
  const tag = obj.resource || obj.tag || 'link-push';

  return self.registration.showNotification(title, {
    body,
    icon,
    tag,
  });
}
