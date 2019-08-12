import Vue from 'vue';
import VueRx from 'vue-rx';
Vue.use(VueRx);

import App from './App';

new Vue({
  el: '#app',
  render: h => h(App),
});
