'use strict';

/*
 * This file provides an helper to add custom events to any object.
 *
 * In order to use this functionality with any object consumer should extend
 * target object class with EventDispatcher:
 *
 * class Obj extends EventDispatcher {}
 * const obj = new Obj();
 *
 * A list of events can be optionally provided and it is recommended to do so.
 * If a list is provided then only the events present in the list will be
 * allowed. Using events not present in the list will cause other functions to
 * throw an error:
 *
 * class Obj extends EventDispatcher {
 *   constructor() {
 *     super(['somethinghappened', 'somethingelsehappened']);
 *   }
 * }
 * const obj = new Obj();
 *
 * The object will have five new methods: 'on', 'once', 'off', 'offAll' and
 * 'emit'. Use 'on' to register a new event-handler:
 *
 * obj.on("somethinghappened", function onSomethingHappened() { ... });
 *
 * If the same event-handler is added multiple times then only one will be
 * registered, e.g.:
 *
 * function onSomethingHappened() { ... }
 * obj.on("somethinghappened", onSomethingHappened);
 * obj.on("somethinghappened", onSomethingHappened); // Does nothing
 *
 * Use 'off' to remove a registered listener:
 *
 * obj.off("somethinghappened", onSomethingHappened);
 *
 * Use 'once' to register a one-time event-handler: it will be automatically
 * unregistered after being called.
 *
 * obj.once("somethinghappened", function onSomethingHappened() { ... });
 *
 * And use 'offAll' to remove all registered event listeners for the specified
 * event:
 *
 * obj.offAll("somethinghappened");
 *
 * When used without parameters 'offAll' removes all registered event handlers,
 * this can be useful when writing unit-tests.
 *
 * Finally use 'emit' to send an event to the registered handlers:
 *
 * obj.emit("somethinghappened");
 *
 * An optional parameter can be passed to 'emit' to be passed to the registered
 * handlers:
 *
 * obj.emit("somethinghappened", 123);
 */

const assertValidEventName = function(eventName) {
  if (!eventName || typeof eventName !== 'string') {
    throw new Error('Event name should be a valid non-empty string!');
  }
};

const assertValidHandler = function(handler) {
  if (typeof handler !== 'function') {
    throw new Error('Handler should be a function!');
  }
};

const assertAllowedEventName = function(allowedEvents, eventName) {
  if (allowedEvents && allowedEvents.indexOf(eventName) < 0) {
    throw new Error(`Event "${eventName}" is not allowed!`);
  }
};

const p = Object.freeze({
  allowedEvents: Symbol('allowedEvents'),
  listeners: Symbol('listeners'),
});

export default class EventDispatcher {
  constructor(allowedEvents) {
    if (typeof allowedEvents !== 'undefined' && !Array.isArray(allowedEvents)) {
      throw new Error('Allowed events should be a valid array of strings!');
    }

    this[p.listeners] = new Map();
    this[p.allowedEvents] = allowedEvents;
  }

  /**
   * Registers listener function to be executed once event occurs.
   *
   * @param {string} eventName Name of the event to listen for.
   * @param {function} handler Handler to be executed once event occurs.
   */
  on(eventName, handler) {
    assertValidEventName(eventName);
    assertAllowedEventName(this[p.allowedEvents], eventName);
    assertValidHandler(handler);

    let handlers = this[p.listeners].get(eventName);
    if (!handlers) {
      handlers = new Set();
      this[p.listeners].set(eventName, handlers);
    }

    // Set.add ignores handler if it has been already registered.
    handlers.add(handler);
  }

  /**
   * Registers listener function to be executed only first time when event
   * occurs.
   *
   * @param {string} eventName Name of the event to listen for.
   * @param {function} handler Handler to be executed once event occurs.
   */
  once(eventName, handler) {
    assertValidHandler(handler);

    const once = (parameters) => {
      this.off(eventName, once);

      handler.call(this, parameters);
    };

    this.on(eventName, once);
  }

  /**
   * Removes registered listener for the specified event.
   *
   * @param {string} eventName Name of the event to remove listener for.
   * @param {function} handler Handler to remove, so it won't be executed
   * next time event occurs.
   */
  off(eventName, handler) {
    assertValidEventName(eventName);
    assertAllowedEventName(this[p.allowedEvents], eventName);
    assertValidHandler(handler);

    const handlers = this[p.listeners].get(eventName);
    if (!handlers) {
      return;
    }

    handlers.delete(handler);

    if (!handlers.size) {
      this[p.listeners].delete(eventName);
    }
  }

  /**
   * Removes all registered listeners for the specified event.
   *
   * @param {string=} eventName Name of the event to remove all listeners for.
   */
  offAll(eventName) {
    if (typeof eventName === 'undefined') {
      this[p.listeners].clear();
      return;
    }

    assertValidEventName(eventName);
    assertAllowedEventName(this[p.allowedEvents], eventName);

    const handlers = this[p.listeners].get(eventName);
    if (!handlers) {
      return;
    }

    handlers.clear();

    this[p.listeners].delete(eventName);
  }

  /**
   * Emits specified event so that all registered handlers will be called
   * with the specified parameters.
   *
   * @param {string} eventName Name of the event to call handlers for.
   * @param {Object=} parameters Optional parameters that will be passed to
   * every registered handler.
   */
  emit(eventName, parameters) {
    assertValidEventName(eventName);
    assertAllowedEventName(this[p.allowedEvents], eventName);

    const handlers = this[p.listeners].get(eventName);
    if (!handlers) {
      return;
    }

    handlers.forEach((handler) => {
      try {
        handler.call(this, parameters);
      } catch (error) {
        console.error(error);
      }
    });
  }

  /**
   * Checks if there are any listeners that listen for the specified event.
   *
   * @param {string} eventName Name of the event to check listeners for.
   * @returns {boolean}
   */
  hasListeners(eventName) {
    assertValidEventName(eventName);
    assertAllowedEventName(this[p.allowedEvents], eventName);

    return this[p.listeners].has(eventName);
  }
}
