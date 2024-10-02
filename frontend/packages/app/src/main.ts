import "@unocss/reset/tailwind-compat.css";
import "uno.css";

import "./style.css";

import { createApp } from "vue";
import { createRouter, createWebHistory } from "vue-router";
import { routes } from "vue-router/auto-routes";

import { createPinia } from "pinia";
import App from "./App.vue";

window.moveTo(0, 0)
window.resizeTo(window.screen.availWidth, window.screen.availHeight)

const router = createRouter({
  history: createWebHistory(),
  routes,
});

createApp(App).use(createPinia()).use(router).mount("#app");
