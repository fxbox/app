/* global React */

import FooterMenu from 'js/views/footer-menu';
import ServiceList from 'js/views/service-list';
import Modal from 'js/views/modal';

export default class HomeView extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      visible: false,
      title: '',
      body: ''
    };
  }

  render() {
    return (
      <div>
        <header>
          <h1>My Home</h1>
        </header>
        <h2>General</h2>
        <ServiceList services={this.props.services} foxbox={this.props.foxbox}/>
        <Modal visible={this.state.visible} title={this.state.title} body={this.state.body}/>
        <FooterMenu/>
      </div>
    );
  }
}
