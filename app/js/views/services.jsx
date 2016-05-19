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

    this.updateServiceList = this.updateServiceList.bind(this);
    this.updateServiceState = this.updateServiceState.bind(this);
  }

  componentDidMount() {
    this.updateServiceList();

    this.foxbox.services.togglePolling(true);

    this.foxbox.services.on('services-changed', this.updateServiceList);
    this.foxbox.services.on('service-changed', this.updateServiceState);
  }

  componentWillUnmount() {
    this.foxbox.services.togglePolling(false);

    this.foxbox.services.off('services-changed', this.updateServiceList);
    this.foxbox.services.off('service-changed', this.updateServiceState);
  }

  updateServiceList() {
    this.foxbox.services.getAll()
      .then((services) => this.setState({ services }))
      .catch((error) => {
        console.error('Could not update service list: %o', error);
      });
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
