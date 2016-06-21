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
      { channels: [{ feature: 'thinkerbell/rule-source' }] }
    )
    // Mark channels with more friendly names.
    .then((services) => {
      return services.map((service) => {
        return Object.keys(service.channels).reduce((rule, channelId) => {
          const channel = service.channels[channelId];

          switch (channel.feature) {
            case 'thinkerbell/is-rule-enabled':
              rule.enabled = { id: channelId, feature: channel.feature };
              break;
            case 'thinkerbell/rule-source':
              rule.getSource = { id: channelId, feature: channel.feature };
              break;
            case 'thinkerbell/remove-rule-id':
              rule.remove = { id: channelId, feature: channel.feature };
              break;
          }

          return rule;
        }, {
          id: service.id,
          getSource: null,
          enabled: null,
          remove: null,
          status: null,
          source: null,
        });
      });
    })
    .then((services) => {
      // Fetch recipe enabled statuses and sources.
      const { enabledSelectors, sourceSelectors } = services.reduce(
        (selectors, service) => {
          selectors.enabledSelectors.push(service.enabled);
          selectors.sourceSelectors.push(service.getSource);

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
          const statusResponse = statuses[service.enabled.id];
          const sourceResponse = sources[service.getSource.id];

          if (!statusResponse || statusResponse.Error) {
            console.error(
              'Error occurred while retrieving recipe (%s) status: ',
              service.id,
              statusResponse ? statusResponse.Error : 'No status'
            );
            service.status = false;
          } else {
            service.status = statusResponse === 'On';
          }

          if (!sourceResponse || sourceResponse.Error) {
            console.error(
              'Error occurred while retrieving recipe (%s) source: ',
              service.id,
              sourceResponse ? sourceResponse.Error : 'No source'
            );
            service.source = null;
          } else {
            service.source = sourceResponse;
          }

          return new Recipe(service);
        });
      });
    });
  }

  getGetters() {
    // Currently we support only Clock, Motion Sensor and Door Lock as triggers.
    const supportedFeatures = [
      'clock/time-of-day-seconds',
      'door/is-open',
      'door/is-locked',
    ];

    return this[p.api].post(
      'channels',
      supportedFeatures.map((feature) => ({ feature, supports_fetch: true }))
    )
    .then((getters) => {
      return getters.map((getter) => {
        let name;
        const options = [];

        // Assign user friendly name to every getter and it's value options.
        switch (getter.feature) {
          case 'clock/time-of-day-seconds':
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
          case 'door/is-open':
            name = 'Motion Sensor';
            options.push({
              label: 'detects motion',
              value: 'Open',
            });
            break;
          case 'door/is-locked':
            name = 'Door';
            options.push({
              label: 'is locked',
              value: 'Locked',
            }, {
              label: 'is unlocked',
              value: 'Unlocked',
            });
        }

        return {
          id: getter.id,
          feature: getter.feature,
          name: name || getter.adapter,
          tags: getter.tags,
          options,
        };
      });
    });
  }

  getSetters() {
    // Currently we support only TTS, camera, connected lights, motion sensor
    // and door lock as actuators.
    const supportedFeatures = [
      'speak/sentence',
      'camera/store-snapshot',
      'light/is-on',
      'door/is-locked',
    ];

    return this[p.api].post(
      'channels',
      supportedFeatures.map((feature) => ({ feature, supports_send: true }))
    )
    .then((setters) => {
      return setters.map((setter) => {
        const options = [];
        let name;

        switch (setter.feature) {
          case 'speak/sentence':
            name = 'say';
            options.push(...[
              {
                label: '"Good morning!"',
                value: '"Good morning!"',
              },
              {
                label: '"Good afternoon!"',
                value: '"Good afternoon!"',
              },
              {
                label: '"Good evening!"',
                value: '"Good evening!"',
              },
            ]);
            break;
          case 'camera/store-snapshot':
            name = 'camera';
            options.push(...[
              {
                label: 'takes a picture',
                value: null,
              },
              {
                label: 'sends me a picture',
                value: [
                  {
                    // Take a picture.
                    destination: [{id: setter.id}],
                    feature: 'camera/store-snapshot',
                    value: null,
                  },
                  {
                    // Notify the user.
                    destination: [{ feature: 'webpush/notify-msg' }],
                    feature: 'webpush/notify-msg',
                    value: {
                      message: JSON.stringify({
                        message: 'Your bedroom patio door has just been ' +
                        'opened. Here is a picture of what I see.',
                        action: `dev/camera-latest-image/${setter.service}`,
                      }),
                      resource: 'res1',
                    },
                  },
                ],
              },
            ]);
            break;
          case 'light/is-on':
            name = 'light';
            options.push(...[
              {
                label: 'gets turned on',
                value: 'On',
              },
              {
                label: 'gets turned off',
                value: 'Off',
              },
            ]);
            break;
          case 'door/is-locked':
            name = 'door lock';
            options.push(...[
              {
                label: 'locks the door',
                value: 'Locked',
              },
              {
                label: 'unlocks the door',
                value: 'Unlocked',
              },
            ]);
            break;
        }

        return {
          id: setter.id,
          feature: setter.feature,
          name: name || setter.adapter,
          tags: setter.tags,
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
    } else {
      execute = [
        {
          destination: [{ id: setter.id }],
          feature: setter.feature,
          value: setterValue.value,
        },
      ];
    }

    const recipe = {
      name,
      rules: [
        {
          conditions: [
            {
              source: [{ id: getter.id }],
              feature: getter.feature,
              when: getterValue.value,
            },
          ],
          execute,
        },
      ],
    };

    return this[p.api].put(
      'channels/set',
      { select: { feature: 'thinkerbell/add-rule' }, value: recipe }
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
      { select: recipe[p.service].remove, value: null }
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
    return this[p.api].put(
      'channels/set',
      { select: recipe[p.service].enabled, value: value ? 'On' : 'Off' }
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
    .then(([getters, setters]) => {
      const clockGetter = getters.find(
        (getter) => getter.feature === 'clock/time-of-day-seconds'
      );
      // Commented until the Philips Hue adapter watcher lands in the box.
      /*const firstLightGetter = getters.find(
        (getter) => getter.feature === 'light/is-on'
      );*/
      const lightsSetter = setters.filter(
        (setter) => setter.feature === 'light/is-on'
      );

      const conditions = [
        // When it's 8:00am.
        {
          source: [{ id: clockGetter.id }],
          feature: 'clock/time-of-day-seconds',
          when: { Geq: { Duration: 28800 } },
        },
        // When the first light is on.
        /*{
          source: [{ id: firstLightGetter.id }],
          feature: firstLightGetter.feature,
          when: 'On',
        },*/
      ];

      const execute = [].concat(
        // Turn off all lights.
        lightsSetter.map((setter) => ({
          destination: [{ id: setter.id }],
          feature: setter.feature,
          value: 'Off',
        })),
        // Notify the user.
        [
          {
            // Notify the user.
            destination: [{ feature: 'webpush/notify-msg' }],
            feature: 'webpush/notify-msg',
            value: {
              message: JSON.stringify({
                message: 'Hello Alex, I\'ve turned your kitchen lights ' +
                  'off for you. Have a wonderful day!',
              }),
              resource: 'res1',
            },
          },
        ]);

      const recipe = {
        name: 'Turn off the lights when I leave for work.',
        rules: [{ conditions, execute }],
      };

      console.log('Recipe for the demo', recipe);

      return this[p.api].put(
        'channels/set',
        { select: { feature: 'thinkerbell/add-rule' }, value: recipe }
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
        (getter) => getter.feature === 'clock/time-of-day-seconds'
      );

      const doorLockGetter = getters.find(
        (getter) => getter.feature === 'door/is-locked'
      );

      const doorLockSetter = setters.find(
        (setter) => setter.feature === 'door/is-locked'
      );

      const conditions = [
        // When it's 8:00am.
        {
          source: [{ id: clockGetter.id }],
          feature: 'clock/time-of-day-seconds',
          when: { Geq: { Duration: 28800 } },
        },
        {
          source: [{ id: doorLockGetter.id }],
          feature: doorLockGetter.feature,
          when: 'Unlocked',
        },
      ];

      const execute = [
        {
          destination: [{ id: doorLockSetter.id }],
          feature: doorLockSetter.feature,
          value: 'Locked',
        },
        {
          // Notify the user.
          destination: [{ feature: 'webpush/notify-msg' }],
          feature: 'webpush/notify-msg',
          value: {
            message: JSON.stringify({
              message: 'Hello Alex, I\'ve locked the door for you. ' +
                'Have a wonderful day!',
            }),
            resource: 'res1',
          },
        },
      ];

      const recipe = {
        name: 'Lock the door when I leave for work.',
        rules: [{ conditions, execute }],
      };

      return this[p.api].put(
        'channels/set',
        { select: { feature: 'thinkerbell/add-rule' }, value: recipe }
      );
    });
  }
}
