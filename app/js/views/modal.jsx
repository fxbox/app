/* global React */

export default class Modal extends React.Component {
  close() {
    this.props.dismiss();
  }

  render() {
    let style = 'modal' + (this.props.visible ? ' visible' : '');

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
