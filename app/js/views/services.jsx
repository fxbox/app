import React from 'components/react';

import ServicesListView from 'js/views/services-list';
import BaseView from 'js/views/base-view';

export default class Services extends BaseView {
  constructor(props) {
    super(props);

    this.state = {
      services: [],

      title: '',
      body: '',
    };

    this.foxbox = props.foxbox;

    this.updateService = this.updateService.bind(this);
    this.updateServiceState = this.updateServiceState.bind(this);
  }

  componentDidMount() {
    this.foxbox.getServices()
      .then((services) => {
        console.log(services);
        this.updateService(services);
      })
      .catch(console.error.bind(console));

    this.foxbox.getTags()
      .then((tags) => {
        console.log(tags);
      })
      .catch(console.error.bind(console));

    this.foxbox.addEventListener('service-change', this.updateService);
    this.foxbox.addEventListener(
      'service-state-change', this.updateServiceState
    );
  }

  componentWillUnmount() {
    this.foxbox.removeEventListener('service-change', this.updateService);
    this.foxbox.removeEventListener(
      'service-state-change', this.updateServiceState
    );
  }

  updateService(services = []) {
    this.setState({ services });
  }

  updateServiceState(state) {
    // Find the index of the service which state has changed.
    const serviceId = this.state.services.findIndex(
      (service) => service.id === state.id
    );
    const services = this.state.services;

    // Update the new state.
    services[serviceId] = state;
    this.setState({ services });
  }

  renderHeader() {
    return super.renderHeader('My Home');
  }

  renderBody() {
    return (
      <div className="app-view__fill-body">
        <h2>General</h2>
        <ServicesListView services={this.state.services} foxbox={this.foxbox} />
      </div>
    );
  }
}

Services.propTypes = {
  foxbox: React.PropTypes.object.isRequired,
};
