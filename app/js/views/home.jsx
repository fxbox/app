/* global React */

import UserLogoutButton from 'js/views/user-logout-button';
import FooterMenu from 'js/views/footer-menu';
import ServiceList from 'js/views/service-list';
import Modal from 'js/views/modal';

export default class HomeView extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      services: [],

      isModalVisible: false,
      title: '',
      body: ''
    };

    this.foxbox = props.foxbox;
  }

  componentDidMount() {
    this.foxbox.getServices()
      .then(services => {
        console.log(services);
        this.setState({ services: services });
      })
      .catch(console.error.bind(console));

    this.foxbox.getTags()
      .then(tags => {
        console.log(tags);
      })
      .catch(console.error.bind(console));
  }

  dismissModal() {
    this.setState({ isModalVisible: false });
  }

  render() {
    return (
      <div>
        <header>
          <h1>My Home</h1>
          <UserLogoutButton foxbox={this.foxbox}/>
        </header>
        <h2>General</h2>
        <ServiceList services={this.state.services} foxbox={this.foxbox}/>
        <Modal visible={this.state.isModalVisible} title={this.state.title} body={this.state.body} dismiss={this.dismissModal.bind(this)}/>
        <FooterMenu/>
      </div>
    );
  }
}
