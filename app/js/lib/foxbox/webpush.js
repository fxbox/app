'use strict';

// Private members
const p = Object.freeze({
  // Properties,
  net: Symbol('net'),
  settings: Symbol('settings'),

  // Methods:
  listenForMessages: Symbol('listenForMessages'),
  dispatchEvent: Symbol('dispatchEvent'),
});

export default class WebPush {
  constructor(network, settings, callback) {
    this[p.net] = network;
    this[p.settings] = settings;
    this[p.dispatchEvent] = callback;

    Object.seal(this);
  }

  subscribeToNotifications(resubscribe = false) {
    const settings = this[p.settings];
    const boxPath =
      `${this[p.net].origin}/api/v${settings.apiVersion}`;

    if (!navigator.serviceWorker) {
      return Promise.reject('No service worker supported');
    }

    navigator.serviceWorker.addEventListener('message',
      this[p.listenForMessages].bind(this));

    if (settings.pushEndpoint && settings.pushPubKey && !resubscribe) {
      return Promise.resolve();
    }

    return navigator.serviceWorker.ready
      .then((reg) => {
        reg.pushManager.subscribe({userVisibleOnly: true})
      .then((subscription) => {
        const endpoint = subscription.endpoint;
        const key = subscription.getKey ? subscription.getKey('p256dh') : '';
        settings.pushEndpoint = endpoint;
        settings.pushPubKey = btoa(String.fromCharCode.apply(null,
          new Uint8Array(key)));

        // Send push information to the server
        // @todo: We will need some library to write taxonomy messages
        const pushConfigurationMsg = [[
            [{
              id: 'setter:subscribe.webpush@link.mozilla.org',
            }], {
              Json: {
                subscriptions: [{
                  public_key: settings.pushPubKey,
                  push_uri: settings.pushEndpoint,
                }],
              },
            },
          ]];

        return this[p.net].fetchJSON(`${boxPath}/channels/set`,
          'PUT', pushConfigurationMsg)
        .then(() => {
          // Setup some common push resources
          const pushResourcesMsg = [[
              [{
                id: 'setter:resource.webpush@link.mozilla.org',
              }], {
                Json: {
                  resources: ['res1'],
                },
              },
            ]];
          return this[p.net].fetchJSON(`${boxPath}/channels/set`,
           'PUT', pushResourcesMsg);
        });
      })
      .catch((error) => {
        if (Notification.permission === 'denied') {
          throw 'Permission request was denied.';
        } else {
          console.error('Error while saving subscription ', error);
          throw 'Subscription error: ' + error;
        }
      });
    });
  }

  [p.listenForMessages](evt) {
    const msg = evt.data || {};

    if (!msg.action) {
      return;
    }

    this[p.dispatchEvent](msg);
  }
}
