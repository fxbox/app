/* global React */

import TagItem from 'js/views/tag-item';

export default class TagList extends React.Component {
  constructor(props) {
    super(props);
    this.db = props.db;
  }

  render() {
    let tagNodes = this.props.tags.map(tag => (
        <TagItem
          key={tag.id}
          id={tag.id}
          name={tag.data.name}
          checked={tag.data.checked}
          serviceId={this.props.serviceId}
          db={this.db}/>
      )
    );

    return (
      <ul className="tag-list">{tagNodes}</ul>
    );
  }
}
