import React from 'components/react';

import ServicesListItem from 'js/views/services-list-item';

export default class ServicesList extends React.Component {
  render() {
    let userFacingServices = this.props.services.filter(
      (service) => this.isUserFacingService(service)
    );

    let serviceNodes = userFacingServices.map((service) => (
        <ServicesListItem
          key={service.id}
          service={service}
          foxbox={this.props.foxbox}/>
      )
    );

    return (
      <ul className="service-list">{serviceNodes}</ul>
    );
  }

  isUserFacingService(service) {
    // If service doesn't have any getters and setters, there is no need to
    // display it to the user.
    if (!service.hasGetters && !service.hasSetters) {
      return false;
    }

    switch (service.type) {
      case 'ip-camera':
      case 'light':
        return true;
      default:
        return false;
    }
  }
}

ServicesList.propTypes = {
  foxbox: React.PropTypes.object.isRequired,
  services: React.PropTypes.array.isRequired,
};
