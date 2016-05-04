import React from 'components/react';

export default class LightService extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      name: props.service.name,
    };

    this.foxbox = props.foxbox;
    this.service = props.service;

    this.onServiceStateChanged = this.onServiceStateChanged.bind(this);
  }

  componentDidMount() {
    this.foxbox.services.on('service-changed', this.onServiceStateChanged);
  }

  componentWillUnmount() {
    this.foxbox.services.off('service-changed', this.onServiceStateChanged);
  }

  onServiceStateChanged(service) {
    if (service.id !== this.service.id) {
      return;
    }

    this.service = service;
    this.setState({ name: service.name });
  }

  render() {
    return (
      <div className="app-view__fill-body default-service__body">
        <p className="default-service__notice">
          Oops, there are no settings available for this service.
        </p>
      </div>
    );
  }
}

LightService.propTypes = {
  foxbox: React.PropTypes.object.isRequired,
  service: React.PropTypes.object.isRequired,
};
