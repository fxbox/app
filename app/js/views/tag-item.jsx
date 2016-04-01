/* global React */

export default class TagItem extends React.Component {
  constructor(props) {
    super(props);

    this.props = props;
    this.state = {
      checked: props.checked
    };

    this.foxbox = props.foxbox;
  }

  handleSetTag(evt) {
    const checked = evt.target.checked;
    this.setState({ checked });

    this.foxbox.getService(this.props.serviceId)
      .then(service => {
        if (!service.data.tags) {
          service.data.tags = [];
        }

        service.data.tags = service.data.tags.filter(
          tag => tag !== this.props.id
        );
        if (checked) {
          service.data.tags.push(this.props.id);
        }

        this.foxbox.setService(service.data);
      })
      .catch(error => {
        this.setState({ checked: !checked }); // Revert back to original state.
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
                 onChange={this.handleSetTag.bind(this)}/>
          {this.props.name}
        </label>
      </li>
    );
  }
}

TagItem.propTypes = {
  foxbox: React.PropTypes.object.isRequired,
  checked: React.PropTypes.bool,
  id: React.PropTypes.string.isRequired,
  name: React.PropTypes.string.isRequired,
  serviceId: React.PropTypes.string.isRequired
};
