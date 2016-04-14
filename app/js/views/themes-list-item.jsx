import React from 'components/react';

export default class ThemesListItem extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      enabled: props.theme.enabled
    };

    this.foxbox = props.foxbox;
    this.handleOnChange = this.handleOnChange.bind(this);
    this.handleOnDelete = this.handleOnDelete.bind(this);
  }

  /**
   * Activate or deactivate a recipe.
   *
   * @param {SyntheticEvent} evt
   */
  handleOnChange(evt) {
    const enabled = evt.target.checked;

    this.setState({ enabled }); // Optimistic update.

    this.foxbox.recipes.toggle(this.props.theme, enabled)
      .catch(error => {
        this.setState({ enabled: !enabled }); // Revert back to previous value.
        console.error(error);
      });
  }

  /**
   * Delete a recipe.
   */
  handleOnDelete() {
    this.foxbox.recipes.remove(this.props.theme)
      .then(() => {
        this.props.update();
      })
      .catch(console.error.bind(console));
  }

  render() {
    let className = 'themes-list__item';
    if (!this.state.enabled) {
      className += ' themes-list__item--deactivated';
    }

    return (
      <li className={className}>
        <input className="themes-list__toggle"
               type="checkbox"
               checked={this.state.enabled}
               onChange={this.handleOnChange}/>
        <span className="themes-list__name">{this.props.theme.label}</span>
        <button className="themes-list__remove"
                onClick={this.handleOnDelete}></button>
      </li>
    );
  }
}

ThemesListItem.propTypes = {
  theme: React.PropTypes.object.isRequired,
  update: React.PropTypes.func.isRequired,
  foxbox: React.PropTypes.object.isRequired
};
