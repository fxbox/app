/* global React */

export default class FooterMenu extends React.Component {
  shouldComponentUpdate() {
    // We never need to update this component as it is being recreated each time
    // the route changes.
    return false;
  }

  render() {
    let route = window.location.hash.substr(1).split('/').shift();
    let menuNodes = [
      ['home', 'Home'],
      ['themes', 'Themes'],
      ['mr-fox', 'Mr. Fox'],
      ['settings', 'Settings']
    ].map(menu => (<li key={menu[0]}>
        <a href={`#${menu[0]}`} className={route === menu[0] ? 'active' : undefined}>{menu[1]}</a>
      </li>)
    );

    return (
      <footer>
        <ul className="footer">{menuNodes}</ul>
      </footer>
    );
  }
}
