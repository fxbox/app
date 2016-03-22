/* global React */
import CameraService from 'js/views/services/camera';
import DefaultService from 'js/views/services/default';

export default class Service extends React.Component {
  constructor(props) {
    super(props);

    this.state = {};
    this.foxbox = props.foxbox;
  }

  componentDidMount() {
    this.foxbox.getService(this.props.id).then((service) => {
      this.setState({ service: service.data });
    }).catch((e) => {
      console.error('Error occurred while retrieving service: ', e);
    });
  }

  render() {
    if (!this.state.service) {
      return false;
    }

    switch(this.state.service.properties.type) {
      case 'ipcamera':
        return (<CameraService service={this.state.service}
                               foxbox={this.foxbox} />);
      default:
        return (<DefaultService service={this.state.service}
                                foxbox={this.foxbox} />);
    }
  }
}
