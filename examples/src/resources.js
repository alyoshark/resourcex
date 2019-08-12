import { Resource } from '../../lib'; // change to 'resourcex'
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
