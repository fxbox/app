/* global React */

export default class Device extends React.Component {
  constructor(props) {
    super(props);
    this.state = this.props.state;
  }

  handleLightOnChange(evt) {
    let value = evt.target.checked;

    this.props.hue.changeLightState(this.props.lightId, { on: value })
      .then(response => {
        if (response[0] && response[0].success) {
          this.setState({ on: value });
        }
      })
      .catch(error => {
        console.error(error);
      });
  }

  render() {
    let deviceType = 'Unknown device';
    let icon = 'unknown';

    switch (this.props.type) {
      case 'Extended color light':
        deviceType = 'Light';
        icon = 'light';
        break;
    }

    if (this.props.modelid !== undefined) {
      switch (this.props.modelid) {
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

    let isConnected = false;
    if (this.state.reachable !== undefined) {
      isConnected = this.state.reachable;
    }

    return (
      <li data-icon={icon} data-connected={isConnected}>{deviceType}
        <small> ({this.props.name})</small>
        <input type="checkbox" checked={this.state.on} disabled={!isConnected}
          onChange={this.handleLightOnChange.bind(this)}/>
      </li>
    );
  }
}
