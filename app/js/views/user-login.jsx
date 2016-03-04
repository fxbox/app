/* global React */

import Modal from 'js/views/modal';

export default class UserLogin extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      username: '',
      password: '',

      isModalVisible: false,
      title: '',
      body: ''
    };

    this.foxbox = props.foxbox;
  }

  handleOnChange(state, evt) {
    this.setState({ [state]: evt.target.value });
  }

  handleOnSubmit() {
    this.foxbox.login(this.state.username, this.state.password)
      .then(() => {
        window.location.hash = '#services';
      })
      .catch(error => {
        this.setState({
          isModalVisible: true,
          title: 'Login failed',
          body: error.message || 'Please double check you credentials.'
        });
      });
  }

  dismissModal() {
    this.setState({ isModalVisible: false });
  }

  render() {
    return (
      <div>
        <header>
          <h1>Project Link</h1>
        </header>
        <form className="user-login" onSubmit={this.handleOnSubmit.bind(this)}>
          <label><span>User</span><input type="text" value={this.state.username} autoFocus
            onChange={this.handleOnChange.bind(this, 'username')}/></label>
          <label><span>Password</span><input type="password" value={this.state.password}
            onChange={this.handleOnChange.bind(this, 'password')}/></label>
          <button>Log in</button>
        </form>
        <Modal visible={this.state.isModalVisible} title={this.state.title} body={this.state.body} dismiss={this.dismissModal.bind(this)}/>
      </div>
    );
  }
}
