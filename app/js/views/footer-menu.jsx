/* global React */

export default class FooterMenu extends React.Component {
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
    ].map(menu => (
      <li key={menu[0]} className={route === menu[0] ? 'active' : undefined}>
        <a href={`#${menu[0]}`}>{menu[1]}</a>
      </li>));

    return (
      <footer>
        <ul className="footer">{menuNodes}</ul>
      </footer>
    );
  }
}
