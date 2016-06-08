export default class BaseController {
  constructor(properties) {
    Object.assign(this, properties || {});
  }

  main() {
    throw new Error('Not implemented!');
  }
}
