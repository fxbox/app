import React from 'components/react';

import ServicesListItem from 'js/views/services-list-item';

export default class ServicesList extends React.Component {
  render() {
    const knownServices = this.props.services.filter(
      (service) => service.type !== 'unknown'
    );

    const serviceNodes = knownServices.map((service) => (
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
}

ServicesList.propTypes = {
  foxbox: React.PropTypes.object.isRequired,
  services: React.PropTypes.array.isRequired,
};
