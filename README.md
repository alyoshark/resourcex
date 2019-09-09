# resourcex

> resourcex - Utilities to wrap global variables into rxjs observables with **reduced** learning curve

This project provides a few handy utilities to make global variables slightly easier to work with,
comparing to traditional [Flux Architecture](https://facebook.github.io/flux/).

By using the utilities inside, plus some observable enhancement tools in your favorite MVVM framework,
global store can be organized into a set of highly structured **resources**. Each resource exposes
its value and corresponding mutating actions.
In this way, frontend applications can integrate with backend RESTful API with less boilerplate.

Since this is a very light encapsulation on top of [rxjs](http://rxjs-dev.firebaseapp.com),
anyone who doesn't mind delving into the design patterns of functional reactive programming
can easily make something more elaborate from these basic tools.

## Example

Both Vue and React examples can be found inside [here](https://github.com/xch91/resourcex/tree/master/examples).

```javascript
// api.js
export async function getProfile() {
  return { uid: 10086, name: 'ResouceX' };
}

export async function setName(name) {
  return { success: true };
}

// resources.js
import { Resource } from 'resourcex';
import { getProfile, setName } from './api';

export const Profile = Resource(
  { uid: 0, name: '', version: 0 },
  {
    async get() {
      const profile = await getProfile();
      return { ...profile, version: 1 };
    },
    increaseVersion({ version }) {
      return { version: version + 1 };
    },
    async setName(_, name) {
      const { success } = await setName(name);
      if (success) return { name };
      else throw Error('update-failed');
    },
  },
);
```

### Vue

For integrating with Vue, it's recommended to install [vue-rx](https://github.com/vuejs/vue-rx)
to ensure observable unregistrations are done correctly on unmount.

```javascript
import { Profile } from '../resources';

new Vue({
  el: '#app',
  template: `
    <div>
      <h1>Hello, {{ profile$.name }}!</h1>
      <h2>{{ profile$.uid }} called {{ profile$.version }} times</h2>
      <button @click="setName('New Name')">Set New Name</button>
      <button @click="incProfileVersion">Bump Version</button>
    </div>
  `,

  subscriptions() {
    return { profile$: Profile };
  },

  methods: {
    setName(name) {
      Profile.setName(name); // <- discard original return
    },
    async incProfileVersion() {
      const { version } = await Profile.increaseVersion();
      console.log(version); // <- captured original return
    },
  },

  created() {
    Profile.get();
  },
});
```

### React

For integrating with React, consider using [resource-react-hook](https://www.npmjs.com/package/resource-react-hook).

```javascript
import React, { useEffect } from 'react';
import ReactDOM from 'react-dom';

import useResource from 'resource-react-hook';
import { Profile } from '../resources';

const App = () => {
  const profile$ = useResource(Profile);

  // on creation do a round of fetch
  useEffect(() => {
    Profile.get();
  }, []);

  return (
    <div>
      <h1>Hello, {profile$.name}!</h1>
      <h2>
        {profile$.uid} called {profile$.version} times
      </h2>
      <button onClick={() => Profile.setName('New Name')}>Set New Name</button>
      <button onClick={Profile.increaseVersion}>Bump Version</button>
    </div>
  );
};

ReactDOM.render(<App />, document.getElementById('app'));
```

## API

### Resources

- `Resource(initial, actions?)`

  Creates a resource (as an rxjs `BehaviorSubject`) with (optionally) `actions` defining how to change its value. Each action is a function that

  - Takes in as first parameter `state`, which is the current value of the subject
  - Returns a value which would be `Object.assign`ed into the original `state`

  Therefore, the value `state` could be destructurally assigned.
  It could be left as `_` or skipped with a comma if there's no dependency on previous value.
  Return value of `Resource.action(..args)` respect the the original action function.

- `NaiveResource(initial)`

  - Almost the same as a `Resource` except that it only exposes a `set` action

  > create a resource with an initial value, expose a `set` call to update its value

- `LocalStorageResource(localStorageKey, initial, actions?)`

  - Almost the same as a `Resource`, just that the value is persisted into local storage with key specified

### Operators

resourcex also exposes a few rxjs operators for easier use, esp in transforming DOM events:

- `catchMergeMap` / `catchFlatMap`
- `catchConcatMap`
- `catchSwitchMap`
- `catchExhaustMap`

The are analagous to the counterparts `mergeMap / flatMap`, `concatMap`, `switchMap` and `exhaustMap` in rxjs.
They respect the same flattening strategy and simply wraps over them for error handling,
so that on error thrown the source observables are preserved.

E.g. `click$` is the click event stream on a button,
the following line triggers `Profile.get` call with *exhaust*ive strategy:

`click$.pipe(catchExhaustMap(Profile.get)).subscribe()`

> - `.subscribe()` is an empty subscription to kick start the streaming of events
> - Here is a [good article](https://medium.com/@shairez/a-super-ninja-trick-to-learn-rxjss-switchmap-mergemap-concatmap-and-exhaustmap-forever-88e178a75f1b) explaining what flattening strategies rxjs provides

## Change Log

- 0.1.1: Allow empty `actions` as pure, unmutatable global variable
- 0.1.0: Major rewrite to return `Resource` as `Subject` directly, and provide separate operators
- 0.0.1 ~ 0.0.9: Pilot versions with `$` as exposed `Subject` and no access to current state; not recommended anymore
