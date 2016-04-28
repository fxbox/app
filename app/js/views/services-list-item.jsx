import React from 'components/react';

export default class ServicesListItem extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      available: false,
      on: true,
      locked: true,
      motionDetected: false,
    };

    this.service = props.service;
    this.foxbox = props.foxbox;

    this.onMotion = this.onMotion.bind(this);
  }

  componentDidMount() {
    switch (this.service.type) {
      case 'light':
        this.service.isAvailable()
          .then((available) => {
            this.setState({ available });
          })
          .catch(console.error.bind(console));

        this.service.isOn()
          .then((on) => {
            this.setState({ on });
          })
          .catch(console.error.bind(console));
        break;
      case 'motion-sensor':
        this.service.isMotionDetected()
          .then(this.onMotion);
        this.service.on('motion', this.onMotion);
        break;
      case 'door-lock':
        this.service.isLocked()
          .then((locked) => {
            this.setState({ locked });
          })
          .catch((error) => {
            console.error('Can not retrieve door lock status: %o', error);
          });
        break;
    }
  }

  componentWillUnmount() {
    switch (this.service.type) {
      case 'motion-sensor':
        this.service.off('motion', this.onMotion);
        break;
    }
  }

  handleLightOnChange(evt) {
    const on = evt.target.checked;

    // Optimistic update.
    this.setState({ on });

    this.service.turn(on)
      .catch((error) => {
        // Revert back to the previous value.
        this.setState({ on: !on });
        console.error(error);
      });
  }

  onDoorLockUnlock(evt) {
    const locked = evt.target.checked;

    this.setState({ locked });

    this.service.lockUnlock(locked)
      .catch((error) => {
        // Revert back to the previous value.
        this.setState({ locked: !locked });
        console.error('Could not change door lock status: %o', error);
      });
  }

  onMotion(motionDetected) {
    this.setState({ motionDetected });
  }

  /**
   * Convert colours from xy space to RGB.
   * See details at:
   * http://www.developers.meethue.com/documentation/color-conversions-rgb-xy
   *
   * @return {string}
   */
  getBulbColour() {
    const hue = /* this.service.hue */ 1;
    const sat = /* this.service.sat */ 1;
    const val = /* this.service.val */ 1;
    const h = hue;
    const s = Math.round(sat * 100);
    const l = val;

    // We set the luminosity to 50% and use the brightness as the opacity. The
    // brighter, the more opaque. Pale shades get transparent.
    return `hsla(${h},${s}%,50%,${l})`;
  }

  renderLightService() {
    let isConnected = this.state.available;

    let serviceType = 'Light';
    let icon = 'light';

    if (this.service.model !== undefined) {
      switch (this.service.model) {
        case 'BSB002':
          icon = 'bridge_v2';
          break;

        case 'LCT001':
        case 'LCT007':
        case 'LCT010':
        case 'LTW010':
        case 'LWB004':
        case 'LWB006':
          icon = 'white_and_color_e27_b22';
          break;

        case 'LWB010':
        case 'LWB014':
          icon = 'white_e27_b22';
          break;

        case 'LCT002':
        case 'LCT011':
        case 'LTW011':
        case 'LWB005':
        case 'LWB011':
          icon = 'br30';
          break;

        case 'LCT003':
          icon = 'gu10_par16';
          break;

        case 'LST001':
        case 'LST002':
          icon = 'lightstrip';
          break;

        case 'LLC006':
        case 'LLC010':
          icon = 'iris';
          break;

        case 'LLC005':
        case 'LLC011':
        case 'LLC012':
        case 'LLC007':
          icon = 'bloom';
          break;

        case 'LLC014':
          icon = 'aura';
          break;

        case 'LLC013':
          icon = 'storylight';
          break;

        case 'LLC020':
          icon = 'go';
          break;

        case 'HBL001':
        case 'HBL002':
        case 'HBL003':
          icon = 'beyond_ceiling_pendant_table';
          break;

        case 'HIL001':
        case 'HIL002':
          icon = 'impulse';
          break;

        case 'HEL001':
        case 'HEL002':
          icon = 'entity';
          break;

        case 'HML001':
        case 'HML002':
        case 'HML003':
        case 'HML004':
        case 'HML005':
        case 'HML006':
          icon = 'phoenix_ceiling_pendant_table_wall';
          break;

        case 'HML007':
          icon = 'phoenix_recessed_spot';
          break;

        case 'SWT001':
          icon = 'tap';
          break;

        case 'RWL021':
          icon = 'hds';
          break;
      }
    }

    return (
      <li className="service-list__item" data-icon={icon}
          data-connected={isConnected}>
        <a className="service-list__item-link"
           href={`#services/${this.service.id}`}>
          {serviceType}
          <small>{` (${this.service.name})`}</small>
        </a>
        <div className="service-list__item-color-picker"
             style={{ background: this.getBulbColour() }}>
        </div>
        <label>
          <input className="service-list__on-off-toggle" type="checkbox"
                 checked={this.state.on} disabled={!isConnected}
                 onChange={this.handleLightOnChange.bind(this)}/>
        </label>
      </li>
    );
  }

  renderDoorLock() {
    const doorLockNameNode = this.service.name ?
      (<small>{` (${this.service.name})`}</small>) :
      null;

    return (
      <li className="service-list__item" data-icon="door-lock">
        <a className="service-list__item-link"
           href={`#services/${this.service.id}`}>
          Door Lock
          {doorLockNameNode}
        </a>
        <label>
          <input className="service-list__on-off-toggle" type="checkbox"
                 checked={this.state.locked}
                 onChange={this.onDoorLockUnlock.bind(this)}/>
        </label>
      </li>
    );
  }

  renderMotionSensor() {
    const motionSensorNameNode = this.service.name ?
      (<small>{` (${this.service.name})`}</small>) :
      null;

    let motionSensorClassName = 'service-list__item motion-sensor-item';
    if (this.state.motionDetected) {
      motionSensorClassName += ' motion-sensor-item--motion-detected';
    }

    return (
      <li className={motionSensorClassName}>
        <a className="service-list__item-link"
           href={`#services/${this.service.id}`}>
          Motion Sensor
          {motionSensorNameNode}
        </a>
      </li>
    );
  }

  renderGenericService(type = 'Unknown service', icon = 'unknown') {
    const serviceNameNode = this.service.name ?
      (<small>{` (${this.service.name})`}</small>) :
      null;

    return (
      <li className="service-list__item" data-icon={icon} data-connected="true">
        <a className="service-list__item-link"
           href={`#services/${this.service.id}`}>
          {type}
          {serviceNameNode}
        </a>
      </li>
    );
  }

  render() {
    switch (this.service.type) {
      case 'door-lock':
        return this.renderDoorLock();
      case 'ip-camera':
        return this.renderGenericService('Camera', 'ip-camera');
      case 'light':
        return this.renderLightService();
      case 'motion-sensor':
        return this.renderMotionSensor();
      default:
        return this.renderGenericService();
    }
  }
}

ServicesListItem.propTypes = {
  foxbox: React.PropTypes.object.isRequired,
  service: React.PropTypes.object.isRequired,
};
