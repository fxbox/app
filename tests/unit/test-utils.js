import Rx from 'rxjs';

export function waitFor(fn) {
  return new Promise((resolve) => {
    Rx.Observable.interval(100)
      .filter(() => fn())
      .take(1)
      .subscribe(resolve);
  });
}
