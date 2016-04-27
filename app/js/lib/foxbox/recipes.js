'use strict';

// @todo Proxy recipes in the db and emit events on change (see services).

// Private members.
const p = Object.freeze({
  // Private properties.
  api: Symbol('api'),

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
  constructor(api) {
    this[p.api] = api;

    Object.seal(this);
  }

  /**
   * Returns a promise resolving to a list of recipes.
   *
   * @return {Promise}
   */
  getAll() {
    return this[p.api].post(
      'services',
      { getters: [{ kind: 'ThinkerbellRuleSource' }] }
    )
    // Mark getters and setters with more friendly names.
    .then((services) => {
      return services.map((service) => {
        const enabledGetterId = Object.keys(service.getters).find(
          (getterId) => service.getters[getterId].kind === 'ThinkerbellRuleOn'
        );
        const sourceGetterId = Object.keys(service.getters).find(
          (getterId) => service.getters[getterId].kind ===
          'ThinkerbellRuleSource'
        );

        const enabledSetterId = Object.keys(service.setters).find(
          (setterId) => service.setters[setterId].kind === 'ThinkerbellRuleOn'
        );
        const removeSetterId = Object.keys(service.setters).find(
          (setterId) => service.setters[setterId].kind ===
          'RemoveThinkerbellRule'
        );

        return {
          id: service.id,
          getEnabled: enabledGetterId,
          getSource: sourceGetterId,
          setEnabled: enabledSetterId,
          remove: removeSetterId,
          status: null,
          source: null,
        };
      });
    })
    .then((services) => {
      // Fetch recipe enabled statuses and sources.
      const { enabledSelectors, sourceSelectors } = services.reduce(
        (selectors, service) => {
          selectors.enabledSelectors.push({ id: service.getEnabled });
          selectors.sourceSelectors.push({ id: service.getSource });

          return selectors;
        },
        { enabledSelectors: [], sourceSelectors: [] }
      );

      return Promise.all([
        this[p.api].put('channels/get', enabledSelectors),
        this[p.api].put('channels/get', sourceSelectors),
      ])
      .then(([statuses, sources]) => {
        return services.map((service) => {
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
    const supportedKinds = [
      'CurrentTimeOfDay',
      'OpenClosed',
      'DoorLocked',
    ];

    return this[p.api].post(
      'channels/getters', supportedKinds.map((kind) => ({ kind }))
    )
    .then((getters) => {
      return getters.map((getter) => {
        let name;
        const options = [];

        // Assign user friendly name to every getter and it's value options.
        switch (getter.kind) {
          case 'CurrentTimeOfDay':
            name = 'Everyday';
            options.push(...[{
              label: 'in the morning',
              // 08:00 AM, 8 * 60 * 60 = 28800 seconds from 00:00.
              value: { Geq: { Duration: 28800 } },
            }, {
              label: 'in the afternoon',
              // 02:00 PM, 14 * 60 * 60 = 50400 seconds from 00:00.
              value: { Geq: { Duration: 50400 } },
            }, {
              label: 'in the evening',
              // 06:00 PM, 18 * 60 * 60 = 64800 seconds from 00:00.
              value: { Geq: { Duration: 64800 } },
            }]);
            break;
          case 'OpenClosed':
            name = 'Motion Sensor';
            options.push({
              label: 'detects motion',
              value: { Eq: { OpenClosed: 'Open' } },
            });
            break;
          case 'DoorLocked':
            name = 'Door';
            options.push({
              label: 'is locked',
              value: { Eq: { DoorLocked: 'Locked' } },
            }, {
              label: 'is unlocked',
              value: { Eq: { DoorLocked: 'Unlocked' } },
            });
        }

        return {
          id: getter.id,
          kind: getter.kind,
          name: name || getter.adapter,
          options,
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
        type: 'String',
      },
      'TakeSnapshot',
      'LightOn',
      'DoorLocked',
    ];

    return this[p.api].post(
      'channels/setters', supportedKinds.map((kind) => ({ kind }))
    )
    .then((setters) => {
      return setters.map((setter) => {
        const options = [];
        let name;

        // Check for the complex extension kind
        if (typeof setter.kind === 'object') {
          if (setter.kind.kind === 'Sentence') {
            name = 'say';
            options.push(...[
              {
                label: '"Good morning!"',
                value: { String: '"Good morning!"' },
              },
              {
                label: '"Good afternoon!"',
                value: { String: '"Good afternoon!"' },
              },
              {
                label: '"Good evening!"',
                value: { String: '"Good evening!"' },
              },
            ]);
          }
        } else if (setter.kind === 'TakeSnapshot') {
          name = 'camera';
          options.push(...[
            {
              label: 'takes a picture',
              value: { 'Unit': null },
            },
            {
              label: 'sends me a picture',
              value: [
                {
                  // Take a picture.
                  destination: [{ id: setter.id }],
                  kind: 'TakeSnapshot',
                  value: { Unit: null },
                },
                {
                  // Notify the user.
                  destination: [{ kind: 'WebPushNotify' }],
                  kind: 'WebPushNotify',
                  value: {
                    WebPushNotify: {
                      message: JSON.stringify({
                        message: 'Your bedroom patio door has just been ' +
                          'opened. Here is a picture of what I see.',
                        action: `dev/${setter.service}/camera-latest-image`,
                      }),
                      resource: 'res1',
                    },
                  },
                },
              ],
            },
          ]);
        } else if (setter.kind === 'LightOn') {
          name = 'light';
          options.push(...[
            {
              label: 'gets turned on',
              value: { OnOff: 'On' },
            },
            {
              label: 'gets turned off',
              value: { OnOff: 'Off' },
            },
          ]);
        } else if (setter.kind === 'DoorLocked') {
          name = 'door lock';
          options.push(...[
            {
              label: 'locks the door',
              value: { DoorLocked: 'Locked' },
            },
            {
              label: 'unlocks the door',
              value: { DoorLocked: 'Unlocked' },
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
    let execute;

    if (Array.isArray(setterValue.value)) {
      execute = setterValue.value;
    } else if (typeof setterValue.value === 'object') {
      execute = [
        {
          destination: [{ id: setter.id }],
          kind: setter.kind,
          value: setterValue.value,
        },
      ];
    } else {
      console.error('Setter doesn\'t have a supported format:',
        JSON.stringify(setter));
    }

    const recipe = {
      name,
      rules: [
        {
          conditions: [
            {
              source: [{ id: getter.id }],
              kind: getter.kind,
              range: getterValue.value,
            },
          ],
          execute,
        },
      ],
    };

    return this[p.api].put(
      'channels/set',
      {
        select: {
          kind: 'AddThinkerbellRule',
        },
        value: {
          ThinkerbellRule: {
            name,
            source: JSON.stringify(recipe),
          },
        },
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
    return this[p.api].put(
      'channels/set',
      {
        select: { id: recipe[p.service].remove },
        value: null,
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
    return this[p.api].put(
      'channels/set',
      {
        select: { id: recipe[p.service].setEnabled },
        value: { OnOff: textValue },
      }
    )
    .then(() => {
      recipe[p.service].status = value;
    });
  }

  // Hack for the demo.
  /**
   * Create the following static recipe:
   * * When:
   *    * The first light is on
   *    * It's 8:00am
   * * Then:
   *    * Turn all the lights off
   *    * Notify the user
   */
  createDemoRecipes() {
    Promise.all([
        this.getGetters(),
        this.getSetters(),
      ])
      .then((services) => {
        const clockGetter = services[0].find(
          (service) => service.kind === 'CurrentTimeOfDay'
        );
        // Commented until the Philips Hue adapter watcher lands in the box.
        /*const firstLightGetter = services[0].find(
          (service) => service.kind === 'LightOn'
        );*/
        const lightsSetter = services[1].filter(
          (service) => service.kind === 'LightOn'
        );

        const conditions = [
          // When it's 8:00am.
          {
            source: [{ id: clockGetter.id }],
            kind: 'CurrentTimeOfDay',
            range: { Geq: { Duration: 28800 } },
          },
          // When the first light is on.
          /*{
            source: [{ id: firstLightGetter.id }],
            kind: firstLightGetter.kind,
            range: { Eq: { OnOff: 'On' } },
          },*/
        ];

        const execute = [].concat(
          // Turn off all lights.
          lightsSetter.map((setter) => ({
            destination: [{ id: setter.id }],
            kind: setter.kind,
            value: { OnOff: 'Off' },
          })),
          // Notify the user.
          [
            {
              // Notify the user.
              destination: [{ kind: 'WebPushNotify' }],
              kind: 'WebPushNotify',
              value: {
                WebPushNotify: {
                  message: JSON.stringify({
                    message: 'Hello Alex, I\'ve turned your kitchen lights ' +
                    'off for you. Have a wonderful day!',
                  }),
                  resource: 'res1',
                },
              },
            },
          ]);

        const recipe = {
          name: 'Turn off the lights when I leave for work.',
          rules: [
            {
              conditions,
              execute,
            },
          ],
        };

        console.log('Recipe for the demo', recipe);

        return this[p.api].put(
          'channels/set',
          {
            select: {
              kind: 'AddThinkerbellRule',
            },
            value: {
              ThinkerbellRule: {
                name,
                source: JSON.stringify(recipe),
              },
            },
          }
        );
      });

    this.createDoorLockDemoRecipe();
  }

  /**
   * Create the following static recipe:
   * * When:
   *    * The door is open
   *    * It's 8:00am
   * * Then:
   *    * Close the door
   *    * Notify the user
   */
  createDoorLockDemoRecipe() {
    Promise.all([
      this.getGetters(),
      this.getSetters(),
    ])
    .then(([getters, setters]) => {
      const clockGetter = getters.find(
        (getter) => getter.kind === 'CurrentTimeOfDay'
      );

      const doorLockGetter = getters.find(
        (getter) => getter.kind === 'DoorLocked'
      );

      const doorLockSetter = setters.find(
        (setter) => setter.kind === 'DoorLocked'
      );

      const conditions = [
        // When it's 8:00am.
        {
          source: [{ id: clockGetter.id }],
          kind: 'CurrentTimeOfDay',
          range: { Geq: { Duration: 28800 } },
        },
        {
          source: [{ id: doorLockGetter.id }],
          kind: doorLockGetter.kind,
          range: { Eq: { DoorLocked: 'Unlocked' } },
        },
      ];

      const execute = [
        {
          destination: [{ id: doorLockSetter.id }],
          kind: doorLockSetter.kind,
          value: { DoorLocked: 'Locked' },
        },
        {
          // Notify the user.
          destination: [{ kind: 'WebPushNotify' }],
          kind: 'WebPushNotify',
          value: {
            WebPushNotify: {
              message: JSON.stringify({
                message: 'Hello Alex, I\'ve locked the door for you. ' +
                  'Have a wonderful day!',
              }),
              resource: 'res1',
            },
          },
        },
      ];

      const recipe = {
        name: 'Lock the door when I leave for work.',
        rules: [
          {
            conditions,
            execute,
          },
        ],
      };

      return this[p.api].put(
        'channels/set',
        {
          select: {
            kind: 'AddThinkerbellRule',
          },
          value: {
            ThinkerbellRule: {
              name,
              source: JSON.stringify(recipe),
            },
          },
        }
      );
    });
  }
}
