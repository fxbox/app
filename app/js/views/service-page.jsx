/* global React */

import FooterMenu from 'js/views/footer-menu';
import TagList from 'js/views/tag-list';

export default class ServicePage extends React.Component {
  constructor(props) {
    super(props);
    this.props = props;
    this.state = {
      tags: [],
      name: props.data.name
    };

    this.db = props.db;
    this.foxbox = props.foxbox;
  }

  componentDidMount() {
    this.populateTags();
  }

  populateTags() {
    this.db.getTags()
      .then(tags => {
        tags.forEach(tag => {
          tag.data.checked = !!(this.props.data.tags && this.props.data.tags.includes(tag.id));
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
    this.db.setTag({ name: tagName })
      .then(() => {
        this.populateTags(); // Needed to get the newly added tag ID.
      });
  }

  render() {
    return (
      <div>
        <header>
          <h1>
            {this.state.name}
          </h1>
          <!--<img className="rename" src="css/icons/rename.svg" alt="Rename"/>-->
        </header>
        <h2>Tags</h2>
        <TagList tags={this.state.tags} serviceId={this.props.id} db={this.db}/>
        <div className="add">
          <span onClick={this.handleAddTag.bind(this)}>Create a new tag</span>
        </div>
        <FooterMenu/>
      </div>
    );
  }
}
