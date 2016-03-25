/* global React */

export default class UserLogin extends React.Component {
  constructor(props) {
    this.state = {
      boxes: props.foxbox.boxes,
      value: null
    };

    this.foxbox = props.foxbox;
  }

  handleOnChange(evt) {
    const value = evt.target.selectedIndex;

    this.setState({ value });
    this.foxbox.selectBox(value);
  }

  handleOnSubmit(evt) {
    evt.preventDefault(); // Avoid redirection to /?.

    this.foxbox.login();
  }

  render() {
    let boxes = (<div hidden></div>);

    if (this.state.boxes.length > 1) {
      let value = this.state.value !== null ? 0 : this.state.value;
      const options = this.state.boxes.map((box, index) => {
        if (box.local_ip === this.foxbox.localHostname) {
          value = index;
        }
        const label = box.local_ip + (box.tunnel_url ? ` / ${box.tunnel_url}` : '');
        return (
          <option key={box.local_ip} value={index}>{label}</option>
        );
      });

      boxes = (<select
        className="user-login__box-selector"
        value={value}
        onChange={this.handleOnChange.bind(this)}>{options}</select>);
    }

    return (
      <div className="app-view">
        <header className="app-view__header app-view__header--white">
          <h1>Project Link</h1>
        </header>
        <form className="app-view__body user-login"
              onSubmit={this.handleOnSubmit.bind(this)}>
          <img className="user-login__logo" src="img/icon.svg"/>
          {boxes}
          <button className="user-login__login-button">Log in</button>
        </form>
      </div>
    );
  }
}
