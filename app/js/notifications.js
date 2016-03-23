navigator.serviceWorker.ready.then(function(reg) {
    reg.pushManager.subscribe({userVisibleOnly: true})
      .then(function(subscription) {
        // The subscription was successful
        // Update status to subscribe current user on server, and to let
        // other users know this user has subscribed
        var endpoint = subscription.endpoint;
        var key = subscription.getKey('p256dh');
        console.log('Send the following data to the box:');
        console.log('----> Got endpoind ', endpoint);
        console.log('----> Got key ->', btoa(String.fromCharCode.apply(null, new Uint8Array(key))));
      })
      .catch(function(e) {
        if (Notification.permission === 'denied') {
          console.log('Permission for Notifications was denied');
        } else {
          console.error('Error on subscription ', e);
        }
      });
});