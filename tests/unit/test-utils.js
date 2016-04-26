import Rx from 'rxjs';

export function waitFor(fn) {
  return new Promise((resolve) => {
    Rx.Observable.interval(100)
      .filter(() => fn())
      .take(1)
      .subscribe(resolve);
  });
}

/**
 * Allows to wait for a new macro task and until all currently scheduled
 * micro tasks are completed (e.g. promises or mutation observers).
 * Post message trick is used instead of setTimeout as there is a high chance
 * that setTimeout and alike are mocked by Sinon.
 *
 * @return {Promise}
 */
export function waitForNextMacroTask() {
  return new Promise((resolve) => {
    function onMessage(evt) {
      if (evt.data !== 'x-macro-task') {
        return;
      }

      window.removeEventListener('message', onMessage);
      resolve();
    }

    window.addEventListener('message', onMessage);
    window.postMessage('x-macro-task', window.location.origin);
  });
}
