import React from 'components/react';

import BaseView from 'js/views/base-view';

export default class CameraLatestImage extends BaseView {
  constructor(props) {
    super(props);

    this.state = {
      service: null,
      hasPreview: false
    };
    this.foxbox = props.foxbox;
  }

  componentDidMount() {
    this.foxbox.getService(this.props.id).then((response) => {
      const service = response.data;

      this.setState({ service });

      return this.foxbox.performGetOperation(
        this.getGetOperation(service, 'latest image')
      );
    })
    .then((image) => {
      this.refs.snapshotPreview.src = URL.createObjectURL(image);
      this.setState({ hasPreview: true });
    })
    .catch((e) => {
      console.error(
        'Error occurred while retrieving latest image for camera (id=%s): ',
        this.props.id,
        e
      );
    });
  }

  renderHeader() {
    return super.renderHeader(
      this.state.service && this.state.service.properties.name ?
        this.state.service.properties.name :
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

  /**
   * Gets service operation with the specified alias.
   *
   * @param {Array<Object>} operations List of available service operations.
   * @param {string} alias Alias of the operation we're looking for.
   * @return {Object} Operation associated with the specified alias.
   *
   * @private
   */
  getOperationByAlias(operations, alias) {
    let operationKey = Object.keys(operations).find((key) => {
      let operation = operations[key];

      if (typeof operation.kind === 'object') {
        return operation.kind.kind === alias;
      }

      return operation.kind === alias;
    });

    return operations[operationKey];
  }

  /**
   * Gets service "get" operation with the specified alias.
   *
   * @param {Object} service Service instance.
   * @param {string} alias Alias of the operation we're looking for.
   * @return {Object} Operation associated with the specified alias.
   *
   * @private
   */
  getGetOperation(service, alias) {
    return this.getOperationByAlias(service.getters, alias);
  }
}

CameraLatestImage.propTypes = {
  foxbox: React.PropTypes.object.isRequired,
  id: React.PropTypes.string.isRequired
};
