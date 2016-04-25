import React from 'components/react';

import TagList from 'js/views/tag-list';

export default class LightService extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      data: props.service.tags,
      tags: [],
    };

    this.foxbox = props.foxbox;
    this.service = props.service;

    this.onServiceStateChanged = this.onServiceStateChanged.bind(this);
  }

  componentDidMount() {
    this.populateTags();

    this.foxbox.addEventListener(
      'service-state-change', this.onServiceStateChanged
    );
  }

  componentWillUnmount() {
    this.foxbox.removeEventListener(
      'service-state-change', this.onServiceStateChanged
    );
  }

  onServiceStateChanged(service) {
    if (service.id !== this.service.id) {
      return;
    }

    this.service = service;
    this.setState({ data: service.tags });
  }

  populateTags() {
    this.foxbox.getTags()
      .then((tags) => {
        tags.forEach((tag) => {
          tag.checked = !!(this.state.data && this.state.data.includes(tag.id));
        });

        this.setState({ tags });
      });
  }

  handleAddTag() {
    let name = prompt('Enter new tag name');

    if (!name || !name.trim()) {
      return;
    }

    name = name.trim();
    this.foxbox.setTag({ name })
      .then(() => {
        this.populateTags(); // Needed to get the newly added tag ID.
      });
  }

  render() {
    return (
      <div className="app-view__fill-body">
        <h2>Tags</h2>
        <TagList tags={this.state.tags} serviceId={this.service.id}
                 foxbox={this.foxbox}/>
        <button className="add-tag-button" type="button"
                onClick={this.handleAddTag.bind(this)}>
          Create a new tag
        </button>
      </div>
    );
  }
}

LightService.propTypes = {
  foxbox: React.PropTypes.object.isRequired,
  service: React.PropTypes.object.isRequired,
};
