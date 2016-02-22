/* global React */

import FooterMenu from 'js/views/footer-menu';
import DeviceGroup from 'js/views/device-group';
import Modal from 'js/views/modal';

export default class HomeView extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      visible: false,
      title: '',
      body: ''
    };
  }

  render() {
    return (
      <div>
        <h1>My Home</h1>
        <h2>General</h2>
        <DeviceGroup devices={this.props.devices} hue={this.props.hue}/>
        <Modal visible={this.state.visible} title={this.state.title} body={this.state.body}/>
        <FooterMenu/>
      </div>
    );
  }
}
