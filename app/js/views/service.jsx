import React from 'components/react';

import BaseView from 'js/views/base-view';
import CameraServiceView from 'js/views/services/camera';
import LightServiceView from 'js/views/services/light';
import DefaultServiceView from 'js/views/services/default';

export default class Service extends BaseView {
  constructor(props) {
    super(props);

    this.state = {
      service: null,
    };

    this.foxbox = props.foxbox;
  }

  componentDidMount() {
    this.foxbox.getService(this.props.id)
      .then((service) => {
        this.setState({ service });
      })
      .catch((error) => {
        console.error('Error occurred while retrieving service: ', error);
      });
  }

  renderHeader() {
    return super.renderHeader(
      this.state.service && this.state.service.name ?
        this.state.service.name :
        'Unknown Service'
    );
  }

  renderBody() {
    if (!this.state.service) {
      return null;
    }

    switch (this.state.service.type) {
      case 'ip-camera':
        return (<CameraServiceView service={this.state.service}
                                   foxbox={this.foxbox}/>);
      case 'light':
        return (<LightServiceView service={this.state.service}
                                  foxbox={this.foxbox}/>);
      default:
        return (<DefaultServiceView service={this.state.service}
                                    foxbox={this.foxbox}/>);
    }
  }
}

Service.propTypes = {
  foxbox: React.PropTypes.object.isRequired,
  id: React.PropTypes.string.isRequired,
};
