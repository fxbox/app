import React from 'components/react';

import BaseView from 'js/views/base-view';

// @todo Validate input on select onChange:
//    * Check if integer
//    * Check if value is within boundaries
//    * Check if properties belong to selected service

export default class ThemesNew extends BaseView {
  constructor(props) {
    super(props);

    this.state = {
      getters: [],
      setters: [],

      selectedGetterIndex: -1,
      selectedGetterValueIndex: -1,

      selectedSetterIndex: -1,
      selectedSetterValueIndex: -1,
    };

    this.foxbox = props.foxbox;

    this.updateServices = this.updateServices.bind(this);
    this.onGetterSelected = this.onGetterSelected.bind(this);
    this.onGetterValueSelected = this.onGetterValueSelected.bind(this);
    this.onSetterSelected = this.onSetterSelected.bind(this);
    this.onSetterValueSelected = this.onSetterValueSelected.bind(this);
    this.onSaveRecipe = this.onSaveRecipe.bind(this);
  }

  componentDidMount() {
    Promise.all([
      this.foxbox.recipes.getGetters(),
      this.foxbox.recipes.getSetters(),
    ])
    .then((services) => this.updateServices(services))
    .catch(console.error.bind(console));
  }

  updateServices([getters, setters] = [[], []]) {
    this.setState({ getters, setters });
  }

  onGetterSelected(evt) {
    let selectedGetterIndex = -1;

    if (evt.target.value) {
      selectedGetterIndex = Number(evt.target.value);
    }

    this.setState({
      selectedGetterIndex,
      selectedGetterValueIndex: -1,

      selectedSetterIndex: -1,
      selectedSetterValueIndex: -1,
    });
  }

  onGetterValueSelected(evt) {
    let selectedGetterValueIndex = -1;

    if (evt.target.value) {
      selectedGetterValueIndex = Number(evt.target.value);
    }

    this.setState({
      selectedGetterValueIndex,

      selectedSetterIndex: -1,
      selectedSetterValueIndex: -1,
    });
  }

  onSetterSelected(evt) {
    let selectedSetterIndex = -1;

    if (evt.target.value) {
      selectedSetterIndex = Number(evt.target.value);
    }

    this.setState({
      selectedSetterIndex,
      selectedSetterValueIndex: -1,
    });
  }

  onSetterValueSelected(evt) {
    let selectedSetterValueIndex = -1;

    if (evt.target.value) {
      selectedSetterValueIndex = Number(evt.target.value);
    }

    this.setState({
      selectedSetterValueIndex,
    });
  }

  onSaveRecipe() {
    if (this.state.selectedSetterValueIndex < 0) {
      return;
    }

    const getter = this.state.getters[this.state.selectedGetterIndex];
    const getterValue = getter.options[this.state.selectedGetterValueIndex];

    const setter = this.state.setters[this.state.selectedSetterIndex];
    const setterValue = setter.options[this.state.selectedSetterValueIndex];

    const name = `${getter.name} ${getterValue.label}, ` +
      `${setter.name} ${setterValue.label}.`;

    this.foxbox.recipes.add({
      name,
      getter,
      getterValue,
      setter,
      setterValue,
    })
    .then(() => {
      location.hash = '#themes';
    })
    .catch((error) => {
      console.log('Error occurred while saving recipe: ', error);
    });
  }

  renderHeader() {
    let actionButtonClassName = 'app-view__action';
    if (this.state.setter === null) {
      actionButtonClassName += ' app-view__action--disabled';
    }

    return (
      <header className="app-view__header">
        <a href="#themes" className="app-view__action">Cancel</a>
        <h1>New Recipe</h1>
        <button className={actionButtonClassName}
                onClick={this.onSaveRecipe}>Done
        </button>
      </header>
    );
  }

  renderBody() {
    let headerClassName = 'new-theme__header';
    if (this.state.selectedGetterValueIndex < 0) {
      headerClassName += ' new-theme__header--hidden';
    }

    return (
      <div className="app-view__fill-body new-theme">
        <h2 className="new-theme__header">If</h2>
        {this.renderGetterSelector()}
        {this.renderGetterValueSelector()}

        <h2 className={headerClassName}>Do</h2>
        {this.renderSetterSelector()}
        {this.renderSetterValueSelector()}
      </div>
    );
  }

  renderGetterSelector() {
    let className = 'new-theme__select';
    if (this.state.selectedGetterIndex >= 0) {
      className += ' new-theme__select--selected';
    }

    const optionNodes = this.state.getters.map((getter, index) => (
      <option key={index} value={index}>{this.getChannelName(getter)}</option>
    ));

    return (
      <select value={this.state.selectedGetterIndex}
              onChange={this.onGetterSelected}
              className={className}>
        <option value="">Select a device</option>
        {optionNodes}
      </select>
    );
  }

  renderGetterValueSelector() {
    if (this.state.selectedGetterIndex < 0) {
      // @todo Rethink styling to avoid redundant element.
      return (
        <select className="new-theme__select new-theme__select--hidden">
        </select>
      );
    }

    let className = 'new-theme__select';
    if (this.state.selectedGetterValueIndex >= 0) {
      className += ' new-theme__select--selected';
    }

    const options = this.state.getters[this.state.selectedGetterIndex].options;
    const optionNodes = options.map((option, index) => (
      <option key={index} value={index}>{option.label}</option>
    ));

    return (
      <select value={this.state.selectedGetterValueIndex}
              onChange={this.onGetterValueSelected}
              className={className}>
        <option value="">Select a property</option>
        {optionNodes}
      </select>
    );
  }

  renderSetterSelector() {
    if (this.state.selectedGetterValueIndex < 0) {
      return (
        <select className="new-theme__select new-theme__select--hidden">
        </select>
      );
    }

    let className = 'new-theme__select';
    if (this.state.selectedSetterIndex >= 0) {
      className += ' new-theme__select--selected';
    }

    const optionNodes = this.state.setters.map((setter, index) => (
      <option key={index} value={index}>{this.getChannelName(setter)}</option>
    ));

    return (
      <select value={this.state.selectedSetterIndex}
              onChange={this.onSetterSelected}
              className={className}>
        <option value="">Select a device</option>
        {optionNodes}
      </select>
    );
  }

  renderSetterValueSelector() {
    if (this.state.selectedSetterIndex < 0) {
      return (
        <select className="new-theme__select new-theme__select--hidden">
        </select>
      );
    }

    let className = 'new-theme__select';
    if (this.state.setter !== null) {
      className += ' new-theme__select--selected';
    }

    const options = this.state.setters[this.state.selectedSetterIndex].options;
    const optionNodes = options.map((option, index) => (
      <option key={index} value={index}>{option.label}</option>
    ));

    return (
      <select value={this.state.selectedSetterValueIndex}
              onChange={this.onSetterValueSelected}
              className={className}>
        <option value="">Select a property</option>
        {optionNodes}
      </select>
    );
  }

  getChannelName(channel) {
    // If channel has tags, let's use them as channel identifier.
    const tags = channel.tags.join(', ');
    return tags ? `${channel.name} (${tags})` : channel.name;
  }
}

ThemesNew.propTypes = {
  foxbox: React.PropTypes.object.isRequired,
};
