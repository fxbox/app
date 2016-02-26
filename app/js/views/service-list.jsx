/* global React */

import ServiceItem from 'js/views/service-item';

export default class ServiceList extends React.Component {
  render() {
    let serviceNodes = this.props.services.map((service, id) => (
        <ServiceItem
          key={service.id}
          id={service.id}
          type={service.type}
          name={service.name}
          manufacturer={service.manufacturername}
          modelid={service.modelid}
          state={service.state}
          foxbox={this.props.foxbox}/>
      )
    );

    return (
      <ul className="service-list">{serviceNodes}</ul>
    );
  }
}
