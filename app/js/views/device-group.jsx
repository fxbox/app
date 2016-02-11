/* global React */

import Device from 'js/views/device';

export default class DeviceGroup extends React.Component {
  render() {
    let deviceNodes = this.props.devices.map((device, id) => {
      return (
        <Device
          key={device.uniqueid}
          lightId={id + 1}
          type={device.type}
          name={device.name}
          manufacturer={device.manufacturername}
          modelid={device.modelid}
          state={device.state}
          hue={this.props.hue}/>
      );
    });

    return (
      <ul>{deviceNodes}</ul>
    );
  }
}
