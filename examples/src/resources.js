import { Resource } from '../../lib'; // change to 'resourcex'
import { getProfile, setName } from './api';
import { wrapMiddleware } from '../../lib/middleware';

export const Profile = Resource(
  { uid: 0, name: '', age: 0 },
  {
    async get() {
      const profile = await getProfile();
      return { ...profile };
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
  wrapMiddleware([
    original => {
      console.log(original);
      return { padd: 'something extra', val: original.val };
    },
    padded => {
      console.log('The chaining of middlewares!');
      return padded.val.val;
    },
  ]),
);
