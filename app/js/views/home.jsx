/* global React */

import DeviceGroup from 'js/views/device-group';
import Modal from 'js/views/modal';

export default class HomeView extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      showModal: false,
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
        <Modal showModal={this.state.showModal} title={this.state.title} body={this.state.body}/>
      </div>
    );
  }
}
