import React from 'components/react';

import ThemesListItem from 'js/views/themes-list-item';
import NavigationMenu from 'js/views/navigation-menu';

// @todo Allow editing existing recipes when clicking on the label.

export default class Themes extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      themes: []
    };

    this.foxbox = props.foxbox;
    this.update = this.update.bind(this);
  }

  componentDidMount() {
    this.update();
  }

  update() {
    this.foxbox.recipes.getAll()
      .then(themes => {
        this.setState({ themes });
      })
      .catch(console.error.bind(console));
  }

  render() {
    const themeItems = this.state.themes.map(theme => (
      <ThemesListItem key={theme.id}
                      theme={theme}
                      update={this.update}
                      foxbox={this.foxbox}/>
    ));

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

Themes.propTypes = {
  foxbox: React.PropTypes.object.isRequired
};
