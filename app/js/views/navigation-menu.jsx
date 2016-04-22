import React from 'components/react';

export default class NavigationMenu extends React.Component {
  constructor(props) {
    super(props);

    this.foxbox = props.foxbox;
  }

  shouldComponentUpdate() {
    // We never need to update this component as it is being recreated each time
    // the route changes.
    return false;
  }

  handleOnClick() {
    this.foxbox.logout();
  }

  render() {
    const route = location.hash.substr(1).split('/').shift();
    let menuNodes = [
      {
        id: 'services',
        label: 'Home',
      },
      {
        id: 'themes',
        label: 'Themes',
      },
      {
        id: 'mr-fox',
        label: 'Mr. Fox',
      },
    ].map((menu) => {
      let className = 'navigation-menu__item';
      if (route === menu.id) {
        className += ' navigation-menu__item--active';
      }

      return (
        <li key={menu.id} className={className}>
          <a href={`#${menu.id}`}
             className="navigation-menu__item-link">
            {menu.label}
          </a>
        </li>
      );
    });

    return (
      <ul className="navigation-menu">
        {menuNodes}
        <li className="navigation-menu__item">
          <a href="#users/login"
             className="navigation-menu__item-link user-logout-button"
             onClick={this.handleOnClick.bind(this)}>
            Log out
          </a>
        </li>
      </ul>
    );
  }
}

NavigationMenu.propTypes = {
  foxbox: React.PropTypes.object.isRequired,
};
