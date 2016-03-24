/* global React */

export default class NavigationMenu extends React.Component {
  constructor(props) {
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
    let route = location.hash.substr(1).split('/').shift();
    let menuNodes = [
      ['services', 'Home'],
      ['themes', 'Themes'],
      ['mr-fox', 'Mr. Fox']
    ].map((menu) => {
      let className = 'navigation-menu__item';
      if (route === menu[0]) {
        className += ' navigation-menu__item--active';
      }

      return (
        <li key={menu[0]} className={className}>
          <a href={`#${menu[0]}`} className="navigation-menu__item-link">
            {menu[1]}
          </a>
        </li>
      );
    });

    return (
      <ul className="navigation-menu">
        {menuNodes}
        <li className="navigation-menu__item">
          <a href="#users/login" className="navigation-menu__item-link user-logout-button" onClick={this.handleOnClick.bind(this)}>
            Log out
          </a>
        </li>
      </ul>
    );
  }
}
