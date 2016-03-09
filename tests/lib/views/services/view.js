var View = require('../view');
var ServicesAccessors = require('./accessors');


function ServicesView() {
  [].push.call(arguments, ServicesAccessors);
  View.apply(this, arguments);

  this.accessors.logOutButton; // Wait until it appears
}

module.exports = ServicesView;
