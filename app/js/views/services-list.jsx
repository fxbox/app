/* global React */

import ServicesListItem from 'js/views/services-list-item';

export default class ServicesList extends React.Component {
  render() {
    let serviceNodes = this.props.services.map((service, id) => (
        <ServicesListItem
          key={service.id}
          id={service.id}
          name={service.name}
          type={service.properties.type}
          manufacturer={service.properties.manufacturer}
          modelid={service.properties.model}
          state={service.state}
          foxbox={this.props.foxbox}/>
      )
    );

    return (
      <ul className="service-list">{serviceNodes}</ul>
    );
  }
}
