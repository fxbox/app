/* global React */

export default class Modal extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      visible: this.props.visible
    };
  }

  close() {
    this.setState({ visible: false });
  }

  render() {
    let style = 'modal' + (this.state.visible ? ' visible' : '');

    return (
      <div className={style}>
        <header>
          <h1>{this.props.title}</h1>
        </header>
        <div>{this.props.body}</div>
        <footer>
          <button onClick={this.close.bind(this)}>Close</button>
        </footer>
      </div>
    );
  }
}
