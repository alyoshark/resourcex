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
