/* global React */

import FooterMenu from 'js/views/footer-menu';
import TagList from 'js/views/tag-list';

export default class DevicePage extends React.Component {
  constructor(props) {
    super(props);
    this.props = props;
    this.state = {
      tags: [],
      name: props.name
    };

    this.db = props.db;
    this.hue = props.hue;
  }

  componentDidMount() {
    this.populateTags();
  }

  populateTags() {
    Promise.all([
        this.db.getDevice(this.props.uniqueid),
        this.db.getTags()
      ])
      .then(response => {
        let device = response[0];
        let tags = response[1];

        tags.forEach(tag => {
          tag.data.checked = !!(device.data.tags && device.data.tags.includes(tag.id));
        });

        this.setState({ tags: tags });
      });
  }

  handleRename() {
    const oldName = this.state.name;
    let deviceName = prompt('Enter new device name', oldName);

    if (!deviceName || !deviceName.trim()) {
      return;
    }

    deviceName = deviceName.trim();

    this.setState({ name: deviceName }); // Optimist update.

    this.hue.changeLightAttribute(this.props.lightId, { name: deviceName })
      .catch(error => {
        this.setState({ name: oldName }); // Revert to previous value.
        console.error(error);
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
        <h1>
          {this.state.name}
          <img className="rename" src="css/icons/rename.svg" alt="Rename" onClick={this.handleRename.bind(this)}/>
        </h1>
        <h2>Tags</h2>
        <TagList tags={this.state.tags} deviceId={this.props.uniqueid} db={this.db}/>
        <div className="add">
          <span onClick={this.handleAddTag.bind(this)}>Create a new tag</span>
        </div>
        <FooterMenu/>
      </div>
    );
  }
}
