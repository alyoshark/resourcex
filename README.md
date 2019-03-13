# resourcex

ResourceX - Utilities to wrap global variables into observables without the learning curve of rxjs

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

```javascript
// store.js
import { NaiveResouce, Resource } from 'resourcex';

export const DummyCounter = NaivResource(0);

export const Books = Resource({
  get: {
    epic: wrap(async () => [{ id: 1, name: 'Book A' }, { id: 2, name: 'Book B' }]),
    reducer: (curr, val) => val, // ignorable if it's simple substitution like this
  },
  post: {
    epic: wrap(async (name) => ({ name, id: Math.floor(Math.random() * 100000) })),
    reducer: (curr, val) => [...curr, val],
  }
};
```

### Vue

For integrating with Vue, it's recommended to install [vue-rx](https://github.com/vuejs/vue-rx)
to ensure observable unregistrations are done correctly on unmount.

```javascript
import { DummyCounter, Books } from './store.js';

new Vue({
  el: '#app',
  template: `
    <div>
      <pre>{{ counter }}</pre><button @click="inc1">Add One</button>
      <ul>
        <li v-for="b in books" :key="b.id">
          {{ b.name }}
        </li>
      </ul>
      <button @click="fetchBooks">Fetch Books</button>
      <button @click="createBook">Add Book</button>
    </div>
  `,

  subscriptions: {
    counter: DummyCounter.$,
    books: Books.$,
  },

  methods: {
    inc1() { DummyCounter.set(this.counter + 1) },

    fetchBooks() {
      try {
        await Books.get();
      } catch (e) {
        console.log(e);
      }
    },

    createBook() {
      try {
        const book = await Books.post(`Book ${this.counter}`);
        console.log(book);
      } catch (e) {
        console.log(e);
      }
    },
  }
})
```

### React

For integrating with React, [useObservable](https://github.com/streamich/react-use/blob/master/docs/useObservable.md)
should be the handy hook to install (or write something to provide similar register / unregistrater purposes)

```javascript
import { useObservable } from 'react-use';
import { DummyCounter, Books } from './store.js';

const Demo = () => {
  const counter = useObservable(DummyCounter.$);
  const books = useObservable(Books.$); // TODO: JSX with books

  return (
    <button onClick={() => DummyCounter.next(counter + 1)}>
      Clicked {counter} times
    </button>
  );
};
```

## API

- `Resource({actionName: {epic, reducer}, ...})`

  > create a resource with value exposed as an observable in `$`,
  > reactivity status as an observable in `lock$` (`true` when the Resource is locked),
  > and corresponding actions defined by a name, with `epic` and `reducer` fields:

  - `epic`: a function that takes in arbitrary parameters and returns a value wrapped in observable
  - `reducer`: a function that calculates the end result based on the old value and the new value returned by the `epic`;
    optional if blind substitution of old with new
  - `lock`: if set to `true`, the Resource would stop reacting to any action on it until the current action finishes;
    useful for HTTP request throttling.

- `NaiveResource(initVal)`

  > create a resource with an initial value, expose a `set` call to update its value

- `LocalStorageResource(localStorageKey, initVal)`

  > almost same as `NaiveResource`, just that the value is persisted into local storage with key specified

- `wrap(anyFunc)`:
  > takes in any function and convert it into a function that takes the same parameters and returns an observable containing the result
