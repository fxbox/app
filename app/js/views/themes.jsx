import React from 'components/react';

import BaseView from 'js/views/base-view';
import ThemesListItemView from 'js/views/themes-list-item';

// @todo Allow editing existing recipes when clicking on the label.

export default class Themes extends BaseView {
  constructor(props) {
    super(props);

    this.state = {
      themes: [],
    };

    this.foxbox = props.foxbox;
    this.update = this.update.bind(this);
  }

  componentDidMount() {
    this.update();
  }

  update() {
    this.foxbox.recipes.getAll()
      .then((themes) => {
        this.setState({ themes });
      })
      .catch(console.error.bind(console));
  }

  renderHeader() {
    return (
      <header className="app-view__header">
        <h1>Recipes</h1>
        <a href="#themes/new" className="themes__new-link">
          <img className="app-view__action-icon"
               src="css/icons/plus.svg"
               alt="Add a recipe"/>
        </a>
      </header>
    );
  }

  renderBody() {
    const themeItems = this.state.themes.map((theme) => (
      <ThemesListItemView key={theme.id}
                          theme={theme}
                          update={this.update}
                          foxbox={this.foxbox} />
    ));

    return (
      <div className="app-view__fill-body themes">
        <ul className="themes-list">{themeItems}</ul>
      </div>
    );
  }
}

Themes.propTypes = {
  foxbox: React.PropTypes.object.isRequired,
};
