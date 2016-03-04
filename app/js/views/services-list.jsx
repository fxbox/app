/* global React */

import ServicesListItem from 'js/views/services-list-item';

export default class ServicesList extends React.Component {
  render() {
    let serviceNodes = this.props.services.map((service, id) => (
        <ServicesListItem
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
