import React from 'components/react';

import BaseView from 'js/views/base-view';

export default class CameraLatestImage extends BaseView {
  constructor(props) {
    super(props);

    this.state = {
      service: null,
      hasPreview: false,
    };

    this.foxbox = props.foxbox;
  }

  componentDidMount() {
    this.foxbox.services.get(this.props.id)
      .then((service) => {
        this.setState({ service });

        return service.getLatestImage();
      })
      .then((image) => {
        this.refs.snapshotPreview.src = URL.createObjectURL(image);
        this.setState({ hasPreview: true });
      })
      .catch((error) => {
        console.error(
          'Error occurred while retrieving latest image for camera (id=%s): ',
          this.props.id,
          error
        );
      });
  }

  renderHeader() {
    return super.renderHeader(
      this.state.service && this.state.service.name ?
        this.state.service.name :
        'Unknown Service'
    );
  }

  renderBody() {
    let cameraControlsClass = 'app-view__fill-body camera-controls';
    if (this.state.hasPreview) {
      cameraControlsClass += ' camera-controls--has-preview';
    }

    return (
      <div className={cameraControlsClass}>
        <img ref="snapshotPreview"
             style={{ flexGrow: 0 }}
             alt={'Snapshot preview'} className="camera-controls__preview" />
        <div className="camera-controls__empty-preview">
          <p>Preview is being loaded.</p>
          <p>Wait a moment please!</p>
        </div>
      </div>
    );
  }
}

CameraLatestImage.propTypes = {
  foxbox: React.PropTypes.object.isRequired,
  id: React.PropTypes.string.isRequired,
};
