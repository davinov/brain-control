import Vue from 'vue';
import RemoteController from './RemoteController.vue';
// import '../registerServiceWorker';

Vue.config.productionTip = false;

new Vue({
    render: (h) => h(RemoteController),
}).$mount('#app');
