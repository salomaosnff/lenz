import 'uno.css';
import './style.css';
import { createPinia } from 'pinia';
import { createApp } from 'vue';
import App from './App.vue';
const { ExtensionHost } = require('@editor/core');

const app = createApp(App).use(createPinia());

app.mount('#app');

ExtensionHost.start();