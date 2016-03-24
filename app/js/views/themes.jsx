/* global React */

import NavigationMenu from 'js/views/navigation-menu';

export default class Themes extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      themes: []
    };

    this.foxbox = props.foxbox;
  }

  componentDidMount() {
    this.foxbox.getRecipes()
      .then(themes => {
        this.setState({ themes });
      })
      .catch(console.error.bind(console));
  }

  /**
   * Activate or deactivate a recipe.
   *
   * @param {number} id
   * @param {SyntheticEvent} evt
   */
  handleOnChange(id, evt) {
    const value = evt.target.checked;

    this.foxbox.toggleRecipe(id, value)
      .then(themes => {
        this.setState({ themes });
      })
      .catch(console.error.bind(console));
  }

  /**
   * Delete a recipe.
   *
   * @param {number} id
   */
  handleOnDelete(id) {
    this.foxbox.removeRecipe(id)
      .then(themes => {
        this.setState({ themes });
      })
      .catch(console.error.bind(console));
  }

  render() {
    const themeItems = this.state.themes.map((theme, id) => {
      let itemClassName = 'themes-list__item';
      if (!theme.enabled) {
        itemClassName += ' themes-list__item--deactivated';
      }

      return (
        <li key={id}
            className={itemClassName}>
          <input className="themes-list__toggle" type="checkbox"
                 checked={theme.enabled}
                 onChange={this.handleOnChange.bind(this, id)}/>
          <span className="themes-list__name">{theme.name}</span>
          <button className="themes-list__remove"
                  onClick={this.handleOnDelete.bind(this, id)}></button>
        </li>
      );
    });

    return (
      <div className="app-view">
        <header className="app-view__header">
          <h1>Recipes</h1>
          <a href="#themes/new" className="themes__new-link">
            <img className="app-view__action-icon"
                 src="css/icons/plus.svg"
                 alt="Add a recipe"/>
          </a>
        </header>
        <section className="app-view__body themes">
          <ul className="themes-list">{themeItems}</ul>
        </section>
        <footer className="app-view__footer">
          <NavigationMenu foxbox={this.foxbox}/>
        </footer>
      </div>
    );
  }
}
