import React from 'components/react';

export default class TagItem extends React.Component {
  constructor(props) {
    super(props);

    this.props = props;
    this.state = {
      checked: props.checked,
    };

    this.foxbox = props.foxbox;
  }

  handleSetTag(evt) {
    this.setState({ checked: evt.target.checked });

    console.error('Tag management is not supported yet!');
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
  id: React.PropTypes.number.isRequired,
  name: React.PropTypes.string.isRequired,
  serviceId: React.PropTypes.string.isRequired,
};
