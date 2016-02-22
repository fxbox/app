/* global React */

export default class TagItem extends React.Component {
  constructor(props) {
    super(props);
    this.props = props;
    this.state = { checked: props.checked };

    this.db = props.db;
  }

  handleSetTag(evt) {
    let value = evt.target.checked;
    this.setState({ checked: value });

    this.db.getDevice(this.props.deviceId)
      .then(device => {
        if (!device.data.tags) {
          device.data.tags = [];
        }

        device.data.tags = device.data.tags.filter(tag => tag !== this.props.id);
        if (value) {
          device.data.tags.push(this.props.id);
        }

        this.db.setDevice(device.data);
      })
      .catch(error => {
        this.setState({ checked: !value }); // Revert back to original state.
        console.error(error);
      });
  }

  render() {
    return (
      <li>
        <label><input
          type="checkbox"
          checked={this.state.checked}
          onChange={this.handleSetTag.bind(this)}/>
        {this.props.name}</label>
      </li>
    );
  }
}
