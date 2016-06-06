import React from 'components/react';

import BaseView from './base-view';
import TagList from './tag-list';

export default class ServiceTags extends BaseView {
  constructor(props) {
    super(props);

    this.state = { service: null, tags: [] };
    this.foxbox = props.foxbox;

    this.onServiceStateChanged = this.onServiceStateChanged.bind(this);
  }

  componentDidMount() {
    this.foxbox.services.get(this.props.id)
      .then((service) => {
        this.setState({ service, tags: service.getTags() });
      })
      .catch((error) => {
        console.error('Error occurred while retrieving service: ', error);
      });

    this.foxbox.services.on('service-changed', this.onServiceStateChanged);
  }

  componentWillUnmount() {
    this.foxbox.services.off('service-changed', this.onServiceStateChanged);
  }

  onServiceStateChanged(service) {
    if (service.id !== this.props.id) {
      return;
    }

    this.setState({ service, tags: service.getTags() });
  }

  onAddTag() {
    const service = this.state.service;
    if (!service) {
      return;
    }

    const tag = (prompt('Enter new tag name') || '').trim();
    if (!tag) {
      return;
    }

    service.addTag(tag)
      .catch((err) => {
        // Restore actual tag list if server failed to add tag.
        console.error(`Could not add the tag "${tag}": %o`, err);
        this.setState({ tags: service.getTags() });
      });

    this.setState({ tags: service.getTags() });
  }

  onRemoveTag(tag) {
    const service = this.state.service;

    service.removeTag(tag)
      .catch((err) => {
        // Restore actual tag list if server failed to remove tag.
        console.error(`Could not remove the tag "${tag}": %o`, err);
        this.setState({ tags: service.getTags() });
      });

    this.setState({ tags: service.getTags() });
  }

  renderHeader() {
    const service = this.state.service;
    return super.renderHeader(
      service && service.name ?
        service.name :
        'Unknown Service'
    );
  }

  renderBody() {
    return (
      <div className="app-view__fill-body">
        <h2>Tags</h2>
        <TagList tags={this.state.tags}
                 onRemoveTag={this.onRemoveTag.bind(this)} />
        <button className="add-tag-button" type="button"
                onClick={this.onAddTag.bind(this)}>
          Create a new tag
        </button>
      </div>
    );
  }
}

ServiceTags.propTypes = {
  foxbox: React.PropTypes.object.isRequired,
  id: React.PropTypes.string.isRequired,
};
