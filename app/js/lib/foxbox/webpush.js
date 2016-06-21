'use strict';

import EventDispatcher from './common/event-dispatcher';

// Private members
const p = Object.freeze({
  // Properties,
  api: Symbol('api'),
  settings: Symbol('settings'),

  // Methods:
  listenForMessages: Symbol('listenForMessages'),
});

export default class WebPush extends EventDispatcher {
  constructor(api, settings) {
    super(['message']);

    this[p.api] = api;
    this[p.settings] = settings;

    Object.seal(this);
  }

  subscribeToNotifications(resubscribe = false) {
    if (!navigator.serviceWorker) {
      return Promise.reject('No service worker supported');
    }

    navigator.serviceWorker.addEventListener('message',
      this[p.listenForMessages].bind(this));

    const settings = this[p.settings];
    if (settings.pushEndpoint && settings.pushPubKey && settings.pushAuth &&
        !resubscribe) {
      return Promise.resolve();
    }

    return navigator.serviceWorker.ready
      .then((reg) => reg.pushManager.subscribe({ userVisibleOnly: true }))
      .then((subscription) => {
        const endpoint = subscription.endpoint;
        const key = subscription.getKey ? subscription.getKey('p256dh') : '';
        const auth = subscription.getKey ? subscription.getKey('auth') : '';
        settings.pushEndpoint = endpoint;
        settings.pushPubKey = btoa(String.fromCharCode.apply(null,
          new Uint8Array(key)));
        settings.pushAuth = btoa(String.fromCharCode.apply(null,
          new Uint8Array(auth)));

        // Send push information to the server.
        // @todo We will need some library to write taxonomy messages.
        const pushConfigurationMsg = {
          select: {
            id: 'channel:subscribe.webpush@link.mozilla.org',
            feature: 'webpush/subscribe',
          },
          value: {
            subscriptions: [{
              public_key: settings.pushPubKey,
              push_uri: settings.pushEndpoint,
              auth: settings.pushAuth,
            }],
          },
        };

        return this[p.api].put('channels/set', pushConfigurationMsg);
      })
      .then(() => {
        // Setup some common push resources.
        const pushResourcesMsg = {
          select: {
            id: 'channel:resource.webpush@link.mozilla.org',
            feature: 'webpush/resource',
          },
          value: { resources: ['res1'] },
        };

        return this[p.api].put('channels/set', pushResourcesMsg);
      })
      .catch((error) => {
        if (Notification.permission === 'denied') {
          throw new Error('Permission request was denied.');
        }

        console.error('Error while saving subscription ', error);
        throw new Error(`Subscription error: ${error}`);
      });
  }

  [p.listenForMessages](evt) {
    const msg = evt.data || {};

    if (!msg.action) {
      return;
    }

    this.emit('message', msg);
  }
}
