import React from 'components/react';

import BaseView from './base-view';
import CameraServiceView from './services/camera';
import LightServiceView from './services/light';
import DefaultServiceView from './services/default';

export default class Service extends BaseView {
  constructor(props) {
    super(props);

    this.state = {
      service: null,
    };

    this.foxbox = props.foxbox;
  }

  componentDidMount() {
    this.foxbox.services.get(this.props.id)
      .then((service) => {
        this.setState({ service });
      })
      .catch((error) => {
        console.error('Error occurred while retrieving service: ', error);
      });
  }

  renderHeader() {
    if (!this.state.service) {
      return super.renderHeader('Unknown Service');
    }

    const serviceName = this.state.service.name ?
      this.state.service.name :
      'Unknown Service';

    return (
      <header className="app-view__header">
        <h1>{serviceName}</h1>
        <a href={`#services/${this.state.service.id}/tags`}
           title="Edit tags"
           className="service__edit-tags-link">
          <img className="app-view__action-icon"
               src="css/icons/tag.svg"
               alt="Edit tags"/>
        </a>
      </header>
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
