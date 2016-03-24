/* global React */

import NavigationMenu from 'js/views/navigation-menu';

export default class CameraService extends React.Component {
  constructor(props) {
    super(props);
    this.foxbox = props.foxbox;
    this.service = props.service;

    this.state = {
      hasPreview: false,
      hasPreviousSnapshot: false
    };
  }

  getPreviewURL(fileName) {
    let serviceId = this.service.id;
    return this.foxbox.getAuthenticatedURL(
      `${this.foxbox.origin}/services/${serviceId}/get?filename=${fileName}`
    );
  }

  takeSnapshot() {
    this.foxbox.performServiceCommand(this.service.id, 'snapshot').then(
      (response) => {
        if (!response.filename) {
          throw new Error('Service did not return snapshot name!');
        }

        let previousSnapshot = this.refs.snapshotPreview.src;

        let newState = {
          hasPreview: true,
          hasPreviousSnapshot: false
        };

        this.refs.snapshotPreview.src = this.getPreviewURL(response.filename);

        if (previousSnapshot) {
          newState.hasPreviousSnapshot = true;
          this.refs.previousSnapshot.src = previousSnapshot;
        }

        this.setState(newState);
      }
    ).catch((e) => {
      console.error('Error occurred while making a snapshot: ', e);
    });
  }

  render() {
    let cameraControlsClass = 'app-view__body camera-controls';

    if (this.state.hasPreview) {
      cameraControlsClass += ' camera-controls--has-preview';
    }

    if (this.state.hasPreviousSnapshot) {
      cameraControlsClass += ' camera-controls--has-previous-snapshot';
    }

    return (
      <div className="app-view">
        <header className="app-view__header">
          <h1>{this.service.name}</h1>
        </header>
        <div className={cameraControlsClass}>
          <img ref="snapshotPreview"
               alt={'Snapshot preview'} className="camera-controls__preview" />
          <div className="camera-controls__empty-preview">
            <p>Preview is not available.</p>
            <p>Touch button to take a snapshot!</p>
          </div>
          <section className="camera-controls__snapshot-tools">
            <button className="camera-controls__snapshot-btn" type="button"
                    title="Take a snapshot"
                    onClick={this.takeSnapshot.bind(this)}>
            </button>
            <img ref="previousSnapshot"
                 className="camera-controls__previous-snapshot" />
          </section>
        </div>
        <footer className="app-view__footer">
          <NavigationMenu foxbox={this.foxbox}/>
        </footer>
      </div>
    );
  }
}
