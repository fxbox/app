import React from 'components/react';

import BaseView from 'js/views/base-view';
import CameraServiceView from 'js/views/services/camera';
import DefaultServiceView from 'js/views/services/default';

export default class Service extends BaseView {
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

  renderHeader() {
    return super.renderHeader(
      this.state.service && this.state.service.properties.name ?
        this.state.service.properties.name :
        'Unknown Service'
    );
  }

  renderBody() {
    if (!this.state.service) {
      return null;
    }

    switch(this.state.service.type) {
      case 'ip-camera@link.mozilla.org':
        return (<CameraServiceView service={this.state.service}
                                   foxbox={this.foxbox} />);
      default:
        return (<DefaultServiceView service={this.state.service}
                                    foxbox={this.foxbox} />);
    }
  }
}

Service.propTypes = {
  foxbox: React.PropTypes.object.isRequired,
  id: React.PropTypes.string.isRequired
};
