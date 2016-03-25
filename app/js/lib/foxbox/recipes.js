'use strict';

// @todo Proxy recipes in the db and emit events on change (see services).

// Private members.
const p = {
  // Private properties.
  settings: Symbol('settings'),
  net: Symbol('net')
};

export default class Recipe {
  constructor(props) {
    this[p.settings] = props.settings;
    this[p.net] = props.net;
  }

  /**
   * Returns a promise resolving to a list of recipes.
   *
   * @return {Promise}
   */
  getAll() {
    return this[p.net].fetchJSON(
      `${this[p.net].origin}/api/v${this[p.settings].apiVersion}/services`)
      // Get all recipes.
      .then(services => services.filter(service =>
        service.adapter === 'thinkerbell-adapter' &&
        service.id !== 'thinkerbell-root-service'
      ))
      // Fetch their respective enabled status.
      .then(recipes => {
        const promises = recipes.map(recipe => {
          const payload = [
            { id: `${recipe.id}/get_enabled` }
          ];

          return this[p.net].fetchJSON(
            `${this[p.net].origin}/api/v${this[p.settings].apiVersion}/` +
            'channels/get',
            'PUT',
            payload
          );
        });

        return Promise.all(promises)
          // Map all the recipes to a more user-friendly format.
          .then(servicesEnabled => recipes.map((recipe, index) => ({
            id: recipe.id,
            label: recipe.id,
            enabled: servicesEnabled[index][`${recipe.id}/get_enabled`]
              .OnOff === 'On'
          })));
      });
  }

  getServicesWithGetters() {
    return this[p.net].fetchJSON(
      `${this[p.net].origin}/api/v${this[p.settings].apiVersion}/services`)
      // Get all services but the recipes.
      .then(services => services.filter(service =>
        service.adapter != 'thinkerbell-adapter' &&
        service.adapter != 'webpush@link.mozilla.org'
      ))
      // Keep only the services with getters.
      .then(services => services.filter(service =>
        Object.keys(service.getters).length
      ))
      // User friendly name.
      .then(services => services.map(service => {
          switch (service.id) {
            case 'service:clock@link.mozilla.org':
              service.name = 'Everyday';
              break;

            default:
              service.name = service.id;
              break;
          }

          return service;
        }
      ))
      // User friendly getters.
      .then(services => services.map(service => {
          switch (service.id) {
            case 'service:clock@link.mozilla.org':
              service.getters = [
                {
                  label: 'in the morning',
                  value: 'service:clock@link.mozilla.org,CurrentTimeOfDay,eq,' +
                  '08:00am'
                },
                {
                  label: 'in the afternoon',
                  value: 'service:clock@link.mozilla.org,CurrentTimeOfDay,eq,' +
                  '02:00pm'
                },
                {
                  label: 'in the evening',
                  value: 'service:clock@link.mozilla.org,CurrentTimeOfDay,eq,' +
                  '06:00pm'
                }
              ];
              break;

            default:
              //service.getters = service.getters;
              break;
          }

          return service;
        }
      ))
      // Map all the recipes to a more user-friendly format.
      .then(services => services.map(service => ({
        id: service.id,
        label: service.name,
        get: service.getters
      })));
  }

  getServicesWithSetters() {
    return this[p.net].fetchJSON(
      `${this[p.net].origin}/api/v${this[p.settings].apiVersion}/services`)
      // Get all services but the recipes.
      .then(services => services.filter(service =>
        service.adapter != 'thinkerbell-adapter' &&
        service.adapter != 'webpush@link.mozilla.org'
      ))
      // Keep only the services with getters.
      .then(services => services.filter(service =>
        Object.keys(service.setters).length
      ))
      // User friendly name.
      .then(services => services.map(service => {
          switch (service.id) {
            case 'espeak@link.mozilla.org':
              service.name = 'say';
              break;

            default:
              service.name = service.id;
              break;
          }

          return service;
        }
      ))
      // User friendly getters.
      .then(services => services.map(service => {
          switch (service.id) {
            case 'espeak@link.mozilla.org':
              service.setters = [
                {
                  label: '"Good morning!"',
                  value: 'espeak@link.mozilla.org,Sentence,String,' +
                  '"Good morning!"'
                },
                {
                  label: '"Good afternoon!"',
                  value: 'espeak@link.mozilla.org,Sentence,String,' +
                  '"Good afternoon!"'
                },
                {
                  label: '"Good evening!"',
                  value: 'espeak@link.mozilla.org,Sentence,String,' +
                  '"Good evening!"'
                }
              ];
              break;

            default:
              //service.setters = service.setters;
              break;
          }

          return service;
        }
      ))
      // Map all the recipes to a more user-friendly format.
      .then(services => services.map(service => ({
        id: service.id,
        label: service.name,
        set: service.setters
      })));
  }

  /**
   * Create a new recipe.
   *
   * @return {Promise}
   */
  add(recipe) {
    const [idGet, kindGet, rangeKeyGet, rangeValGet] = recipe.getter.split(',');
    const [idSet, kindSet, rangeKeySet, rangeValSet] = recipe.setter.split(',');

    recipe = {
      rules: [
        {
          conditions: [
            {
              source: [
                {
                  id: idGet
                }
              ],
              kind: {
                kind: kindGet
              },
              range: {
                [rangeKeyGet]: rangeValGet
              }
            }
          ],
          execute: [
            {
              destination: [
                {
                  id: idSet
                }
              ],
              kind: {
                kind: kindSet
              },
              value: {
                [rangeKeySet]: rangeValSet
              }
            }
          ]
        }
      ]
    };

    return this[p.net].fetchJSON(
      `${this[p.net].origin}/api/v${this[p.settings].apiVersion}/channels/set`,
      'PUT',
      [
        [
          [
            { id: 'thinkerbell-add-rule' }
          ],
          {
            ThinkerbellRule: {
              name: 'foo',
              source: JSON.stringify(recipe)
            }
          }
        ]
      ]
    );
  }

  /**
   * Remove a recipe with the associated id.
   *
   * @param {string} id
   * @return {Promise}
   */
  remove(id) {
    return this[p.net].fetchJSON(
      `${this[p.net].origin}/api/v${this[p.settings].apiVersion}/channels/set`,
      'PUT',
      [
        [
          [
            { id: `${id}/remove` }
          ],
          null
        ]
      ]
    );
  }

  /**
   * Enable or disable the specified recipe.
   *
   * @param {string} id
   * @param {boolean=} value Whether to enable or disable. Enable by default.
   * @return {Promise}
   */
  toggle(id, value = true) {
    const textValue = value ? 'On' : 'Off';
    return this[p.net].fetchJSON(
      `${this[p.net].origin}/api/v${this[p.settings].apiVersion}/channels/set`,
      'PUT',
      [
        [
          [
            { id: `${id}/set_enabled` }
          ],
          {
            OnOff: textValue
          }
        ]
      ]
    );
  }
}
