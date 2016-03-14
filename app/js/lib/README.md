# foxbox.js

> A library to interact with the Project Link box.

## API

### getServices()

Retrieve the list of services previously cached.

The services are cached locally so that the UI is as responsive as possible.
Implementations should listen to the `*-change` events to make sure the UI
remains in sync with the services and their respective states.

## Events

### service-change

Triggers when a new service is connected to the box or when an existing service
is disconnected from it.

### service-state-change

This event is emitted when a service states change.
