import React from 'components/react';

import NavigationMenu from 'js/views/navigation-menu';

// @todo Validate input on select onChange:
//    * Check if integer
//    * Check if value is within boundaries
//    * Check if properties belong to selected service

export default class ThemesNew extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      servicesWithGet: [],
      servicesWithSet: [],

      serviceWithGet: null,
      getter: null,
      serviceWithSet: null,
      setter: null
    };

    this.foxbox = props.foxbox;

    this.updateServices = this.updateServices.bind(this);
    this.handleServiceWithGetChange = this.handleServiceWithGetChange
      .bind(this);
    this.handleGetterChange = this.handleGetterChange.bind(this);
    this.handleServiceWithSetChange = this.handleServiceWithSetChange
      .bind(this);
    this.handleSetterChange = this.handleSetterChange.bind(this);
    this.handleActionButton = this.handleActionButton.bind(this);
  }

  componentDidMount() {
    Promise.all([
        this.foxbox.recipes.getServicesWithGetters(),
        this.foxbox.recipes.getServicesWithSetters()
      ])
      .then(services => {
        this.updateServices(services);
      })
      .catch(console.error.bind(console));
  }

  updateServices([servicesWithGet, servicesWithSet] = [[], []]) {
    this.setState({ servicesWithGet, servicesWithSet });
  }

  handleServiceWithGetChange(evt) {
    const serviceWithGet = evt.target.value;
    if (serviceWithGet !== '') {
      this.setState({ serviceWithGet });
    } else {
      this.setState({
        serviceWithGet: null,
        getter: null,
        serviceWithSet: null,
        setter: null
      });
    }
  }

  handleGetterChange(evt) {
    const getter = evt.target.value;
    if (getter !== '') {
      this.setState({ getter });
    } else {
      this.setState({
        getter: null,
        serviceWithSet: null,
        setter: null
      });
    }
  }

  handleServiceWithSetChange(evt) {
    const serviceWithSet = evt.target.value;
    if (serviceWithSet !== '') {
      this.setState({ serviceWithSet });
    } else {
      this.setState({
        serviceWithSet: null,
        setter: null
      });
    }
  }

  handleSetterChange(evt) {
    const setter = evt.target.value;
    if (setter !== '') {
      this.setState({ setter });
    } else {
      this.setState({
        setter: null
      });
    }
  }

  handleActionButton() {
    if (this.state.setter === null) {
      return;
    }

    const serviceWithGetObject = this.state
      .servicesWithGet[this.state.serviceWithGet];
    const getterObject = this.state
      .servicesWithGet[this.state.serviceWithGet].get[this.state.getter];
    const serviceWithSetObject = this.state
      .servicesWithSet[this.state.serviceWithSet];
    const setterObject = this.state
      .servicesWithSet[this.state.serviceWithSet].set[this.state.setter];
    const label = `${serviceWithGetObject.label} ${getterObject.label}, ` +
      `${serviceWithSetObject.label} ${setterObject.label}.`;

    this.foxbox.recipes.add({
        label,
        serviceWithGet: serviceWithGetObject.id,
        getter: getterObject.value,
        serviceWithSet: serviceWithSetObject.id,
        setter: setterObject.value,
        enabled: true
      })
      .then(() => {
        location.hash = '#themes';
      })
      .catch(console.error.bind(console));
  }

  render() {
    let optionNodes;

    let className = 'new-theme__select';
    if (this.state.serviceWithGet !== null) {
      className += ' new-theme__select--selected';
    }
    optionNodes = this.state.servicesWithGet.map((service, id) => (
      <option key={id} value={id}>{service.label}</option>
    ));
    let serviceSelector = (
      <select value={this.state.serviceWithGet}
              onChange={this.handleServiceWithGetChange}
              className={className}>
        <option value="">Select a device</option>
        {optionNodes}
      </select>
    );

    className = 'new-theme__select';
    if (this.state.getter !== null) {
      className += ' new-theme__select--selected';
    }
    let propertySelector = (
      <select className="new-theme__select new-theme__select--hidden"></select>
    );
    if (this.state.serviceWithGet !== null) {
      optionNodes = this.state.servicesWithGet[this.state.serviceWithGet].get
        .map((getter, id) => (
          <option key={id} value={id}>{getter.label}</option>
        ));
      propertySelector = (
        <select value={this.state.getter}
                onChange={this.handleGetterChange}
                className={className}>
          <option value="">Select a property</option>
          {optionNodes}
        </select>
      );
    }

    className = 'new-theme__select';
    if (this.state.serviceWithSet !== null) {
      className += ' new-theme__select--selected';
    }
    let actionServiceSelector = (
      <select className="new-theme__select new-theme__select--hidden"></select>
    );
    if (this.state.getter !== null) {
      optionNodes = this.state.servicesWithSet.map((service, id) => (
        <option key={id} value={id}>{service.label}</option>
      ));
      actionServiceSelector = (
        <select value={this.state.serviceWithSet}
                onChange={this.handleServiceWithSetChange}
                className={className}>
          <option value="">Select a device</option>
          {optionNodes}
        </select>
      );
    }

    className = 'new-theme__select';
    if (this.state.setter !== null) {
      className += ' new-theme__select--selected';
    }
    let actionPropertySelector = (
      <select className="new-theme__select new-theme__select--hidden"></select>
    );
    if (this.state.serviceWithSet !== null) {
      optionNodes = this.state.servicesWithSet[this.state.serviceWithSet].set
        .map((setter, id) => (
          <option key={id} value={id}>{setter.label}</option>
        ));
      actionPropertySelector = (
        <select value={this.state.setter}
                onChange={this.handleSetterChange}
                className={className}>
          <option value="">Select a property</option>
          {optionNodes}
        </select>
      );
    }

    let headerClassName = 'new-theme__header';
    if (this.state.getter === null) {
      headerClassName += ' new-theme__header--hidden';
    }

    let actionButtonClassName = 'app-view__action';
    if (this.state.setter === null) {
      actionButtonClassName += ' app-view__action--disabled';
    }

    return (
      <div className="app-view">
        <header className="app-view__header">
          <a href="#themes" className="app-view__action">Cancel</a>
          <h1>New Recipe</h1>
          <button className={actionButtonClassName}
                  onClick={this.handleActionButton}>Done
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

ThemesNew.propTypes = {
  foxbox: React.PropTypes.object.isRequired
};
