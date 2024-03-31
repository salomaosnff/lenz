/* eslint-disable @typescript-eslint/consistent-type-imports */
import 'uno.css';
import './style.css';
import { createPinia } from 'pinia';
import { createApp } from 'vue';
import App from './App.vue';
import router from './router'

const app = createApp(App).use(router).use(createPinia());

app.mount('#app');