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
          id={service.id}
          name={service.properties.name}
          type={service.type}
          manufacturer={service.properties.manufacturer}
          model={service.properties.model}
          setters={service.setters}
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
    if (!Object.keys(service.getters).length &&
        !Object.keys(service.setters).length) {
      return false;
    }

    switch (service.type) {
      case 'philips_hue@link.mozilla.org':
      case 'ip-camera@link.mozilla.org':
      case 'OpenZwave Adapter':
        return true;
      default:
        return false;
    }
  }
}

ServicesList.propTypes = {
  foxbox: React.PropTypes.object.isRequired,
  services: React.PropTypes.array.isRequired
};
