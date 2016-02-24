/* global React */

import DeviceItem from 'js/views/device-item';

export default class DeviceGroup extends React.Component {
  render() {
    let deviceNodes = this.props.devices.map((device, id) => (
        <DeviceItem
          key={device.uniqueid}
          id={device.uniqueid}
          lightId={id + 1}
          type={device.type}
          name={device.name}
          manufacturer={device.manufacturername}
          modelid={device.modelid}
          state={device.state}
          hue={this.props.hue}/>
      )
    );

    return (
      <ul className="device-list">{deviceNodes}</ul>
    );
  }
}
