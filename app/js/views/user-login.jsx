/* global React */

import Modal from 'js/views/modal';

export default class UserLogin extends React.Component {
  constructor(props) {
    this.foxbox = props.foxbox;
  }

  handleOnSubmit(evt) {
    evt.preventDefault(); // Avoid redirection to /?.

    this.foxbox.login();
  }

  render() {
    return (
      <div>
        <header className="white">
          <h1>Project Link</h1>
        </header>
        <form className="user-login" onSubmit={this.handleOnSubmit.bind(this)}>
          <img src="img/icon.svg"/>
          <button>Log in</button>
        </form>
      </div>
    );
  }
}
