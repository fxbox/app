/* global React */

import NavigationMenu from 'js/views/navigation-menu';

export default class ThemesNew extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      services: [],

      service: null,
      property: null,
      actionService: null,
      actionProperty: null
    };

    this.foxbox = props.foxbox;

    this.updateServices = this.updateServices.bind(this);
  }

  componentDidMount() {
    this.foxbox.getServices()
      .then(services => {
        this.updateServices(services);
      })
      .catch(console.error.bind(console));

    this.foxbox.addEventListener('service-change', this.updateServices);
  }

  componentWillUnmount() {
    this.foxbox.removeEventListener('service-change', this.updateServices);
  }

  updateServices(services = []) {
    this.setState({ services });

    this.validateSelectedId();
  }

  /**
   * Validate the currently selected service against the list of services.
   */
  validateSelectedId(service = this.state.service) {
    if (service === '0') {
      service = null;
    } else if (!this.state.services.find(s => s.id === service)) {
      service = null;
    }

    if (service === null) {
      this.setState({
        service,
        property: null,
        actionService: null,
        actionProperty: null
      });
    }
  }

  handleServiceSelection(evt) {
    const service = evt.target.value;
    this.setState({ service });

    this.validateSelectedId(service);
  }

  handlePropertySelection(evt) {
    const property = evt.target.value;
    if (property !== '0') {
      this.setState({ property });
    } else {
      this.setState({
        property: null,
        actionService: null,
        actionProperty: null
      });
    }
  }

  handleActionServiceSelection(evt) {
    const actionService = evt.target.value;
    if (actionService !== '0') {
      this.setState({ actionService });
    } else {
      this.setState({
        actionService: null,
        actionProperty: null
      });
    }
  }

  handleActionPropertySelection(evt) {
    const actionProperty = evt.target.value;
    if (actionProperty !== '0') {
      this.setState({ actionProperty });
    } else {
      this.setState({
        actionProperty: null
      });
    }
  }

  handleActionButton() {
    if (this.state.actionProperty === null) {
      return;
    }

    const selects = document.querySelectorAll('select');

    const service = selects[0].options[selects[0].selectedIndex].label;
    const property = selects[1].options[selects[1].selectedIndex].label
      .toLowerCase();
    const actionService = selects[2].options[selects[2].selectedIndex].label;
    const actionProperty = selects[3].options[selects[3].selectedIndex].label
      .toLowerCase();

    this.foxbox.addRecipe({
        name: `When a ${service} ${property}, ${actionService} ${actionProperty}.`,
        conditionServiceId: this.state.service,
        conditionProp: this.state.property,
        actionServiceId: this.state.actionService,
        actionProp: this.state.actionProperty,
        enabled: true
      })
      .then(() => {
        location.hash = '#themes';
      })
      .catch(console.error.bind(console));
  }

  render() {
    let className = 'new-theme__select';
    if (this.state.service !== null) {
      className += ' new-theme__select--selected';
    }
    const optionNodes = this.state.services.map(service => (
      <option key={service.id} value={service.id}>{service.name}</option>
    ));
    let serviceSelector = (
      <select value={this.state.service}
              onChange={this.handleServiceSelection.bind(this)}
              className={className}>
        <option value="0">Select a device</option>
        {optionNodes}
      </select>
    );

    className = 'new-theme__select';
    if (this.state.property !== null) {
      className += ' new-theme__select--selected';
    }
    let propertySelector = (
      <select className="new-theme__select new-theme__select--hidden"></select>);
    if (this.state.service !== null) {
      propertySelector = (
        <select value={this.state.property}
                onChange={this.handlePropertySelection.bind(this)}
                className={className}>
          <option value="0">Select a property</option>
          <option key="1" value="1">Is opened</option>
          <option key="2" value="2">Is closed</option>
        </select>
      );
    }

    className = 'new-theme__select';
    if (this.state.actionService !== null) {
      className += ' new-theme__select--selected';
    }
    let actionServiceSelector = (
      <select className="new-theme__select new-theme__select--hidden"></select>);
    if (this.state.property !== null) {
      const actionServiceNodes = this.state.services.map(service => (
        <option key={service.id} value={service.id}>{service.name}</option>
      ));
      actionServiceSelector = (
        <select value={this.state.actionService}
                onChange={this.handleActionServiceSelection.bind(this)}
                className={className}>
          <option value="0">Select a device</option>
          {actionServiceNodes}
        </select>
      );
    }

    className = 'new-theme__select';
    if (this.state.actionProperty !== null) {
      className += ' new-theme__select--selected';
    }
    let actionPropertySelector = (
      <select className="new-theme__select new-theme__select--hidden"></select>);
    if (this.state.actionService !== null) {
      actionPropertySelector = (
        <select value={this.state.actionProperty}
                onChange={this.handleActionPropertySelection.bind(this)}
                className={className}>
          <option key="0" value="0">Select a property</option>
          <option key="1" value="1">Take a picture</option>
          <option key="2" value="2">Record a video</option>
        </select>
      );
    }

    let headerClassName = 'new-theme__header';
    if (this.state.property === null) {
      headerClassName += ' new-theme__header--hidden';
    }

    let actionButtonClassName = 'app-view__action';
    if (this.state.actionProperty === null) {
      actionButtonClassName += ' app-view__action--disabled';
    }

    return (
      <div className="app-view">
        <header className="app-view__header">
          <a href="#themes" className="app-view__action">Cancel</a>
          <h1>New Recipe</h1>
          <button className={actionButtonClassName}
                  onClick={this.handleActionButton.bind(this)}>Done
          </button>
        </header>
        <section className="app-view__body">
          <div className="new-theme">
            <h2 className="new-theme__header">If</h2>
            {serviceSelector}
            {propertySelector}

            <h2 className={headerClassName}>Do</h2>
            {actionServiceSelector}
            {actionPropertySelector}
          </div>
        </section>
        <footer className="app-view__footer">
          <NavigationMenu foxbox={this.foxbox}/>
        </footer>
      </div>
    );
  }
}
