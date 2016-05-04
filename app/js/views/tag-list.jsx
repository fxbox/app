import React from 'components/react';

export default class TagList extends React.Component {
  render() {
    let tagNodes = this.props.tags.map((tag) => (
      <li key={tag} className="tag-list__item">
        {tag}
        <button className="tag-list__item-remove"
                type="button"
                onClick={this.props.onRemoveTag.bind(null, tag)}
                title="Remove tag"></button>
      </li>
    ));

    return (
      <ul className="tag-list">{tagNodes}</ul>
    );
  }
}

TagList.propTypes = {
  tags: React.PropTypes.array.isRequired,
  onRemoveTag: React.PropTypes.func.isRequired,
};
