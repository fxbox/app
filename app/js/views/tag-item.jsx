/* global React */

export default class TagItem extends React.Component {
  constructor(props) {
    super(props);
    this.props = props;
    this.state = { checked: props.checked };

    this.foxbox = props.foxbox;
  }

  handleSetTag(evt) {
    let value = evt.target.checked;
    this.setState({ checked: value });

    this.foxbox.getService(this.props.serviceId)
      .then(service => {
        if (!service.data.tags) {
          service.data.tags = [];
        }

        service.data.tags = service.data.tags.filter(tag => tag !== this.props.id);
        if (value) {
          service.data.tags.push(this.props.id);
        }

        this.foxbox.setService(service.data);
      })
      .catch(error => {
        this.setState({ checked: !value }); // Revert back to original state.
        console.error(error);
      });
  }

  render() {
    return (
      <li className="tag-list__item">
        <label>
          <input className="tag-list__item-checkbox"
                 type="checkbox"
                 checked={this.state.checked}
                 onChange={this.handleSetTag.bind(this)} />
          {this.props.name}
        </label>
      </li>
    );
  }
}
