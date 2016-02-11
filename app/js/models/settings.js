import { Model } from 'components/fxos-mvc/dist/mvc';

export default class Settings extends Model {
  constructor() {
    super({
      _bridgeAddress: localStorage.getItem('bridgeAddress') || '',
      _userId: localStorage.getItem('userId') || ''
    });
  }

  get bridgeAddress() {
    return this._bridgeAddress;
  }

  set bridgeAddress(bridgeAddress) {
    bridgeAddress = String(bridgeAddress) || '';
    this._bridgeAddress = bridgeAddress.replace(/\/$/, ''); // Trailing slash.
    localStorage.setItem('bridgeAddress', this._bridgeAddress);
  }

  get userId() {
    return this._userId;
  }

  set userId(userId) {
    this._userId = userId;
    localStorage.setItem('userId', this._userId);
  }
}
