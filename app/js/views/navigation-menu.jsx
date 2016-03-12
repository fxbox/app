/* global React */

export default class NavigationMenu extends React.Component {
  shouldComponentUpdate() {
    // We never need to update this component as it is being recreated each time
    // the route changes.
    return false;
  }

  render() {
    let route = location.hash.substr(1).split('/').shift();
    let menuNodes = [
      ['services', 'Home'],
      ['themes', 'Themes'],
      ['mr-fox', 'Mr. Fox'],
      ['settings', 'Settings']
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

    return (<ul className="navigation-menu">{menuNodes}</ul>);
  }
}
