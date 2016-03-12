/* global React */

import UserLogoutButton from 'js/views/user-logout-button';
import NavigationMenu from 'js/views/navigation-menu';
import TagList from 'js/views/tag-list';

export default class Service extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      data: props.service.tags,
      tags: []
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
    if (service.id !== this.props.id) {
      return;
    }

    this.service = service;
    this.setState({ data: service.tags });
  }

  populateTags() {
    this.foxbox.getTags()
      .then(tags => {
        tags.forEach(tag => {
          tag.data.checked = !!(this.state.data && this.state.data.includes(tag.id));
        });

        this.setState({ tags: tags });
      });
  }

  handleAddTag() {
    let tagName = prompt('Enter new tag name');

    if (!tagName || !tagName.trim()) {
      return;
    }

    tagName = tagName.trim();
    this.foxbox.setTag({ name: tagName })
      .then(() => {
        this.populateTags(); // Needed to get the newly added tag ID.
      });
  }

  render() {
    return (
      <div className="app-view">
        <header className="app-view__header">
          <h1>{this.service.name}</h1>
          <UserLogoutButton foxbox={this.foxbox}/>
          <!--<img className="rename" src="css/icons/rename.svg" alt="Rename"/>-->
        </header>
        <section className="app-view__body">
          <h2>Tags</h2>
          <TagList tags={this.state.tags} serviceId={this.service.id} foxbox={this.foxbox}/>
        </section>
        <button className="add-tag-button" type="button"
                onClick={this.handleAddTag.bind(this)}>
          Create a new tag
        </button>
        <footer className="app-view__footer">
          <NavigationMenu />
        </footer>
      </div>
    );
  }
}
