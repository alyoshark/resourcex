<template>
  <div>
    <h1>Hello, {{ profile$.name }}!</h1>
    <h2>{{ profile$.uid }} called {{ profile$.version }} times</h2>
    <button @click="setName('New Name')">Set New Name</button>
    <button @click="incProfileVersion">Bump Version</button>
  </div>
</template>

<script>
import { Profile } from "../resources";

export default {
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
    }
  },

  created() {
    Profile.get();
  }
};
</script>
