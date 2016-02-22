import { Service } from 'components/fxos-mvc/dist/mvc';

const USER_NAME = 'web';
const APP_NAME = 'foxbox-client';

let loadJSON = function(method, url, content = '') {
  return new Promise((resolve, reject) => {
    let xhr = new XMLHttpRequest();
    xhr.open(method, url, true);
    xhr.responseType = 'json';
    xhr.timeout = 3000;
    xhr.overrideMimeType('application/json');
    xhr.setRequestHeader('Accept', 'application/json,text/javascript,*/*;q=0.01');
    xhr.addEventListener('load', () => {
      if (xhr.readyState === XMLHttpRequest.DONE && xhr.status === 200) {
        resolve(xhr.response);
      } else {
        reject('Could not complete the operation.');
      }
    });
    xhr.addEventListener('error', reject);
    xhr.send(JSON.stringify(content));
  });
};

let toArray = function(object) {
  return Object.keys(object).map(k => object[k]);
};

export default class Hue extends Service {
  constructor(settings) {
    this.settings = settings;
    super();
  }

  connectToBridge() {
    return this.getBridgeAddress()
      .then(this.getUserId.bind(this));
  }

  /**
   * Use N-UPnP to discover the IP address of a Philips Hue bridge connected
   * to the local network.
   */
  getBridgeAddress() {
    return new Promise((resolve, reject) => {
      if (this.settings.bridgeAddress) {
        // @todo Try to ping it to see if it's still connected.
        return resolve(this.settings.bridgeAddress);
      }

      loadJSON('GET', 'https://www.meethue.com/api/nupnp')
        .then(response => {
          if (!response) {
            return reject(`Cannot reach the broker server. Make sure you're connected to the internet.`);
          }

          if (!response.length) {
            return reject('No bridge found. Please connect a bridge and try again.');
          }

          // @todo Manage the case where several bridges are connected.
          this.settings.bridgeAddress = response[0].internalipaddress;
          return resolve(this.settings.bridgeAddress);
        });
    });
  }

  getUserId() {
    let retriesNumber = 10;
    let messageShown = false;

    return new Promise((resolve, reject) => {
      if (this.settings.userId) {
        // @todo Check that this user ID is still working/authorised.
        return resolve(this.settings.userId);
      }

      let userInterval = setInterval(() => {
        loadJSON('POST', `http://${this.settings.bridgeAddress}/api`, {
          devicetype: `${APP_NAME}#${USER_NAME}`
        })
          .then(response => {
            console.log(response);

            if (response[0] && response[0].success) {
              this.settings.userId = response[0].success.username;
              clearInterval(userInterval);
              this._dispatchEvent('dismiss-message');
              return resolve(this.settings.userId);
            }

            if (response[0] && response[0].error.type === 101 && !messageShown) {
              this._dispatchEvent('message', {
                title: 'Please link',
                body: 'Please press the link button on your Philips bridge.'
              });
              messageShown = true;
            }

            if (retriesNumber === 0) {
              clearInterval(userInterval);
              this._dispatchEvent('message', {
                title: 'Error',
                body: 'The link button was not pressed on time.'
              });
              return reject('The link button was not pressed on time.');
            }

            retriesNumber--;
          });
      }, 1000);
    });
  }

  getLights() {
    return new Promise((resolve, reject) => {
      return loadJSON('GET', `http://${this.settings.bridgeAddress}/api/${this.settings.userId}`)
        .then(response => {
          if (!response.lights) {
            return reject('lights property is missing.');
          }

          resolve(toArray(response.lights));
        });
    });
  }

  getLight(id) {
    return new Promise((resolve, reject) => {
      return loadJSON('GET', `http://${this.settings.bridgeAddress}/api/${this.settings.userId}/lights/${id}`)
        .then(response => {
          if (!response) {
            return reject('Response is empty.');
          }

          resolve(response);
        });
    });
  }

  changeLightState(id, states) {
    return new Promise((resolve, reject) => {
      return loadJSON('PUT', `http://${this.settings.bridgeAddress}/api/${this.settings.userId}/lights/${id}/state`,
        states)
        .then(response => {
          if (response[0] && response[0].error) {
            return reject(response[0].error.description);
          }

          resolve(response);
        });
    });
  }

  changeLightAttribute(id, attrs) {
    return new Promise((resolve, reject) => {
      return loadJSON('PUT', `http://${this.settings.bridgeAddress}/api/${this.settings.userId}/lights/${id}`,
        attrs)
        .then(response => {
          if (response[0] && response[0].error) {
            return reject(response[0].error.description);
          }

          resolve(response);
        });
    });
  }
}
