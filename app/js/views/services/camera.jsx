import React from 'components/react';

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
   * Gets service "set" operation with the specified alias.
   *
   * @param {string} alias Alias of the operation we're looking for.
   * @return {Object} Operation associated with the specified alias.
   *
   * @private
   */
  getSetOperation(alias) {
    return this.getOperationByAlias(this.service.setters, alias);
  }

  /**
   * Gets service "get" operation with the specified alias.
   *
   * @param {string} alias Alias of the operation we're looking for.
   * @return {Object} Operation associated with the specified alias.
   *
   * @private
   */
  getGetOperation(alias) {
    return this.getOperationByAlias(this.service.getters, alias);
  }

  /**
   * Takes camera snapshot and displays it to the user.
   *
   * @private
   */
  takeSnapshot() {
    this.foxbox.performSetOperation(this.getSetOperation('TakeSnapshot'), '')
      .then(() => {
        return this.foxbox.performGetOperation(
          this.getGetOperation('latest image')
        );
      })
      .then((image) => {
        let previousSnapshot = this.refs.snapshotPreview.src;

        let newState = {
          hasPreview: true,
          hasPreviousSnapshot: false
        };

        this.refs.snapshotPreview.src = URL.createObjectURL(image);

        if (previousSnapshot) {
          newState.hasPreviousSnapshot = true;

          if (this.refs.previousSnapshot.src) {
            URL.revokeObjectURL(this.refs.previousSnapshot.src);
          }

          this.refs.previousSnapshot.src = previousSnapshot;
        }

        this.setState(newState);
      })
      .catch((e) => {
        console.error('Error occurred while making a snapshot: ', e);
      });
  }

  render() {
    let cameraControlsClass = 'app-view__fill-body camera-controls';

    if (this.state.hasPreview) {
      cameraControlsClass += ' camera-controls--has-preview';
    }

    if (this.state.hasPreviousSnapshot) {
      cameraControlsClass += ' camera-controls--has-previous-snapshot';
    }

    return (
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
    );
  }
}

CameraService.propTypes = {
  foxbox: React.PropTypes.object.isRequired,
  service: React.PropTypes.object.isRequired
};
