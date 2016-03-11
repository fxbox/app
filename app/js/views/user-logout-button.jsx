/* global React */

export default class UserLogoutButton extends React.Component {
  constructor(props) {
    this.foxbox = props.foxbox;
  }

  handleOnClick() {
    this.foxbox.logout();

    // Once logged out, we redirect to the login page.
    location.hash = '#users/login';
  }

  render() {
    if (!this.foxbox.isLoggedIn) {
      return (<div hidden></div>);
    }

    return (
      <button className="user-logout-button" onClick={this.handleOnClick.bind(this)}>Log out</button>
    );
  }
}
