import '@unocss/reset/tailwind-compat.css';
import 'uno.css';

import './style.scss';

import { createApp } from 'vue';
import { createRouter, createWebHistory } from 'vue-router';
import { routes } from 'vue-router/auto-routes';

import App from './App.vue';

const router = createRouter({
  history: createWebHistory(),
  routes
})


createApp(App).use(router).mount('#app')
