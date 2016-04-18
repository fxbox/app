import React from 'components/react';

export default class ServicesListItem extends React.Component {
  constructor(props) {
    super(props);

    this.props = props;
    this.state = {
      // @todo Query getter to get the `available` state.
      available: true,
      // @todo Query getter to get the `power` state.
      on: true,
    };

    this.foxbox = props.foxbox;
  }

  handleLightOnChange(evt) {
    const on = evt.target.checked;
    const value = on ? 'On' : 'Off';
    const operation = this.getOperationByAlias('LightOn');

    // Optimistic update.
    this.setState({ on });

    this.foxbox.performSetOperation(operation, value)
      .catch((error) => {
        // Revert back to the previous value.
        this.setState({ on: !on });
        console.error(error);
      });
  }

  /**
   * Gets service operation with the specified alias.
   *
   * @param {string} alias Alias of the operation we're looking for.
   * @return {Object} Operation associated with the specified alias.
   *
   * @private
   */
  getOperationByAlias(alias) {
    const operations = this.props.setters;

    let operationKey = Object.keys(operations).find((key) => {
      let operation = operations[key];

      if (typeof operation.kind === 'object') {
        return operation.kind.kind === alias;
      }

      return operation.kind === alias;
    });

    return operations[operationKey];
  }

  /**
   * Convert colours from xy space to RGB.
   * See details at:
   * http://www.developers.meethue.com/documentation/color-conversions-rgb-xy
   */
  getBulbColour() {
    const hue = /* this.state.hue */ 1;
    const sat = /* this.state.sat */ 1;
    const val = /* this.state.val */ 1;
    let h = hue;
    let s = Math.round(sat * 100);
    let l = val;

    // We set the luminosity to 50% and use the brightness as the opacity. The
    // brighter, the more opaque. Pale shades get transparent.
    return `hsla(${h},${s}%,50%,${l})`;
  }

  renderLightService() {
    let isConnected = this.state.available;

    let serviceType = 'Light';
    let icon = 'light';

    if (this.props.model !== undefined) {
      switch (this.props.model) {
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
           href={`#services/${this.props.id}`}>
          {serviceType}
          <small>{` (${this.props.name})`}</small>
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

  renderGenericService(type = 'Unknown service', icon = 'unknown') {
    const serviceNameNode = this.props.name ?
      (<small>{` (${this.props.name})`}</small>) :
      null;

    return (
      <li className="service-list__item" data-icon={icon} data-connected="true">
        <a className="service-list__item-link"
           href={`#services/${this.props.id}`}>
          {type}
          {serviceNameNode}
        </a>
      </li>
    );
  }

  render() {
    switch (this.props.type) {
      case 'philips_hue@link.mozilla.org':
        return this.renderLightService();
      case 'ip-camera@link.mozilla.org':
        return this.renderGenericService('Camera', 'ip-camera');
      case 'OpenZwave Adapter':
        if (this.hasDoorLockChannel(this.props.getters) ||
            this.hasDoorLockChannel(this.props.setters)) {
          return this.renderGenericService('Door Lock', 'door-lock');
        }
        return this.renderGenericService('Motion Sensor', 'motion-sensor');
      default:
        return this.renderGenericService();
    }
  }

  hasDoorLockChannel(channels) {
    return Object.keys(channels).find(
      (key) => channels[key].kind === 'DoorLocked'
    );
  }
}

ServicesListItem.propTypes = {
  foxbox: React.PropTypes.object.isRequired,
  id: React.PropTypes.string.isRequired,
  model: React.PropTypes.string,
  name: React.PropTypes.string.isRequired,
  type: React.PropTypes.string.isRequired,
  getters: React.PropTypes.object,
  setters: React.PropTypes.object,
};
