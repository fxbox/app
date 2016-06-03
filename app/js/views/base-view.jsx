import React from 'components/react';

import NavigationMenu from './navigation-menu';

export default class BaseView extends React.Component {
  renderHeader(title, cssClass) {
    let className = 'app-view__header';
    if (cssClass) {
      className += ` ${cssClass}`;
    }

    return (
      <header className={className}>
        <h1>{title}</h1>
      </header>
    );
  }

  renderFooter() {
    return (
      <footer className="app-view__footer">
        <NavigationMenu foxbox={this.props.foxbox}/>
      </footer>
    );
  }

  renderBody() {
    return null;
  }

  render() {
    return (
      <div className="app-view">
        {this.renderHeader()}
        <section className="app-view__body">{this.renderBody()}</section>
        {this.renderFooter()}
      </div>
    );
  }
}

BaseView.propTypes = {
  foxbox: React.PropTypes.object.isRequired,
};
