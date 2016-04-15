'use strict';

// @todo Proxy recipes in the db and emit events on change (see services).

// Private members.
const p = Object.freeze({
  // Private properties.
  settings: Symbol('settings'),
  net: Symbol('net'),

  // Recipe private properties.
  service: Symbol('service'),
});

export class Recipe {
  constructor(service) {
    if (!service) {
      throw new Error('Service is required!');
    }

    this[p.service] = service;
  }

  get id() {
    return this[p.service].id;
  }

  get label() {
    return this[p.service].source && this[p.service].source.name;
  }

  get enabled() {
    return this[p.service].status;
  }
}

export default class Recipes {
  constructor(props) {
    // Private properties.
    this[p.settings] = props.settings;
    this[p.net] = props.net;

    Object.seal(this);
  }

  /**
   * Returns a promise resolving to a list of recipes.
   *
   * @return {Promise}
   */
  getAll() {
    return this[p.net].fetchJSON(
      `${this[p.net].origin}/api/v${this[p.settings].apiVersion}/services`,
      'POST',
      { getters: [{ kind: 'ThinkerbellRuleSource' }] }
    )
    .then(services => {
      // Mark getters and setters with more friendly names.
      return services.map(service => {
        const enabledGetterId = Object.keys(service.getters).find(getterId => {
          return service.getters[getterId].kind === 'ThinkerbellRuleOn';
        });
        const sourceGetterId = Object.keys(service.getters).find(getterId => {
          return service.getters[getterId].kind === 'ThinkerbellRuleSource';
        });

        const enabledSetterId = Object.keys(service.setters).find(setterId => {
          return service.setters[setterId].kind === 'ThinkerbellRuleOn';
        });
        const removeSetterId = Object.keys(service.setters).find(setterId => {
          return service.setters[setterId].kind === 'RemoveThinkerbellRule';
        });

        return {
          id: service.id,
          getEnabled: enabledGetterId,
          getSource: sourceGetterId,
          setEnabled: enabledSetterId,
          remove: removeSetterId,
          status: null,
          source: null
        };
      });
    })
    .then(services => {
      // Fetch recipe enabled statuses and sources.
      const { enabledSelectors, sourceSelectors } = services.reduce(
        (selectors, service) => {
          selectors.enabledSelectors.push({ id: service.getEnabled });
          selectors.sourceSelectors.push({ id: service.getSource });

          return selectors;
        },
        { enabledSelectors: [], sourceSelectors: [] }
      );

      const getterURL = `${this[p.net].origin}/api/` +
        `v${this[p.settings].apiVersion}/channels/get`;

      return Promise.all([
        this[p.net].fetchJSON(getterURL, 'PUT', enabledSelectors),
        this[p.net].fetchJSON(getterURL, 'PUT', sourceSelectors)
      ])
      .then(([statuses, sources]) => {
        return services.map(service => {
          const statusResponse = statuses[service.getEnabled];
          const sourceResponse = sources[service.getSource];

          if (statusResponse && statusResponse.OnOff) {
            service.status = statusResponse.OnOff === 'On';
          } else {
            console.error(
              'Error occurred while retrieving recipe (%s) status: ',
              service.id,
              statusResponse && statusResponse.Error
            );
            service.status = false;
          }

          if (sourceResponse && sourceResponse.String) {
            service.source = JSON.parse(sourceResponse.String);
          } else {
            console.error(
              'Error occurred while retrieving recipe (%s) source: ',
              service.id,
              sourceResponse && sourceResponse.Error
            );
            service.source = null;
          }

          return new Recipe(service);
        });
      });
    });
  }

  getGetters() {
    // Currently we support only Clock and Motion Sensor as triggers.
    const supportedKinds = ['CurrentTimeOfDay', 'OpenClosed'];

    const gettersURL = `${this[p.net].origin}/api/` +
      `v${this[p.settings].apiVersion}/channels/getters`;

    return this[p.net].fetchJSON(
      gettersURL, 'POST', supportedKinds.map(kind => ({ kind }))
    )
    .then(getters => {
      return getters.map(getter => {
        let name, options = [];

        // Assign user friendly name to every getter and it's value options.
        switch (getter.kind) {
          case 'CurrentTimeOfDay':
            name = 'Everyday';
            options.push(...[{
              label: 'in the morning',
              // 08:00 AM, 8 * 60 * 60 = 28800 seconds from 00:00.
              value: { Geq: { Duration: 28800 } }
            }, {
              label: 'in the afternoon',
              // 02:00 PM, 14 * 60 * 60 = 50400 seconds from 00:00.
              value: { Geq: { Duration: 50400 } }
            }, {
              label: 'in the evening',
              // 06:00 PM, 18 * 60 * 60 = 64800 seconds from 00:00.
              value: { Geq: { Duration: 64800 } }
            }]);
            break;
          case 'OpenClosed':
            name = 'Motion Sensor';
            options.push({
              label: 'detects motion',
              value: { Eq: { OpenClosed: 'Open' } }
            });
            break;
        }

        return {
          id: getter.id,
          kind: getter.kind,
          name: name || getter.adapter,
          options
        };
      });
    });
  }

  getSetters() {
    // Currently we support only TTS, camera and connected lights as actuators.
    const supportedKinds = [
      {
        vendor: 'team@link.mozilla.org',
        adapter: 'eSpeak adapter',
        kind: 'Sentence',
        type: 'String'
      },
      'TakeSnapshot',
      'LightOn',
    ];

    const settersURL = `${this[p.net].origin}/api/` +
      `v${this[p.settings].apiVersion}/channels/setters`;

    return this[p.net].fetchJSON(
      settersURL, 'POST', supportedKinds.map(kind => ({ kind }))
    )
    .then(setters => {
      return setters.map(setter => {
        let name;
        let options = [];

        // Check for the complex extension kind
        if (typeof setter.kind === 'object') {
          if (setter.kind.kind === 'Sentence') {
            name = 'say';
            options.push(...[
              {
                label: '"Good morning!"',
                value: { String: '"Good morning!"' }
              },
              {
                label: '"Good afternoon!"',
                value: { String: '"Good afternoon!"' }
              },
              {
                label: '"Good evening!"',
                value: { String: '"Good evening!"' }
              },
            ]);
          }
        } else if (setter.kind === 'TakeSnapshot') {
          name = 'camera';
          options.push({
            label: 'takes a picture',
            value: { 'Unit': null }
          });
        } else if (setter.kind === 'LightOn') {
          name = 'light';
          options.push(...[
            {
              label: 'gets turned on',
              value: { OnOff: 'On' }
            },
            {
              label: 'gets turned off',
              value: { OnOff: 'Off' }
            },
          ]);
        }

        return {
          id: setter.id,
          kind: setter.kind,
          name: name || setter.adapter,
          options,
        };
      });
    });
  }

  /**
   * Create a new recipe.
   *
   * @return {Promise}
   */
  add({ name, getter, getterValue, setter, setterValue }) {
    const recipe = {
      name,
      rules: [
        {
          conditions: [
            {
              source: [{ id: getter.id }],
              kind: getter.kind,
              range: getterValue.value
            }
          ],
          execute: [
            {
              destination: [{ id: setter.id }],
              kind: setter.kind,
              value: setterValue.value
            }
          ]
        }
      ]
    };

    return this[p.net].fetchJSON(
      `${this[p.net].origin}/api/v${this[p.settings].apiVersion}/channels/set`,
      'PUT',
      {
        select:{
          kind: 'AddThinkerbellRule'
        },
        value: {
          ThinkerbellRule: {
            name,
            source: JSON.stringify(recipe)
          }
        }
      }
    );
  }

  /**
   * Remove a recipe with the associated id.
   *
   * @param {Recipe} recipe Recipe instance to remove.
   * @return {Promise}
   */
  remove(recipe) {
    return this[p.net].fetchJSON(
      `${this[p.net].origin}/api/v${this[p.settings].apiVersion}/channels/set`,
      'PUT',
      {
        select: { id: recipe[p.service].remove },
        value: null
      }
    );
  }

  /**
   * Enable or disable the specified recipe.
   *
   * @param {Recipe} recipe Recipe to toggle status for.
   * @param {boolean=} value Whether to enable or disable. Enable by default.
   * @return {Promise}
   */
  toggle(recipe, value = true) {
    const textValue = value ? 'On' : 'Off';
    return this[p.net].fetchJSON(
      `${this[p.net].origin}/api/v${this[p.settings].apiVersion}/channels/set`,
      'PUT',
      {
        select: { id: recipe[p.service].setEnabled },
        value: { OnOff: textValue }
      }
    )
    .then(() => {
      recipe[p.service].status = value;
    });
  }
}
