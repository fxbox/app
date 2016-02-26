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

    this.db.getService(this.props.serviceId)
      .then(service => {
        if (!service.data.tags) {
          service.data.tags = [];
        }

        service.data.tags = service.data.tags.filter(tag => tag !== this.props.id);
        if (value) {
          service.data.tags.push(this.props.id);
        }

        this.db.setService(service.data);
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
