# foxbox.js

> A library to interact with the Project Link box.

## API

### Foxbox#login()

Redirect the user to the box for authentication.

### Foxbox#logout()

Revoke the current user session by deleting the associated token.

### Foxbox#getServices()

Retrieve the list of services previously cached. Returns a promise that resolves
with an array of service objects.

The services are cached locally so that the UI is as responsive as possible.
Implementations must listen to the `*-change` events to make sure the UI
remains in sync with the services and their respective states.

```javascript
foxbox.getServices()
  .then(services => {
    updateUI(services);
  });
```

### Foxbox#getService(serviceId)

Get a service given its Id. Returns a promise resolving to a single object.

Make sure to listen to the `service-state-change` event to get any change in the
service states.

```javascript
foxbox.getService(serviceId)
  .then(service => {
    updateUI(service);
  });
```

## Events

### `service-change`

Triggers when a new service is connected to the box or when an existing service
is disconnected from it.

### `service-state-change`

This event is emitted when a service states change.
