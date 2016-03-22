/* global React */

import UserLogoutButton from 'js/views/user-logout-button';
import FooterMenu from 'js/views/footer-menu';
import TagList from 'js/views/tag-list';

export default class Service extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      data: {},
      tags: []
    };

    this.foxbox = props.foxbox;

    this.updateServiceState = this.updateServiceState.bind(this);
  }

  componentDidMount() {
    this.foxbox.getService(this.props.id)
      .then(service => {
        this.updateServiceState(service.data);
      })
      .catch(console.error.bind(console));

    this.populateTags();

    this.foxbox.addEventListener('service-state-change', this.updateServiceState);
  }

  componentWillUnmount() {
    this.foxbox.removeEventListener('service-state-change', this.updateServiceState);
  }

  updateServiceState(state) {
    if (state.id !== this.props.id) {
      return;
    }

    this.setState({ data: state });
  }

  populateTags() {
    this.foxbox.getTags()
      .then(tags => {
        tags.forEach(tag => {
          tag.data.checked = !!(this.state.data.tags && this.state.data.tags.includes(tag.id));
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
      <div>
        <header>
          <h1>{this.state.data.name}</h1>
          <UserLogoutButton foxbox={this.foxbox}/>
          <!--<img className="rename" src="css/icons/rename.svg" alt="Rename"/>-->
        </header>
        <h2>Tags</h2>
        <TagList tags={this.state.tags} serviceId={this.props.id} foxbox={this.foxbox}/>
        <div className="add">
          <span onClick={this.handleAddTag.bind(this)}>Create a new tag</span>
        </div>
        <FooterMenu/>
      </div>
    );
  }
}
